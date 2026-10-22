import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";
import { toIssueItems, type AnalysisResult, type StoredAnalysisResult } from "@/components/checker/types";

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

describe("section breakdown yang tidak tersimpan tidak boleh dibuat-buat", () => {
  /** Meniru semua akses nested yang dilakukan src/app/checker/[id]/page.tsx. */
  function bacaSepertiHalaman(r: StoredAnalysisResult) {
    const quantPct = (r.breakdown?.experience as { quantification_pct?: number } | undefined)?.quantification_pct;
    // Halaman hanya merender kartu untuk section yang benar-benar ada.
    void r.breakdown?.summary?.score;
    void r.breakdown?.summary?.issues.length;
    void r.breakdown?.summary?.suggestions.length;
    void r.breakdown?.experience?.score;
    void r.breakdown?.experience?.issues.length;
    void r.breakdown?.experience?.suggestions.length;
    void r.breakdown?.skills?.score;
    void r.breakdown?.skills?.missing_skills?.length;
    void r.breakdown?.skills?.recommendations?.length;
    void r.breakdown?.education?.score;
    void r.breakdown?.education?.suggestions.length;
    void r.breakdown?.format_ats?.score;
    void r.breakdown?.format_ats?.issues.length;
    void r.breakdown?.format_ats?.tips.length;
    void quantPct;
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
    void r.impactForecast?.current_score;
    void r.impactForecast?.projected_after_quick_wins;
    void r.impactForecast?.projected_after_all_fixes;
  }

  it("breakdown tanpa section tidak menghasilkan satu pun kartu", () => {
    // Objek kosong berarti tidak ada satu pun skor yang pernah dihitung.
    const kosong = analysisFromFullResult("kosong-breakdown", {
      scores: {},
      aiFeedback: {},
      fullResult: { breakdown: {} },
    });
    expect(kosong.breakdown).toBeNull();
    expect(() => bacaSepertiHalaman(kosong)).not.toThrow();

    const bukanObjek = analysisFromFullResult("bukan-objek", {
      scores: {},
      aiFeedback: {},
      fullResult: { breakdown: "bukan objek" },
    });
    expect(bukanObjek.breakdown).toBeNull();
  });

  it("section tanpa skor angka dianggap tidak ada, bukan diberi skor 50", () => {
    // Skor 50 hasil .catch() schema akan tampil sebagai skor asli di kartu amber.
    const result = analysisFromFullResult("tanpa-skor", {
      scores: {},
      aiFeedback: {},
      fullResult: { breakdown: { summary: { score: "70" }, experience: { score: 80 }, skills: {} } },
    });
    expect(Object.keys(result.breakdown ?? {}).sort()).toEqual(["experience"]);
    expect(result.breakdown?.summary).toBeUndefined();
    expect(result.breakdown?.skills).toBeUndefined();
    expect(result.breakdown?.experience?.score).toBe(80);
    expect(() => bacaSepertiHalaman(result)).not.toThrow();
  });

  it("section yang ada tetap utuh, section yang hilang tidak muncul", () => {
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
    expect(b.summary?.score).toBe(70);
    // String polos pada issues harus ikut terbawa.
    expect(b.summary?.issues).toEqual(["Kurang metrik"]);
    expect(b.experience?.quantification_pct).toBe(40);
    // Section yang tidak ada tidak boleh muncul sebagai 50% palsu.
    expect(b.education).toBeUndefined();
    expect(b.format_ats).toBeUndefined();
    expect(() => bacaSepertiHalaman(result)).not.toThrow();
  });

  it("entri kosong dibuang dari daftar issue dan teks", () => {
    const result = analysisFromFullResult("kosong-di-tengah", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: {
          summary: {
            score: 70,
            issues: ["", "   ", "Kurang metrik", { text: "", source_excerpt: null }, { text: "Umum", source_excerpt: "x" }],
            suggestions: ["", "  ", "Tambah angka"],
          },
        },
      },
    });
    expect(result.breakdown?.summary?.issues).toEqual(["Kurang metrik", { text: "Umum", source_excerpt: "x" }]);
    expect(result.breakdown?.summary?.suggestions).toEqual(["Tambah angka"]);
  });

  it("relevance kosong tidak menghasilkan bullet ISSUES kosong", () => {
    const result = analysisFromFullResult("relevance-kosong", {
      scores: {},
      aiFeedback: {},
      fullResult: { breakdown: { education: { score: 60, relevance: "", suggestions: ["Tambah rata-rata studi"] } } },
    });
    const relevance = result.breakdown?.education?.relevance ?? "";
    // Ekspresi yang dipakai halaman untuk kartu education; bullet kosong jangan sampai muncul.
    expect(toIssueItems(relevance ? [relevance] : [])).toEqual([]);
  });

  it("koleksi yang bukan array diabaikan, bukan dipakai apa adanya", () => {
    const result = analysisFromFullResult("sampah", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: { summary: "bukan objek", experience: { score: 75, issues: "bukan array" } },
        keywordAnalysis: { matched: "React", missing_critical: null },
        narrativeFeedback: { strengths: { bukan: "array" } },
        actionPlan: { quick_wins: "tambah metrik", short_term: 5 },
        bulletReview: [{ section: "Exp", original_text: "x", issues: [], suggested_rewrite: "y", priority: "High" }, null, "sampah"],
        missingSections: "skills",
      },
    });
    expect(result.breakdown?.summary).toBeUndefined();
    expect(result.breakdown?.experience?.score).toBe(75);
    expect(result.breakdown?.experience?.issues).toEqual([]);
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

