import { describe, it, expect } from "vitest";
import { AnalysisResultSchema, RevisionResultSchema, SuggestionResultSchema, SummarySuggestionResultSchema } from "@/lib/ai/prompts/schemas";

/* ─── Helper: Minimal valid data for each schema ─── */

const MINIMAL_ANALYSIS = {
  overall_score: 75,
  grade: "B",
  verdict: "CV ini cukup baik dengan beberapa area yang perlu diperbaiki.",
  ats_prediction: "Borderline",
  breakdown: {
    summary: { score: 70, issues: ["Terlalu generik"], suggestions: ["Tambahkan keyword spesifik"] },
    experience: { score: 65, issues: [], suggestions: [] },
    skills: { score: 60, missing_skills: ["TypeScript"], recommendations: ["Tambahkan TypeScript"] },
    education: { score: 80, relevance: "S1 Ilmu Komputer — relevan", suggestions: [] },
    format_ats: { score: 55, issues: ["Format tabel"], tips: ["Ganti dengan single-column"] },
  },
  keyword_analysis: {
    matched: ["React", "Node.js"],
    missing_critical: ["TypeScript"],
    missing_nice_to_have: ["Docker"],
    synonym_suggestions: ["Ganti 'buat' dengan 'developed'"],
    match_rate_pct: 45,
  },
  narrative_feedback: {
    overall_assessment: "CV memiliki fondasi yang cukup baik...",
    strengths: ["Pengalaman React solid"],
    areas_for_improvement: ["Kurang metrik"],
    ats_recommendations: ["Tambahkan angka"],
  },
  action_plan: {
    quick_wins: ["Tambah TypeScript"],
    short_term: ["Rewrite bullet points"],
    long_term: ["Ambil sertifikasi AWS"],
  },
  bullet_review: [
    {
      section: "Pengalaman",
      original_text: "Membuat fitur login",
      issues: ["Action verb lemah"],
      suggested_rewrite: "Developed authentication system serving 10,000+ users",
      priority: "High",
    },
  ],
  missing_sections: ["Sertifikasi"],
};

const MINIMAL_REVISION = {
  original: "bantu tim coding fitur login",
  context: "Developer berkontribusi pada fitur autentikasi",
  versions: {
    conservative: "Developed user authentication features.",
    improved: "Built a comprehensive authentication system.",
    bold: "Engineered a multi-factor authentication architecture.",
  },
  explanation: "Versi menggunakan action verb yang lebih kuat.",
  action_verb: "Developed",
  keywords_added: ["authentication", "security"],
  tip: "Tambahkan metrik untuk versi improved.",
};

const MINIMAL_SUGGESTION = {
  suggestions: [
    {
      bullet: "Developed 5+ frontend features using React.",
      actionVerb: "Developed",
      action_verb: "Developed",
      metric: "5+ features",
    },
  ],
};

const MINIMAL_SUMMARY = {
  suggestions: [
    { label: "Ringkas", text: "Engineer with 3+ years experience.", description: "ATS-friendly", style: "concise" },
    { label: "Narasi", text: "Berawal dari ketertarikan...", description: "Personal", style: "narrative" },
    { label: "Impact", text: "Delivered 40% improvement.", description: "For senior role", style: "impact" },
    { label: "Keyword", text: "Expert in React and TypeScript.", description: "ATS-optimized", style: "keyword" },
  ],
};

/* ─── Tests ─── */

