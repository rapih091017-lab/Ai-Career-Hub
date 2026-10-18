import type {
  ActionPlan,
  AnalysisResult,
  BulletItem,
  ImpactForecast,
  IssueItem,
  KeywordAnalysis,
  NarrativeFeedback,
} from "@/components/checker/types";

interface StoredResult {
  scores?: unknown;
  aiFeedback?: unknown;
  fullResult?: unknown;
  /** Model AI, field yang sama dengan response route analyze; diteruskan apa adanya. */
  aiModel?: AnalysisResult["aiModel"];
}

type AnyRecord = Record<string, any>;

/** Skor default untuk section yang tidak tersimpan. Nilainya sama dengan
 *  .catch() di `AnalysisResultSchema`, supaya hasil tersimpan punya bentuk yang
 *  sama dengan hasil langsung (yang selalu lengkap karena lewat zod). */
const SKOR_DEFAULT = 50;

/** Objek atau apa pun yang tidak bisa dibaca property-nya (string, null, array). */
function asRecord(v: unknown): AnyRecord {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as AnyRecord) : {};
}

function isRecord(v: unknown): v is AnyRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Kolom jsonb bisa berisi null/kode/string karena baris rusak atau jsonb terpotong.
 *  Default-nya mengikuti .catch() di schema: 50 untuk score section, 0 untuk match_rate_pct. */
function toScore(v: unknown, fallback = SKOR_DEFAULT): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function toText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function toTextList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Issue boleh string polos (hasil lama) maupun objek { text, severity, source_excerpt }.
 *  Entri string tidak boleh dibuang, karena UI membacanya lewat toIssueItems(). */
function toIssueList(v: unknown): (string | IssueItem)[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" || (isRecord(x) && typeof x.text === "string"));
}

/** Lima section breakdown selalu dikembalikan lengkap supaya halaman detail tidak
 *  pernah membaca `breakdown.experience.score` pada baris yang section-nya hilang. */
function toBreakdown(v: unknown): AnalysisResult["breakdown"] {
  if (!isRecord(v)) return null;
  const summary = asRecord(v.summary);
  const experience = asRecord(v.experience);
  const skills = asRecord(v.skills);
  const education = asRecord(v.education);
  const formatAts = asRecord(v.format_ats);
  return {
    summary: {
      score: toScore(summary.score),
      issues: toIssueList(summary.issues),
      suggestions: toTextList(summary.suggestions),
    },
    experience: {
      score: toScore(experience.score),
      issues: toIssueList(experience.issues),
      suggestions: toTextList(experience.suggestions),
      // Hanya isi kalau AI mengirimnya; undefined berarti chip kuantifikasi tidak tampil.
      ...(typeof experience.quantification_pct === "number"
        ? { quantification_pct: experience.quantification_pct }
        : {}),
    },
    skills: {
      score: toScore(skills.score),
      issues: toIssueList(skills.issues),
      suggestions: toTextList(skills.suggestions),
      missing_skills: toTextList(skills.missing_skills),
      recommendations: toTextList(skills.recommendations),
    },
    education: {
      score: toScore(education.score),
      relevance: toText(education.relevance),
      suggestions: toTextList(education.suggestions),
    },
    format_ats: {
      score: toScore(formatAts.score),
      issues: toIssueList(formatAts.issues),
      tips: toTextList(formatAts.tips),
    },
  };
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
  return v.filter(isRecord).map((item) => ({
    section: toText(item.section),
    original_text: toText(item.original_text),
    issues: toIssueList(item.issues),
    suggested_rewrite: toText(item.suggested_rewrite),
    priority:
      item.priority === "High" || item.priority === "Medium" || item.priority === "Low" ? item.priority : "Medium",
    ...(typeof item.cari_score === "number" ? { cari_score: item.cari_score } : {}),
  }));
}

/**
 * Bentukkan AnalysisResult dari baris yang tersimpan di `checker_results`.
 *
 * Dipisah dari komponen supaya bisa diuji dan supaya hasil tersimpan punya
 * bentuk yang sama persis dengan hasil langsung. Field yang tidak ada pada
 * baris lama menjadi null/kosong, bukan error: kolom jsonb tidak dijamin
 * lengkap, jadi setiap section/koleksi dinormalisasi di sini, bukan hanya
 * diasumsikan benar lewat cast.
 *
 * `impactForecast`, `meta`, `careerVelocity`, `atsPredictionDetail`, dan
 * `weightsApplied` diteruskan apa adanya: seluruh field di dalamnya opsional di
 * sisi Client, dan ImpactForecastCard sudah memeriksa sendiri bahwa skor ada
 * (src/components/checker/ImpactForecastCard.tsx) sebelum merender.
 */
export function analysisFromFullResult(id: string, data: StoredResult): AnalysisResult {
  const scores = asRecord(data.scores);
  const feedback = asRecord(data.aiFeedback);
  const full = asRecord(data.fullResult);

  return {
    id,
    scores: {
      overall: scores.overall ?? 0,
      keywordGap: scores.keywordGap ?? 0,
      contextRelevance: scores.contextRelevance ?? 0,
      atsRules: scores.atsRules ?? 0,
    },
    aiFeedback: {
      keywordGap: feedback.keywordGap ?? "",
      contextRelevance: feedback.contextRelevance ?? "",
      atsRules: feedback.atsRules ?? "",
      summary: feedback.summary ?? "",
    },
    summary: feedback.summary ?? "",
    grade: full.grade ?? null,
    atsPrediction: full.atsPrediction ?? null,
    breakdown: toBreakdown(full.breakdown),
    keywordAnalysis: toKeywordAnalysis(full.keywordAnalysis),
    narrativeFeedback: toNarrativeFeedback(full.narrativeFeedback),
    actionPlan: toActionPlan(full.actionPlan),
    bulletReview: toBulletReview(full.bulletReview),
    missingSections: toTextList(full.missingSections),
    weightsApplied: (full.weightsApplied ?? null) as AnalysisResult["weightsApplied"],
    impactForecast: (full.impactForecast ?? null) as ImpactForecast | null,
    meta: full.meta ?? null,
    careerVelocity: full.careerVelocity ?? null,
    atsPredictionDetail: full.atsPredictionDetail ?? null,
    aiModel: data.aiModel,
  };
}