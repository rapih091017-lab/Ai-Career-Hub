import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";
import { buildChangePack, copyToClipboard, findPlaceholders, sanitizeCopyText } from "@/lib/checker/copy";
import { BulletReviewCard } from "@/components/checker/ResultComponents";
import { LanguageProvider } from "@/lib/i18n";
import { ANALYSIS_PROMPT_V4 } from "@/lib/ai/prompts/analysis-v4";
import type { StoredAnalysisResult } from "@/components/checker/types";

function makeAnalysis(bulletReview: StoredAnalysisResult["bulletReview"]): StoredAnalysisResult {
  return {
    id: "uji",
    scores: { overall: 62, keywordGap: 42, contextRelevance: 60, atsRules: 45 },
    aiFeedback: { keywordGap: "", contextRelevance: "", atsRules: "", summary: "" },
    summary: "",
    bulletReview,
  };
}

describe("sanitizeCopyText", () => {
  it("membuang markdown tapi tidak mengubah kata", () => {
    expect(sanitizeCopyText("**Naik** 20%")).toBe("Naik 20%");
    expect(sanitizeCopyText("__tetap__ kata")).toBe("tetap kata");
    expect(sanitizeCopyText("`inline code` penting")).toBe("inline code penting");
    expect(sanitizeCopyText("  Pekerja  keras  ")).toBe("Pekerja keras");
  });

  it("membuang bullet, penomoran, dan heading di awal baris", () => {
    expect(sanitizeCopyText("• Memimpin tim 5 orang")).toBe("Memimpin tim 5 orang");
    expect(sanitizeCopyText("- Mengurangi downtime")).toBe("Mengurangi downtime");
    expect(sanitizeCopyText("1. Kelola anggaran")).toBe("Kelola anggaran");
    expect(sanitizeCopyText("2) Audit proses")).toBe("Audit proses");
    expect(sanitizeCopyText("# Ringkasan Profil")).toBe("Ringkasan Profil");
  });

  it("tanda pagar di tengah kata tidak disentuh", () => {
    expect(sanitizeCopyText("Kuasai C# dan .NET")).toBe("Kuasai C# dan .NET");
  });

  it("input tidak berupa teks tetap aman", () => {
    expect(sanitizeCopyText("")).toBe("");
    expect(sanitizeCopyText(undefined as unknown as string)).toBe("");
  });
});

describe("findPlaceholders", () => {
  it("menemukan semua placeholder", () => {
    const found = findPlaceholders("naik [persen] dalam [bulan]");
    expect(found).toHaveLength(2);
    expect(found).toEqual(["[persen]", "[bulan]"]);
  });

  it("mengembalikan [] ketika tidak ada placeholder", () => {
    expect(findPlaceholders("tanpa placeholder")).toEqual([]);
    expect(findPlaceholders("")).toEqual([]);
  });
});

