import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments, usageLogs } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { getUserAccess } from "@/lib/access";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { AUTO_FIX_PROMPT_V1 } from "@/lib/ai/prompts/auto-fix-v1";
import { parseAutoFixSuggestions } from "@/lib/auto-fix";

/**
 * POST /api/cv-documents/[id]/auto-fix
 *
 * Memeriksa draf CV lalu mengembalikan daftar saran perbaikan
 * (bahasa, bullet, kata kunci). Endpoint ini HANYA membaca dan
 * mengusulkan — tidak ada perubahan yang disimpan. Penerapan terjadi
 * di client setelah user menyetujui tiap saran satu per satu.
 *
 * Body: { cv?: {...}, jobDescription?: string }
 * Respons: { suggestions: AutoFixSuggestion[] }
 */
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
      key: `auto-fix:${session.user.id}`,
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetInSeconds);
    }

    const { id } = await params;

    // CV harus milik user yang login.
    const [cvDoc] = await db
      .select()
      .from(cvDocuments)
      .where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, session.user.id)))
      .limit(1);

    if (!cvDoc) {
      return NextResponse.json(
        { error: "CV_NOT_FOUND", message: "CV tidak ditemukan" },
        { status: 404 }
      );
    }

    // ── 1. KUOTA (pakai jatah AI Suggestion) ─────────────────────
    const access = await getUserAccess(session.user.id);
    const suggestLimit = access.limits.ai_suggestion;

    if (suggestLimit === false) {
      return NextResponse.json(
        { error: "FEATURE_NOT_AVAILABLE", message: "Perbaikan otomatis tidak tersedia di paket kamu." },
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

    // ── 2. AMBIL DRAF CV ─────────────────────────────────────────
    // Utamakan draf terbaru dari client (state Review), fallback ke
    // data tersimpan kalau client tidak mengirim.
    const body = await request.json();
    const cv = body.cv ?? cvDoc.tailoredContent;
    const jobDescription =
      typeof body.jobDescription === "string"
        ? body.jobDescription
        : cvDoc.jobDescription ?? "";

    const summary = typeof cv?.summary === "string" ? cv.summary : "";
    const workHistory = Array.isArray(cv?.workHistory) ? cv.workHistory : [];
    const skills = Array.isArray(cv?.skills)
      ? cv.skills.map((s: { name?: string }) => s?.name).filter(Boolean)
      : [];
    const cvLang = cv?.cvLang === "en" ? "en" : "id";

    if (!summary && workHistory.length === 0) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "CV masih kosong. Isi ringkasan atau pengalaman dulu sebelum dicek." },
        { status: 400 }
      );
    }

    const userCtx = buildUserContext({
      jobTitle: cvDoc.jobTitle || "",
      industry: undefined,
      cvLang,
      experienceLevel: cv?.experienceLevel ?? undefined,
    });

    // ── 3. PANGGIL AI ────────────────────────────────────────────
    const userPrompt = JSON.stringify({
      summary,
      workHistory: workHistory.map((w: { position?: string; company?: string; description?: string }) => ({
        position: w.position || "",
        company: w.company || "",
        description: w.description || "",
      })),
      skills,
      jobTitle: cvDoc.jobTitle || "",
      jobDescription,
    });

    const aiResult = await callAI({
      systemPrompt: AUTO_FIX_PROMPT_V1,
      userPrompt,
      temperature: 0.4,
      model: MODELS.CHAT,
      userContext: userCtx,
    });

    // Validasi manual: saran yang tidak valid dibuang, bukan diganti default.
    const suggestions = parseAutoFixSuggestions(aiResult).slice(0, 10);

    await db.insert(usageLogs).values({
      userId: session.user.id,
      actionType: "ai_suggestion",
      resourceId: id,
    });

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error("AutoFix Error:", error);
    return NextResponse.json(
      { error: "AI_SERVICE_ERROR", message: "Layanan AI sedang gangguan. Silakan coba lagi beberapa saat." },
      { status: 500 }
    );
  }
}
