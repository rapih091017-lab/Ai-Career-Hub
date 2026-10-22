import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toKeywordAnalysis } from "@/lib/checker/analysis-from-full-result";
import { buildChangePack } from "@/lib/checker/copy";
import {
  KeywordEvidenceBadge,
  KeywordExtrasBlock,
  KeywordSourceLine,
} from "@/components/checker/KeywordAnalysisExtras";
import { AnalysisResultSchema } from "@/lib/ai/prompts/schemas";
import type { StoredAnalysisResult } from "@/components/checker/types";

const CV = "Pengalaman sebagai Frontend Developer di PT Maju (2020-2023). Membangun dashboard pakai React.";

/* ═══════════════════════════════════════════════════════════ */
/*  MAPPER                                                     */
/* ═══════════════════════════════════════════════════════════ */

describe("toKeywordAnalysis (mapper prompt 5)", () => {
  it("source: opts route menang, nilai invalid tidak pernah dipakai", () => {
    // Route (deterministik) MENANG atas nilai tersimpan/AI.
    expect(
      toKeywordAnalysis({ matched: [], source: "job_description" }, { source: "role_generic" })?.source,
    ).toBe("role_generic");
    // Tanpa opts: dua nilai enum lolos, selain itu hilang.
    expect(toKeywordAnalysis({ matched: [], source: "role_generic" })?.source).toBe("role_generic");
    expect(toKeywordAnalysis({ matched: [], source: "ngawur" })?.source).toBeUndefined();
    expect(toKeywordAnalysis({ matched: [] })?.source).toBeUndefined();
  });

  it("evidence: level invalid / bukan anggota matched dibuang; excerpt diverifikasi ke CV", () => {
    const result = toKeywordAnalysis(
      {
        matched: ["React", "TypeScript"],
        evidence: [
          { keyword: "React", level: "dibuktikan", excerpt: "Membangun dashboard pakai React" },
          { keyword: "TypeScript", level: "sesat" },
          { keyword: "Vue", level: "dibuktikan" }, // bukan anggota matched
          { keyword: "React", level: "dibuktikan", excerpt: "ngarang di luar CV" },
        ],
      },
      { cvText: CV },
    );
    expect(result?.evidence).toEqual([
      { keyword: "React", level: "dibuktikan", excerpt: "Membangun dashboard pakai React" },
      // excerpt kedua dibuang (bukan potongan CV), itemnya tetap ada tanpa excerpt.
      { keyword: "React", level: "dibuktikan" },
    ]);
    // match_rate_pct tidak diubah caranya: angka AI diteruskan apa adanya.
    expect(result?.match_rate_pct).toBe(0);
    expect(toKeywordAnalysis({ matched: ["x"], match_rate_pct: 42.5 })?.match_rate_pct).toBe(42.5);
  });

  it("placements: item tanpa keyword/where/copy_text/priority invalid dibuang, critical dulu, maks 8", () => {
    const placements = [
      { keyword: "A", priority: "nice", where: "Skills", copy_text: "baris A" },
      { keyword: "B", priority: "critical", where: "Pengalaman > poin 1", copy_text: "baris B", replaces: "teks lama" },
      { keyword: "C", priority: "critical", where: "Skills", copy_text: "" }, // tanpa copy_text
      { keyword: "D", priority: "sedang", where: "Skills", copy_text: "baris D" }, // prioritas invalid
      { keyword: "E", priority: "nice", where: "", copy_text: "baris E" }, // tanpa where
      { keyword: "F", priority: "critical", where: "Skills", copy_text: "baris F" },
      { keyword: "G", priority: "critical", where: "Skills", copy_text: "baris G" },
      { keyword: "H", priority: "critical", where: "Skills", copy_text: "baris H" },
      { keyword: "I", priority: "critical", where: "Skills", copy_text: "baris I" },
      { keyword: "J", priority: "critical", where: "Skills", copy_text: "baris J" },
      { keyword: "K", priority: "critical", where: "Skills", copy_text: "baris K" },
    ];
    const result = toKeywordAnalysis({ matched: [], placements });
    const list = result?.placements ?? [];
    // Urutan: critical (stabil sesuai input) dulu baru nice; dipotong 8.
    expect(list.map((p) => p.keyword)).toEqual(["B", "F", "G", "H", "I", "J", "K", "A"]);
    expect(list.find((p) => p.keyword === "B")?.replaces).toBe("teks lama");
    expect(list.every((p) => p.copy_text && p.where)).toBe(true);
  });

  it("requirements: hanya bila source job_description; status invalid dibuang; maks 12", () => {
    const requirements = [
      { requirement: "Pengalaman 3 tahun", status: "terpenuhi", evidence: "2020-2023" },
      { requirement: "Domisili Jakarta", status: "ragu" },
      { requirement: "", status: "tidak_ada" },
      ...Array.from({ length: 14 }, (_, i) => ({ requirement: `R${i}`, status: "sebagian" })),
    ];
    const jd = toKeywordAnalysis(
      { matched: [], requirements },
      { source: "job_description", cvText: CV },
    );
    expect(jd?.requirements?.[0]).toEqual({
      requirement: "Pengalaman 3 tahun",
      status: "terpenuhi",
      evidence: "2020-2023",
    });
    // Status "ragu" invalid: barisnya gugur seluruhnya (bukan jadi default).
    expect(jd?.requirements?.some((r) => r.requirement === "Domisili Jakarta")).toBe(false);
    expect(jd?.requirements?.some((r) => r.requirement === "")).toBe(false);
    expect(jd?.requirements?.length).toBe(12);

    // Sumber role_generic: requirements dibuang, berapa pun isinya.
    const generic = toKeywordAnalysis({ matched: [], requirements }, { source: "role_generic" });
    expect(generic?.requirements).toBeUndefined();
    // Baris lama tanpa source: juga tidak ada requirements.
    expect(toKeywordAnalysis({ matched: [], requirements })?.requirements).toBeUndefined();
  });
});

