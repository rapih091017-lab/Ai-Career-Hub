import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  analysisFromFullResult,
  toQuickSummary,
} from "@/lib/checker/analysis-from-full-result";
import { QuickSummaryCard } from "@/components/checker/QuickSummaryCard";
import { buildChangePack, copyToClipboard, sanitizeCopyText } from "@/lib/checker/copy";
import type { QuickFix, QuickSummary, StoredAnalysisResult } from "@/components/checker/types";

// copyToClipboard dipalsukan supaya bergantung pada navigator.clipboard milik
// jsdom; modul aslinya (termasuk buildChangePack) tetap dipakai apa adanya.
vi.mock("@/lib/checker/copy", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/checker/copy")>();
  return { ...actual, copyToClipboard: vi.fn(async () => true) };
});

function baseAnalysis(overrides: Partial<StoredAnalysisResult> = {}): StoredAnalysisResult {
  return {
    id: "r1",
    scores: { overall: 62, keywordGap: 50, contextRelevance: 60, atsRules: 55 },
    aiFeedback: { keywordGap: "", contextRelevance: "", atsRules: "", summary: "Fondasi solid." },
    summary: "Fondasi solid.",
    grade: "C",
    ...overrides,
  } as StoredAnalysisResult;
}

beforeEach(() => {
  vi.mocked(copyToClipboard).mockClear();
});

/* ═══════════════════════════════════════════════════════════ */
/*  MAPPER: toQuickSummary                                     */
/* ═══════════════════════════════════════════════════════════ */

describe("toQuickSummary (mapper)", () => {
  it("null untuk input tanpa ringkasan (baris lama) dan verdict+fix sama-sama kosong", () => {
    expect(toQuickSummary(undefined)).toBeNull();
    expect(toQuickSummary(null)).toBeNull();
    expect(toQuickSummary("bukan-objek")).toBeNull();
    expect(toQuickSummary({})).toBeNull();
    expect(toQuickSummary({ verdict: "  ", top_fixes: [], top_strengths: ["tetap"] })).toBeNull();
  });

  it("baris lama lewat analysisFromFullResult tidak punya quickSummary", () => {
    const mapped = analysisFromFullResult("abc", {
      scores: { overall: 70 },
      aiFeedback: { summary: "Lumayan" },
      fullResult: { grade: "B", bulletReview: [] },
    });
    expect(mapped.quickSummary).toBeNull();
  });

  it("verdict ada tapi tanpa fix tetap menghasilkan ringkasan", () => {
    const qs = toQuickSummary({ verdict: "CV sudah kuat.", top_fixes: [] });
    expect(qs).not.toBeNull();
    expect(qs?.verdict).toBe("CV sudah kuat.");
    expect(qs?.top_fixes).toEqual([]);
  });

  it("membuang fix dengan target_section/impact invalid atau title kosong", () => {
    const qs = toQuickSummary({
      verdict: "V",
      top_fixes: [
        { id: "bad-target", title: "X", target_section: "random", impact: "Tinggi" },
        { id: "bad-impact", title: "X", target_section: "hr", impact: "sedang" },
        { id: "no-title", title: "   ", target_section: "hr", impact: "Tinggi" },
        "string-bukan-objek",
        { id: "ok", title: "Fix valid", target_section: "keyword", impact: "Rendah" },
      ],
    });
    expect(qs?.top_fixes.map((f) => f.id)).toEqual(["ok"]);
  });

  it("est_minutes dibulatkan dan dibatasi 1–60; non-numerik membuat field hilang", () => {
    const qs = toQuickSummary({
      verdict: "V",
      top_fixes: [
        { id: "bulat", title: "A", target_section: "hr", impact: "Tinggi", est_minutes: 7.4 },
        { id: "min", title: "B", target_section: "hr", impact: "Tinggi", est_minutes: 0 },
        { id: "max", title: "C", target_section: "hr", impact: "Tinggi", est_minutes: 90 },
        { id: "teks", title: "D", target_section: "hr", impact: "Tinggi", est_minutes: "30" },
      ],
    });
    const fix = (id: string): QuickFix => qs!.top_fixes.find((f) => f.id === id)!;
    expect(fix("bulat").est_minutes).toBe(7);
    expect(fix("min").est_minutes).toBe(1);
    expect(fix("max").est_minutes).toBe(60);
    expect(fix("teks")).toBeDefined();
    expect(fix("teks")).not.toHaveProperty("est_minutes");
  });

  it("urutan deterministik: Tinggi > Sedang > Rendah, lalu est_minutes naik, stabil", () => {
    const input = {
      verdict: "V",
      top_fixes: [
        { id: "sedang", title: "A", target_section: "skor", impact: "Sedang", est_minutes: 10 },
        { id: "tinggi-besar", title: "B", target_section: "hr", impact: "Tinggi", est_minutes: 30 },
        { id: "tinggi-kecil", title: "C", target_section: "keyword", impact: "Tinggi", est_minutes: 10 },
        { id: "rendah-1", title: "D", target_section: "checklist", impact: "Rendah" },
        { id: "rendah-2", title: "E", target_section: "checklist", impact: "Rendah" },
      ],
    };
    const order = toQuickSummary(input)!.top_fixes.map((f) => f.id);
    // Tie antara dua "Rendah" tanpa menit dipertahankan sesuai urutan input (sort stabil).
    expect(order).toEqual(["tinggi-kecil", "tinggi-besar", "sedang", "rendah-1", "rendah-2"]);
    // Input sama → output sama.
    expect(toQuickSummary(input)!.top_fixes.map((f) => f.id)).toEqual(order);
  });

  it("membatasi maksimal 5 fix dan 3 strengths", () => {
    const qs = toQuickSummary({
      verdict: "V",
      top_strengths: ["satu", "dua", "tiga", "empat", "lima"],
      top_fixes: Array.from({ length: 7 }, (_, i) => ({
        id: `f${i}`,
        title: `Fix ${i}`,
        target_section: "hr",
        impact: "Rendah",
        est_minutes: i + 1,
      })),
    });
    expect(qs?.top_fixes).toHaveLength(5);
    // Karena dipotong setelah sort, yang tersisa adalah menit terkecil.
    expect(qs?.top_fixes.map((f) => f.id)).toEqual(["f0", "f1", "f2", "f3", "f4"]);
    expect(qs?.top_strengths).toEqual(["satu", "dua", "tiga"]);
  });

  it("idempoten: hasil normalisasi tidak berubah saat diproses ulang", () => {
    const messy = {
      verdict: "  Sudah bersih.  ",
      top_strengths: ["a", "b", "c", "d"],
      top_fixes: [
        { id: "1", title: "A", target_section: "hr", impact: "Tinggi", est_minutes: 90 },
        { id: "2", title: "", target_section: "salah", impact: "X" },
        { id: "3", title: "C", target_section: "skor", impact: "Rendah" },
      ],
    };
    const once = toQuickSummary(messy);
    expect(once?.verdict).toBe("Sudah bersih.");
    expect(toQuickSummary(once)).toEqual(once);
  });
});

