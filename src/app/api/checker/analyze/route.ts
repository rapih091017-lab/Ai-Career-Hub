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
  const { extractedText, jobDescription, roleCategory } = body;

  // Kategori posisi → bobot per-section dinamis (lihat prompt analysis-v3 ROLE CATEGORY).
  const VALID_ROLE_CATEGORIES = ["tech", "creative", "sales_marketing", "fresh_graduate", "general"];
  const roleCat = VALID_ROLE_CATEGORIES.includes(roleCategory) ? roleCategory : "general";

  // ── 0.5 VALIDASI INPUT ───────────────────────────────────────────
  // Cegah payload tak lengkap (undefined/non-string/kosong) dari crash
  // toLowerCase, prompt AI berisi "undefined", atau insert DB gagal.
  if (typeof extractedText !== "string" || !extractedText.trim()) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Teks CV wajib diisi." },
      { status: 400 },
    );
  }

  // Job description opsional — normalisasi ke string kosong agar aman
  // untuk cleanWords, prompt AI, dan insert DB (kolom NOT NULL).
  const jd = typeof jobDescription === "string" ? jobDescription : "";

  // ── 1. CEK SESSION DULU ──────────────────────────────────────────
  // Session dicek sebelum kuota anonim — supaya user yang sudah login
  // tidak ikut dihitung kuota anonim dari riwayat anonymous sebelumnya.
  const session = await auth();

  // ── 2. CEK KUOTA USER (jika login) ───────────────────────────────
  // Model analyzer: pembeli paket yang memberi fitur CV Analyzer → deepseek-v4-pro (thinking);
  // free / paket tanpa analyzer → deepseek-v4-flash. Diputuskan di sini.
  let useReasoner = false;
  if (session?.user?.id) {
    const access = await getUserAccess(session.user.id);
    // purchasedFeatures = fitur yang benar-benar dibeli (bukan kuota gratis),
    // jadi pembeli portfolio_web misalnya TETAP dapat V3 untuk jatah free analyzer-nya.
    useReasoner = access.purchasedFeatures.cv_analyzer !== false;
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

  // ── 3. CEK KUOTA ANONYMOUS (hanya jika TIDAK login) ──────────────
  // ip already defined by rate limiter above
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const cookieHash = userAgent;
  // x-anon-id: UUID per browser yang dikirim client (localStorage).
  // Ini jadi fingerprint utama — supaya kuota 2x tidak dishare semua user
  // yang kebetulan pakai IP/User-Agent sama (masalah di localhost & NAT).
  const anonId = request.headers.get("x-anon-id")?.trim() || null;

  if (!session?.user?.id) {
    const [anonCount] = await db
      .select({ value: count() })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.actionType, "checker_check"),
          // Prioritaskan anonId; fallback ke ip+cookieHash untuk record lama
          anonId
            ? sql`${usageLogs.anonymousFingerprint}->>'anonId' ILIKE ${anonId}`
            : and(
                sql`${usageLogs.anonymousFingerprint}->>'ip' ILIKE ${ip}`,
                sql`${usageLogs.anonymousFingerprint}->>'cookieHash' ILIKE ${cookieHash}`,
              ),
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
  }

  // ── 4. HITUNG SKOR RULE-BASED ────────────────────────────────────
  const cleanWords = (text: string | null | undefined): Set<string> => {
    return new Set(
      (text ?? "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 1),
    );
  };

  const jdWords = cleanWords(jd);
  const cvWords = cleanWords(extractedText);

  let matches = 0;
  for (const word of jdWords) {
    if (cvWords.has(word)) matches++;
  }

  const keywordMatchRate =
    jdWords.size > 0 ? Math.round((matches / jdWords.size) * 100) : 0;    // ── 5. PANGGIL AI ────────────────────────────────────────────────
  // ── Extract role hint from CV for context injection ──
  const cvLines = (extractedText ?? "").split("\n").slice(0, 15);
  const roleHint: string | null = cvLines
    .map((l: string) => l.replace(/^[#*\s]+/, "").trim())
    .find((l: string) => l.toLowerCase().includes("engineer") || l.toLowerCase().includes("developer") || l.toLowerCase().includes("manager") || l.toLowerCase().includes("analyst") || l.toLowerCase().includes("designer") || l.toLowerCase().includes("specialist"))
    ?? null;

  let aiAnalysis: AnalysisResult | null = null;
  try {
    aiAnalysis = await callAI<AnalysisResult>({
      systemPrompt: ANALYSIS_PROMPT_V3.replace(/\{\{ROLE_CATEGORY\}\}/g, roleCat),
      userPrompt: `=== ROLE CATEGORY: ${roleCat} ===\n\n=== CV KANDIDAT ===\n${extractedText}\n\n=== JOB DESCRIPTION TARGET ===\n${jd || "Tidak ada deskripsi pekerjaan."}`,
      temperature: 0.3,
      // Model: premium → deepseek-v4-pro (thinking) untuk analisis mendalam;
      // free/anonymous → deepseek-v4-flash agar biaya terkontrol.
      // Catatan: R1 tidak mendukung response_format json_object — JSON dipaksa
      // via prompt analysis-v3 dan ditangani adapter (isReasoner).
      model: useReasoner ? MODELS.REASONER : MODELS.CHAT,
      // R1: token reasoning ikut menghabiskan budget max_tokens → 16K agar
      // JSON final tidak terpotong. V3 cukup 8K.
      maxTokens: useReasoner ? 16384 : 8192,
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

  // ── 6. NORMALIZE AI RESPONSE ──────────────────────────────────────
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

  // ── 7. HITUNG SKOR AKHIR ─────────────────────────────────────────
  // Bobot fallback konsisten dengan metodologi prompt analysis-v3:
  // Summary 20% · Experience 35% · Skills 25% · Education 10% · Format ATS 10%
  const overall = aiAnalysis?.overall_score ?? Math.round(
    (aiAnalysis?.breakdown?.summary?.score ?? keywordMatchRate) * 0.2 +
      (aiAnalysis?.breakdown?.experience?.score ?? 50) * 0.35 +
      (aiAnalysis?.breakdown?.skills?.score ?? 50) * 0.25 +
      (aiAnalysis?.breakdown?.education?.score ?? 70) * 0.1 +
      (aiAnalysis?.breakdown?.format_ats?.score ?? 70) * 0.1
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
    weightsApplied: aiAnalysis?.weights_applied ?? null,
    atsPrediction: normalizedAtsPrediction,
  };

  // ── 8. SIMPAN KE DATABASE ────────────────────────────────────────
  const userId = session?.user?.id ?? null;
  const anonymousFingerprint = userId
    ? null
    : anonId
    ? { ip, cookieHash, anonId }
    : { ip, cookieHash };

  const [newResult] = await db
    .insert(checkerResults)
    .values({
      userId,
      anonymousFingerprint,
      cvTextExtracted: extractedText,
      jobDescription: jd,
      scores,
      aiFeedback,
      fullResult: aiStructuredData,
    })
    .returning();

  await db.insert(usageLogs).values({
    userId,
    anonymousFingerprint,
    actionType: "checker_check",
    resourceId: newResult.id,
  });

  // ── 9. RETURN ────────────────────────────────────────────────────
  return NextResponse.json(
    {
      id: newResult.id,
      scores,
      aiFeedback,
      summary: aiFeedback.summary,
      // Model yang dipakai — ditampilkan sebagai badge di UI hasil analisis.
      // Hanya dikirim jika AI benar-benar berhasil (aiAnalysis non-null),
      // supaya badge tidak muncul di response fallback tanpa analisis AI.
      aiModel: aiAnalysis ? (useReasoner ? "V4 Pro" : "V4 Flash") : undefined,
      ...aiStructuredData,
    },
    { status: 200 },
  );
});
