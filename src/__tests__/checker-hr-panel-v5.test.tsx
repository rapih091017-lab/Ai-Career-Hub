import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HrPointOfView from "@/components/checker/HrPointOfView";
import { LanguageProvider } from "@/lib/i18n";
import {
  toDurationRewrite,
  toHrFlags,
  toHrQuestions,
  toHrScan,
  toKnockoutRisks,
} from "@/lib/checker/analysis-from-full-result";
import { buildChangePack } from "@/lib/checker/copy";
import { atsReadinessLabel, type StoredAnalysisResult } from "@/components/checker/types";

const CV =
  "Bekerja sebagai Frontend Developer di PT Maju dari 2020 sampai 2023. " +
  "Membangun dashboard untuk 40 user aktif setiap hari.";

afterEach(() => {
  // LanguageProvider membaca localStorage saat mount; bahasa yang bocor ke
  // test berikutnya membuat assertion Indonesia tidak pernah cocok.
  localStorage.removeItem("lang");
});

/* ═══════════════════════════════════════════════════════════ */
/*  MAPPER                                                     */
/* ═══════════════════════════════════════════════════════════ */

describe("mapper panel HR", () => {
  it("toHrScan: kunci dengan status invalid dibuang; semua rusak → null", () => {
    const scan = toHrScan({
      last_title: { value: "Frontend Developer", status: "terbaca" },
      total_experience: { value: "3 tahun", status: "SESAT" },
      top_achievement: "bukan objek",
      key_skills: { value: null, status: "tidak_terbaca", note: "CV memang tidak menyebut" },
    });
    expect(scan?.last_title).toEqual({ value: "Frontend Developer", status: "terbaca" });
    expect(scan?.total_experience).toBeUndefined();
    expect(scan?.top_achievement).toBeUndefined();
    expect(scan?.key_skills).toEqual({ value: null, status: "tidak_terbaca", note: "CV memang tidak menyebut" });
    expect(toHrScan({ last_title: { value: "x", status: "salah" } })).toBeNull();
    expect(toHrScan("bukan objek")).toBeNull();
  });

  it("toHrFlags: type/label invalid dibuang, evidence diverifikasi ke CV, cap 8", () => {
    const flags = toHrFlags(
      [
        { type: "yellow", label: "Warna ngawur" },
        { type: "red", label: "  " },
        {
          type: "red",
          label: "Jeda karier 2 tahun tak dijelaskan",
          evidence: "dashboard untuk  40 USER", // spasi/kapital beda tetap sah
          fix: { copy_text: "Menjelaskan jeda karier 2023 sebagai [kegiatan]", replaces: "2022 - 2024" },
        },
        { type: "green", label: "Karier naik konsisten", evidence: "mengarang di luar CV" },
        "bukan objek",
      ],
      CV,
    );
    expect(flags.map((f) => f.label)).toEqual([
      "Jeda karier 2 tahun tak dijelaskan",
      "Karier naik konsisten",
    ]);
    expect(flags[0].evidence).toBe("dashboard untuk  40 USER");
    expect(flags[0].fix?.copy_text).toContain("jeda karier");
    // Bukti yang bukan potongan CV: flag tetap ada, evidence hilang.
    expect(flags[1]).not.toHaveProperty("evidence");

    const many = Array.from({ length: 10 }, (_, i) => ({ type: "green", label: `F${i}` }));
    expect(toHrFlags(many, CV)).toHaveLength(8);

    // Tanpa teks CV (mis. hasil tersimpan yang sudah divalidasi saat ditulis),
    // evidence diteruskan apa adanya.
    expect(toHrFlags([{ type: "red", label: "X", evidence: "bebas" }])[0].evidence).toBe("bebas");
  });

  it("toHrQuestions: question kosong dibuang, maksimal 5", () => {
    const questions = toHrQuestions([
      { question: "", why_asked: "x", answer_tip: "y" },
      { question: "Kenapa pindah dari PT Maju?", why_asked: "Riwayat kerja", answer_tip: "Jawab jujur." },
      "bukan objek",
    ]);
    // why_asked/answer_tip opsional: pertanyaan tanpa keduanya tetap lolos.
    expect(questions).toHaveLength(1);
    expect(questions[0].question).toContain("PT Maju");
    const many = Array.from({ length: 7 }, (_, i) => ({ question: `Q${i}` }));
    expect(toHrQuestions(many)).toHaveLength(5);
  });

  it("toKnockoutRisks: status invalid dibuang, evidence diverifikasi, cap 8", () => {
    const risks = toKnockoutRisks(
      [
        { requirement: "Pengalaman minimal 3 tahun", status: "terpenuhi", evidence: "2020 sampai 2023" },
        { requirement: "Domisili Jakarta", status: "ragu-ragu" },
        { requirement: "Gelar S1", status: "tidak_ada", tip: "Sebutkan sertifikasi pendukung" },
        { requirement: "", status: "terpenuhi" },
      ],
      CV,
    );
    expect(risks.map((r) => r.requirement)).toEqual([
      "Pengalaman minimal 3 tahun",
      "Gelar S1",
    ]);
    expect(risks[0].evidence).toBe("2020 sampai 2023");
    expect(risks[1].tip).toBe("Sebutkan sertifikasi pendukung");
    const many = Array.from({ length: 9 }, (_, i) => ({ requirement: `R${i}`, status: "terpenuhi" }));
    expect(toKnockoutRisks(many, CV)).toHaveLength(8);
  });

  it("toDurationRewrite: tanpa copy_text → null; tanpa replaces tidak ada field itu", () => {
    expect(toDurationRewrite(undefined)).toBeNull();
    expect(toDurationRewrite({ copy_text: "   " })).toBeNull();
    expect(toDurationRewrite({ copy_text: "Frontend Developer (3 thn 2 bln)", replaces: "2020 - 2023" })).toEqual({
      copy_text: "Frontend Developer (3 thn 2 bln)",
      replaces: "2020 - 2023",
    });
    expect(toDurationRewrite({ copy_text: "Senior Engineer (2 thn)" })).toEqual({
      copy_text: "Senior Engineer (2 thn)",
    });
  });
});

