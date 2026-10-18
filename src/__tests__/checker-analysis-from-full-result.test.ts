import { describe, expect, it } from "vitest";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";
import { toIssueItems, type AnalysisResult } from "@/components/checker/types";

const FULL = {
  grade: "B",
  atsPrediction: "Likely Pass",
  meta: { detected_seniority: "entry", analysis_confidence: 78 },
  careerVelocity: { title_progression: "Upward", growth_rate: "Normal" },
  atsPredictionDetail: {
    result: "Likely Pass",
    risk_factors: [{ text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" }],
    strengths: [{ text: "Ada metrik dampak", source_excerpt: "Bangun dashboard untuk 40 user" }],
  },
  breakdown: { summary: { score: 70 } },
};

describe("mapping hasil tersimpan ke bentuk hasil analisis", () => {
  it("membawa meta, careerVelocity, dan atsPredictionDetail", () => {
    const result = analysisFromFullResult("abc", {
      scores: { overall: 72 },
      aiFeedback: { summary: "Cukup baik" },
      fullResult: FULL,
    });
    expect(result.meta?.detected_seniority).toBe("entry");
    expect(result.careerVelocity?.title_progression).toBe("Upward");
    expect(result.atsPredictionDetail?.risk_factors).toHaveLength(1);
  });

  it("hasil lama tanpa meta tetap jadi hasil yang valid", () => {
    // Baris checker_results yang dibuat sebelum meta ada tidak punya field ini.
    const result = analysisFromFullResult("lama", {
      scores: { overall: 50 },
      aiFeedback: { summary: "" },
      fullResult: { grade: "C", breakdown: { summary: { score: 50 } } },
    });
    expect(result.meta).toBeNull();
    expect(result.careerVelocity).toBeNull();
    expect(result.atsPredictionDetail).toBeNull();
    expect(result.grade).toBe("C");
  });

  it("fullResult null tidak bikin error", () => {
    const result = analysisFromFullResult("kosong", { scores: {}, aiFeedback: {}, fullResult: null });
    expect(result.breakdown).toBeNull();
    expect(result.bulletReview).toEqual([]);
    expect(result.scores.overall).toBe(0);
  });
});

describe("risk_factors dan strengths bisa berupa string polos", () => {
  // Kunci kompilasi: schema (IssueArr/StrengthArr) menerima string maupun objek.
  // Kalau salah satu sisi tipe Client jadi objek saja, baris ini gagal di tsc.
  const _stringShapeOk: NonNullable<AnalysisResult["atsPredictionDetail"]>["risk_factors"] = ["Kurang TypeScript"];
  const _strengthShapeOk: NonNullable<AnalysisResult["atsPredictionDetail"]>["strengths"] = ["React solid"];
  void _stringShapeOk;
  void _strengthShapeOk;

  it("entri string tidak hilang dan tidak berubah bentuk", () => {
    const result = analysisFromFullResult("union", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        atsPredictionDetail: {
          result: "Borderline",
          risk_factors: ["Kurang TypeScript", { text: "Tanpa metrik", severity: "high", source_excerpt: null }],
          strengths: ["React solid", { text: "Impact terukur", source_excerpt: "40 user" }],
        },
      },
    });
    expect(result.atsPredictionDetail?.risk_factors).toEqual([
      "Kurang TypeScript",
      { text: "Tanpa metrik", severity: "high", source_excerpt: null },
    ]);
    expect(result.atsPredictionDetail?.strengths).toEqual([
      "React solid",
      { text: "Impact terukur", source_excerpt: "40 user" },
    ]);
  });

  it("teks entri string tetap bisa dibaca panel lewat toIssueItems", () => {
    const result = analysisFromFullResult("union-2", {
      scores: {},
      aiFeedback: {},
      fullResult: { atsPredictionDetail: { risk_factors: ["Kurang TypeScript"], strengths: ["React solid"] } },
    });
    // Panel sisi HR akan pakai toIssueItems; kalau mapper membuang string, teksnya hilang.
    expect(toIssueItems(result.atsPredictionDetail?.risk_factors).map((i) => i.text)).toEqual(["Kurang TypeScript"]);
    expect(toIssueItems(result.atsPredictionDetail?.strengths).map((i) => i.text)).toEqual(["React solid"]);
  });
});