describe("skor, umpan balik, bobot, dan proyeksi dinormalkan", () => {
  const WEIGHTS = {
    role_category: "tech",
    summary_weight: 0.2,
    experience_weight: 0.35,
    skills_weight: 0.25,
    education_weight: 0.1,
    format_ats_weight: 0.1,
  };

  it("scores dan aiFeedback tidak menerima nilai di luar tipenya", () => {
    const result = analysisFromFullResult("tip-jahat", {
      scores: { overall: "80", keywordGap: 12.5, contextRelevance: null },
      aiFeedback: { keywordGap: 5, contextRelevance: null, atsRules: null, summary: "Cukup baik" },
      fullResult: {},
    });
    expect(result.scores).toEqual({ overall: 0, keywordGap: 12.5, contextRelevance: 0, atsRules: 0 });
    expect(result.aiFeedback).toEqual({ keywordGap: "", contextRelevance: "", atsRules: "", summary: "Cukup baik" });
    expect(result.summary).toBe("Cukup baik");
  });

  it("bobot yang tidak lengkap dibuang, bukan diisi angka nol", () => {
    // Bobot dipakai sebagai penjelasan skor; angka yang hilang berarti angka itu
    // tidak pernah dihitung, jadi catatan bobotnya lebih baik tidak tampil.
    const parsial = analysisFromFullResult("bobot-parsial", {
      scores: {},
      aiFeedback: {},
      fullResult: { weightsApplied: { role_category: "tech", experience_weight: 0.35 } },
    });
    expect(parsial.weightsApplied).toBeNull();

    const rusak = analysisFromFullResult("bobot-rusak", {
      scores: {},
      aiFeedback: {},
      fullResult: { weightsApplied: { ...WEIGHTS, role_category: 7 } },
    });
    expect(rusak.weightsApplied).toBeNull();

    const lengkap = analysisFromFullResult("bobot-lengkap", {
      scores: {},
      aiFeedback: {},
      fullResult: { weightsApplied: WEIGHTS },
    });
    expect(lengkap.weightsApplied).toEqual(WEIGHTS);
  });

  it("proyeksi skor tanpa angka lengkap tidak diteruskan", () => {
    const parsial = analysisFromFullResult("proyeksi-parsial", {
      scores: {},
      aiFeedback: {},
      fullResult: { impactForecast: { current_score: 70, projected_after_all_fixes: 90 } },
    });
    expect(parsial.impactForecast).toBeNull();

    const lengkap = analysisFromFullResult("proyeksi-lengkap", {
      scores: {},
      aiFeedback: {},
      fullResult: { impactForecast: { current_score: 70, projected_after_quick_wins: 80, projected_after_all_fixes: 90 } },
    });
    expect(lengkap.impactForecast).toEqual({
      current_score: 70,
      projected_after_quick_wins: 80,
      projected_after_all_fixes: 90,
    });
  });
});

describe("hasil tersimpan punya bentuk yang sama dengan hasil langsung", () => {
  it("aiModel dibaca dari hasil tersimpan, bukan dari payload API", () => {
    // aiModel tidak pernah jadi kolom sendiri; ia disimpan di dalam full_result
    // oleh route analyze, jadi mapper membacanya dari sana.
    const result = analysisFromFullResult("lengkap", {
      scores: {},
      aiFeedback: {},
      fullResult: { aiModel: "V4 Pro" },
    });
    expect(result.aiModel).toBe("V4 Pro");
  });

  it("baris lama tanpa aiModel jadi undefined, bukan error", () => {
    const result = analysisFromFullResult("lama", {
      scores: {},
      aiFeedback: {},
      fullResult: { grade: "C" },
    });
    expect(result.aiModel).toBeUndefined();
  });

  it("aiModel di luar daftar model yang dikenal diabaikan", () => {
    const result = analysisFromFullResult("ngawur", {
      scores: {},
      aiFeedback: {},
      fullResult: { aiModel: "GPT-9" },
    });
    expect(result.aiModel).toBeUndefined();
  });

  it("route analyze menyimpan aiModel di dalam full_result", () => {
    const src = readFileSync(join(process.cwd(), "src/app/api/checker/analyze/route.ts"), "utf8");
    const blok = src.slice(src.indexOf("const aiStructuredData = {"), src.indexOf("};", src.indexOf("const aiStructuredData = {")));
    expect(blok).toMatch(/aiModel:/);
    // Objek yang sama itulah yang disimpan sebagai kolom jsonb full_result.
    expect(src).toContain("fullResult: aiStructuredData");
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
      // Panel HR (prompt 3): field baru yang disengaja, kosong untuk baris lama.
      "durationRewrite",
      "grade",
      "hrFlags",
      "hrQuestions",
      "hrScan",
      "id",
      "impactForecast",
      "keywordAnalysis",
      "knockoutRisks",
      "meta",
      "missingSections",
      "narrativeFeedback",
      // quickSummary: kartu Ringkasan 10 detik (v5) — field baru yang disengaja,
      // null untuk baris lama.
      "quickSummary",
      "scores",
      "summary",
      "weightsApplied",
    ]);
    // fitLabel sengaja tidak ada: ekspresi lama membaca breakdown.overall yang
    // tidak pernah ada, jadi selalu undefined, dan hanya /checker/page.tsx yang membacanya.
  });
});
