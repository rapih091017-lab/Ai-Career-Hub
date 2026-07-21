import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { checkerResults, usageLogs } from "@/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { getUserAccess } from "@/lib/access";
import { ANALYSIS_PROMPT_V3 } from "@/lib/ai/prompts/analysis-v3";
import type { AnalysisResult } from "@/lib/ai/prompts/schemas";
import { apiHandler } from "@/lib/api-utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

export const POST = apiHandler(async (request: NextRequest) => {
  // ── 0. RATE LIMIT ─────────────────────────────────────────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rl = checkRateLimit({
    key: `checker:${ip}`,
    maxRequests: 10,
    windowSeconds: 60,
  });

  if (!rl.allowed) {
    return rateLimitResponse(rl.resetInSeconds);
  }

  const body = await request.json();
  const { extractedText, jobDescription, originalFileName } = body;

  // ── 1. CEK KUOTA ANONYMOUS ────────────────────────────────────────
  // ip already defined by rate limiter above
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const cookieHash = userAgent;

  const [anonCount] = await db
    .select({ value: count() })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.actionType, "checker_check"),
        sql`${usageLogs.anonymousFingerprint}->>'ip' ILIKE ${ip}`,
        sql`${usageLogs.anonymousFingerprint}->>'cookieHash' ILIKE ${cookieHash}`,
      ),
    );

  if (anonCount.value >= 2) {
    return NextResponse.json(
      {
        error: "QUOTA_EXCEEDED",
        message:
          "Batas gratis 2x pengecekan sudah habis. Silakan login untuk melanjutkan.",
      },
      { status: 403 },
    );
  }

  // ── 2. CEK KUOTA USER (jika login) ───────────────────────────────
  const session = await auth();

  if (session?.user?.id) {
    const access = await getUserAccess(session.user.id);
    const cvAnalyzerLimit = access.limits.cv_analyzer;

    if (cvAnalyzerLimit === false) {
      return NextResponse.json(
        { error: "FEATURE_NOT_AVAILABLE", message: "CV Analyzer tidak tersedia di paket kamu. Upgrade untuk mengakses." },
        { status: 403 },
      );
    }

    if (cvAnalyzerLimit !== "unlimited") {
      const [userCount] = await db
        .select({ value: count() })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.userId, session.user.id),
            eq(usageLogs.actionType, "checker_check"),
          ),
        );

      if (userCount.value >= cvAnalyzerLimit) {
        return NextResponse.json(
          {
            error: "QUOTA_EXCEEDED",
            message: `Batas gratis pengecekan (${cvAnalyzerLimit}x) sudah habis. Upgrade ke Premium untuk unlimited.`,
          },
          { status: 403 },
        );
      }
    }
  }

  // ── 3. HITUNG SKOR RULE-BASED ────────────────────────────────────
  const cleanWords = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 1),
    );
  };

  const jdWords = cleanWords(jobDescription);
  const cvWords = cleanWords(extractedText);

  let matches = 0;
  for (const word of jdWords) {
    if (cvWords.has(word)) matches++;
  }

  const keywordMatchRate =
    jdWords.size > 0 ? Math.round((matches / jdWords.size) * 100) : 0;    // ── 4. PANGGIL AI ────────────────────────────────────────────────
  // ── Extract role hint from CV for context injection ──
  const cvLines = extractedText.split("\n").slice(0, 15);
  const roleHint: string | null = cvLines
    .map((l: string) => l.replace(/^[#*\s]+/, "").trim())
    .find((l: string) => l.toLowerCase().includes("engineer") || l.toLowerCase().includes("developer") || l.toLowerCase().includes("manager") || l.toLowerCase().includes("analyst") || l.toLowerCase().includes("designer") || l.toLowerCase().includes("specialist"))
    ?? null;

  let aiAnalysis: AnalysisResult | null = null;
  try {
    aiAnalysis = await callAI<AnalysisResult>({
      systemPrompt: ANALYSIS_PROMPT_V3,
      userPrompt: `${extractedText}

=== JOB DESCRIPTION ===
${jobDescription || "Tidak ada deskripsi pekerjaan."}`,
      temperature: 0.3,
      maxTokens: 8192,
      model: MODELS.CHAT,
      taskType: "analysis",
      userContext: buildUserContext({
        jobTitle: roleHint,
        industry: undefined,
        experienceLevel: undefined,
      }),
    });
  } catch (error) {
    console.error("AI Analysis error:", error);
  }

  // ── 5. NORMALIZE AI RESPONSE ──────────────────────────────────────
  // ats_prediction bisa berupa string ATAU object {result, match_confidence, ...}
  // Pastikan selalu string untuk menghindari React render error
  const normalizeAtsPrediction = (pred: unknown): string | null => {
    if (!pred) return null;
    if (typeof pred === "string") return pred;
    if (typeof pred === "object" && pred !== null && "result" in pred) {
      return (pred as { result: string }).result;
    }
    return String(pred);
  };

  // ── 6. HITUNG SKOR AKHIR ─────────────────────────────────────────
  const overall = aiAnalysis?.overall_score ?? Math.round(
    keywordMatchRate * 0.25 +
      (aiAnalysis?.breakdown?.experience?.score ?? 50) * 0.35 +
      (aiAnalysis?.breakdown?.skills?.score ?? 50) * 0.25 +
      (aiAnalysis?.breakdown?.format_ats?.score ?? 70) * 0.15
  );

  // Backward-compat scores buat DB
  const scores = {
    overall,
    keywordGap: aiAnalysis?.keyword_analysis?.match_rate_pct ?? keywordMatchRate,
    contextRelevance: aiAnalysis?.breakdown?.experience?.score ?? 50,
    atsRules: aiAnalysis?.breakdown?.format_ats?.score ?? 70,
  };

  const normalizedAtsPrediction = normalizeAtsPrediction(aiAnalysis?.ats_prediction);

  const aiFeedback = {
    keywordGap: aiAnalysis?.keyword_analysis
      ? `Ditemukan ${aiAnalysis.keyword_analysis.matched.length} keyword cocok, ${aiAnalysis.keyword_analysis.missing_critical.length} critical hilang.`
      : "Tidak dapat menganalisis keyword gap. Silakan coba lagi.",
    contextRelevance: aiAnalysis?.narrative_feedback?.overall_assessment?.slice(0, 200) ?? "Tidak dapat menganalisis relevansi. Silakan coba lagi.",
    atsRules: normalizedAtsPrediction ?? "Tidak dapat menganalisis kepatuhan ATS.",
    summary: aiAnalysis?.verdict ?? "Analisis AI tidak tersedia.",
  };

  // Data struktur lengkap dari AI — dikirim ke frontend (atsPrediction sudah dinormalisasi)
  const aiStructuredData = {
    breakdown: aiAnalysis?.breakdown ?? null,
    keywordAnalysis: aiAnalysis?.keyword_analysis ?? null,
    narrativeFeedback: aiAnalysis?.narrative_feedback ?? null,
    actionPlan: aiAnalysis?.action_plan ?? null,
    bulletReview: aiAnalysis?.bullet_review ?? [],
    missingSections: aiAnalysis?.missing_sections ?? [],
    grade: aiAnalysis?.grade ?? null,
    atsPrediction: normalizedAtsPrediction,
  };

  // ── 6. SIMPAN KE DATABASE ────────────────────────────────────────
  const userId = session?.user?.id ?? null;
  const anonymousFingerprint = userId
    ? null
    : { ip, cookieHash };

  const [newResult] = await db
    .insert(checkerResults)
    .values({
      userId,
      anonymousFingerprint,
      cvTextExtracted: extractedText,
      jobDescription,
      scores,
      aiFeedback,
    })
    .returning();

  await db.insert(usageLogs).values({
    userId,
    anonymousFingerprint,
    actionType: "checker_check",
    resourceId: newResult.id,
  });

  // ── 7. RETURN ────────────────────────────────────────────────────
  return NextResponse.json(
    {
      id: newResult.id,
      scores,
      aiFeedback,
      summary: aiFeedback.summary,
      ...aiStructuredData,
    },
    { status: 200 },
  );
});