describe("baris lama / jsonb terpotong tidak boleh membuat halaman crash", () => {
  /** Meniru semua akses nested yang dilakukan src/app/checker/[id]/page.tsx. */
  function bacaSepertiHalaman(r: AnalysisResult) {
    const quantPct = (r.breakdown?.experience as { quantification_pct?: number } | undefined)?.quantification_pct;
    if (r.breakdown) {
      void r.breakdown.summary.score;
      void r.breakdown.summary.issues.length;
      void r.breakdown.summary.suggestions.length;
      void r.breakdown.experience.score;
      void r.breakdown.experience.issues.length;
      void r.breakdown.experience.suggestions.length;
      void r.breakdown.skills.score;
      void r.breakdown.skills.missing_skills?.length;
      void r.breakdown.skills.recommendations?.length;
      void r.breakdown.education.score;
      void r.breakdown.education.relevance;
      void r.breakdown.education.suggestions.length;
      void r.breakdown.format_ats.score;
      void r.breakdown.format_ats.issues.length;
      void r.breakdown.format_ats.tips.length;
      void quantPct;
    }
    if (r.narrativeFeedback) {
      void r.narrativeFeedback.overall_assessment;
      void r.narrativeFeedback.strengths.length;
      void r.narrativeFeedback.areas_for_improvement.length;
      void r.narrativeFeedback.ats_recommendations.length;
    }
    if (r.keywordAnalysis) {
      void r.keywordAnalysis.match_rate_pct;
      void r.keywordAnalysis.matched.length;
      void r.keywordAnalysis.missing_critical.length;
      void r.keywordAnalysis.missing_nice_to_have.length;
      void r.keywordAnalysis.synonym_suggestions.length;
    }
    void r.actionPlan?.quick_wins?.length;
    void r.actionPlan?.short_term?.length;
    void r.actionPlan?.long_term?.length;
    void r.missingSections?.length;
    void r.bulletReview?.length;
    if (r.impactForecast) {
      void (r.impactForecast.current_score as number | undefined);
      void (r.impactForecast.projected_after_all_fixes as number | undefined);
    }
  }

  it("breakdown kosong menghasilkan lima section yang aman dibaca", () => {
    const result = analysisFromFullResult("kosong-breakdown", {
      scores: {},
      aiFeedback: {},
      fullResult: { breakdown: {} },
    });
    const b = result.breakdown;
    expect(b).not.toBeNull();
    expect(Object.keys(b!).sort()).toEqual(["education", "experience", "format_ats", "skills", "summary"]);
    // Default mengikuti .catch() di AnalysisResultSchema agar bentuk hasil
    // tersimpan sama dengan hasil langsung.
    expect(b!.experience.score).toBe(50);
    expect(b!.experience.issues).toEqual([]);
    expect(b!.experience.suggestions).toEqual([]);
    expect(b!.skills.missing_skills).toEqual([]);
    expect(b!.skills.recommendations).toEqual([]);
    expect(b!.education.relevance).toBe("");
    expect(b!.format_ats.tips).toEqual([]);
    expect(() => bacaSepertiHalaman(result)).not.toThrow();
  });

  it("section yang ada tetap utuh, section yang hilang diisi default", () => {
    const result = analysisFromFullResult("sebagian", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: {
          summary: { score: 70, issues: ["Kurang metrik"], suggestions: ["Tambah angka"] },
          experience: { score: 80, issues: [{ text: "Umum", severity: "low", source_excerpt: null }], suggestions: [], quantification_pct: 40 },
        },
      },
    });
    const b = result.breakdown!;
    expect(b.summary.score).toBe(70);
    // String polos pada issues harus ikut terbawa.
    expect(b.summary.issues).toEqual(["Kurang metrik"]);
    expect(b.experience.quantification_pct).toBe(40);
    expect(b.skills.score).toBe(50);
    expect(() => bacaSepertiHalaman(result)).not.toThrow();
  });

  it("koleksi yang bukan array diabaikan, bukan dipakai apa adanya", () => {
    const result = analysisFromFullResult("sampah", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: { summary: "bukan objek" },
        keywordAnalysis: { matched: "React", missing_critical: null },
        narrativeFeedback: { strengths: { bukan: "array" } },
        actionPlan: { quick_wins: "tambah metrik", short_term: 5 },
        bulletReview: [{ section: "Exp", original_text: "x", issues: [], suggested_rewrite: "y", priority: "High" }, null, "sampah"],
        missingSections: "skills",
      },
    });
    const b = result.breakdown!;
    expect(b.summary.score).toBe(50);
    expect(b.summary.issues).toEqual([]);
    expect(result.keywordAnalysis?.matched).toEqual([]);
    expect(result.keywordAnalysis?.missing_critical).toEqual([]);
    expect(result.keywordAnalysis?.match_rate_pct).toBe(0);
    expect(result.narrativeFeedback?.strengths).toEqual([]);
    expect(result.actionPlan?.quick_wins).toEqual([]);
    expect(result.actionPlan?.short_term).toEqual([]);
    expect(result.missingSections).toEqual([]);
    expect(result.bulletReview).toHaveLength(1);
    expect(() => bacaSepertiHalaman(result)).not.toThrow();
  });
});

describe("hasil tersimpan punya bentuk yang sama dengan hasil langsung", () => {
  const WEIGHTS = {
    role_category: "tech",
    summary_weight: 0.2,
    experience_weight: 0.35,
    skills_weight: 0.25,
    education_weight: 0.1,
    format_ats_weight: 0.1,
  };

  it("weightsApplied dan aiModel diteruskan", () => {
    const result = analysisFromFullResult("lengkap", {
      scores: {},
      aiFeedback: {},
      fullResult: { weightsApplied: WEIGHTS },
      aiModel: "V4 Pro",
    });
    expect(result.weightsApplied).toEqual(WEIGHTS);
    expect(result.aiModel).toBe("V4 Pro");
  });

  it("kunci hasil dipin agar field tidak hilang diam-diam", () => {
    const result = analysisFromFullResult("kunci", { scores: {}, aiFeedback: {}, fullResult: {} });
    expect(Object.keys(result).sort()).toEqual([
      "actionPlan",
      "aiFeedback",
      "aiModel",
      "atsPrediction",
      "atsPredictionDetail",
      "breakdown",
      "bulletReview",
      "careerVelocity",
      "grade",
      "id",
      "impactForecast",
      "keywordAnalysis",
      "meta",
      "missingSections",
      "narrativeFeedback",
      "scores",
      "summary",
      "weightsApplied",
    ]);
    // fitLabel sengaja tidak ada: ekspresi lama membaca breakdown.overall yang
    // tidak pernah ada, jadi selalu undefined, dan hanya /checker/page.tsx yang membacanya.
  });
});