describe("copyToClipboard", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
  });

  it("memakai navigator.clipboard kalau tersedia", async () => {
    writeText.mockResolvedValue(undefined);
    await expect(copyToClipboard("teks polos")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("teks polos");
  });

  it("tidak pernah melempar saat klip diblokir", async () => {
    writeText.mockRejectedValue(new Error("diblokir"));
    await expect(copyToClipboard("teks polos")).resolves.toBe(false);
  });

  it("teks kosong tidak disalin", async () => {
    await expect(copyToClipboard("")).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe("buildChangePack", () => {
  it("mengelompokkan per section dengan judul kapital dan poin ber-bullet", () => {
    const pack = buildChangePack(
      makeAnalysis([
        {
          section: "experience",
          original_text: "Membangun fitur login",
          issues: [],
          suggested_rewrite: "**Memimpin** tim 5 orang",
          priority: "High",
        },
        {
          section: "experience",
          original_text: "Downtime server",
          issues: [],
          suggested_rewrite: "Mengurangi downtime [persen]",
          priority: "Medium",
        },
        {
          section: "summary",
          original_text: "Profil",
          issues: [],
          suggested_rewrite: "Frontend engineer dengan 4 tahun pengalaman",
          priority: "Low",
        },
      ]),
    );

    expect(pack).toBe(
      [
        "PENGALAMAN — EXPERIENCE",
        "• Memimpin tim 5 orang",
        "• Mengurangi downtime [persen]",
        "",
        "PENGALAMAN — SUMMARY",
        "• Frontend engineer dengan 4 tahun pengalaman",
      ].join("\n"),
    );
  });

  it("melewati item tanpa teks dan mengembalikan '' kalau tidak ada isi", () => {
    const pack = buildChangePack(
      makeAnalysis([
        { section: "experience", original_text: "a", issues: [], suggested_rewrite: "   ", priority: "Low" },
        { section: "summary", original_text: "b", issues: [], suggested_rewrite: "**  **", priority: "Low" },
      ]),
    );
    expect(pack).toBe("");
    expect(buildChangePack(makeAnalysis([]))).toBe("");
    expect(buildChangePack(makeAnalysis(undefined))).toBe("");
  });
});

/** Baris lama & terpotong wajib memetakan persis seperti sebelum upgrade fondasi. */
describe("analysisFromFullResult tidak berubah untuk baris lama", () => {
  it("baris lama tanpa field baru menghasilkan hasil yang sama", () => {
    const result = analysisFromFullResult("lama-1", {
      scores: { overall: 62, keywordGap: 42, contextRelevance: 60, atsRules: 45 },
      aiFeedback: { keywordGap: "k", contextRelevance: "c", atsRules: "a", summary: "V" },
      fullResult: {
        grade: "C",
        atsPrediction: "Borderline",
        breakdown: { experience: { score: 60, issues: ["Tanpa metrik"], suggestions: ["Tambah angka"] } },
        bulletReview: [
          {
            section: "experience",
            original_text: "Membangun fitur",
            issues: ["Verb lemah"],
            suggested_rewrite: "Merancang sistem [angka]",
            priority: "High",
          },
        ],
        missingSections: ["Sertifikasi"],
        weightsApplied: {
          role_category: "tech",
          summary_weight: 20,
          experience_weight: 35,
          skills_weight: 25,
          education_weight: 10,
          format_ats_weight: 10,
        },
        impactForecast: { current_score: 62, projected_after_quick_wins: 68, projected_after_all_fixes: 80 },
      },
    });

    expect(result).toEqual({
      id: "lama-1",
      scores: { overall: 62, keywordGap: 42, contextRelevance: 60, atsRules: 45 },
      aiFeedback: { keywordGap: "k", contextRelevance: "c", atsRules: "a", summary: "V" },
      summary: "V",
      grade: "C",
      atsPrediction: "Borderline",
      breakdown: { experience: { score: 60, issues: ["Tanpa metrik"], suggestions: ["Tambah angka"] } },
      keywordAnalysis: null,
      narrativeFeedback: null,
      actionPlan: null,
      bulletReview: [
        {
          section: "experience",
          original_text: "Membangun fitur",
          issues: ["Verb lemah"],
          suggested_rewrite: "Merancang sistem [angka]",
          priority: "High",
        },
      ],
      // Input string "Sertifikasi" dinormalkan mapper jadi objek { name }.
      missingSections: [{ name: "Sertifikasi" }],
      weightsApplied: {
        role_category: "tech",
        summary_weight: 20,
        experience_weight: 35,
        skills_weight: 25,
        education_weight: 10,
        format_ats_weight: 10,
      },
      impactForecast: { current_score: 62, projected_after_quick_wins: 68, projected_after_all_fixes: 80 },
      meta: null,
      careerVelocity: null,
      atsPredictionDetail: null,
      aiModel: undefined,
      // quickSummary (v5): baris lama tidak punya field ini di full_result,
      // jadi hasilnya null dan kartu ringkasan tidak muncul.
      quickSummary: null,
      // Panel HR (prompt 3): baris lama juga tanpa field ini — panel tampil
      // seperti sebelumnya tanpa kotak kosong.
      hrScan: null,
      hrFlags: [],
      hrQuestions: [],
      knockoutRisks: [],
      durationRewrite: null,
    });
  });

  it("baris terpotong hanya memunculkan section yang punya skor", () => {
    const result = analysisFromFullResult("potong", {
      scores: { overall: 50 },
      aiFeedback: {},
      fullResult: { breakdown: { summary: { score: 70 } } },
    });
    expect(result.breakdown).toEqual({ summary: { score: 70, issues: [], suggestions: [] } });
  });
});

describe("CopyButton di BulletReviewCard", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
  });

  it("menyalin suggested_rewrite sebagai teks polos dan memperingatkan placeholder", async () => {
    render(
      <BulletReviewCard
        index={0}
        item={{
          section: "experience",
          original_text: "Membangun fitur login",
          issues: ["Tanpa metrik"],
          suggested_rewrite: "**Merancang** autentikasi yang dipakai [persen] pengguna",
          priority: "High",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { expanded: false }));

    expect(
      screen.getByText("Masih ada bagian [persen], ganti dengan data aslimu sebelum dikirim."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Salin" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Merancang autentikasi yang dipakai [persen] pengguna");
    });
    expect(await screen.findByRole("button", { name: "Tersalin ✓" })).toBeInTheDocument();
  });

  it("mengikuti bahasa aktif saat pengguna memilih Inggris", async () => {
    localStorage.setItem("lang", "en");
    try {
      render(
        <LanguageProvider>
          <BulletReviewCard
            index={0}
            item={{
              section: "experience",
              original_text: "Built the login flow",
              issues: ["No metric"],
              suggested_rewrite: "**Redesigned** auth used by [persen] users",
              priority: "High",
            }}
          />
        </LanguageProvider>,
      );

      fireEvent.click(screen.getByRole("button", { expanded: false }));

      expect(
        screen.getByText("Still contains [persen]. Replace it with your real data before sending."),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      expect(await screen.findByRole("button", { name: "Copied ✓" })).toBeInTheDocument();
    } finally {
      localStorage.removeItem("lang");
    }
  });
});

describe("aturan output AI di prompt analyze", () => {
  it("prompt memuat blok aturan teks yang bisa ditempel ke CV", () => {
    expect(ANALYSIS_PROMPT_V4).toContain("--- ATURAN OUTPUT TEKS YANG BISA DITEMPEL KE CV ---");
    expect(ANALYSIS_PROMPT_V4).toContain('placeholder "[angka]"');
    expect(ANALYSIS_PROMPT_V4).toMatch(/statistik tentang HR\/perekrut/);
    expect(ANALYSIS_PROMPT_V4).toMatch(/JANGAN menjanjikan lolos ATS/);
  });
});
