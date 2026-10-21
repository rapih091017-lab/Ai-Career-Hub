"use client";

/* ── Types ── */

/** Issue dengan bukti kutipan verbatim dari CV (excerpt anchoring).
 *  AI baru mengirim { text, source_excerpt, severity }; hasil lama string polos / tanpa severity. */
export interface IssueItem {
  text: string;
  source_excerpt: string | null;
  severity?: "critical" | "high" | "medium" | "low";
}

/** Normalisasi issue dari bentuk lama (string[]) maupun baru ({text, source_excerpt}[]). */
export function toIssueItems(v: unknown): IssueItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item): IssueItem | null => {
      if (typeof item === "string") return { text: item, source_excerpt: null };
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (typeof obj.text === "string") {
          return {
            text: obj.text,
            source_excerpt: typeof obj.source_excerpt === "string" ? obj.source_excerpt : null,
            severity:
              obj.severity === "critical" || obj.severity === "high" || obj.severity === "medium" || obj.severity === "low"
                ? obj.severity
                : undefined,
          };
        }
      }
      return null;
    })
    .filter((x): x is IssueItem => x !== null);
}

/* ── Severity badge (v4), warna & label netral bahasa (label via i18n) ── */
/* Warna memakai token tema, bukan palet Tailwind mentah: latar pastel
   `red-100`/`blue-100` tidak berbalik di mode gelap, jadi lencananya menyala
   seperti berasal dari halaman lain. Urutan tingkat tetap terbaca: kritis
   merah penuh, tinggi merah lembut, sedang kuning-lime, rendah netral. */
