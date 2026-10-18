import type {
  ActionPlan,
  BulletItem,
  ImpactForecast,
  IssueItem,
  KeywordAnalysis,
  NarrativeFeedback,
  StoredAnalysisResult,
  StoredBreakdown,
  WeightsApplied,
} from "@/components/checker/types";

/** Baris yang dikembalikan `/api/checker/history/[id]`. `aiModel` sengaja tidak
 *  ada di sini: route itu tidak pernah mengirimkannya, dan field tersebut
 *  disimpan di dalam `fullResult` — bukan sebagai kolom sendiri. */
interface StoredResult {
  scores?: unknown;
  aiFeedback?: unknown;
  fullResult?: unknown;
}

type AnyRecord = Record<string, any>;

/** Objek atau apa pun yang tidak bisa dibaca property-nya (string, null, array). */
function asRecord(v: unknown): AnyRecord {
  return isRecord(v) ? v : {};
}

function isRecord(v: unknown): v is AnyRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Angka finite atau null. Kolom jsonb bisa berisi string/null karena baris rusak
 *  atau terpotong, dan angka pengganti selalu jadi klaim yang tidak berdasar. */
function toNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Angka finite, atau default kalau memang tidak ada. Dipakai untuk field yang
 *  nolnya berarti "tidak ada", bukan "salah": `scores` dan `match_rate_pct` sudah
 *  calculado sendiri di route analyze dan selalu tersimpan. */
function toScore(v: unknown, fallback: number): number {
  return toNumber(v) ?? fallback;
}

function toText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Teks yang isinya cuma spasi dianggap tidak ada — entri seperti itu hanya jadi
 *  bullet kosong di UI. */
function toTextList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

/** Issue boleh string polos (hasil lama) maupun objek { text, severity, source_excerpt }.
 *  Entri string tidak boleh dibuang, karena UI membacanya lewat toIssueItems();
 *  yang dibuang hanya entri tanpa teks, karena jadi bullet kosong. */
function toIssueList(v: unknown): (string | IssueItem)[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => {
    if (typeof x === "string") return x.trim().length > 0;
    return isRecord(x) && typeof x.text === "string" && x.text.trim().length > 0;
  });
}

/** Skor sebuah section, atau null kalau tidak pernah dihitung. Section tanpa skor
 *  tidak boleh dibuat-buat: kartu SectionScoreCard selalu menampilkan persentase,
 *  jadi skor 50 hasil `.catch()` schema akan terbaca sebagai skor asli. */
function toSectionScore(v: unknown): number | null {
  return isRecord(v) ? toNumber(v.score) : null;
}

/** Hanya section yang punya skor yang diteruskan. Baris lama yang `breakdown`-nya
 *  terpotong jadi tampil sebagian, bukan lima kartu dengan angka tebakan. */
function toBreakdown(v: unknown): StoredBreakdown | null {
  if (!isRecord(v)) return null;
  const out: StoredBreakdown = {};

  const summaryScore = toSectionScore(v.summary);
  if (summaryScore !== null) {
    out.summary = {
      score: summaryScore,
      issues: toIssueList(v.summary.issues),
      suggestions: toTextList(v.summary.suggestions),
    };
  }

  const experienceScore = toSectionScore(v.experience);
  if (experienceScore !== null) {
    const quantification = toNumber(v.experience.quantification_pct);
    out.experience = {
      score: experienceScore,
      issues: toIssueList(v.experience.issues),
      suggestions: toTextList(v.experience.suggestions),
      // Hanya isi kalau AI mengirimnya; undefined berarti chip kuantifikasi tidak tampil.
      ...(quantification !== null ? { quantification_pct: quantification } : {}),
    };
  }

  const skillsScore = toSectionScore(v.skills);
  if (skillsScore !== null) {
    out.skills = {
      score: skillsScore,
      issues: toIssueList(v.skills.issues),
      suggestions: toTextList(v.skills.suggestions),
      missing_skills: toTextList(v.skills.missing_skills),
      recommendations: toTextList(v.skills.recommendations),
    };
  }

  const educationScore = toSectionScore(v.education);
  if (educationScore !== null) {
    out.education = {
      score: educationScore,
      relevance: toText(v.education.relevance),
      suggestions: toTextList(v.education.suggestions),
    };
  }

  const formatAtsScore = toSectionScore(v.format_ats);
  if (formatAtsScore !== null) {
    out.format_ats = {
      score: formatAtsScore,
      issues: toIssueList(v.format_ats.issues),
      tips: toTextList(v.format_ats.tips),
    };
  }

  return Object.keys(out).length > 0 ? out : null;
}

function toKeywordAnalysis(v: unknown): KeywordAnalysis | null {
  if (!isRecord(v)) return null;
  return {
    matched: toTextList(v.matched),
    missing_critical: toTextList(v.missing_critical),
    missing_nice_to_have: toTextList(v.missing_nice_to_have),
    synonym_suggestions: toTextList(v.synonym_suggestions),
    match_rate_pct: toScore(v.match_rate_pct, 0),
  };
}

function toNarrativeFeedback(v: unknown): NarrativeFeedback | null {
  if (!isRecord(v)) return null;
  return {
    overall_assessment: toText(v.overall_assessment),
    strengths: toTextList(v.strengths),
    areas_for_improvement: toTextList(v.areas_for_improvement),
    ats_recommendations: toTextList(v.ats_recommendations),
  };
}

function toActionPlan(v: unknown): ActionPlan | null {
  if (!isRecord(v)) return null;
  return {
    quick_wins: toTextList(v.quick_wins),
    short_term: toTextList(v.short_term),
    long_term: toTextList(v.long_term),
  };
}

