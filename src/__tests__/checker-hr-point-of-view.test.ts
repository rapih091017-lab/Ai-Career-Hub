import { describe, expect, it } from "vitest";
import { buildHrPointOfView } from "@/lib/checker/hr-point-of-view";
import { AnalysisResultSchema } from "@/lib/ai/prompts/schemas";

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

    // Urutan berikut hasil pengurutan severity: butir "medium" mendahului
    // butir tanpa severity. Yang dijaga test ini adalah string polos tidak
    // hilang diam-diam, bukan urutan masuknya.
    expect(view.stopping).toEqual([
      { text: "Tidak ada metrik", severity: "medium", quote: null },
      { text: "Kurang TypeScript", severity: null, quote: null },
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

  it("sisi yang tidak ada di ats_prediction dipakai dari narrative_feedback", () => {
    // Dua kolom narrative_feedback ini bukan duplikat dari risk_factors:
    // bentuknya string polos tanpa severity dan tanpa kutipan, dan beberapa CV
    // hanya punya kelemahan di sana. Kalau tidak jadi sumber cadangan, isinya
    // tidak pernah sampai ke layar.
    const view = buildHrPointOfView({
      atsPredictionDetail: { risk_factors: [], strengths: [] },
      narrativeFeedback: {
        strengths: ["Growth positif", "Stack relevan"],
        areas_for_improvement: ["Kuantifikasi rendah"],
      },
    } as any);

    expect(view.stopping).toEqual([{ text: "Kuantifikasi rendah", severity: null, quote: null }]);
    expect(view.continuing).toEqual([
      { text: "Growth positif", severity: null, quote: null },
      { text: "Stack relevan", severity: null, quote: null },
    ]);
    expect(view.isEmpty).toBe(false);
  });

  it("fallback dipakai hanya di sisi yang kosong", () => {
    // Sisi berhenti sudah punya kutipan asli, jadi narrative_feedback tidak
    // boleh menambah duplikat di dalamnya. Sisi lanjut kosong, jadi boleh pakai
    // cadangan.
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" }],
        strengths: [],
      },
      narrativeFeedback: {
        strengths: ["Growth positif"],
        areas_for_improvement: ["Kuantifikasi rendah"],
      },
    } as any);

    expect(view.stopping).toEqual([
      { text: "TypeScript tidak ada", severity: "critical", quote: "JavaScript, React" },
    ]);
    expect(view.continuing).toEqual([{ text: "Growth positif", severity: null, quote: null }]);
  });

  it("risk_factors kosong jatuh ke narrative, strengths tetap pakai ats", () => {
    // Kebalikan dari tes sebelumnya: sisi berhenti yang kosong harus jatuh ke
    // narrative, sisi lanjut yang sudah terisi ats tidak boleh ikut terbawa.
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [],
        strengths: [{ text: "Stack relevan", source_excerpt: "React, TypeScript" }],
      },
      narrativeFeedback: {
        strengths: ["Growth positif"],
        areas_for_improvement: ["Kuantifikasi rendah"],
      },
    } as any);

    expect(view.stopping).toEqual([{ text: "Kuantifikasi rendah", severity: null, quote: null }]);
    expect(view.continuing).toEqual([
      { text: "Stack relevan", severity: null, quote: "React, TypeScript" },
    ]);
  });

  it("narrative kosong tidak menggantikan data ats yang sudah ada", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" }],
        strengths: [{ text: "Metrik dampak jelas", source_excerpt: "Konversi naik 30%" }],
      },
      narrativeFeedback: { strengths: [], areas_for_improvement: [] },
    } as any);

    expect(view.stopping).toEqual([
      { text: "TypeScript tidak ada", severity: "critical", quote: "JavaScript, React" },
    ]);
    expect(view.continuing).toEqual([
      { text: "Metrik dampak jelas", severity: null, quote: "Konversi naik 30%" },
    ]);
  });

  it("daftar ats non-kosong membuat narrative diabaikan sepenuhnya", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "Tabel pengalaman padat", severity: "medium", source_excerpt: "2019 – 2024" }],
        strengths: [{ text: "Portofolio kuat", source_excerpt: "github.com/contoh" }],
      },
      narrativeFeedback: {
        strengths: ["Growth positif"],
        areas_for_improvement: ["Kuantifikasi rendah"],
      },
    } as any);

    expect(view.stopping).toEqual([
      { text: "Tabel pengalaman padat", severity: "medium", quote: "2019 – 2024" },
    ]);
    expect(view.continuing).toEqual([
      { text: "Portofolio kuat", severity: null, quote: "github.com/contoh" },
    ]);
  });

  it("ats_prediction sama sekali tidak ada, fallback tetap dipakai", () => {
    const view = buildHrPointOfView({
      narrativeFeedback: {
        strengths: ["Stack relevan"],
        areas_for_improvement: ["Kuantifikasi rendah"],
      },
    } as any);

    expect(view.stopping).toHaveLength(1);
    expect(view.continuing).toHaveLength(1);
    expect(view.isEmpty).toBe(false);
  });

  it("cadangan yang isinya bukan teks tidak jadi baris kosong", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: { risk_factors: [], strengths: [] },
      narrativeFeedback: {
        strengths: ["  ", null, 7, "Stack relevan"],
        areas_for_improvement: [{}, "Kuantifikasi rendah"],
      },
    } as any);

    expect(view.stopping).toEqual([{ text: "Kuantifikasi rendah", severity: null, quote: null }]);
    expect(view.continuing).toEqual([{ text: "Stack relevan", severity: null, quote: null }]);
  });

  it("keempat daftar kosong berarti panel kosong", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: { risk_factors: [], strengths: [] },
      narrativeFeedback: { strengths: [], areas_for_improvement: [] },
    } as any);

    expect(view.isEmpty).toBe(true);
    expect(view.stopping).toEqual([]);
    expect(view.continuing).toEqual([]);
  });

  it("narrative_feedback null tidak menggagalkan sisi yang sudah ada", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "Ada tabel", severity: "high", source_excerpt: null }],
        strengths: [],
      },
      narrativeFeedback: null,
    } as any);

    expect(view.stopping).toHaveLength(1);
    expect(view.continuing).toEqual([]);
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

  it("buildHrPointOfView menolak default schema yang bukan datang dari AI", () => {
    // "mid", "Stable", dan "Normal" memang lolos allowlist di sini karena ketiga
    // nilai itu sah saat benar-benar dikirim model. Yang jadi masalah: schema
    // dulu menyuntik ketiganya lewat .catch(), jadi output parse selalu
    // memaksa baris level dan arah tampil walau model tidak pernah mengirimnya.
    // Tes ini menjembatani schema → panel: kalau schema kembali menyuntik
    // default, ketiga assertion di bawah gugur.
    const parsed = AnalysisResultSchema.parse({
      meta: { role_category: "tech", cv_word_count: 380, jd_present: true, analysis_confidence: 75 },
      career_velocity: {
        time_in_role_analysis: "2 tahun di role yang sama",
        responsibility_arc: "Eksekusi task → ownership fitur",
        recommendations: ["Ambil proyek leadership"],
      },
    });

    const view = buildHrPointOfView({
      meta: parsed.meta,
      careerVelocity: parsed.career_velocity,
    } as any);

    expect(view.seniority).toBeNull();
    expect(view.progression).toBeNull();
    expect(view.growthRate).toBeNull();
  });
});