export function severityMeta(sev?: IssueItem["severity"], tFn?: (k: string) => string) {
  const t2 = tFn || ((k: string) => k);
  switch (sev) {
    case "critical":
      return { label: t2("checker.sev-critical"), cls: "border-error/50 bg-error-container text-on-error-container", dot: "bg-error" };
    case "high":
      return { label: t2("checker.sev-high"), cls: "border-error/30 bg-surface-container-low text-error", dot: "bg-error/60" };
    case "medium":
      return { label: t2("checker.sev-medium"), cls: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container", dot: "bg-tertiary" };
    case "low":
      return { label: t2("checker.sev-low"), cls: "border-ink/20 bg-surface-container-low text-ink-soft", dot: "bg-outline" };
    default:
      return null;
  }
}

/** Bobot per-section yang dipakai AI (transparansi skor) */
export interface WeightsApplied {
  role_category: "tech" | "creative" | "sales_marketing" | "fresh_graduate" | "general" | string;
  summary_weight: number;
  experience_weight: number;
  skills_weight: number;
  education_weight: number;
  format_ats_weight: number;
}

export const ROLE_CATEGORY_OPTIONS = [
  { value: "general", labelKey: "checker.role-opt-general", descKey: "checker.role-desc-general" },
  { value: "tech", labelKey: "checker.role-opt-tech", descKey: "checker.role-desc-tech" },
  { value: "creative", labelKey: "checker.role-opt-creative", descKey: "checker.role-desc-creative" },
  { value: "sales_marketing", labelKey: "checker.role-opt-sales", descKey: "checker.role-desc-sales" },
  { value: "fresh_graduate", labelKey: "checker.role-opt-fresh", descKey: "checker.role-desc-fresh" },
] as const;

export interface BreakdownSection {
  score: number;
  issues: (string | IssueItem)[];
  suggestions: string[];
}

export interface SkillsSection extends BreakdownSection {
  missing_skills?: string[];
  recommendations?: string[];
}

export interface ExperienceSection extends BreakdownSection {
  /** v4, persentase bullet experience yang punya metrik/angka (0-100) */
  quantification_pct?: number;
}

export interface EducationSection {
  score: number;
  relevance: string;
  suggestions: string[];
}

export interface FormatAtsSection {
  score: number;
  issues: (string | IssueItem)[];
  tips: string[];
}

export interface KeywordAnalysis {
  matched: string[];
  missing_critical: string[];
  missing_nice_to_have: string[];
  synonym_suggestions: string[];
  match_rate_pct: number;
}

export interface NarrativeFeedback {
  overall_assessment: string;
  strengths: string[];
  areas_for_improvement: string[];
  ats_recommendations: string[];
}

export interface ActionPlan {
  quick_wins: string[];
  short_term: string[];
  long_term: string[];
}

/** v4, proyeksi skor jika saran dieksekusi (monoton, dari AI) */
export interface ImpactForecast {
  current_score: number;
  projected_after_quick_wins: number;
  projected_after_all_fixes: number;
}

export interface BulletItem {
  section: string;
  original_text: string;
  /** Skor CARI (Context-Action-Result-Impact) 0-100 dari AI, belum tentu ada di hasil lama */
  cari_score?: number;
  issues: (string | IssueItem)[];
  suggested_rewrite: string;
  priority: "High" | "Medium" | "Low";
}

export interface AnalysisResult {
  id: string;
  scores: {
    overall: number;
    keywordGap: number;
    contextRelevance: number;
    atsRules: number;
  };
  aiFeedback: {
    keywordGap: string;
    contextRelevance: string;
    atsRules: string;
    summary: string;
  };
  summary: string;
  fitLabel?: "Excellent" | "Good" | "Fair" | "Poor";
  keywordsFound?: string[];
  keywordsMissing?: string[];
  actionVerbsUsed?: string[];
  suggestedImprovements?: string[];
  issuesFound?: string[];
  suggestions?: string[];

  grade?: "A" | "B" | "C" | "D" | null;
  atsPrediction?: "Likely Pass" | "Borderline" | "Likely Fail" | null;
  breakdown?: {
    summary: BreakdownSection;
    experience: ExperienceSection;
    skills: SkillsSection;
    education: EducationSection;
    format_ats: FormatAtsSection;
  } | null;
  keywordAnalysis?: KeywordAnalysis | null;
  narrativeFeedback?: NarrativeFeedback | null;
  actionPlan?: ActionPlan | null;
  bulletReview?: BulletItem[];
  missingSections?: string[];
  /** Bobot per-section yang dipakai AI, tampilkan sebagai tooltip skor */
  weightsApplied?: WeightsApplied | null;
  /** v4, proyeksi skor setelah perbaikan (motivasi user) */
  impactForecast?: ImpactForecast | null;
  /** Model AI yang dipakai analisis: "V4 Pro" (deepseek-v4-pro, premium) atau "V4 Flash" (deepseek-v4-flash) */
  aiModel?: "V4 Pro" | "V4 Flash";
  /** Konteks yang dikembalikan AI, dipakai panel sisi HR */
  meta?: {
    role_category?: string;
    detected_seniority?: "entry" | "mid" | "senior" | "lead";
    cv_word_count?: number;
    jd_present?: boolean;
    analysis_confidence?: number;
  } | null;
  /** Bacaan lintasan karier; belum ditampilkan sebelum panel sisi HR */
  careerVelocity?: {
    time_in_role_analysis?: string;
    title_progression?: "Strong Upward" | "Upward" | "Stable" | "Sideways" | "Declining";
    responsibility_arc?: string;
    growth_rate?: "Fast" | "Normal" | "Slow";
    red_flags?: string[];
    recommendations?: string[];
  } | null;
  /** Detail prediksi ATS: risk factor dan strength lengkap dengan kutipan CV.
   *  Sesuai IssueArr()/StrengthArr() di schema, tiap entri bisa berupa string polos
   *  (AI/hasil lama) maupun objek berteks; pakai toIssueItems() kalau mau selalu
   *  bentuk objek. */
  atsPredictionDetail?: {
    result?: "Likely Pass" | "Borderline" | "Likely Fail";
    match_confidence?: number;
    risk_factors?: (string | IssueItem)[];
    strengths?: (string | IssueItem)[];
  } | null;
}

/* Hasil tersimpan di `checker_results` */

/** Breakdown dari kolom jsonb: hanya section yang benar-benar ada yang muncul.
 *  Section tanpa skor tidak boleh dibuat-buat — kartu SectionScoreCard selalu
 *  menampilkan persentase, jadi skor 50 hasil `.catch()` schema akan tampil
 *  seolah-olah dihitung padahal tidak pernah. */
export type StoredBreakdown = Partial<NonNullable<AnalysisResult["breakdown"]>>;

/** Bentuk AnalysisResult untuk halaman hasil tersimpan (`/checker/[id]`).
 *  Sama dengan AnalysisResult, kecuali breakdown boleh terpotong.
 *  Sengaja tipe terpisah dan bukan `AnalysisResult["breakdown"]` yang di-partial-kan:
 *  hasil live di `/checker/page.tsx` selalu lengkap (lewat zod) dan file itu
 *  membaca kelima section tanpa penjaga, jadi melonggarkan sana jadi error. */
export type StoredAnalysisResult = Omit<AnalysisResult, "breakdown"> & {
  breakdown?: StoredBreakdown | null;
};

/* ── Helpers ── */

/** Warna cincin skor. Nilai berupa CSS var, bukan hex, supaya cincin ikut
 *  berbalik saat tema gelap: hijau tua yang pekat hilang di atas kertas gelap. */
export function scoreColor(score: number) {
  if (score > 70) return "rgb(var(--c-green-deep))";
  if (score >= 40) return "rgb(var(--c-tertiary))";
  return "rgb(var(--c-error))";
}

export function gradeColor(grade?: string | null) {
  switch (grade) {
    case "A": return { bg: "bg-primary-fixed", text: "text-on-primary-fixed", border: "border-green-deep/40" };
    case "B": return { bg: "bg-surface-container-low", text: "text-ink", border: "border-ink/25" };
    case "C": return { bg: "bg-tertiary-container", text: "text-on-tertiary-container", border: "border-tertiary/50" };
    case "D": return { bg: "bg-error-container", text: "text-on-error-container", border: "border-error/50" };
    default: return { bg: "bg-surface-container", text: "text-ink-soft", border: "border-outline/40" };
  }
}

export function atsBadgeColor(prediction?: string | null) {
  switch (prediction) {
    case "Likely Pass": return { bg: "bg-primary-fixed", text: "text-on-primary-fixed", dot: "bg-green-deep" };
    case "Borderline": return { bg: "bg-tertiary-container", text: "text-on-tertiary-container", dot: "bg-tertiary" };
    case "Likely Fail": return { bg: "bg-error-container", text: "text-on-error-container", dot: "bg-error" };
    default: return { bg: "bg-surface-container", text: "text-ink-soft", dot: "bg-outline" };
  }
}

export function fitLabelMeta(label?: string, tFn?: (key: string) => string) {
  const t2 = tFn || ((k: string) => k);
  switch (label) {
    case "Excellent": return { color: "rgb(var(--c-green-deep))", bg: "bg-primary-fixed", text: "text-on-primary-fixed", icon: "stars", desc: t2("checker.fit-excellent") };
    case "Good": return { color: "rgb(var(--c-tertiary))", bg: "bg-tertiary-container", text: "text-on-tertiary-container", icon: "thumb_up", desc: t2("checker.fit-good") };
    case "Fair": return { color: "rgb(var(--c-tertiary))", bg: "bg-tertiary-container", text: "text-on-tertiary-container", icon: "trending_up", desc: t2("checker.fit-fair") };
    case "Poor": return { color: "rgb(var(--c-error))", bg: "bg-error-container", text: "text-on-error-container", icon: "warning", desc: t2("checker.fit-poor") };
    default: return { color: "rgb(var(--c-green-deep))", bg: "bg-surface-container-low", text: "text-ink", icon: "info", desc: "" };
  }
}

export function sectionScoreColor(score: number) {
  if (score >= 80) return "bg-green-deep";
  if (score >= 60) return "bg-green";
  if (score >= 40) return "bg-tertiary";
  return "bg-error";
}

export function priorityBadge(p: string) {
  switch (p) {
    case "High": return "border-error/50 bg-error-container text-on-error-container";
    case "Medium": return "border-tertiary/50 bg-tertiary-container text-on-tertiary-container";
    case "Low": return "border-green-deep/40 bg-primary-fixed text-on-primary-fixed";
    default: return "border-outline/40 bg-surface-container text-ink-soft";
  }
}
