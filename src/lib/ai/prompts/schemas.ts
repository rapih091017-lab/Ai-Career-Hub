import { z } from "zod";

/* ─── Schema: CV CHECKER ANALYSIS v4 ────────────────────── */
/* ── Using .catch() defaults on every field so partial AI responses
   still pass validation instead of failing entirely ── */

const ScoreField = () => z.number().int().min(0).max(100).catch(50);
const StringField = (min = 1) => z.string().min(min).catch("");
const StringArr = () => z.array(z.string()).catch([]);
const SEVERITIES = ["critical", "high", "medium", "low"] as const;

/* Issue dengan bukti kutipan (excerpt anchoring) + severity (v4). Backward-compat:
 * AI lama mengirim string polos / { text, source_excerpt } tanpa severity, 
 * union + field optional dipakai agar semua bentuk lolos validasi. */
const IssueOrString = () =>
  z.union([
    z.string(),
    z.object({
      text: z.string().catch(""),
      source_excerpt: z.string().nullable().catch(null),
      severity: z.enum(SEVERITIES).optional(),
    }),
  ]);
/* .catch("") per butir: satu butir rusak (severity salah kapital, null nyasar,
 * tipe tak terduga) gugur sendiri, bukan menghapus seluruh array. Tanpa ini satu
 * butir membuat hasil parse [] dan panel sisi HR mengklaim analisis tidak punya
 * temuan padahal model memang mengirim temuan. Filter buang penanda "" supaya
 * yang rusak benar-benar hilang dari hasil parse, bukan jadi entri kosong. */
const IssueArr = () =>
  z.array(IssueOrString().catch("")).catch([]).transform((items) => items.filter((item) => item !== ""));

/* Strength dengan excerpt anchoring opsional (v4), tetap string polos juga diterima. */
const StrengthOrString = () =>
  z.union([
    z.string(),
    z.object({
      text: z.string().catch(""),
      source_excerpt: z.string().nullable().catch(null),
    }),
  ]);
/* Alasan sama dengan IssueArr: satu butir rusak tidak boleh menghapus seluruh
 * daftar "yang bikin lanjut baca". */
const StrengthArr = () =>
  z.array(StrengthOrString().catch("")).catch([]).transform((items) => items.filter((item) => item !== ""));

/** Bobot per-section (desimal 0-1, mis. 0.20) sesuai role category, 
 * dipakai transparansi skor di UI. BUKAN ScoreField karena bobot bukan integer. */
const WeightField = () => z.number().min(0).max(1).catch(0);

/** Satu kotak "Yang HR tangkap dalam 30 detik". `status` sengaja string biasa:
 *  enum invalid harus membuat kunci itu DIBUANG di mapper, bukan diganti
 *  default yang membuat kotak terlihat terbaca padahal tidak pernah. */
const HrScanFieldSchema = () => z.object({
  value: z.string().nullable().catch(null),
  status: z.string().catch(""),
  note: z.string().optional().catch(undefined),
});

/** Perbaikan terbesar satu section (v5). Tanpa `title` tidak ada yang
 *  ditampilkan, jadi objeknya jatuh ke undefined — bukan kartu judul kosong. */
const TopFixSchema = () => z.object({
  title: z.string().catch(""),
  copy_text: z.string().optional().catch(undefined),
  replaces: z.string().optional().catch(undefined),
  // .transform() menghapus penanda optional, jadi .optional() harus di LUAR
  // transform — kalau tidak, default .catch() objek section kehilangan key ini.
}).transform((fix) => (fix && fix.title ? fix : undefined)).optional();