describe("urutan temuan yang bikin berhenti", () => {
  it("diurutkan dari yang paling serius ke yang paling ringan", () => {
    // Panel adalah triage. Urutan semula ikut apa adanya dari AI, sehingga
    // "Rendah" bisa tampil di atas "Kritis" dan pembaca harus mengubek-ubek.
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [
          { text: "Format tanggal tidak konsisten", severity: "low", source_excerpt: null },
          { text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" },
          { text: "Tidak ada ringkasan", severity: "medium", source_excerpt: null },
          { text: "Butir tanpa severity", source_excerpt: null },
        ],
        strengths: [],
      },
    } as any);

    expect(view.stopping.map((finding) => finding.text)).toEqual([
      "TypeScript tidak ada",
      "Tidak ada ringkasan",
      "Format tanggal tidak konsisten",
      "Butir tanpa severity",
    ]);
  });

  it("temuan yang sama tetap diurutkan meski masuk dalam urutan acak", () => {
    const urut = (risks: unknown[]) =>
      buildHrPointOfView({
        atsPredictionDetail: { risk_factors: risks, strengths: [] },
      } as any).stopping.map((finding) => finding.severity);

    const kacau = [
      { text: "satu", severity: "high" },
      { text: "dua", severity: "critical" },
      { text: "tiga", severity: "low" },
    ];
    expect(urut(kacau)).toEqual(["critical", "high", "low"]);
    expect(urut([...kacau].reverse())).toEqual(["critical", "high", "low"]);
  });
});
