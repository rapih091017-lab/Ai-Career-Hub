import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { reserveQuota, type QuotaReservation } from "@/lib/api-utils";
import { REVISION_PROMPT_V2 } from "@/lib/ai/prompts/revision-v2";
import { SUGGESTION_PROMPT_V2 } from "@/lib/ai/prompts/suggestion-v2";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { SUMMARY_SUGGESTION_PROMPT_V2 } from "@/lib/ai/prompts/suggestion-summary-v2";
import { SUMMARY_REVISION_PROMPT_V2 } from "@/lib/ai/prompts/summary-revision-v2";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let reservation: QuotaReservation | null = null;
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

    // ── Mode: SUGGEST, Summary ──
    if (mode === "suggest" && section === "summary") {
      // Kuota dicek dan dicatat atomik (reserveQuota); gagal → dikembalikan di catch.
      const reserved = await reserveQuota(session.user.id, "ai_suggestion", id);
      if (reserved instanceof NextResponse) return reserved;
      reservation = reserved;

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



      return NextResponse.json(aiResult, { status: 200 });
    }

    // ── Mode: SUGGEST (generate bullet suggestions from job context, work history) ──
    if (mode === "suggest") {
      if (!body.position && !body.jobTitle) {
        return NextResponse.json(
          { error: "INVALID_REQUEST", message: "Position/job title diperlukan untuk generate saran" },
          { status: 400 }
        );
      }

      // Kuota dicek dan dicatat atomik (reserveQuota); gagal → dikembalikan di catch.
      const reserved = await reserveQuota(session.user.id, "ai_suggestion", id);
      if (reserved instanceof NextResponse) return reserved;
      reservation = reserved;

      const userPrompt = JSON.stringify({
        position: body.position || body.jobTitle,
        company: body.company || "",
        industry: body.industry || "",
        skills: body.skills || [],
        // Hook useBuilderAI mengirim field `jobDescription`, terima dua-duanya
        description: body.description || body.jobDescription || "",
      });

      const aiResult = await callAI({
        systemPrompt: SUGGESTION_PROMPT_V2,
        userPrompt,
        temperature: 0.4,
        model: MODELS.CHAT,
        taskType: "suggestion",
        userContext: userCtx,
      });



      return NextResponse.json(aiResult, { status: 200 });
    }

    // ── Mode: REVISE, Summary ──
    if (mode === "revise" && section === "summary") {
      if (!cvDoc) {
        return NextResponse.json(
          { error: "CV_NOT_FOUND", message: "CV tidak ditemukan" },
          { status: 404 }
        );
      }

      // Kuota dicek dan dicatat atomik (reserveQuota); gagal → dikembalikan di catch.
      const reserved = await reserveQuota(session.user.id, "ai_revision", id);
      if (reserved instanceof NextResponse) return reserved;
      reservation = reserved;

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


      return NextResponse.json(aiResult, { status: 200 });
    }

    // ── Mode: REVISE (default, perbaiki teks yang sudah ada) ──
    if (!currentText) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Teks tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (!cvDoc) {
      return NextResponse.json(
        { error: "CV_NOT_FOUND", message: "CV tidak ditemukan" },
        { status: 404 }
      );
    }

    // Kuota dicek dan dicatat atomik (reserveQuota); gagal → dikembalikan di catch.
    const reserved = await reserveQuota(session.user.id, "ai_revision", id);
    if (reserved instanceof NextResponse) return reserved;
    reservation = reserved;

    // 2. Filter Keyword Sederhana
    const jdWords = cvDoc.jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    // Keyword yang SUDAH ada di teks vs yang MASIH KURANG, 
    // yang kurang inilah yang perlu disisipkan AI untuk optimasi ATS.
    const normalizedText = currentText.toLowerCase();
    const relevantJdKeywords = jdWords.filter((word) =>
      normalizedText.includes(word)
    );
    const missingJdKeywords = jdWords.filter((word) =>
      !normalizedText.includes(word)
    );

    // 3. Panggil AI
    const userPrompt = JSON.stringify({
      sectionType: section,
      currentText: currentText,
      jobDescription: cvDoc.jobDescription,
      relevantJdKeywords: relevantJdKeywords,
      missingJdKeywords: missingJdKeywords,
    });

    const aiResult = await callAI({
      systemPrompt: REVISION_PROMPT_V2,
      userPrompt,
      temperature: 0.5,
      model: MODELS.CHAT,
      taskType: "revision",
      userContext: userCtx,
    });


    // 5. Return hasil
    return NextResponse.json(aiResult, { status: 200 });
  } catch (error) {
    await reservation?.refund();
    console.error("Revise Error:", error);
    return NextResponse.json(
      { error: "AI_SERVICE_ERROR", message: "Layanan AI sedang gangguan. Silakan coba lagi beberapa saat." },
      { status: 500 }
    );
  }
}