/* ═══════════════════════════════════════════════════════════ */
/*  buildChangePack                                            */
/* ═══════════════════════════════════════════════════════════ */

describe("buildChangePack + format durasi kerja", () => {
  const base = {
    id: "uji",
    scores: { overall: 60, keywordGap: 50, contextRelevance: 60, atsRules: 55 },
    aiFeedback: { keywordGap: "", contextRelevance: "", atsRules: "", summary: "" },
    summary: "",
  } as StoredAnalysisResult;

  it("menambah blok FORMAT DURASI KERJA dalam teks polos", () => {
    const pack = buildChangePack({
      ...base,
      bulletReview: [
        {
          section: "experience",
          original_text: "Kerja",
          issues: [],
          suggested_rewrite: "**Memimpin** tim 5 orang",
          priority: "High",
        },
      ],
      durationRewrite: { copy_text: "**Senior** Frontend Developer (3 thn 2 bln)" },
    });
    expect(pack).toContain("FORMAT DURASI KERJA");
    expect(pack).toContain("• Senior Frontend Developer (3 thn 2 bln)");
    expect(pack).toContain("• Memimpin tim 5 orang");
    expect(pack).not.toContain("**");
  });

  it("tanpa durasi hasilnya sama seperti sebelumnya; fix flag tidak ikut pack", () => {
    const analysis: StoredAnalysisResult = {
      ...base,
      bulletReview: [
        {
          section: "summary",
          original_text: "Profil",
          issues: [],
          suggested_rewrite: "Frontend engineer dengan 4 tahun pengalaman",
          priority: "Low",
        },
      ],
      // Fix dari hrFlags sengaja tidak masuk pack — hanya tombol per kartu.
      hrFlags: [
        { type: "red", label: "Typo di jabatan", fix: { copy_text: "TEKS_FIX_FLAG" } },
      ],
    };
    const pack = buildChangePack(analysis);
    expect(pack).not.toContain("FORMAT DURASI KERJA");
    expect(pack).not.toContain("TEKS_FIX_FLAG");
    // Hanya durasi kosong yang membuat pack kosong, bukan flag.
    expect(buildChangePack({ ...base, bulletReview: [] })).toBe("");
  });
});

/* ═══════════════════════════════════════════════════════════ */
/*  UI: panel HR + label kesiapan                              */
/* ═══════════════════════════════════════════════════════════ */