describe("source tidak pernah dari output AI (schema)", () => {
  it("zod membuang key `source` yang disisipkan AI di keyword_analysis", () => {
    const parsed = AnalysisResultSchema.parse({
      overall_score: 60,
      grade: "C",
      verdict: "Cukup.",
      breakdown: {},
      keyword_analysis: {
        matched: ["React"],
        missing_critical: [],
        missing_nice_to_have: [],
        synonym_suggestions: [],
        match_rate_pct: 40,
        source: "job_description", // disisipkan AI, harus hilang
      },
      missing_sections: [],
      section_order_recommendation: "",
    });
    expect(parsed.keyword_analysis).not.toHaveProperty("source");
  });
});

describe("route analyze menentukan source secara deterministik", () => {
  it("source berasal dari jd, bukan dari objek AI", () => {
    const src = readFileSync(join(process.cwd(), "src/app/api/checker/analyze/route.ts"), "utf8");
    expect(src).toContain('source: jd?.trim() ? "job_description" : "role_generic"');
    expect(src).not.toContain("source: aiAnalysis");
    expect(src).not.toContain("keyword_analysis.source");
  });
});

/* ═══════════════════════════════════════════════════════════ */
/*  buildChangePack: PENYESUAIAN KATA KUNCI + dedupe           */
/* ═══════════════════════════════════════════════════════════ */

function baseAnalysis(overrides: Partial<StoredAnalysisResult> = {}): StoredAnalysisResult {
  return {
    id: "kw1",
    scores: { overall: 60, keywordGap: 50, contextRelevance: 60, atsRules: 55 },
    aiFeedback: { keywordGap: "", contextRelevance: "", atsRules: "", summary: "" },
    summary: "",
    ...overrides,
  } as StoredAnalysisResult;
}

describe("buildChangePack blok PENYESUAIAN KATA KUNCI", () => {
  const bulletOriginal = "Membangun fitur login menggunakan React";
  const bulletRewrite = "**Merancang** autentikasi login dengan React";

  it("dedupe: placement yang replaces-nya sama dengan original_text tidak dihitung dua kali", () => {
    const pack = buildChangePack(
      baseAnalysis({
        bulletReview: [
          {
            section: "experience",
            original_text: bulletOriginal,
            issues: [],
            suggested_rewrite: bulletRewrite,
            priority: "High",
          },
        ],
        keywordAnalysis: {
          matched: [],
          missing_critical: [],
          missing_nice_to_have: [],
          synonym_suggestions: [],
          match_rate_pct: 40,
          placements: [
            // Versi placement dari poin yang sama: TIDAK ikut, karena
            // suggested_rewrite-nya sudah ada di blok PENGALAMAN.
            { keyword: "React", priority: "critical", where: "Pengalaman > poin 1", replaces: bulletOriginal, copy_text: "Versi placement yang tidak boleh dobel" },
            // Replaces sama dengan placement pertama: cukup sekali.
            { keyword: "ReactJS", priority: "critical", where: "Skills", replaces: bulletOriginal, copy_text: "Versi placement kedua yang juga gugur" },
            // Baris baru tanpa replaces: selalu ikut.
            { keyword: "TypeScript", priority: "nice", where: "Skills", copy_text: "TypeScript untuk build tools internal" },
          ],
        },
      }),
    );

    expect(pack).toContain("PENYESUAIAN KATA KUNCI");
    expect(pack).toContain("• TypeScript untuk build tools internal");
    expect(pack).not.toContain("Versi placement yang tidak boleh dobel");
    expect(pack).not.toContain("Versi placement kedua yang juga gugur");
    // Versi suggested_rewrite tampil tepat satu kali.
    expect(pack.match(/Merancang autentikasi login dengan React/g)).toHaveLength(1);
    // Tidak ada duplikasi poin secara keseluruhan.
    const lines = pack.split("\n").filter((line) => line.startsWith("• "));
    expect(new Set(lines).size).toBe(lines.length);
    expect(pack).not.toContain("**");
  });

  it("tanpa placements, bloknya tidak ada dan pack lama tidak berubah", () => {
    const pack = buildChangePack(
      baseAnalysis({
        bulletReview: [
          {
            section: "experience",
            original_text: "Naik 20%",
            issues: [],
            suggested_rewrite: "Meningkatkan konversi 20%",
            priority: "High",
          },
        ],
      }),
    );
    expect(pack).not.toContain("PENYESUAIAN KATA KUNCI");
    expect(pack).toContain("• Meningkatkan konversi 20%");
  });
});