describe("AnalysisResultSchema", () => {
  it("should pass valid minimal data", () => {
    const result = AnalysisResultSchema.safeParse(MINIMAL_ANALYSIS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.overall_score).toBe(75);
      expect(result.data.grade).toBe("B");
    }
  });

  it("should handle v3 ats_prediction as object", () => {
    const v3Data = {
      ...MINIMAL_ANALYSIS,
      ats_prediction: {
        result: "Likely Pass",
        match_confidence: 80,
        risk_factors: ["Kurang TypeScript"],
        strengths: ["React solid"],
      },
    };
    const result = AnalysisResultSchema.safeParse(v3Data);
    expect(result.success).toBe(true);
    if (result.success) {
      // Should accept object format
      expect(result.data.ats_prediction).toHaveProperty("result");
    }
  });

  it("should handle v3 additional fields", () => {
    const v3Data = {
      ...MINIMAL_ANALYSIS,
      ats_prediction: { result: "Likely Pass", match_confidence: 80, risk_factors: [], strengths: [] },
      career_velocity: {
        time_in_role_analysis: "Growth positif",
        title_progression: "Upward",
        responsibility_arc: "Meningkat",
        growth_rate: "Normal",
        recommendations: ["Ambil proyek leadership"],
      },
      section_order_recommendation: "Contact → Summary → Skills → Experience → Education",
    };
    const result = AnalysisResultSchema.safeParse(v3Data);
    expect(result.success).toBe(true);
  });

  it("should gracefully degrade partial data with .catch() defaults", () => {
    const partialData = { overall_score: 60, grade: "C" };
    const result = AnalysisResultSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      // Missing fields should have catch defaults
      expect(result.data.breakdown).toBeDefined();
      expect(result.data.keyword_analysis.matched).toEqual([]);
      expect(result.data.bullet_review).toEqual([]);
    }
  });

  it("should handle completely empty object", () => {
    const result = AnalysisResultSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("RevisionResultSchema", () => {
  it("should pass valid minimal data", () => {
    const result = RevisionResultSchema.safeParse(MINIMAL_REVISION);
    expect(result.success).toBe(true);
  });

  it("should handle v2 fields (action_verb_chosen, cari_analysis)", () => {
    const v2Data = {
      ...MINIMAL_REVISION,
      action_verb_chosen: "Engineered",
      action_verb_level: "strongest",
      cari_analysis: {
        context: "E-commerce platform",
        action: "Mengembangkan fitur login",
        result: "10,000+ users",
        impact: "Security compliance",
      },
      ats_keywords: ["React", "Node.js", "JWT"],
      format: "single-line",
    };
    const result = RevisionResultSchema.safeParse(v2Data);
    expect(result.success).toBe(true);
  });

  it("should handle missing action_verb with catch default", () => {
    const data = { ...MINIMAL_REVISION };
    delete (data as any).action_verb;
    const result = RevisionResultSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action_verb).toBe("developed"); // catch default
    }
  });
});

describe("SuggestionResultSchema", () => {
  it("should pass valid minimal data", () => {
    const result = SuggestionResultSchema.safeParse(MINIMAL_SUGGESTION);
    expect(result.success).toBe(true);
  });

  it("should handle v2 fields (action_verb_level, ats_keywords, adjacent_skills)", () => {
    const v2Data = {
      suggestions: [{
        bullet: "Developed 5+ frontend features using React.",
        actionVerb: "Developed",
        action_verb: "Developed",
        action_verb_level: "strong",
        metric: "5+ features",
        ats_keywords: ["React", "TypeScript", "frontend"],
        adjacent_skills: ["JavaScript → TypeScript"],
        industry_context: "SaaS",
      }],
    };
    const result = SuggestionResultSchema.safeParse(v2Data);
    expect(result.success).toBe(true);
  });
});

describe("SummarySuggestionResultSchema", () => {
  it("should pass valid minimal data", () => {
    const result = SummarySuggestionResultSchema.safeParse(MINIMAL_SUMMARY);
    expect(result.success).toBe(true);
  });

  it("should accept fewer than 4 suggestions (min 1 per schema)", () => {
    const data = { suggestions: MINIMAL_SUMMARY.suggestions.slice(0, 2) };
    const result = SummarySuggestionResultSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject empty suggestions array", () => {
    const result = SummarySuggestionResultSchema.safeParse({ suggestions: [] });
    expect(result.success).toBe(false); // min 1 item
  });

  it("should tolerate invalid style via .catch() default", () => {
    const data = {
      suggestions: MINIMAL_SUMMARY.suggestions.map(s => ({ ...s, style: "invalid" as any })),
    };
    const result = SummarySuggestionResultSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.suggestions[0].style).toBe("concise"); // catch default
    }
  });
});
