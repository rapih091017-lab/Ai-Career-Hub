import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PROMPT_DIR = join(process.cwd(), "src/lib/ai/prompts");

// Sumber mentah semua file prompt (template string ikut terbaca apa adanya).
const allPrompts: Record<string, string> = Object.fromEntries(
  readdirSync(PROMPT_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => [f.replace(/\.ts$/, ""), readFileSync(join(PROMPT_DIR, f), "utf8")]),
);

const polishSrc = readFileSync(join(process.cwd(), "src/app/api/ai/polish/route.ts"), "utf8");
allPrompts.polish = polishSrc.slice(
  polishSrc.indexOf("const POLISH_SYSTEM_PROMPT_V2"),
  polishSrc.indexOf("const PolishBodySchema"),
);

// Prompt yang menghasilkan teks untuk ditempel ke CV: wajib memuat aturan AGENTS.md.
const CV_TEXT_PROMPTS = [
  "polish",
  "revision-v2",
  "suggestion-v2",
  "summary-revision-v2",
  "suggestion-summary-v2",
  "analysis-v3",
  "analysis-v4",
  "auto-fix-v1",
];

// Persentase di contoh boleh ada bila memang berasal dari INPUT contoh itu sendiri.
const PERCENT_FROM_EXAMPLE_INPUT = new Set(["portfolio-v1"]);

describe.each(Object.entries(allPrompts))("prompt %s", (name, prompt) => {
  it("tidak mengizinkan angka [est.]", () => {
    expect(prompt).not.toMatch(/\[est/i);
  });

  it("persona tidak menggoda klaim ATS", () => {
    expect(prompt).not.toMatch(/ATS Copywriter|ATS-safe/);
  });

  it("'lolos ATS' hanya muncul di kalimat larangan", () => {
    const mentions = prompt.match(/lolos ATS/gi) ?? [];
    const forbids = prompt.match(/(menjanjikan|klaim akan) lolos ATS/gi) ?? [];
    expect(mentions.length).toBe(forbids.length);
  });

  it.skipIf(PERCENT_FROM_EXAMPLE_INPUT.has(name))("contoh teks tidak memuat persentase karangan", () => {
    const offenders = prompt
      .split("\n")
      // Baris larangan boleh mengutip contoh buruk ("90% recruiter menolak...").
      .filter((line) => !/JANGAN|Jangan/.test(line))
      .flatMap((line) => line.match(/"[^"\n]*\b\d{1,3}(?:\.\d+)?%[^"\n]*"/g) ?? []);
    expect(offenders).toEqual([]);
  });
});

describe.each(CV_TEXT_PROMPTS)("prompt teks CV %s (aturan AGENTS.md)", (name) => {
  const prompt = allPrompts[name];

  it("file prompt ada", () => {
    expect(prompt, name).toBeTruthy();
  });

  it("memakai placeholder untuk angka yang tidak ada", () => {
    expect(prompt).toContain("[persen]");
    expect(prompt).toMatch(/\[angka\]|\[jumlah orang\]/);
  });

  it("melarang klaim lolos ATS dan statistik perekrut", () => {
    expect(prompt).toMatch(/menjanjikan lolos ATS/i);
    expect(prompt).toMatch(/statistik tentang HR/);
  });
});
