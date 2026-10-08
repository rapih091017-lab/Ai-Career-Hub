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
export function severityMeta(sev?: IssueItem["severity"], tFn?: (k: string) => string) {
  const t2 = tFn || ((k: string) => k);
  switch (sev) {
    case "critical":
      return { label: t2("checker.sev-critical"), cls: "bg-red-100 text-red-700 border-red-300", dot: "bg-red-500" };
    case "high":
      return { label: t2("checker.sev-high"), cls: "bg-orange-100 text-orange-700 border-orange-300", dot: "bg-orange-500" };
    case "medium":
      return { label: t2("checker.sev-medium"), cls: "bg-amber-100 text-amber-700 border-amber-300", dot: "bg-amber-500" };
    case "low":
      return { label: t2("checker.sev-low"), cls: "bg-blue-100 text-blue-700 border-blue-300", dot: "bg-blue-500" };
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
}

/* ── Helpers ── */

export function scoreColor(score: number) {
  if (score > 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

export function gradeColor(grade?: string | null) {
  switch (grade) {
    case "A": return { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" };
    case "B": return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" };
    case "C": return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" };
    case "D": return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" };
    default: return { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };
  }
}

export function atsBadgeColor(prediction?: string | null) {
  switch (prediction) {
    case "Likely Pass": return { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" };
    case "Borderline": return { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" };
    case "Likely Fail": return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    default: return { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };
  }
}

export function fitLabelMeta(label?: string, tFn?: (key: string) => string) {
  const t2 = tFn || ((k: string) => k);
  switch (label) {
    case "Excellent": return { color: "#22c55e", bg: "bg-green-100", text: "text-green-800", icon: "stars", desc: t2("checker.fit-excellent") };
    case "Good": return { color: "#eab308", bg: "bg-yellow-100", text: "text-yellow-800", icon: "thumb_up", desc: t2("checker.fit-good") };
    case "Fair": return { color: "#f97316", bg: "bg-orange-100", text: "text-orange-800", icon: "trending_up", desc: t2("checker.fit-fair") };
    case "Poor": return { color: "#ef4444", bg: "bg-red-100", text: "text-red-800", icon: "warning", desc: t2("checker.fit-poor") };
    default: return { color: "#0d7377", bg: "bg-primary/10", text: "text-primary", icon: "info", desc: "" };
  }
}

export function sectionScoreColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export function priorityBadge(p: string) {
  switch (p) {
    case "High": return "bg-red-100 text-red-700";
    case "Medium": return "bg-yellow-100 text-yellow-700";
    case "Low": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-600";
  }
}
