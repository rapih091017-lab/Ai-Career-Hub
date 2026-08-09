"use client";

/* ── Types ── */

export interface BreakdownSection {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface SkillsSection extends BreakdownSection {
  missing_skills?: string[];
  recommendations?: string[];
}

export interface EducationSection {
  score: number;
  relevance: string;
  suggestions: string[];
}

export interface FormatAtsSection {
  score: number;
  issues: string[];
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

export interface BulletItem {
  section: string;
  original_text: string;
  issues: string[];
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
    experience: BreakdownSection;
    skills: SkillsSection;
    education: EducationSection;
    format_ats: FormatAtsSection;
  } | null;
  keywordAnalysis?: KeywordAnalysis | null;
  narrativeFeedback?: NarrativeFeedback | null;
  actionPlan?: ActionPlan | null;
  bulletReview?: BulletItem[];
  missingSections?: string[];
  /** Model AI yang dipakai analisis: "R1" (deepseek-reasoner, premium) atau "V3" (deepseek-chat) */
  aiModel?: "R1" | "V3";
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
