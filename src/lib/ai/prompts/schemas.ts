import { z } from "zod";

/* ─── Schema: CV CHECKER ANALYSIS v3 ────────────────────── */
/* ── Using .catch() defaults on every field so partial AI responses
   still pass validation instead of failing entirely ── */

const ScoreField = () => z.number().int().min(0).max(100).catch(50);
const StringField = (min = 1) => z.string().min(min).catch("");
const StringArr = () => z.array(z.string()).catch([]);

/* Issue dengan bukti kutipan (excerpt anchoring). Backward-compat:
 * AI lama masih mengirim string polos, AI baru mengirim { text, source_excerpt }.
 * Union dipakai agar keduanya lolos validasi. */
const IssueOrString = () =>
  z.union([
    z.string(),
    z.object({
      text: z.string().catch(""),
      source_excerpt: z.string().nullable().catch(null),
    }),
  ]);
const IssueArr = () => z.array(IssueOrString()).catch([]);

/** Bobot per-section (desimal 0-1, mis. 0.20) sesuai role category —
 * dipakai transparansi skor di UI. BUKAN ScoreField karena bobot bukan integer. */
const WeightField = () => z.number().min(0).max(1).catch(0);
const ROLE_CATEGORIES = ["tech", "creative", "sales_marketing", "fresh_graduate", "general"] as const;
const WeightsAppliedSchema = z.object({
  role_category: z.enum(ROLE_CATEGORIES).catch("general"),
  summary_weight: WeightField(),
  experience_weight: WeightField(),
  skills_weight: WeightField(),
  education_weight: WeightField(),
  format_ats_weight: WeightField(),
}).catch({
  role_category: "general",
  summary_weight: 0.2,
  experience_weight: 0.35,
  skills_weight: 0.25,
  education_weight: 0.1,
  format_ats_weight: 0.1,
});

