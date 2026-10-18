import { describe, expect, it } from "vitest";
import { buildHrPointOfView } from "@/lib/checker/hr-point-of-view";

describe("pandangan sisi HR dari data analisis", () => {
  it("temuan berhenti dibaca membawa severity dan kutipan", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [
          { text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" },
        ],
        strengths: [],
      },
    } as any);

    expect(view.stopping).toEqual([
      { text: "TypeScript tidak ada", severity: "critical", quote: "JavaScript, React" },
    ]);
    expect(view.isEmpty).toBe(false);
  });

  it("risk_factors berupa string polos tetap terbaca", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: ["Kurang TypeScript", { text: "Tidak ada metrik", severity: "medium", source_excerpt: null }],
        strengths: [],
      },
    } as any);

    expect(view.stopping).toEqual([
      { text: "Kurang TypeScript", severity: null, quote: null },
      { text: "Tidak ada metrik", severity: "medium", quote: null },
    ]);
  });

  it("strengths berupa string dan object dinormalisasi jadi satu bentuk", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [],
        strengths: [
          "Ada metrik dampak",
          { text: "Proyek nyata", source_excerpt: "Bangun dashboard untuk 40 user" },
        ],
      },
    } as any);

    expect(view.continuing).toEqual([
      { text: "Ada metrik dampak", severity: null, quote: null },
      { text: "Proyek nyata", severity: null, quote: "Bangun dashboard untuk 40 user" },
    ]);
  });

  it("kutipan null tidak jadi kotak kosong", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "Ada tabel", severity: "high", source_excerpt: null }],
        strengths: [],
      },
    } as any);

    expect(view.stopping[0].quote).toBeNull();
  });

  it("kutipan kosong dianggap tidak ada", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "Ada tabel", severity: "high", source_excerpt: "   " }],
        strengths: [],
      },
    } as any);

    expect(view.stopping[0].quote).toBeNull();
  });

  it("seniority terbaca dari meta", () => {
    const view = buildHrPointOfView({ meta: { detected_seniority: "entry" } } as any);
    expect(view.seniority).toBe("entry");
  });

  it("nilai meta dan careerVelocity di luar daftar tidak diteruskan apa adanya", () => {
    const view = buildHrPointOfView({
      meta: { detected_seniority: "principal" },
      careerVelocity: { title_progression: "Naik Cepat", growth_rate: "Laju" },
    } as any);

    expect(view.seniority).toBeNull();
    expect(view.progression).toBeNull();
    expect(view.growthRate).toBeNull();
  });

  it("perjalanan karier terbaca dari careerVelocity", () => {
    const view = buildHrPointOfView({
      careerVelocity: { title_progression: "Upward", growth_rate: "Fast" },
    } as any);
    expect(view.progression).toBe("Upward");
    expect(view.growthRate).toBe("Fast");
  });

  it("panel kosong ditandai benar saat tidak ada temuan", () => {
    const view = buildHrPointOfView({ atsPredictionDetail: { risk_factors: [], strengths: [] } } as any);
    expect(view.isEmpty).toBe(true);
    expect(view.stopping).toEqual([]);
    expect(view.continuing).toEqual([]);
  });

  it("ats_prediction berupa string tidak bikin error", () => {
    // Schema mengizinkan ats_prediction berupa string, bukan objek.
    const view = buildHrPointOfView({ atsPrediction: "Likely Pass" } as any);
    expect(view.isEmpty).toBe(true);
    expect(view.stopping).toEqual([]);
  });

  it("atsPredictionDetail dengan bentuk asing tetap aman", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: { risk_factors: "bukan array", strengths: null },
    } as any);

    expect(view.stopping).toEqual([]);
    expect(view.continuing).toEqual([]);
    expect(view.isEmpty).toBe(true);
  });

  it("hasil tanpa data sama sekali tetap aman", () => {
    for (const input of [null, undefined, {}, { meta: null, careerVelocity: null }]) {
      const view = buildHrPointOfView(input as any);
      expect(view.isEmpty).toBe(true);
      expect(view.seniority).toBeNull();
      expect(view.progression).toBeNull();
      expect(view.growthRate).toBeNull();
    }
  });

  it("butir tanpa teks diabaikan", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "   ", severity: "high", source_excerpt: "apa saja" }],
        strengths: ["", { text: "  " }],
      },
    } as any);

    expect(view.stopping).toEqual([]);
    expect(view.continuing).toEqual([]);
    expect(view.isEmpty).toBe(true);
  });
});
