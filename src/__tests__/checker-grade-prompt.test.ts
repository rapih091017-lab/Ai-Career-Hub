import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ANALYSIS_PROMPT_V4 } from "@/lib/ai/prompts/analysis-v4";

describe("tabel GRADE di prompt v4", () => {
  it("prompt memuat ambang grade lengkap", () => {
    // Prompt menyuruh AI ikutin "tabel GRADE", jadi tabelnya wajib ada.
    // Tanpa ini grade yang tampil ke user hanya tebakan model.
    expect(ANALYSIS_PROMPT_V4).toContain("85-100");
    expect(ANALYSIS_PROMPT_V4).toContain("70-84");
    expect(ANALYSIS_PROMPT_V4).toContain("50-69");
    expect(ANALYSIS_PROMPT_V4).toContain("0-49");
  });

  it("setiap ambang disebut dengan huruf grade yang benar", () => {
    const gradeTable = ANALYSIS_PROMPT_V4.match(/GRADE[\s\S]{0,600}/g)?.join("\n") ?? "";
    expect(gradeTable).toMatch(/85-100[^\n]*\bA\b/);
    expect(gradeTable).toMatch(/70-84[^\n]*\bB\b/);
    expect(gradeTable).toMatch(/50-69[^\n]*\bC\b/);
    expect(gradeTable).toMatch(/0-49[^\n]*\bD\b/);
  });

  it("grade wajib konsisten dengan overall_score", () => {
    // Bentuk huruf kapital ikut diterima: aturan di prompt memakai WAJIB
    // untuk penekanan, jadi polanya harus cocok dengan teks yang benar-benar
    // ada di prompt.
    expect(ANALYSIS_PROMPT_V4).toMatch(
      /grade[^\n]*(WAJIB|Wajib|wajib|MUST|must)[^\n]*overall_score/,
    );
  });
});

describe("penanda CV dan JD di prompt v4", () => {
  // Dua sumber kebenaran: template menulis penanda sendiri sebagai literal
  // sementara route dan adapter memakai PROMPT_MARKERS. Kalau literalnya masih
  // ada, mengubah PROMPT_MARKERS hanya memindahkan route dan adapter, tapi
  // template sistem diam-diam memakai header lama.
  it("template menulis penanda lewat PROMPT_MARKERS, bukan literal", () => {
    const source = readFileSync("src/lib/ai/prompts/analysis-v4.ts", "utf8");

    expect(source).toContain("PROMPT_MARKERS.cv");
    expect(source).toContain("PROMPT_MARKERS.jd");
    // Penanda sebagai string literal sudah tidak boleh ditulis manual.
    expect(source).not.toContain("=== CV KANDIDAT ===");
    expect(source).not.toContain("=== JOB DESCRIPTION TARGET ===");
  });

  it("penanda yang muncul di prompt sama dengan yang dicari adapter", () => {
    // Kalau PROMPT_MARKERS berubah, prompt harus ikut berubah bersamanya.
    expect(ANALYSIS_PROMPT_V4).toContain("=== CV KANDIDAT ===");
    expect(ANALYSIS_PROMPT_V4).toContain("=== JOB DESCRIPTION TARGET ===");
  });
});