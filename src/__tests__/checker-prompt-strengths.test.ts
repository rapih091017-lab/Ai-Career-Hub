import { describe, expect, it } from "vitest";
import { ANALYSIS_PROMPT_V4 } from "@/lib/ai/prompts/analysis-v4";

/**
 * Panel Sisi HR menampilkan kutipan verbatim CV di kolom "Yang bikin saya
 * lanjut baca" hanya kalau ats_prediction.strengths berbentuk objek
 * { text, source_excerpt }. Zod tetap menerima string polos untuk hasil lama,
 * tapi prompt adalah sumber bentuk untuk hasil baru — kalau prompt balik ke
 * string[], produksi berhenti mengirim kutipan dan kolom itu kosong terus.
 */
describe("bentuk ats_prediction.strengths di prompt v4", () => {
  it("blok output memakai objek teks + source_excerpt, bukan string[]", () => {
    const atsBlock = ANALYSIS_PROMPT_V4.match(/"ats_prediction": \{[\s\S]*?\n {2}\}/)?.[0];
    expect(atsBlock, "blok ats_prediction di SKEMA OUTPUT tidak ditemukan").toBeDefined();
    expect(atsBlock).toContain('"strengths": [{ "text": string, "source_excerpt": string | null }]');
    expect(atsBlock).not.toContain("string[]");
  });

  it("contoh kerja memakai bentuk objek berikut source_excerpt", () => {
    const example = ANALYSIS_PROMPT_V4.slice(ANALYSIS_PROMPT_V4.indexOf("CONTOH"));
    expect(example).toMatch(/"strengths": \[\s*\{\s*"text":/);
  });

  it("aturan verbatim source_excerpt mencakup strengths", () => {
    // Batasi ke blok ATURAN KERAS: blok guardrail di atas juga punya nomor 6
    // dan aturan #4 di dalamnya menyebut "ROLE CATEGORY", jadi anchor harus
    // judul section-nya, bukan sekadar kata kuncinya.
    const start = ANALYSIS_PROMPT_V4.indexOf("ATURAN KERAS");
    const end = ANALYSIS_PROMPT_V4.indexOf("--- ROLE CATEGORY: {{ROLE_CATEGORY}}");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const hardRules = ANALYSIS_PROMPT_V4.slice(start, end);
    const rule = hardRules.match(/6\.[\s\S]*?menebak\./)?.[0];
    expect(rule, "aturan verbatim source_excerpt tidak ditemukan").toBeDefined();
    expect(rule).toContain("strengths");
    expect(rule).toContain("substring");
  });
});
