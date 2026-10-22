import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { checkerResults, usageLogs } from "@/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { getUserAccess } from "@/lib/access";
import { ANALYSIS_PROMPT_V4 } from "@/lib/ai/prompts/analysis-v4";
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";
import { sanitizeExtractedText } from "@/lib/checker/extracted-text";
import {
  toDurationRewrite,
  toHrFlags,
  toHrQuestions,
  toHrScan,
  toKeywordAnalysis,
  toKnockoutRisks,
  toMissingSections,
  toQuickSummary,
} from "@/lib/checker/analysis-from-full-result";
import { analyzeFailureMessage } from "@/lib/checker/analyze-failure";

import type { AnalysisResult } from "@/lib/ai/prompts/schemas";
import { apiHandler, errorResponse } from "@/lib/api-utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { checkProCheckAllowance } from "@/lib/fair-use";

// Model berpikir butuh ±2 menit (effort "low", terukur 22 Okt 2026). Tanpa
// batas ini route ikut default akun, dan mode deep pernah berakhir 504
// Vercel Runtime Timeout — pengguna menunggu lama lalu tidak dapat hasil.
export const maxDuration = 300;

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
  const { extractedText: extractedTextRaw, jobDescription, roleCategory, lang, mode } = body;

  // Bahasa output analisis mengikuti bahasa UI user (id/en). Default "id" untuk
  // klien lama & backward-compat. Diteruskan ke prompt analysis-v3 {{OUTPUT_LANGUAGE}}.
  const outputLang = lang === "en" ? "en" : "id";
  const t = (id: string, en: string) => (outputLang === "en" ? en : id);

  // Kategori posisi → bobot per-section dinamis (lihat prompt analysis-v3 ROLE CATEGORY).
  const VALID_ROLE_CATEGORIES = ["tech", "creative", "sales_marketing", "fresh_graduate", "general"];
  const roleCat = VALID_ROLE_CATEGORIES.includes(roleCategory) ? roleCategory : "general";

  // ── 0.5 VALIDASI INPUT ───────────────────────────────────────────
  // Cegah payload tak lengkap (undefined/non-string/kosong) dari crash
  // toLowerCase, prompt AI berisi "undefined", atau insert DB gagal.
  if (typeof extractedTextRaw !== "string" || !extractedTextRaw.trim()) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: t("Teks CV wajib diisi.", "CV text is required.") },
      { status: 400 },
    );
  }

  // Byte NUL dari ekstraksi PDF dibuang sebelum dipakai di dua tempat: prompt
  // AI dan insert checker_results. Postgres menolak byte itu untuk kolom text
  // dengan error 22021, sehingga insert gagal setelah AI selesai dan pengguna
  // hanya melihat pesan kesalahan server yang generik.
  const extractedText = sanitizeExtractedText(extractedTextRaw);

  // Job description opsional, normalisasi ke string kosong agar aman
  // untuk cleanWords, prompt AI, dan insert DB (kolom NOT NULL).
  const jd = sanitizeExtractedText(typeof jobDescription === "string" ? jobDescription : "");

  // ── 1. CEK SESSION DULU ──────────────────────────────────────────
  // Session dicek sebelum kuota anonim, supaya user yang sudah login
  // tidak ikut dihitung kuota anonim dari riwayat anonymous sebelumnya.
  const session = await auth();

  // ── 2. CEK KUOTA USER (jika login) ───────────────────────────────
  // Model analyzer: pembeli paket yang memberi fitur CV Analyzer → deepseek-v4-pro (thinking);
  // free / paket tanpa analyzer → deepseek-v4-flash. Diputuskan di sini.
  //
  // `mode` dari klien overriding: "fast" memaksa model ringan (hasil dalam
  // hitungan detik), "deep" memakai model berpikir (lebih menyeluruh, tapi
  // bisa puluhan detik). Tanpa ini, pembeli tidak punya kendali atas
  // tradeoff-kecepatan dan hanya bisa menunggu.
  let useReasoner = false;
  if (mode === "fast") {
    useReasoner = false;
  } else if (mode === "deep") {
    // Model berpikir tetap hanya untuk yang boleh memakai CV Analyzer berbayar.
    useReasoner = true;
  } else if (session?.user?.id) {
    const access = await getUserAccess(session.user.id);
    // purchasedFeatures = fitur yang benar-benar dibeli (bukan kuota gratis),
    // jadi pembeli portfolio_web misalnya TETAP dapat V3 untuk jatah free analyzer-nya.
    useReasoner = access.purchasedFeatures.cv_analyzer !== false;
    const cvAnalyzerLimit = access.limits.cv_analyzer;

    if (cvAnalyzerLimit === false) {
      return NextResponse.json(
        { error: "FEATURE_NOT_AVAILABLE", message: t("CV Analyzer tidak tersedia di paket kamu. Upgrade untuk mengakses.", "CV Analyzer is not available on your plan. Upgrade to access it.") },
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
            message: t(
              `Batas mengecek (${cvAnalyzerLimit}x) sudah habis. Paket satuan Cek CV Rp9.000 menambah 1x cek lagi.`,
              `Check limit (${cvAnalyzerLimit}x) reached. The one-off Check CV package (Rp9,000) adds 1 more check.`
            ),
          },
          { status: 403 },
        );
      }
    }
  }

  // ── 2b. BATAS WAJAR MODEL MENDALAM ────────────────────────────────
  // Paket Pro/Max menjanjikan cek CV tanpa batas, dan itu yang ditulis di
  // kartu harga. Batas di sini hanya menjaga biaya server: pemakaian di
  // luar batas dialihkan ke model ringan, bukan diblokir.
  let fairUse = { allowed: true, used: 0, limit: Number.POSITIVE_INFINITY };
  let fairUseApplied = false;
  if (useReasoner && session?.user?.id) {
    fairUse = await checkProCheckAllowance(session.user.id);
    if (!fairUse.allowed) {
      useReasoner = false;
      fairUseApplied = true;
    }
  }

  // ── 3. CEK KUOTA ANONYMOUS (hanya jika TIDAK login) ──────────────
  // ip already defined by rate limiter above
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const cookieHash = userAgent;
  // x-anon-id: UUID per browser yang dikirim client (localStorage).
  // Ini jadi fingerprint utama, supaya kuota 2x tidak dishare semua user
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
message: t(
            "Cek gratis untuk tamu sudah dipakai 2x. Login untuk lanjut.",
            "Both free guest checks are used up. Log in to continue."
          ),
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
      systemPrompt: ANALYSIS_PROMPT_V4
        // Bentuk fungsi dipakai, bukan string biasa: isinya berasal dari input
        // pengguna (role dari form, isi dari kode), dan "$&" pada data itu akan
        // ditafsirkan sebagai pola pengganti kalau dipakai string biasa. Prompt
        // jadi rusak tanpa error, jadi bentuk fungsi dipakai sejak awal.
        .replace(/\{\{ROLE_CATEGORY\}\}/g, () => roleCat)
        .replace(/\{\{OUTPUT_LANGUAGE\}\}/g, () => outputLang)
        // Kedalaman bullet review mengikuti tier akses, hemat token untuk free/flash.
        .replace(/\{\{BULLET_MAX\}\}/g, () => (useReasoner ? "5" : "3")),
      userPrompt: `=== ROLE CATEGORY: ${roleCat} ===\n\n${PROMPT_MARKERS.cv}\n${extractedText}\n\n${PROMPT_MARKERS.jd}\n${jd || (outputLang === "en" ? "No job description provided." : "Tidak ada deskripsi pekerjaan.")}`,
      temperature: 0.3,
      // Model: premium → deepseek-v4-pro (thinking) untuk analisis mendalam;
      // free/anonymous → deepseek-v4-flash agar biaya terkontrol.
      // Catatan: R1 tidak mendukung response_format json_object, JSON dipaksa
      // via prompt analysis-v3 dan ditangani adapter (isReasoner).
      model: useReasoner ? MODELS.REASONER : MODELS.CHAT,
      // Kedua model V4 notabene model berpikir: token nalar (reasoning_content)
      // menghabiskan max_tokens yang sama dengan JSON akhir. Terukur 22 Okt
      // 2026 dengan CV contoh — flash 8K: seluruh 8192 token habis untuk nalar,
      // konten kosong, finish=length, dan setiap percobaan gagal (makanya cek
      // pernah selalu berakhir 503 setelah ±105 detik). Flash 16K: ±59 detik,
      // JSON valid. Karena max_tokens hanya batas atas (bukan biaya), 16K untuk
      // keduanya tidak menaikkan tagihan ketika keluaran lebih pendek.
      maxTokens: 16384,
      // Nalar dijaga tetap kecil supaya muat di maxDuration: "none" untuk flash
      // (±18 detik) dan "low" untuk pro (±117 detik). Kualitas skor tetap dari
      // prompt & skema yang divalidasi Zod, bukan dari lamanya nalar.
      reasoningEffort: useReasoner ? "low" : "none",
      // Pro ±2 menit per percobaan; tiga percobaan melewati batas 300 detik dan
      // berakhir 504 tanpa pesan ke pengguna. Satu retry cukup menjaga kasus
      // terburuk tetap di bawah batas.
      maxRetries: useReasoner ? 1 : 2,
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

  // callAI sudah mencoba ulang sendiri, jadi null di sini berarti semua
  // percobaan gagal. Dulu route tetap melanjutkan dan menyusun skor dari
  // rumus cadangan (keyword match + 50/50/70/70), hasilnya disimpan, dan
  // pengguna melihat angka yang bukan hasil AI dengan wajah hasil AI.
  // Sekarang dihentikan di sini: tidak ada skor dikarang, tidak ada baris
  // tersimpan, dan pesannya jujur tanpa meminta maaf berlebihan.
  if (!aiAnalysis) {
    return errorResponse("AI_ANALYSIS_FAILED", analyzeFailureMessage(outputLang), 503);
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
  // Tidak ada lagi rumus cadangan. Di titik ini analisis dijamin berhasil,
  // jadi setiap angka berasal dari AI. Angka tetap 50/70 yang dulu dipakai
  // saat AI gagal dihapus, karena itu bukan hasil analisis sama sekali.
  const overall = aiAnalysis.overall_score;

  // Backward-compat scores buat DB
  const scores = {
    overall,
    // Keyword match dihitung nyata dari CV + JD di atas, jadi boleh dipakai
    // sebagai cadangan kalau sub-field AI kosong: nilai terukur, bukan tebakan.
    keywordGap: aiAnalysis.keyword_analysis?.match_rate_pct ?? keywordMatchRate,
    contextRelevance: aiAnalysis.breakdown?.experience?.score ?? keywordMatchRate,
    atsRules: aiAnalysis.breakdown?.format_ats?.score ?? keywordMatchRate,
  };

  const normalizedAtsPrediction = normalizeAtsPrediction(aiAnalysis?.ats_prediction);

  // Model yang dipakai, ditampilkan sebagai badge di UI hasil analisis. Hanya
  // diisi kalau AI benar-benar berhasil, supaya badge tidak muncul pada analisis
  // fallback yang tidak memakai AI sama sekali.
  const aiModelLabel = aiAnalysis ? (useReasoner ? "V4 Pro" : "V4 Flash") : null;

  const aiFeedback = {
    keywordGap: aiAnalysis?.keyword_analysis
      ? t(
          `Ditemukan ${aiAnalysis.keyword_analysis.matched.length} keyword cocok, ${aiAnalysis.keyword_analysis.missing_critical.length} critical hilang.`,
          `Found ${aiAnalysis.keyword_analysis.matched.length} matching keywords, ${aiAnalysis.keyword_analysis.missing_critical.length} critical missing.`
        )
      : t("Tidak dapat menganalisis keyword gap. Silakan coba lagi.", "Unable to analyze keyword gap. Please try again."),
    contextRelevance: aiAnalysis?.narrative_feedback?.overall_assessment?.slice(0, 200) ?? t("Tidak dapat menganalisis relevansi. Silakan coba lagi.", "Unable to analyze relevance. Please try again."),
    atsRules: normalizedAtsPrediction ?? t("Tidak dapat menganalisis kepatuhan ATS.", "Unable to analyze ATS compliance."),
    summary: aiAnalysis?.verdict ?? t("Analisis AI tidak tersedia.", "AI analysis is unavailable."),
  };

  // Data struktur lengkap dari AI, dikirim ke frontend (atsPrediction sudah dinormalisasi).
  // V4: risk_factors membawa severity + source_excerpt (object), jadi simpan juga objek asli
  // supaya UI bisa render badge severity. Field ini additive, hasil V3 lama tetap aman.
  const aiStructuredData = {
    breakdown: aiAnalysis?.breakdown ?? null,
    // keywordAnalysis dinormalisasi di sini: `source` dihitung DETERMINISTIK
    // dari ada/tidaknya JD (bukan dari output AI, schema pun tidak memuatnya),
    // evidence/requirements diverifikasi ke teks CV, placements disortir.
    // match_rate_pct diteruskan apa adanya oleh mapper.
    keywordAnalysis: aiAnalysis?.keyword_analysis
      ? toKeywordAnalysis(aiAnalysis.keyword_analysis, {
          source: jd?.trim() ? "job_description" : "role_generic",
          cvText: extractedText,
        })
      : null,
    narrativeFeedback: aiAnalysis?.narrative_feedback ?? null,
    // meta belum pernah diteruskan; detected_seniority di dalamnya dibutuhkan panel sisi HR.
    meta: aiAnalysis?.meta ?? null,
    // Model AI ikut tersimpan di sini: `/api/checker/history/[id]` tidak punya
    // kolom terpisah untuk model, jadi tanpa ini badge model di halaman hasil
    // tersimpan selalu kosong. Tidak perlu migrasi, ini kolom jsonb yang sama.
    aiModel: aiModelLabel,
    careerVelocity: aiAnalysis?.career_velocity ?? null,
    actionPlan: aiAnalysis?.action_plan ?? null,
    bulletReview: aiAnalysis?.bullet_review ?? [],
    // String lama dinormalkan jadi { name } di sini juga: respons live dan baris
    // tersimpan harus punya satu bentuk yang sama.
    missingSections: toMissingSections(aiAnalysis?.missing_sections),
    grade: aiAnalysis?.grade ?? null,
    weightsApplied: aiAnalysis?.weights_applied ?? null,
    impactForecast: aiAnalysis?.impact_forecast ?? null,
    // Ringkasan 10 detik dinormalisasi di sini juga, bukan disimpan mentah:
    // respons live dan baris tersimpan harus identik, dan mapper mengulanginya
    // dengan aman karena toQuickSummary idempoten. null untuk baris tanpa ringkasan.
    quickSummary: toQuickSummary(aiAnalysis?.quick_summary),
    /* Panel HR (prompt 3). evidence flag/knockout divalidasi ke teks CV di sini
     * (bukan di mapper): teks yang bukan potongan CV dikosongkan, flag tetap ada.
     * Teks CV tersedia di semua request analyze, jadi validasi tidak pernah
     * dilewati diam-diam. */
    hrScan: toHrScan(aiAnalysis?.hr_scan),
    hrFlags: toHrFlags(aiAnalysis?.hr_flags, extractedText),
    hrQuestions: toHrQuestions(aiAnalysis?.hr_questions),
    knockoutRisks: toKnockoutRisks(aiAnalysis?.knockout_risks, extractedText),
    durationRewrite: toDurationRewrite(aiAnalysis?.duration_rewrite),
    atsPrediction: normalizedAtsPrediction,
    atsPredictionDetail: aiAnalysis?.ats_prediction && typeof aiAnalysis.ats_prediction === "object"
      ? aiAnalysis.ats_prediction
      : null,
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

  // Catat pemakaian model mendalam terpisah supaya batas wajar per bulan bisa
  // dihitung dan HPP cek CV bisa dilacak.
  if (userId && !fairUseApplied) {
    const wasReasoner = useReasoner;
    await db
      .insert(usageLogs)
      .values({
        userId,
        actionType: wasReasoner ? "checker_check_pro" : "checker_check_light",
        resourceId: newResult.id,
      })
      .catch(() => {});
  }

  // ── 9. RETURN ────────────────────────────────────────────────────
  return NextResponse.json(
    {
      id: newResult.id,
      scores,
      aiFeedback,
      summary: aiFeedback.summary,
      // Diberi tahu kalau analisis ini memakai model ringan karena jatah
      // model mendalam bulan ini sudah habis. Analisis tetap jalan.
      fairUseNote: fairUseApplied
        ? {
            used: fairUse.used,
            limit: fairUse.limit,
            message: "Analisis ini memakai model ringan karena jatah model mendalam bulan ini sudah habis. Hasil tetap keluar, hanya kurang mendalam.",
          }
        : undefined,
      ...aiStructuredData,
      // Ditulis ulang setelah spread: bentuk response tidak boleh berubah karena
      // aiStructuredData ikut menyimpan aiModel. `undefined` membuat key hilang
      // dari JSON, jadi badge tidak muncul saat analisis gagal.
      aiModel: aiModelLabel ?? undefined,
    },
    { status: 200 },
  );
});