const PANEL_RESULT = {
  meta: { detected_seniority: "mid" },
  careerVelocity: { title_progression: "Upward" },
  atsPredictionDetail: { risk_factors: [], strengths: [] },
  hrScan: {
    last_title: { value: "Frontend Developer", status: "terbaca" as const },
    total_experience: { value: "3 tahun", status: "terbaca" as const },
    top_achievement: { value: null, status: "tidak_terbaca" as const, note: "CV tidak menyebut angka" },
    key_skills: { value: "React, Next.js", status: "samar" as const },
  },
  hrFlags: [
    {
      type: "red" as const,
      label: "Pindah kerja 4 kali dalam 3 tahun",
      evidence: "PT Maju dari 2020 sampai 2023",
      fix: { copy_text: "Menjelaskan alasan pindah secara singkat" },
    },
    {
      type: "green" as const,
      label: "Jabatan naik konsisten",
      evidence: "Frontend Developer di PT Maju",
    },
  ],
  hrQuestions: [
    {
      question: "Kenapa hanya bertahan 3 tahun di PT Maju?",
      why_asked: "Riwayat kerja di CV",
      answer_tip: "Jawab dengan alasan jujur. Jangan mengarang konflik.",
    },
  ],
  knockoutRisks: [
    {
      requirement: "Pengalaman minimal 3 tahun",
      status: "terpenuhi" as const,
      evidence: "2020 sampai 2023",
    },
  ],
  durationRewrite: {
    copy_text: "Frontend Developer (3 thn 2 bln)",
    replaces: "2020 - 2023",
  },
};

function renderPanel(result: unknown) {
  return render(
    <LanguageProvider>
      <HrPointOfView result={result as never} />
    </LanguageProvider>,
  );
}

describe("panel HR v5", () => {
  it("menampilkan scan 30 detik, flag berbukti, akordeon, knockout, dan kartu durasi", () => {
    renderPanel(PANEL_RESULT);

    // 1. Scan 30 detik + chip status
    expect(screen.getByText("Yang HR tangkap dalam 30 detik")).toBeInTheDocument();
    expect(screen.getByText("Jabatan terakhir")).toBeInTheDocument();
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("Tidak terbaca")).toBeInTheDocument();
    expect(screen.getByText("CV tidak menyebutkannya.")).toBeInTheDocument();

    // 2. Dua kolom flag + bukti kutipan + tombol salin fix
    expect(screen.getByText("Perlu diperiksa")).toBeInTheDocument();
    expect(screen.getByText("Patut dipertahankan")).toBeInTheDocument();
    expect(screen.getByText("Pindah kerja 4 kali dalam 3 tahun")).toBeInTheDocument();
    expect(screen.getByText(/PT Maju dari 2020 sampai 2023/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Salin perbaikan" })).toHaveLength(1);

    // 3. Akordeon pertanyaan: tertutup lalu terbuka
    const qButton = screen.getByRole("button", { expanded: false, name: /Kenapa hanya bertahan 3 tahun/ });
    fireEvent.click(qButton);
    expect(screen.getByRole("button", { expanded: true, name: /Kenapa hanya bertahan 3 tahun/ })).toBeInTheDocument();
    expect(screen.getByText(/Jawab dengan alasan jujur/)).toBeInTheDocument();

    // 4. Knockout
    expect(screen.getByText("Risiko syarat wajib")).toBeInTheDocument();
    expect(screen.getByText("Pengalaman minimal 3 tahun")).toBeInTheDocument();
    expect(screen.getByText("Terpenuhi")).toBeInTheDocument();

    // 5. Kartu durasi + catatan statis
    expect(screen.getByText("Format durasi kerja")).toBeInTheDocument();
    expect(screen.getByText("Frontend Developer (3 thn 2 bln)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salin format" })).toBeInTheDocument();
    expect(
      screen.getByText("Tetap jujur. Pertahankan tahun jika portal lowongan memintanya."),
    ).toBeInTheDocument();
  });

  it("baris lama: panel tampil seperti sebelumnya tanpa blok baru yang kosong", () => {
    renderPanel({
      meta: { detected_seniority: "mid" },
      atsPredictionDetail: { risk_factors: [], strengths: [] },
    });
    expect(screen.queryByText("Yang HR tangkap dalam 30 detik")).toBeNull();
    expect(screen.queryByText("Perlu diperiksa")).toBeNull();
    expect(screen.queryByText("Pertanyaan yang kemungkinan ditanyakan HR")).toBeNull();
    expect(screen.queryByText("Risiko syarat wajib")).toBeNull();
    expect(screen.queryByText("Format durasi kerja")).toBeNull();
  });
});

describe("label kesiapan dibaca HR & mesin", () => {
  it("menerjemahkan enum tanpa mengubah nilai datanya", () => {
    expect(atsReadinessLabel("Likely Pass")).toBe("Siap dibaca");
    expect(atsReadinessLabel("Borderline")).toBe("Perlu dirapikan");
    expect(atsReadinessLabel("Likely Fail")).toBe("Berisiko terlewat");
    expect(atsReadinessLabel("apapun")).toBe("");
    expect(atsReadinessLabel(null)).toBe("");
  });
});
