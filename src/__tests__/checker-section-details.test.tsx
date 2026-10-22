import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analysisFromFullResult, toMissingSections } from "@/lib/checker/analysis-from-full-result";
import { buildChangePack, buildSectionChangePack, copyToClipboard } from "@/lib/checker/copy";
import { SectionScoreCard } from "@/components/checker/SectionScoreCard";
import { MissingSectionsCard } from "@/components/checker/MissingSectionsCard";
import { LanguageProvider } from "@/lib/i18n";
import type { StoredAnalysisResult } from "@/components/checker/types";

// copyToClipboard dipalsukan; buildChangePack/buildSectionChangePack tetap asli.
vi.mock("@/lib/checker/copy", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/checker/copy")>();
  return { ...actual, copyToClipboard: vi.fn(async () => true) };
});

beforeEach(() => {
  vi.mocked(copyToClipboard).mockClear();
});

afterEach(() => {
  localStorage.removeItem("lang");
});

/* ═══════════════════════════════════════════════════════════ */
/*  MAPPER                                                     */
/* ═══════════════════════════════════════════════════════════ */

describe("mapper v5 kartu section", () => {
  it("toMissingSections menormalkan string lama dan membuang entri tanpa nama", () => {
    expect(toMissingSections(["Sertifikasi", "  ", 42])).toEqual([{ name: "Sertifikasi" }]);
    expect(
      toMissingSections([
        { name: "Portfolio", why_it_matters: "HR mengecek karya", template_copy_text: "Portfolio: link" },
        { name: "  ", why_it_matters: "tanpa nama" },
        "Link GitHub",
      ]),
    ).toEqual([
      { name: "Portfolio", why_it_matters: "HR mengecek karya", template_copy_text: "Portfolio: link" },
      { name: "Link GitHub" },
    ]);
    expect(toMissingSections("bukan-array")).toEqual([]);
  });

  it("score_reason/top_fix dan field khusus section diteruskan; top_fix tanpa judul dibuang", () => {
    const mapped = analysisFromFullResult("v5", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: {
          summary: {
            score: 55,
            issues: [],
            suggestions: [],
            score_reason: "Belum menyebut TypeScript",
            top_fix: { title: "Tambah TypeScript", copy_text: "TypeScript | Next.js" },
            has_skills_and_achievement: true,
            rewrite_copy_text: "Frontend Engineer dengan 4 tahun pengalaman.",
          },
          experience: { score: 60, issues: [], suggestions: [], bullets_total: 5, bullets_without_result: 2 },
          education: { score: 80, relevance: "S1", suggestions: [], copy_text: "S1 Ilmu Komputer — IPK 3.6" },
        },
      },
    });
    expect(mapped.breakdown?.summary?.score_reason).toBe("Belum menyebut TypeScript");
    expect(mapped.breakdown?.summary?.top_fix).toEqual({ title: "Tambah TypeScript", copy_text: "TypeScript | Next.js" });
    expect(mapped.breakdown?.summary?.has_skills_and_achievement).toBe(true);
    expect(mapped.breakdown?.experience?.bullets_total).toBe(5);
    expect(mapped.breakdown?.experience?.bullets_without_result).toBe(2);
    expect(mapped.breakdown?.education?.copy_text).toBe("S1 Ilmu Komputer — IPK 3.6");

    const noTitle = analysisFromFullResult("v5b", {
      scores: {},
      aiFeedback: {},
      fullResult: { breakdown: { summary: { score: 40, issues: [], suggestions: [], top_fix: { title: "   " } } } },
    });
    expect(noTitle.breakdown?.summary?.top_fix).toBeUndefined();
  });

  it("pasangan bullets tidak valid (X > Y atau salah satu hilang) dibuang", () => {
    const mapped = analysisFromFullResult("bul", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: {
          experience: { score: 60, issues: [], suggestions: [], bullets_total: 3, bullets_without_result: 7 },
        },
      },
    });
    expect(mapped.breakdown?.experience?.bullets_total).toBeUndefined();
    expect(mapped.breakdown?.experience?.bullets_without_result).toBeUndefined();
  });

  it("grouped_skills_copy_text yang bocor missing_skills dibuang seluruhnya", () => {
    const leak = analysisFromFullResult("skills-leak", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: {
          skills: {
            score: 70,
            issues: [],
            suggestions: [],
            missing_skills: ["Docker", "GraphQL"],
            unproven_skills: ["Figma"],
            grouped_skills_copy_text: "Frontend: React, Next.js · DevOps: Docker",
          },
        },
      },
    });
    // AC: grouped tidak boleh memuat satu pun missing_skills — teks dibuang utuh.
    expect(leak.breakdown?.skills?.grouped_skills_copy_text).toBeUndefined();
    expect(leak.breakdown?.skills?.missing_skills).toEqual(["Docker", "GraphQL"]);
    expect(leak.breakdown?.skills?.unproven_skills).toEqual(["Figma"]);

    const clean = analysisFromFullResult("skills-ok", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: {
          skills: {
            score: 70,
            issues: [],
            suggestions: [],
            missing_skills: ["Docker"],
            grouped_skills_copy_text: "React · Next.js · TypeScript",
          },
        },
      },
    });
    expect(clean.breakdown?.skills?.grouped_skills_copy_text).toBe("React · Next.js · TypeScript");
  });

  it("checks: status invalid dibuang, 'tidak_dapat_dinilai' tetap tersimpan", () => {
    const mapped = analysisFromFullResult("checks", {
      scores: {},
      aiFeedback: {},
      fullResult: {
        breakdown: {
          format_ats: {
            score: 45,
            issues: [],
            tips: [],
            checks: [
              { id: "chron", label: "Urutan kronologis", status: "perlu_perbaikan" },
              { id: "pages", label: "Panjang halaman", status: "tidak_dapat_dinilai", note: "Jumlah halaman tidak tersedia" },
              { id: "bad", label: "Status ngawur", status: "mungkin" },
              { id: "", label: "Tanpa id", status: "ok" },
            ],
          },
        },
      },
    });
    expect(mapped.breakdown?.format_ats?.checks).toEqual([
      { id: "chron", label: "Urutan kronologis", status: "perlu_perbaikan" },
      { id: "pages", label: "Panjang halaman", status: "tidak_dapat_dinilai", note: "Jumlah halaman tidak tersedia" },
    ]);
  });
});

