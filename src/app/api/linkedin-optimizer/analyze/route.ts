import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { linkedinOptimizations, usageLogs } from "@/db/schema";
import { callAI, MODELS } from "@/lib/ai/adapter";
import { getUserAccess } from "@/lib/access";
import { LINKEDIN_OPTIMIZER_PROMPT } from "@/lib/ai/prompts/linkedin-optimizer";
import type { LinkedInOptimizerResult } from "@/lib/ai/prompts/schemas";
import { sanitizeExtractedText } from "@/lib/checker/extracted-text";
import { buildLinkedInResult } from "@/lib/linkedin-optimizer/result";
import { apiHandler, errorResponse } from "@/lib/api-utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

// Satu panggilan model + validasi. Model berpikir butuh puluhan detik; tanpa
// batas ini route ikut default akun dan bisa berakhir 504 tanpa hasil.
export const maxDuration = 300;

/** Batas gratis untuk tamu, sama seperti checker. */
const GUEST_LIMIT = 2;

export const POST = apiHandler(async (request: NextRequest) => {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rl = checkRateLimit({
    key: `linkedin-optimizer:${ip}`,
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  const body = await request.json();
  const { resumeText: resumeRaw, branding: brandingRaw, lang } = body;

  const outputLang = lang === "en" ? "en" : "id";
  const t = (id: string, en: string) => (outputLang === "en" ? en : id);

  if (typeof resumeRaw !== "string" || !resumeRaw.trim()) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: t("Teks resume wajib diisi.", "Resume text is required.") },
      { status: 400 },
    );
  }
  if (typeof brandingRaw !== "string" || !brandingRaw.trim()) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        message: t(
          "Isi dulu kamu mau dikenal sebagai apa.",
          "Tell us what you want to be known for first.",
        ),
      },
      { status: 400 },
    );
  }

  // Byte NUL dari ekstraksi PDF dibuang sebelum masuk prompt dan database.
  const resumeText = sanitizeExtractedText(resumeRaw);
  const branding = sanitizeExtractedText(brandingRaw).slice(0, 300);

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // ── Kuota ────────────────────────────────────────────────────────
  // Memakai jatah fitur CV Analyzer yang sama seperti checker, tapi dihitung
  // terpisah: satu optimasi LinkedIn tidak menghabiskan jatah cek CV.
  let useReasoner = false;

  if (userId) {
    const access = await getUserAccess(userId);
    const limit = access.limits.cv_analyzer;

    if (limit === false) {
      return NextResponse.json(
        {
          error: "FEATURE_NOT_AVAILABLE",
          message: t(
            "LinkedIn Optimizer tidak tersedia di paket kamu. Upgrade untuk mengakses.",
            "LinkedIn Optimizer is not available on your plan. Upgrade to access it.",
          ),
        },
        { status: 403 },
      );
    }

    if (limit !== "unlimited") {
      const [used] = await db
        .select({ value: count() })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.userId, userId),
            eq(usageLogs.actionType, "linkedin_optimizer"),
          ),
        );

      if (used.value >= limit) {
        return NextResponse.json(
          {
            error: "QUOTA_EXCEEDED",
            message: t(
              `Batas optimasi (${limit}x) di paketmu sudah habis. Paket satuan menambah 1x lagi.`,
              `Your optimization limit (${limit}x) is used up. A one-off pack adds 1 more.`,
            ),
          },
          { status: 403 },
        );
      }
    }

    // Pembeli fitur CV Analyzer mendapat model berpikir; jatah gratis memakai
    // model ringan supaya biaya tetap terkendali.
    useReasoner = access.purchasedFeatures.cv_analyzer !== false;
  } else {
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const cookieHash = userAgent;
    const anonId = request.headers.get("x-anon-id")?.trim() || null;

    const [used] = await db
      .select({ value: count() })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.actionType, "linkedin_optimizer"),
          anonId
            ? sql`${usageLogs.anonymousFingerprint}->>'anonId' ILIKE ${anonId}`
            : and(
                sql`${usageLogs.anonymousFingerprint}->>'ip' ILIKE ${ip}`,
                sql`${usageLogs.anonymousFingerprint}->>'cookieHash' ILIKE ${cookieHash}`,
              ),
        ),
      );

    if (used.value >= GUEST_LIMIT) {
      return NextResponse.json(
        {
          error: "QUOTA_EXCEEDED",
          message: t(
            "Jatah gratis untuk tamu sudah habis. Login untuk lanjut.",
            "The free guest quota is used up. Log in to continue.",
          ),
        },
        { status: 403 },
      );
    }
  }

  // ── Panggil model ────────────────────────────────────────────────
  let aiResult: LinkedInOptimizerResult | null = null;
  try {
    aiResult = await callAI<LinkedInOptimizerResult>({
      systemPrompt: LINKEDIN_OPTIMIZER_PROMPT,
      userPrompt: [
        "=== ARAH BRANDING ===",
        branding,
        "",
        "=== RESUME KANDIDAT ===",
        resumeText,
      ].join("\n"),
      temperature: 0.4,
      model: useReasoner ? MODELS.REASONER : MODELS.CHAT,
      maxTokens: 16384,
      // Nalar dimatikan supaya muat di batas waktu, sama seperti checker.
      reasoningEffort: "none",
      maxRetries: 1,
      taskType: "linkedin_optimizer",
    });
  } catch (error) {
    console.error("LinkedIn optimizer AI error:", error);
  }

  if (!aiResult) {
    return errorResponse(
      "AI_ANALYSIS_FAILED",
      t(
        "Model belum bisa menyelesaikan optimasi. Coba lagi sebentar.",
        "The model could not finish the optimization. Try again shortly.",
      ),
      503,
    );
  }

  const result = buildLinkedInResult(aiResult);
  if (!result) {
    return errorResponse(
      "AI_ANALYSIS_FAILED",
      t(
        "Hasil optimasi tidak lengkap. Coba lagi.",
        "The optimization result was incomplete. Try again.",
      ),
      503,
    );
  }

  const anonymousFingerprint = userId
    ? null
    : {
        ip,
        cookieHash: request.headers.get("user-agent") ?? "unknown",
        ...(request.headers.get("x-anon-id")?.trim()
          ? { anonId: request.headers.get("x-anon-id")!.trim() }
          : {}),
      };

  const [row] = await db
    .insert(linkedinOptimizations)
    .values({
      userId,
      anonymousFingerprint,
      branding,
      resumeText,
      overallScore: result.overallScore,
      grade: result.grade,
      // Kolom jsonb bertipe Record<string, unknown>; bentuknya sudah
      // dinormalisasi buildLinkedInResult dan divalidasi ulang saat dibaca.
      fullResult: result as unknown as Record<string, unknown>,
    })
    .returning();

  await db.insert(usageLogs).values({
    userId,
    anonymousFingerprint,
    actionType: "linkedin_optimizer",
    resourceId: row.id,
  });

  return NextResponse.json({ id: row.id, result }, { status: 200 });
});
