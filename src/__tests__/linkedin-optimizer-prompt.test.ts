import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildLinkedInOptimizerPrompt } from "@/lib/ai/prompts/linkedin-optimizer";

/**
 * Prompt ini satu-satunya tempat bahasa hasil bisa diatur: skema JSON-nya
 * sama untuk kedua bahasa, jadi kalau instruksinya lupa diganti, pengguna
 * English tetap mendapat verdict dan teks siap tempel berbahasa Indonesia.
 */
describe("prompt LinkedIn Optimizer mengikuti bahasa", () => {
  const promptId = buildLinkedInOptimizerPrompt("id");
  const promptEn = buildLinkedInOptimizerPrompt("en");

  it("tanpa argumen memakai Bahasa Indonesia", () => {
    expect(buildLinkedInOptimizerPrompt()).toBe(promptId);
    expect(promptId).toContain("--- BAHASA KELUARAN ---");
    expect(promptId).toContain("BAHASA INDONESIA yang natural");
    expect(promptId).toContain('"text": "headline baru"');
  });

  it("versi Inggris menyuruh model menulis dalam bahasa Inggris", () => {
    expect(promptEn).toContain("BAHASA INGGRIS");
    expect(promptEn).toContain("Jangan memakai Bahasa Indonesia");
    expect(promptEn).toContain("Natural English");
    expect(promptEn).toContain('"text": "new headline"');
    // Contoh Indonesia pada format JSON tidak boleh ikut terbawa.
    expect(promptEn).not.toContain("headline baru");
    expect(promptEn).not.toContain("Bahasa Indonesia yang natural");
  });

  it("aturan fakta dan skema tetap sama di kedua bahasa", () => {
    for (const prompt of [promptId, promptEn]) {
      expect(prompt).toContain("--- ATURAN FAKTA (WAJIB) ---");
      expect(prompt).toContain("JANGAN mengarang perusahaan, jabatan, tanggal, angka");
      expect(prompt).toContain("placeholder: [angka], [persen], atau [jumlah]");
      expect(prompt).toContain("Jangan menerjemahkan nama perusahaan");
      expect(prompt).toContain('"verdict"');
      expect(prompt).toContain('"experience"');
      expect(prompt).toContain('Semua enam kunci "sections" wajib ada');
      for (const section of [
        "headline",
        "about",
        "experience_titles",
        "experience_descriptions",
        "skills",
        "education",
      ]) {
        expect(prompt).toContain(section);
      }
    }
  });

  it("route analyze memakai bahasa dari request, bukan prompt tetap", () => {
    const route = readFileSync("src/app/api/linkedin-optimizer/analyze/route.ts", "utf8");
    expect(route).toContain("buildLinkedInOptimizerPrompt(outputLang)");
    expect(route).toContain('const outputLang = lang === "en" ? "en" : "id";');
  });
});