/* ═══════════════════════════════════════════════════════════ */
/*  UI extras                                                  */
/* ═══════════════════════════════════════════════════════════ */

const KEYWORD_ANALYSIS = {
  matched: ["React", "TypeScript"],
  missing_critical: ["Docker"],
  missing_nice_to_have: [],
  synonym_suggestions: [],
  match_rate_pct: 42,
  source: "job_description" as const,
  evidence: [
    { keyword: "React", level: "dibuktikan" as const, excerpt: "Membangun dashboard pakai React" },
    { keyword: "TypeScript", level: "hanya_daftar_skill" as const },
  ],
  placements: [
    {
      keyword: "Docker",
      priority: "critical" as const,
      where: "Skills",
      copy_text: "Docker untuk deployment layanan internal",
    },
  ],
  requirements: [
    { requirement: "Pengalaman 3 tahun", status: "terpenuhi" as const, evidence: "2020-2023" },
    { requirement: "Bersedia ditempatkan di Jakarta", status: "tidak_ada" as const, tip: "Konfirmasi di sesi wawancara" },
  ],
};

describe("UI extras keyword", () => {
  it("chip sumber + keterangan muncul sesuai source, hilang untuk baris lama", () => {
    const { rerender } = render(<KeywordSourceLine analysis={KEYWORD_ANALYSIS} />);
    expect(screen.getByText("Dihitung dari lowongan yang kamu tempel")).toBeInTheDocument();
    expect(screen.getByText("Kecocokan kata kunci, bukan skor ATS resmi")).toBeInTheDocument();

    rerender(<KeywordSourceLine analysis={{ ...KEYWORD_ANALYSIS, source: "role_generic" }} />);
    expect(screen.getByText("Dihitung dari kebutuhan umum role ini")).toBeInTheDocument();
    expect(screen.queryByText("Dihitung dari lowongan yang kamu tempel")).toBeNull();

    // Baris lama: tanpa source, tidak ada elemen baru sama sekali.
    rerender(<KeywordSourceLine analysis={{ ...KEYWORD_ANALYSIS, source: undefined }} />);
    expect(screen.queryByText(/Dihitung dari/)).toBeNull();
    expect(screen.queryByText(/bukan skor ATS resmi/)).toBeNull();
    expect(document.body.textContent).toBe("");
  });

  it("badge bukti per keyword matched; tanpa evidence tidak ada badge", () => {
    const { rerender } = render(
      <span>
        <KeywordEvidenceBadge analysis={KEYWORD_ANALYSIS} keyword="React" />
        <KeywordEvidenceBadge analysis={KEYWORD_ANALYSIS} keyword="TypeScript" />
      </span>,
    );
    expect(screen.getByText("Terbukti di pengalaman")).toBeInTheDocument();
    expect(screen.getByText("Hanya daftar skill")).toBeInTheDocument();

    rerender(<span><KeywordEvidenceBadge analysis={{ ...KEYWORD_ANALYSIS, evidence: undefined }} keyword="React" /></span>);
    expect(screen.queryByText(/Terbukti di pengalaman/)).toBeNull();
  });

  it("kartu penempatan: Ganti di, CopyButton, catatan statis; tabel requirements tampil", () => {
    render(<KeywordExtrasBlock analysis={KEYWORD_ANALYSIS} />);
    expect(screen.getByText("Penempatan untuk keyword yang kurang")).toBeInTheDocument();
    expect(screen.getByText("Tambahkan hanya jika benar-benar kamu kuasai")).toBeInTheDocument();
    expect(screen.getByText("Ganti di:").nextSibling?.textContent).toBe("Skills");
    expect(screen.getByText("Docker untuk deployment layanan internal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salin revisi" })).toBeInTheDocument();

    expect(screen.getByText("Syarat dari lowongan")).toBeInTheDocument();
    expect(screen.getByText("Pengalaman 3 tahun")).toBeInTheDocument();
    expect(screen.getByText("Terpenuhi")).toBeInTheDocument();
    expect(screen.getByText("Tidak ada")).toBeInTheDocument();
    expect(screen.getByText("Konfirmasi di sesi wawancara")).toBeInTheDocument();
  });

  it("requirements tidak tampil bila source bukan job_description; blok null bila kosong", () => {
    const { rerender } = render(
      <KeywordExtrasBlock analysis={{ ...KEYWORD_ANALYSIS, source: "role_generic" }} />,
    );
    expect(screen.queryByText("Syarat dari lowongan")).toBeNull();
    expect(screen.getByText("Penempatan untuk keyword yang kurang")).toBeInTheDocument();

    rerender(<KeywordExtrasBlock analysis={{ matched: [], missing_critical: [], missing_nice_to_have: [], synonym_suggestions: [], match_rate_pct: 0 }} />);
    expect(document.body.textContent).toBe("");
  });
});
