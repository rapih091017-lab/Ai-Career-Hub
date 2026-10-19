import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { analyzeFailureMessage } from "@/lib/checker/analyze-failure";

/**
 * Jalur kegagalan analisis.
 *
 * Dulu ketika panggilan AI gagal setelah semua percobaan, route tetap
 * mengembalikan 200 lalu menyimpan baris dengan skor hasil formula cadangan
 * (keyword match + 50/50/70/70). Pengguna melihat angka yang sama矿区nya
 * dengan hasil AI padahal tidak ada hasil AI sama sekali. Di produk yang
 * janjinya "trust our score", presenting an unearned score is the worst
 * outcome: bukan error, tapi angka yang dipercaya.
 */
describe("pesan gagalnya analisis", () => {
  it("bilang hasil tidak disimpan dan mengajak mencoba lagi", () => {
    const id = analyzeFailureMessage("id");
    expect(id).toMatch(/tidak disimpan/i);
    expect(id).toMatch(/coba lagi/i);
  });

  it("versi Inggrisnya setara", () => {
    const en = analyzeFailureMessage("en");
    expect(en).toMatch(/nothing was saved/i);
    expect(en).toMatch(/try again/i);
  });

  it("tidak menjanjikan skor apa pun", () => {
    for (const lang of ["id", "en"] as const) {
      const message = analyzeFailureMessage(lang);
      expect(message).not.toMatch(/skor|score|hasil analisis kamu/i);
    }
  });
});

describe("route analisis tidak mengarang skor saat AI gagal", () => {
  const source = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");

  it("balas 503 dan berhenti sebelum menyimpan baris", () => {
    // Urutan penting: cabang gagal harus muncul sebelum insert ke database,
    // supaya hasil palsu tidak pernah tersimpan.
    const posisiGagal = source.indexOf("analyzeFailureMessage");
    const posisiSimpan = source.indexOf(".insert(checkerResults)");
    expect(posisiGagal).toBeGreaterThan(-1);
    expect(posisiSimpan).toBeGreaterThan(-1);
    expect(posisiGagal).toBeLessThan(posisiSimpan);
    expect(source).toContain("AI_ANALYSIS_FAILED");
  });

  it("formula skor cadangan sudah tidak ada", () => {
    // Rumus cadangan inilah yang menghasilkan skor palsu saat AI gagal.
    expect(source).not.toMatch(/\?\?\s*Math\.round\(/);
  });

  it("tidak lagi mengisi skor tetap saat analisis gagal", () => {
    // contextRelevance: 50 dan atsRules: 70 adalah angka tebakan yang dulu
    // muncul sebagai hasil-analysis ketika breakdown tidak ada.
    expect(source).not.toMatch(/contextRelevance:\s*aiAnalysis\?\.breakdown\?\.experience\?\.score\s*\?\?\s*50/);
    expect(source).not.toMatch(/atsRules:\s*aiAnalysis\?\.breakdown\?\.format_ats\?\.score\s*\?\?\s*70/);
  });
});