/* ═══════════════════════════════════════════════════════════ */
/*  buildChangePack + pack per section                         */
/* ═══════════════════════════════════════════════════════════ */

const ANALYSIS: StoredAnalysisResult = {
  id: "a1",
  scores: { overall: 62, keywordGap: 50, contextRelevance: 60, atsRules: 55 },
  aiFeedback: { keywordGap: "", contextRelevance: "", atsRules: "", summary: "" },
  summary: "",
  weightsApplied: {
    role_category: "tech",
    summary_weight: 0.2,
    experience_weight: 0.35,
    skills_weight: 0.25,
    education_weight: 0.1,
    format_ats_weight: 0.1,
  },
  breakdown: {
    summary: {
      score: 55,
      issues: [],
      suggestions: [],
      score_reason: "Summary belum menyebut TypeScript",
      top_fix: { title: "Tambah TypeScript di awal", copy_text: "TypeScript | Next.js" },
      has_skills_and_achievement: true,
      rewrite_copy_text: "Frontend Engineer dengan **4 tahun** pengalaman membangun aplikasi web.",
    },
    experience: {
      score: 60,
      issues: [],
      suggestions: [],
      bullets_total: 5,
      bullets_without_result: 2,
      top_fix: { title: "Kuantifikasi bullet pertama" },
    },
    skills: {
      score: 70,
      issues: [],
      suggestions: [],
      missing_skills: ["Docker"],
      unproven_skills: ["Figma"],
      grouped_skills_copy_text: "Frontend: React, Next.js, TypeScript",
      score_reason: "Belum ada bukti pakai Figma di pengalaman",
    },
    education: { score: 80, relevance: "S1 Ilmu Komputer", suggestions: [], copy_text: "S1 Ilmu Komputer — IPK 3.6" },
    format_ats: {
      score: 45,
      issues: [],
      tips: [],
      score_reason: "Urutan tanggal belum konsisten",
      top_fix: { title: "Balik urutan pengalaman terbaru ke atas", copy_text: "2022 - sekarang" },
      checks: [
        { id: "chron", label: "Urutan kronologis", status: "perlu_perbaikan" },
        { id: "lang", label: "Konsistensi bahasa", status: "ok" },
        { id: "pages", label: "Panjang halaman", status: "tidak_dapat_dinilai", note: "Jumlah halaman tidak tersedia" },
      ],
    },
  },
  bulletReview: [
    {
      section: "experience",
      original_text: "Membangun fitur login",
      issues: [],
      suggested_rewrite: "**Merancang** autentikasi end-to-end",
      priority: "High",
    },
  ],
  missingSections: [
    { name: "Sertifikasi", why_it_matters: "ATS sering mencari", template_copy_text: "Sertifikasi — AWS Cloud Practitioner (2024)" },
    { name: "Portfolio Tanpa Template" },
  ],
};