export const AnalysisResultSchema = z.object({
  // ── Overall ──
  overall_score: ScoreField(),
  grade: z.enum(["A", "B", "C", "D"]).catch("C"),
  weights_applied: WeightsAppliedSchema.optional(),
  verdict: StringField(5).catch("Analisis AI telah selesai. Lihat breakdown untuk detail."),
  ats_prediction: z.union([
    z.string(),
    z.object({
      result: z.enum(["Likely Pass", "Borderline", "Likely Fail"]).catch("Borderline"),
      match_confidence: ScoreField(),
      risk_factors: IssueArr(),
      strengths: StringArr(),
    }).catch({ result: "Borderline", match_confidence: 50, risk_factors: [], strengths: [] }),
  ]).catch("Borderline"),

  // ── Per-section breakdown ──
  breakdown: z.object({
    summary: z.object({ score: ScoreField(), issues: IssueArr(), suggestions: StringArr() })
      .catch({ score: 50, issues: [], suggestions: [] }),
    experience: z.object({ score: ScoreField(), issues: IssueArr(), suggestions: StringArr() })
      .catch({ score: 50, issues: [], suggestions: [] }),
    skills: z.object({ score: ScoreField(), missing_skills: StringArr(), adjacent_skills: StringArr().optional(), recommendations: StringArr() })
      .catch({ score: 50, missing_skills: [], adjacent_skills: [], recommendations: [] }),
    education: z.object({ score: ScoreField(), relevance: StringField(), suggestions: StringArr() })
      .catch({ score: 50, relevance: "", suggestions: [] }),
    format_ats: z.object({ score: ScoreField(), issues: IssueArr(), tips: StringArr() })
      .catch({ score: 50, issues: [], tips: [] }),
  }).catch({
    summary: { score: 50, issues: [], suggestions: [] },
    experience: { score: 50, issues: [], suggestions: [] },
    skills: { score: 50, missing_skills: [], adjacent_skills: [], recommendations: [] },
    education: { score: 50, relevance: "", suggestions: [] },
    format_ats: { score: 50, issues: [], tips: [] },
  }),

  // ── Keyword analysis (v3: with semantic matching) ──
  keyword_analysis: z.object({
    matched: StringArr(),
    semantic_matched: StringArr().optional(),
    missing_critical: StringArr(),
    missing_nice_to_have: StringArr(),
    synonym_suggestions: StringArr(),
    match_rate_pct: ScoreField(),
    semantic_match_rate_pct: ScoreField().optional(),
  }).catch({ matched: [], semantic_matched: [], missing_critical: [], missing_nice_to_have: [], synonym_suggestions: [], match_rate_pct: 0, semantic_match_rate_pct: 0 }),

  // ── Career velocity analysis (v3 new) ──
  career_velocity: z.object({
    time_in_role_analysis: StringField(),
    title_progression: z.enum(["Strong Upward", "Upward", "Stable", "Sideways", "Declining"]).catch("Stable"),
    responsibility_arc: StringField(),
    growth_rate: z.enum(["Fast", "Normal", "Slow"]).catch("Normal"),
    recommendations: StringArr(),
  }).catch({
    time_in_role_analysis: "",
    title_progression: "Stable",
    responsibility_arc: "",
    growth_rate: "Normal",
    recommendations: [],
  }).optional(),

  // ── Narrative feedback ──
  narrative_feedback: z.object({
    overall_assessment: StringField(10).catch("Tidak ada penilaian naratif dari AI."),
    strengths: StringArr(),
    areas_for_improvement: StringArr(),
    ats_recommendations: StringArr(),
  }).catch({ overall_assessment: "Tidak ada penilaian naratif dari AI.", strengths: [], areas_for_improvement: [], ats_recommendations: [] }),

  // ── Action plan ──
  action_plan: z.object({
    quick_wins: StringArr(),
    short_term: StringArr(),
    long_term: StringArr(),
  }).catch({ quick_wins: [], short_term: [], long_term: [] }),

  // ── Bullet-level review (v3: with cari_score) ──
  bullet_review: z.array(z.object({
    section: StringField(),
    original_text: StringField(),
    cari_score: ScoreField().optional(),
    issues: StringArr(),
    suggested_rewrite: StringField(),
    priority: z.enum(["High", "Medium", "Low"]).catch("Medium"),
  })).catch([]),

  // ── Missing sections + section order ──
  missing_sections: StringArr(),
  section_order_recommendation: StringField().optional(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/* ─── Schema: CV REVISION v2 ────────────────────────────── */
export const RevisionResultSchema = z.object({
  original: z.string().min(1),
  context: z.string(),
  versions: z.object({
    conservative: z.string().min(1),
    improved: z.string().min(1),
    bold: z.string().min(1),
  }),
  cari_analysis: z.object({
    context: z.string(),
    action: z.string(),
    result: z.string(),
    impact: z.string(),
  }).catch({ context: "", action: "", result: "", impact: "" }).optional(),
  explanation: z.string().min(1),
  action_verb: z.string().min(1).catch("developed"),
  action_verb_chosen: z.string().optional(),
  action_verb_level: z.enum(["weak", "moderate", "strongest"]).catch("moderate").optional(),
  keywords_added: z.array(z.string()),
  ats_keywords: z.array(z.string()).optional(),
  tip: z.string(),
  format: z.enum(["single-line", "multi-line"]).catch("single-line").optional(),
});

export type RevisionResult = z.infer<typeof RevisionResultSchema>;

/* ─── Schema: CV SUGGESTION v2 (with adjacent skills) ─── */
const SuggestionItemSchema = z.object({
  bullet: z.string().min(1),
  actionVerb: z.string().min(1).catch("developed"),
  action_verb: z.string().optional(),
  action_verb_level: z.enum(["moderate", "strong", "strongest"]).catch("strong").optional(),
  metric: z.string().optional(),
  ats_keywords: z.array(z.string()).optional(),
  adjacent_skills: z.array(z.string()).optional(),
  industry_context: z.string().optional(),
});

export const SuggestionResultSchema = z.object({
  suggestions: z.array(SuggestionItemSchema).min(1).max(10),
  /** Keyword rekomendasi dari target role/JD — dipakai builder untuk keyword chips */
  keywords: z.array(z.string()).catch([]),
});

export type SuggestionResult = z.infer<typeof SuggestionResultSchema>;

/* ─── Schema: SUMMARY SUGGESTION v2 ─────────────────────── */
const SummaryVariantSchema = z.object({
  label: z.string().catch(""),
  text: z.string().min(1).catch(""),
  description: z.string().catch(""),
  style: z.enum(["concise", "narrative", "impact", "keyword"]).catch("concise"),
  ats_keywords: z.array(z.string()).optional().default([]),
  adjacent_skills: z.array(z.string()).optional().default([]),
  target_level: z.enum(["entry", "mid", "senior", "executive"]).catch("mid"),
});

export const SummarySuggestionResultSchema = z.object({
  suggestions: z.array(SummaryVariantSchema).min(1).max(4),
});

export type SummarySuggestionResult = z.infer<typeof SummarySuggestionResultSchema>;

/* ─── Schema: PORTFOLIO GENERATION ───────────────────────── */
export const PortfolioResultSchema = z.object({
  hero: z.object({
    headline: z.string().min(1).max(120),
    subheadline: z.string().min(1).max(240),
    cta_primary: z.string().min(1),
    cta_secondary: z.string().min(1),
  }),
  about: z.object({
    meta_description: z.string().min(1).max(155),
    paragraph_1: z.string().min(1),
    paragraph_2: z.string().min(1),
    paragraph_3: z.string().nullable(),
  }),
  experience_highlights: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        period: z.string(),
        headline: z.string().min(1),
        impact: z.string().min(1),
      }),
    )
    .max(5),
  skills_display: z.object({
    primary: z.array(z.string()).min(1).max(8),
    secondary: z.array(z.string()).max(10),
    tagline: z.string().min(1),
  }),
  contact_cta: z.object({
    headline: z.string().min(1),
    subtext: z.string().min(1),
    button_text: z.string().min(1),
  }),
  seo: z.object({
    page_title: z.string().min(1),
    keywords: z.array(z.string()).min(1).max(10),
  }),
});

export type PortfolioResult = z.infer<typeof PortfolioResultSchema>;

/* ─── Registry: Map task type → schema ──────────────────── */
export const AI_SCHEMAS = {
  analysis: AnalysisResultSchema,
  revision: RevisionResultSchema,
  suggestion: SuggestionResultSchema,
  summary_suggestion: SummarySuggestionResultSchema,
  portfolio: PortfolioResultSchema,
} as const;

export type AiTaskType = keyof typeof AI_SCHEMAS;
