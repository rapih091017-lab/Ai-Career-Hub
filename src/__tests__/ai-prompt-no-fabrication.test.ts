import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REVISION_PROMPT_V2 } from "@/lib/ai/prompts/revision-v2";
import { SUGGESTION_PROMPT_V2 } from "@/lib/ai/prompts/suggestion-v2";

const polishSrc = readFileSync(join(process.cwd(), "src/app/api/ai/polish/route.ts"), "utf8");
const polishPrompt = polishSrc.slice(
  polishSrc.indexOf("const POLISH_SYSTEM_PROMPT_V2"),
  polishSrc.indexOf("const PolishBodySchema"),
);

const prompts: Record<string, string> = {
  polish: polishPrompt,
  "revision-v2": REVISION_PROMPT_V2,
  "suggestion-v2": SUGGESTION_PROMPT_V2,
};

describe.each(Object.entries(prompts))("prompt %s (A5)", (_name, prompt) => {
  it("tidak lagi mengizinkan angka [est.]", () => {
    expect(prompt).not.toContain("[est.]");
  });

  it("memakai placeholder untuk angka yang tidak ada", () => {
    expect(prompt).toContain("[persen]");
    expect(prompt).toMatch(/\[angka\]|\[jumlah orang\]/);
  });

  it("melarang klaim lolos ATS dan statistik perekrut", () => {
    expect(prompt).toMatch(/JANGAN menjanjikan lolos ATS/);
    expect(prompt).toMatch(/statistik tentang HR\/perekrut/);
    // Satu-satunya kemunculan "lolos ATS" adalah di kalimat larangan.
    const mentions = prompt.match(/lolos ATS/g) ?? [];
    const forbids = prompt.match(/(menjanjikan|klaim akan) lolos ATS/g) ?? [];
    expect(mentions.length).toBe(forbids.length);
  });

  it("contoh few-shot tidak memuat persentase karangan", () => {
    expect(prompt).not.toMatch(/\b\d{1,3}(\.\d+)?%/);
  });
});