describe("buildChangePack v5", () => {
  it("menambah blok RINGKASAN PROFIL, SKILLS, PENDIDIKAN, dan SECTION TAMBAHAN", () => {
    const pack = buildChangePack(ANALYSIS);
    expect(pack).toContain("RINGKASAN PROFIL");
    expect(pack).toContain("• Frontend Engineer dengan 4 tahun pengalaman membangun aplikasi web.");
    expect(pack).toContain("SKILLS");
    expect(pack).toContain("• Frontend: React, Next.js, TypeScript");
    expect(pack).toContain("PENDIDIKAN");
    expect(pack).toContain("S1 Ilmu Komputer — IPK 3.6");
    expect(pack).toContain("SECTION TAMBAHAN");
    expect(pack).toContain("• Sertifikasi — AWS Cloud Practitioner (2024)");
    // Teks polos.
    expect(pack).not.toContain("**");
    expect(pack).not.toContain("#");
  });

  it("tanpa teks baru, pack lama tidak berubah", () => {
    const pack = buildChangePack({ ...ANALYSIS, breakdown: null, missingSections: [] });
    expect(pack).not.toContain("RINGKASAN PROFIL");
    expect(pack).toContain("• Merancang autentikasi end-to-end");
  });
});

describe("buildSectionChangePack", () => {
  it("mengambil teks khusus section yang bersangkutan", () => {
    expect(buildSectionChangePack("summary", ANALYSIS)).toBe(
      ["• Frontend Engineer dengan 4 tahun pengalaman membangun aplikasi web.", "• TypeScript | Next.js"].join("\n"),
    );
    expect(buildSectionChangePack("experience", ANALYSIS)).toContain("Merancang autentikasi end-to-end");
    expect(buildSectionChangePack("education", ANALYSIS)).toContain("IPK 3.6");
    expect(buildSectionChangePack("format_ats", ANALYSIS)).toBe("• 2022 - sekarang");
    expect(buildSectionChangePack("skills", ANALYSIS)).toContain("React, Next.js, TypeScript");
  });

  it("mengembalikan '' kalau section tidak punya teks salin", () => {
    expect(
      buildSectionChangePack("format_ats", { ...ANALYSIS, breakdown: { ...ANALYSIS.breakdown, format_ats: { score: 45, issues: [], tips: [] } } }),
    ).toBe("");
  });
});

/* ═══════════════════════════════════════════════════════════ */
/*  UI: SectionScoreCard + MissingSectionsCard                 */
/* ═══════════════════════════════════════════════════════════ */