/** Satu cek format ATS (v5). status string biasa: enum invalid dibuang di mapper. */
const FormatCheckSchema = () => z.object({
  id: z.string().catch(""),
  label: z.string().catch(""),
  status: z.string().catch(""),
  note: z.string().optional().catch(undefined),
});
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
  // ── Meta (v4), konteks analisis untuk kalibrasi & debugging ──
  meta: z.object({
    role_category: z.enum(ROLE_CATEGORIES).catch("general"),
    // .optional() tanpa .catch(): level yang tidak dikirim model harus tetap
    // kosong sampai ke panel, bukan jadi "mid" yang lalu tampil sebagai bacaan
    // soal kandidat. catch "mid" juga dilarang di .catch() objek di bawah.
    detected_seniority: z.enum(["entry", "mid", "senior", "lead"]).optional(),
    cv_word_count: z.number().int().min(0).catch(0),
    jd_present: z.boolean().catch(false),
    analysis_confidence: z.number().int().min(0).max(100).catch(60),
  }).catch({
    role_category: "general",
    cv_word_count: 0,
    jd_present: false,
    analysis_confidence: 60,
  }).optional(),

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
      strengths: StrengthArr(),
    }).catch({ result: "Borderline", match_confidence: 50, risk_factors: [], strengths: [] }),
  ]).catch("Borderline"),

  // ── Per-section breakdown ──
  breakdown: z.object({
    summary: z.object({
      score: ScoreField(), issues: IssueArr(), suggestions: StringArr(),
      // v5: alasan skor, perbaikan terbesar, dan rewrite summary.
      score_reason: z.string().optional().catch(undefined),
      top_fix: TopFixSchema(),
      has_skills_and_achievement: z.boolean().optional().catch(undefined),
      rewrite_copy_text: z.string().optional().catch(undefined),
    }).catch({ score: 50, issues: [], suggestions: [] }),
    experience: z.object({
      score: ScoreField(), quantification_pct: z.number().int().min(0).max(100).catch(0).optional(), issues: IssueArr(), suggestions: StringArr(),
      score_reason: z.string().optional().catch(undefined),
      top_fix: TopFixSchema(),
      // Tanpa .catch(0): nol palsu membuat "0 dari 0 poin" tampil sebagai temuan.
      bullets_total: z.number().int().min(0).optional().catch(undefined),
      bullets_without_result: z.number().int().min(0).optional().catch(undefined),
    }).catch({ score: 50, issues: [], suggestions: [] }),
    skills: z.object({
      score: ScoreField(), missing_skills: StringArr(), adjacent_skills: StringArr().optional(), recommendations: StringArr(),
      score_reason: z.string().optional().catch(undefined),
      top_fix: TopFixSchema(),
      unproven_skills: z.array(z.string()).optional().catch(undefined),
      grouped_skills_copy_text: z.string().optional().catch(undefined),
    }).catch({ score: 50, missing_skills: [], adjacent_skills: [], recommendations: [] }),
    education: z.object({
      score: ScoreField(), relevance: StringField(), suggestions: StringArr(),
      score_reason: z.string().optional().catch(undefined),
      top_fix: TopFixSchema(),
      copy_text: z.string().optional().catch(undefined),
    }).catch({ score: 50, relevance: "", suggestions: [] }),
    format_ats: z.object({
      score: ScoreField(), issues: IssueArr(), tips: StringArr(),
      score_reason: z.string().optional().catch(undefined),
      top_fix: TopFixSchema(),
      // Per butir .catch(null): satu cek rusak gugur sendiri (alasan IssueArr).
      checks: z.array(FormatCheckSchema().nullable().catch(null)).catch([]).transform((checks) => checks.filter((check) => check !== null)).optional(),
    }).catch({ score: 50, issues: [], tips: [] }),
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
    // ── v5 (prompt 5): bukti, penempatan, syarat lowongan ──
    // `source` SENGADA TIDAK ada di schema: zod membuang key tak dikenal,
    // sehingga output AI tidak pernah bisa menentukan sumber daftar keyword.
    // Per butir .catch(null) + filter: satu butir rusak gugur sendiri (alasan
    // IssueArr). .optional() paling luar supaya default .catch() objek di bawah
    // tidak kehilangan key (penanda optional hilang saat transform).
    evidence: z.array(z.object({
      keyword: z.string().catch(""),
      level: z.string().catch(""),
      excerpt: z.string().optional().catch(undefined),
    }).nullable().catch(null)).catch([]).transform((items) => items.filter((item) => item !== null)).optional(),
    placements: z.array(z.object({
      keyword: z.string().catch(""),
      priority: z.string().catch(""),
      where: z.string().catch(""),
      replaces: z.string().optional().catch(undefined),
      copy_text: z.string().catch(""),
    }).nullable().catch(null)).catch([]).transform((items) => items.filter((item) => item !== null)).optional(),
    requirements: z.array(z.object({
      requirement: z.string().catch(""),
      status: z.string().catch(""),
      evidence: z.string().optional().catch(undefined),
      tip: z.string().optional().catch(undefined),
    }).nullable().catch(null)).catch([]).transform((items) => items.filter((item) => item !== null)).optional(),
  }).catch({ matched: [], semantic_matched: [], missing_critical: [], missing_nice_to_have: [], synonym_suggestions: [], match_rate_pct: 0, semantic_match_rate_pct: 0 }),

  // ── Career velocity analysis (v3 new) ──
  career_velocity: z.object({
    time_in_role_analysis: StringField(),
    // Kedua field ini .optional() tanpa .catch(): arah dan laju yang tidak
    // dikirim model harus hilang dari panel, bukan tampil sebagai
    // "Stable"/"Normal" buatan. catch nilai itu juga dilarang di .catch()
    // objek di bawah.
    title_progression: z.enum(["Strong Upward", "Upward", "Stable", "Sideways", "Declining"]).optional(),
    responsibility_arc: StringField(),
    growth_rate: z.enum(["Fast", "Normal", "Slow"]).optional(),
    red_flags: StringArr().optional(),
    recommendations: StringArr(),
  }).catch({
    time_in_role_analysis: "",
    responsibility_arc: "",
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

  // ── Impact forecast (v4), proyeksi skor jika saran dieksekusi ──
  impact_forecast: z.object({
    current_score: ScoreField(),
    projected_after_quick_wins: ScoreField(),
    projected_after_all_fixes: ScoreField(),
  }).catch({ current_score: 50, projected_after_quick_wins: 55, projected_after_all_fixes: 60 }).optional(),

  // ── Ringkasan 10 detik (v5), kartu paling atas halaman hasil ──
  // Schema di sini hanya menjaga bentuk; validasi berat (fix invalid dibuang,
  // batas kata, urutan deterministik, pembulatan/clamping menit) dikerjakan
  // mapper `toQuickSummary`. Field AI baru: .optional().catch(undefined),
  // jadi baris lama dan AI yang tidak mengirimnya tetap lolos parse.
  quick_summary: z.object({
    verdict: z.string().catch(""),
    top_strengths: StringArr(),
    // .catch(null) per item: satu fix rusak gugur sendiri, bukan menghapus
    // seluruh daftar (alasan yang sama dengan IssueArr di atas).
    top_fixes: z.array(z.object({
      id: z.string().catch(""),
      title: z.string().catch(""),
      // String biasa, bukan enum: nilai di luar daftar harus dibuang oleh mapper,
      // bukan diganti default oleh schema.
      target_section: z.string().catch(""),
      impact: z.string().catch(""),
      // Tanpa int/min/max: 90 harus di-clamp mapper ke 60, bukan hilang dari UI;
      // non-numerik jatuh ke undefined sehingga fieldnya dibuang (tampil tanpa menit).
      est_minutes: z.number().optional().catch(undefined),
      copy_text: z.string().optional().catch(undefined),
    }).nullable().catch(null)).catch([]).transform((fixes) => fixes.filter((fix) => fix !== null)),
  }).optional().catch(undefined),

  // ── Panel HR (v5, prompt 3): scan 30 detik, flag, pertanyaan, knockout, durasi ──
  // Gaya sama dengan quick_summary: schema hanya menjaga bentuk (enum jadi
  // string + validasi/pelemparan di mapper), field AI baru opsional + catch.
  hr_scan: z.object({
    // Tiap kunci nullable: satu kotak rusak tidak menghapus panel scan.
    last_title: HrScanFieldSchema().nullable().catch(null),
    total_experience: HrScanFieldSchema().nullable().catch(null),
    top_achievement: HrScanFieldSchema().nullable().catch(null),
    key_skills: HrScanFieldSchema().nullable().catch(null),
  }).optional().catch(undefined),

  hr_flags: z.array(z.object({
    // String biasa, bukan enum: type/label invalid harus dibuang mapper.
    type: z.string().catch(""),
    label: z.string().catch(""),
    evidence: z.string().optional().catch(undefined),
    fix: z.object({
      copy_text: z.string().catch(""),
      replaces: z.string().optional().catch(undefined),
    }).optional().catch(undefined),
  }).nullable().catch(null)).catch([]).transform((flags) => flags.filter((flag) => flag !== null)),

  hr_questions: z.array(z.object({
    question: z.string().catch(""),
    why_asked: z.string().catch(""),
    answer_tip: z.string().catch(""),
  }).nullable().catch(null)).catch([]).transform((items) => items.filter((item) => item !== null)),

  knockout_risks: z.array(z.object({
    requirement: z.string().catch(""),
    status: z.string().catch(""),
    evidence: z.string().optional().catch(undefined),
    tip: z.string().optional().catch(undefined),
  }).nullable().catch(null)).catch([]).transform((items) => items.filter((item) => item !== null)),

  duration_rewrite: z.object({
    copy_text: z.string().catch(""),
    replaces: z.string().optional().catch(undefined),
  }).optional().catch(undefined),

  // ── Missing sections + section order ──
  missing_sections: z.array(z.union([
    z.string(),
    z.object({
      name: z.string().catch(""),
      why_it_matters: z.string().optional().catch(undefined),
      template_copy_text: z.string().optional().catch(undefined),
    }),
  ]).nullable().catch(null)).catch([]).transform((items) => items.filter((item) => item !== null)),
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
  /** Keyword rekomendasi dari target role/JD, dipakai builder untuk keyword chips */
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
