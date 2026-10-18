import { describe, expect, it } from "vitest";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";

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