function renderCard(props: Partial<ComponentProps<typeof SectionScoreCard>> = {}) {
  return render(
    <LanguageProvider>
      <SectionScoreCard title="Summary" score={55} issues={[]} suggestions={[]} delay={0} {...props} />
    </LanguageProvider>,
  );
}

describe("SectionScoreCard v5", () => {
  it("menampilkan alasan skor, bobot, top_fix, dan salin per section saat dibuka", () => {
    renderCard({ sectionKey: "summary", analysis: ANALYSIS });
    fireEvent.click(screen.getByRole("button", { name: /Summary/ }));

    expect(screen.getByText("Kenapa skor ini:")).toBeInTheDocument();
    expect(screen.getByText("Summary belum menyebut TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Bobot skor 20%")).toBeInTheDocument();
    expect(screen.getByText("Memuat keahlian dan pencapaian")).toBeInTheDocument();
    expect(screen.getByText("Siap salin: rewrite summary")).toBeInTheDocument();
    expect(screen.getByText("Perbaikan terbesar")).toBeInTheDocument();
    expect(screen.getByText("Tambah TypeScript di awal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salin perbaikan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salin semua perubahan section ini" })).toBeInTheDocument();
  });

  it("tanpa bobot tidak ada caption (larangan '0% bobot palsu')", () => {
    renderCard({
      sectionKey: "summary",
      analysis: { ...ANALYSIS, weightsApplied: null } as StoredAnalysisResult,
    });
    fireEvent.click(screen.getByRole("button", { name: /Summary/ }));
    expect(screen.queryByText(/Bobot skor/)).toBeNull();
  });

  it("baris lama (tanpa sectionKey/analysis) tampil seperti sebelumnya", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /Summary/ }));
    expect(screen.queryByText(/Kenapa skor ini/)).toBeNull();
    expect(screen.queryByText(/Bobot skor/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Salin semua perubahan section ini" })).toBeNull();
    expect(screen.getByText("Tidak ada catatan tambahan.")).toBeInTheDocument();
  });

  it("menghitung X dari Y poin hanya bila keduanya valid", () => {
    renderCard({ title: "Experience", sectionKey: "experience", analysis: ANALYSIS, issues: [] });
    fireEvent.click(screen.getByRole("button", { name: /Experience/ }));
    expect(screen.getByText("2 dari 5 poin belum menyebut hasil")).toBeInTheDocument();
  });

  it("daftar checks tampil dengan label status, termasuk 'tidak dapat dinilai'", () => {
    renderCard({ title: "Format ATS", sectionKey: "format_ats", analysis: ANALYSIS });
    fireEvent.click(screen.getByRole("button", { name: /Format ATS/ }));
    expect(screen.getByText("Cek format ATS")).toBeInTheDocument();
    expect(screen.getByText("Perlu perbaikan")).toBeInTheDocument();
    expect(screen.getByText("Tidak dapat dinilai")).toBeInTheDocument();
    expect(screen.getByText("Jumlah halaman tidak tersedia")).toBeInTheDocument();
  });
});

describe("MissingSectionsCard", () => {
  it("entri objek mendapat tombol salin template; entri { name } saja tidak", () => {
    render(
      <LanguageProvider>
        <MissingSectionsCard items={ANALYSIS.missingSections} />
      </LanguageProvider>,
    );
    expect(screen.getByText("Section yang belum ada")).toBeInTheDocument();
    expect(screen.getByText("Sertifikasi")).toBeInTheDocument();
    expect(screen.getByText("ATS sering mencari")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salin template" })).toBeInTheDocument();
    expect(screen.getByText("Portfolio Tanpa Template")).toBeInTheDocument();
  });

  it("tanpa item, kartu tidak dirender sama sekali", () => {
    const { container } = render(
      <LanguageProvider>
        <MissingSectionsCard items={[]} />
      </LanguageProvider>,
    );
    expect(container.innerHTML).toBe("");
    expect(screen.queryByText("Section yang belum ada")).toBeNull();
  });
});
