import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments, usageLogs } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { getUserAccess } from "@/lib/access";
import { REVISION_PROMPT_V2 } from "@/lib/ai/prompts/revision-v2";
import { SUGGESTION_PROMPT_V2 } from "@/lib/ai/prompts/suggestion-v2";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { SUMMARY_SUGGESTION_PROMPT_V2 } from "@/lib/ai/prompts/suggestion-summary-v2";
import { SUMMARY_REVISION_PROMPT_V2 } from "@/lib/ai/prompts/summary-revision-v2";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "Anda harus login" },
        { status: 401 }
      );
    }

    // ── 0. RATE LIMIT ─────────────────────────────────────────────
    const rl = checkRateLimit({
      key: `revise:${session.user.id}`,
      maxRequests: 20,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetInSeconds);
    }

    const { id } = await params;
    const body = await request.json();
    const { section, sectionIndex, field, currentText, mode } = body;

    // Ambil Data CV dulu untuk context, reuse di semua mode
    const [cvDoc] = await db
      .select()
      .from(cvDocuments)
      .where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, session.user.id)))
      .limit(1);

    const cvData = cvDoc?.tailoredContent as any;
    const skillsList = cvData?.skills?.map((s: any) => s.name) || [];
    const cvTitle = cvDoc?.jobTitle || "";

    // Build user context untuk dikirim ke AI
    const userCtx = buildUserContext({
      jobTitle: cvTitle,
      industry: undefined,
      cvLang: cvData?.cvLang || "id",
      experienceLevel: cvData?.experienceLevel || undefined,
    });

    // ── Mode: SUGGEST — Summary ──
    if (mode === "suggest" && section === "summary") {
      const access = await getUserAccess(session.user.id);
      const suggestLimit = access.limits.ai_suggestion;

      if (suggestLimit === false) {
        return NextResponse.json(
          { error: "FEATURE_NOT_AVAILABLE", message: "AI Suggestion tidak tersedia di paket kamu." },
          { status: 403 }
        );
      }

      if (suggestLimit !== "unlimited") {
        const [usageCount] = await db
          .select({ count: count() })
          .from(usageLogs)
          .where(
            and(
              eq(usageLogs.userId, session.user.id),
              eq(usageLogs.actionType, "ai_suggestion")
            )
          );

        if (usageCount.count >= suggestLimit) {
          return NextResponse.json(
            { error: "QUOTA_EXCEEDED", message: `Batas gratis AI Suggestions sudah terpakai (${suggestLimit}/${suggestLimit}). Upgrade ke Premium untuk unlimited.` },
            { status: 403 }
          );
        }
      }

      const userPrompt = JSON.stringify({
        currentText: body.currentText || "",
        fullName: body.fullName || "",
        jobTitle: body.jobTitle || cvTitle,
        professionalTitle: body.professionalTitle || "",
        skills: body.skills || skillsList,
        workHistorySummary: body.workHistorySummary || "",
        eduSummary: body.eduSummary || "",
        certSummary: body.certSummary || [],
        jobDescription: cvDoc?.jobDescription || "",
      });

      const aiResult = await callAI({
        systemPrompt: SUMMARY_SUGGESTION_PROMPT_V2,
        userPrompt,
        temperature: 0.5,
        model: MODELS.CHAT,
        taskType: "summary_suggestion",
        userContext: userCtx,
      });


      await db.insert(usageLogs).values({
        userId: session.user.id,
        actionType: "ai_suggestion",
        resourceId: id,
      });

      return NextResponse.json(aiResult, { status: 200 });
    }

    // ── Mode: SUGGEST (generate bullet suggestions from job context — work history) ──
    if (mode === "suggest") {
      if (!body.position && !body.jobTitle) {
        return NextResponse.json(
          { error: "INVALID_REQUEST", message: "Position/job title diperlukan untuk generate saran" },
          { status: 400 }
        );
      }

      // Cek kuota suggestion — menggunakan getUserAccess
      const access = await getUserAccess(session.user.id);
      const suggestLimit = access.limits.ai_suggestion;

      if (suggestLimit === false) {
        return NextResponse.json(
          { error: "FEATURE_NOT_AVAILABLE", message: "AI Suggestion tidak tersedia di paket kamu." },
          { status: 403 }
        );
      }

      if (suggestLimit !== "unlimited") {
        const [usageCount] = await db
          .select({ count: count() })
          .from(usageLogs)
          .where(
            and(
              eq(usageLogs.userId, session.user.id),
              eq(usageLogs.actionType, "ai_suggestion")
            )
          );

        if (usageCount.count >= suggestLimit) {
          return NextResponse.json(
            { error: "QUOTA_EXCEEDED", message: `Batas gratis AI Suggestions sudah terpakai (${suggestLimit}/${suggestLimit}). Upgrade ke Premium untuk unlimited.` },
            { status: 403 }
          );
        }
      }

      const userPrompt = JSON.stringify({
        position: body.position || body.jobTitle,
        company: body.company || "",
        industry: body.industry || "",
        skills: body.skills || [],
        description: body.description || "",
      });

      const aiResult = await callAI({
        systemPrompt: SUGGESTION_PROMPT_V2,
        userPrompt,
        temperature: 0.4,
        model: MODELS.CHAT,
        taskType: "suggestion",
        userContext: userCtx,
      });


      await db.insert(usageLogs).values({
        userId: session.user.id,
        actionType: "ai_suggestion",
        resourceId: id,
      });

      return NextResponse.json(aiResult, { status: 200 });
    }

    // ── Mode: REVISE — Summary ──
    if (mode === "revise" && section === "summary") {
      // Cek Kuota Revision
      const access = await getUserAccess(session.user.id);
      const revisionLimit = access.limits.ai_revision;

      if (revisionLimit === false) {
        return NextResponse.json(
          { error: "FEATURE_NOT_AVAILABLE", message: "AI Smart Revision tidak tersedia di paket kamu." },
          { status: 403 }
        );
      }

      if (revisionLimit !== "unlimited") {
        const [usageCount] = await db
          .select({ count: count() })
          .from(usageLogs)
          .where(
            and(
              eq(usageLogs.userId, session.user.id),
              eq(usageLogs.actionType, "ai_revision")
            )
          );

        if (usageCount.count >= revisionLimit) {
          return NextResponse.json(
            { error: "QUOTA_EXCEEDED", message: `Batas gratis AI Smart Revision sudah terpakai (${revisionLimit}/${revisionLimit}). Upgrade ke Premium untuk unlimited.` },
            { status: 403 }
          );
        }
      }

      if (!cvDoc) {
        return NextResponse.json(
          { error: "CV_NOT_FOUND", message: "CV tidak ditemukan" },
          { status: 404 }
        );
      }

      const userPrompt = JSON.stringify({
        currentText: body.currentText || "",
        fullName: body.fullName || "",
        jobTitle: body.jobTitle || cvTitle,
        professionalTitle: body.professionalTitle || "",
        skills: body.skills || skillsList,
        workHistorySummary: body.workHistorySummary || "",
        eduSummary: body.eduSummary || "",
        certSummary: body.certSummary || [],
        jobDescription: cvDoc?.jobDescription || "",
      });

      const aiResult = await callAI({
        systemPrompt: SUMMARY_REVISION_PROMPT_V2,
        userPrompt,
        temperature: 0.5,
        model: MODELS.CHAT,
        taskType: "revision",
        userContext: userCtx,
      });

      await db.insert(usageLogs).values({
        userId: session.user.id,
        actionType: "ai_revision",
        resourceId: id,
      });

      return NextResponse.json(aiResult, { status: 200 });
    }

    // ── Mode: REVISE (default — perbaiki teks yang sudah ada) ──
    if (!currentText) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Teks tidak boleh kosong" },
        { status: 400 }
      );
    }

    // 1. Cek Kuota Revision
    const access = await getUserAccess(session.user.id);
    const revisionLimit = access.limits.ai_revision;

    if (revisionLimit === false) {
      return NextResponse.json(
        { error: "FEATURE_NOT_AVAILABLE", message: "AI Smart Revision tidak tersedia di paket kamu." },
        { status: 403 }
      );
    }

    if (revisionLimit !== "unlimited") {
      const [usageCount] = await db
        .select({ count: count() })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.userId, session.user.id),
            eq(usageLogs.actionType, "ai_revision")
          )
        );

      if (usageCount.count >= revisionLimit) {
        return NextResponse.json(
          { error: "QUOTA_EXCEEDED", message: `Batas gratis AI Smart Revision sudah terpakai (${revisionLimit}/${revisionLimit}). Upgrade ke Premium untuk unlimited.` },
          { status: 403 }
        );
      }
    }

    if (!cvDoc) {
      return NextResponse.json(
        { error: "CV_NOT_FOUND", message: "CV tidak ditemukan" },
        { status: 404 }
      );
    }

    // 2. Filter Keyword Sederhana
    const jdWords = cvDoc.jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const relevantJdKeywords = jdWords.filter((word) =>
      currentText.toLowerCase().includes(word)
    );

    // 3. Panggil AI
    const userPrompt = JSON.stringify({
      sectionType: section,
      currentText: currentText,
      jobDescription: cvDoc.jobDescription,
      relevantJdKeywords: relevantJdKeywords,
    });

    const aiResult = await callAI({
      systemPrompt: REVISION_PROMPT_V2,
      userPrompt,
      temperature: 0.5,
      model: MODELS.CHAT,
      taskType: "revision",
      userContext: userCtx,
    });

    // 4. Catat Pemakaian
    await db.insert(usageLogs).values({
      userId: session.user.id,
      actionType: "ai_revision",
      resourceId: id,
    });

    // 5. Return hasil
    return NextResponse.json(aiResult, { status: 200 });
  } catch (error) {
    console.error("Revise Error:", error);
    return NextResponse.json(
      { error: "AI_SERVICE_ERROR", message: "Layanan AI sedang gangguan. Silakan coba lagi beberapa saat." },
      { status: 500 }
    );
  }
}