/* ═══════════════════════════════════════════════════════════ */
/*  KARTU: QuickSummaryCard                                    */
/* ═══════════════════════════════════════════════════════════ */

const SUMMARY: QuickSummary = {
  verdict: "Fondasi solid, dua hal kecil menahan skor.",
  top_strengths: ["React sesuai stack JD", "Pendidikan relevan"],
  top_fixes: [
    {
      id: "q1",
      title: "Tambah TypeScript di Skills",
      target_section: "keyword",
      impact: "Tinggi",
      est_minutes: 5,
      copy_text: "TypeScript | CI/CD",
    },
    {
      id: "q2",
      title: "Kuantifikasi bullet experience",
      target_section: "skor",
      impact: "Sedang",
    },
  ],
};

describe("QuickSummaryCard", () => {
  it("menampilkan verdict, kekuatan, dan fix lengkap dengan chip dampak dan menit", () => {
    render(<QuickSummaryCard analysis={baseAnalysis()} summary={SUMMARY} />);
    expect(screen.getByText("Ringkasan 10 detik")).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.verdict)).toBeInTheDocument();
    expect(screen.getByText("React sesuai stack JD")).toBeInTheDocument();
    expect(screen.getByText("Tambah TypeScript di Skills")).toBeInTheDocument();
    expect(screen.getByText("Tinggi")).toBeInTheDocument();
    expect(screen.getByText("±5 menit")).toBeInTheDocument();
    // Fix tanpa est_minutes tampil tanpa baris menit.
    expect(screen.getAllByText(/±\d+ menit/)).toHaveLength(1);
  });

  it("tombol \"Lihat\" meng-scroll ke anchor section yang benar", () => {
    const scrolled: string[] = [];
    Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
      scrolled.push((this as HTMLElement).id);
    });
    render(
      <>
        <QuickSummaryCard analysis={baseAnalysis()} summary={SUMMARY} />
        <div id="section-hr" />
        <div id="section-skor" />
        <div id="section-keyword" />
        <div id="section-checklist" />
      </>,
    );
    const lihatButtons = screen.getAllByRole("button", { name: "Lihat" });
    expect(lihatButtons).toHaveLength(2);
    // q1 (keyword) lalu q2 (skor), sesuai urutan array top_fixes.
    fireEvent.click(lihatButtons[0]);
    fireEvent.click(lihatButtons[1]);
    expect(scrolled).toEqual(["section-keyword", "section-skor"]);
  });

  it("\"Salin semua perubahan\" menyalin teks polos tanpa ** atau #", async () => {
    const analysis = baseAnalysis({
      bulletReview: [
        {
          section: "experience",
          original_text: "Membangun fitur login",
          issues: ["tanpa metrik"],
          suggested_rewrite: "**Merancang** sistem autentikasi",
          priority: "High",
        },
      ],
    });
    render(<QuickSummaryCard analysis={analysis} summary={SUMMARY} />);
    fireEvent.click(screen.getByRole("button", { name: "Salin semua perubahan" }));
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledTimes(1));
    const text = vi.mocked(copyToClipboard).mock.calls[0][0];
    // CopyButton meny-sanitasi pack sebelum disalin (bullet "•" dibuang) —
    // hasilnya teks polos siap tempel.
    expect(text).toBe(sanitizeCopyText(buildChangePack(analysis)));
    expect(text).toContain("Merancang sistem autentikasi");
    expect(text).not.toContain("**");
    expect(text).not.toContain("#");
  });

  it("tombol salin nonaktif + keterangan saat tidak ada perubahan yang bisa disalin", () => {
    render(
      <QuickSummaryCard
        analysis={baseAnalysis({ bulletReview: [] })}
        summary={{ verdict: "V", top_strengths: [], top_fixes: [] }}
      />,
    );
    expect(screen.getByRole("button", { name: /Salin semua perubahan/ })).toBeDisabled();
    expect(screen.getByText("Belum ada perubahan yang bisa disalin")).toBeInTheDocument();
    expect(copyToClipboard).not.toHaveBeenCalled();
  });
});