/** Komponen BulletReviewCard membaca field tiap item langsung (section, issues,
 *  suggested_rewrite, priority), jadi tiap baris diluruskan di sini: entri yang
 *  bukan objek dibuang, field yang hilang diisi default yang sama dengan schema. */
function toBulletReview(v: unknown): BulletItem[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isRecord).map((item) => {
    const cari = toNumber(item.cari_score);
    return {
      section: toText(item.section),
      original_text: toText(item.original_text),
      issues: toIssueList(item.issues),
      suggested_rewrite: toText(item.suggested_rewrite),
      priority:
        item.priority === "High" || item.priority === "Medium" || item.priority === "Low" ? item.priority : "Medium",
      ...(cari !== null ? { cari_score: cari } : {}),
    };
  });
}

/** Bobot dipakai sebagai penjelasan skor ("35% experience"), jadi bobot yang
 *  hilang berarti angka itu tidak pernah ada. Lebih jujur catatan bobotnya
 *  disembunyikan daripada menampilkan 0% yang mengarang. */
function toWeightsApplied(v: unknown): WeightsApplied | null {
  if (!isRecord(v) || typeof v.role_category !== "string") return null;
  const summary = toNumber(v.summary_weight);
  const experience = toNumber(v.experience_weight);
  const skills = toNumber(v.skills_weight);
  const education = toNumber(v.education_weight);
  const formatAts = toNumber(v.format_ats_weight);
  if (summary === null || experience === null || skills === null || education === null || formatAts === null) {
    return null;
  }
  return {
    role_category: v.role_category,
    summary_weight: summary,
    experience_weight: experience,
    skills_weight: skills,
    education_weight: education,
    format_ats_weight: formatAts,
  };
}

/** Proyeksi skor adalah angka yang ditampilkan sebagai janji hasil, jadi hanya
 *  diteruskan kalau ketiganya benar-benar ada; kalau tidak, kartu disembunyikan
 *  oleh ImpactForecastCard yang memeriksa sendiri. */
function toImpactForecast(v: unknown): ImpactForecast | null {
  if (!isRecord(v)) return null;
  const current = toNumber(v.current_score);
  const quickWins = toNumber(v.projected_after_quick_wins);
  const allFixes = toNumber(v.projected_after_all_fixes);
  if (current === null || quickWins === null || allFixes === null) return null;
  return {
    current_score: current,
    projected_after_quick_wins: quickWins,
    projected_after_all_fixes: allFixes,
  };
}

/** Grade dan prediksi ATS punya daftar nilai tertutup; jsonb bisa berisi apa saja,
 *  sedangkan UI mewarnainya berdasarkan daftar itu. */
function toGrade(v: unknown): "A" | "B" | "C" | "D" | null {
  return v === "A" || v === "B" || v === "C" || v === "D" ? v : null;
}

function toAtsPrediction(v: unknown): "Likely Pass" | "Borderline" | "Likely Fail" | null {
  return v === "Likely Pass" || v === "Borderline" || v === "Likely Fail" ? v : null;
}

/** Badge model hanya boleh menampilkan model yang benar-benar dipakai; nilai
 *  di luar daftar itu (atau baris lama yang belum menyimpannya) jadi undefined. */
function toAiModel(v: unknown): "V4 Pro" | "V4 Flash" | undefined {
  return v === "V4 Pro" || v === "V4 Flash" ? v : undefined;
}

/**
 * Bentukkan hasil analisis dari baris yang tersimpan di `checker_results`.
 *
 * Dipisah dari komponen supaya bisa diuji dan supaya kolom jsonb yang tidak
 * lengkap tidak dipercaya begitu saja. Aturannya satu: apa yang tidak ada di
 * baris tidak dimunculkan sebagai angka — section breakdown, bobot, dan proyeksi
 * skor hilang kalau tidak lengkap, bukan diisi default yang terlihat meyakinkan.
 *
 * `meta`, `careerVelocity`, dan `atsPredictionDetail` diteruskan apa adanya:
 * seluruh field di dalamnya opsional di sisi Client, jadi panel sisi HR bisa
 * menampilkan fallback sendiri tanpa angka yang mengarang.
 */
export function analysisFromFullResult(id: string, data: StoredResult): StoredAnalysisResult {
  const scores = asRecord(data.scores);
  const feedback = asRecord(data.aiFeedback);
  const full = asRecord(data.fullResult);

  return {
    id,
    scores: {
      overall: toScore(scores.overall, 0),
      keywordGap: toScore(scores.keywordGap, 0),
      contextRelevance: toScore(scores.contextRelevance, 0),
      atsRules: toScore(scores.atsRules, 0),
    },
    aiFeedback: {
      keywordGap: toText(feedback.keywordGap),
      contextRelevance: toText(feedback.contextRelevance),
      atsRules: toText(feedback.atsRules),
      summary: toText(feedback.summary),
    },
    summary: toText(feedback.summary),
    grade: toGrade(full.grade),
    atsPrediction: toAtsPrediction(full.atsPrediction),
    breakdown: toBreakdown(full.breakdown),
    keywordAnalysis: toKeywordAnalysis(full.keywordAnalysis),
    narrativeFeedback: toNarrativeFeedback(full.narrativeFeedback),
    actionPlan: toActionPlan(full.actionPlan),
    bulletReview: toBulletReview(full.bulletReview),
    missingSections: toTextList(full.missingSections),
    weightsApplied: toWeightsApplied(full.weightsApplied),
    impactForecast: toImpactForecast(full.impactForecast),
    meta: full.meta ?? null,
    careerVelocity: full.careerVelocity ?? null,
    atsPredictionDetail: full.atsPredictionDetail ?? null,
    // Disimpan route analyze di dalam full_result, bukan jadi kolom sendiri.
    aiModel: toAiModel(full.aiModel),
  };
}
