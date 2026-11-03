import { describe, expect, it } from "vitest";
import { BUILDER_HELP } from "@/lib/builder-help";

describe("isi bantuan builder", () => {
  const entries = Object.entries(BUILDER_HELP);

  it("setiap topik punya penjelasan, contoh baik, dan contoh kurang", () => {
    for (const [, h] of entries) {
      expect(h.what.trim().length).toBeGreaterThan(20);
      expect(h.good.trim()).not.toBe("");
      expect(h.weak.trim()).not.toBe("");
      expect(h.weakWhy.trim()).not.toBe("");
    }
  });

  it("tanpa em dash, klaim ATS, atau statistik perekrut", () => {
    for (const [key, h] of entries) {
      const text = Object.values(h).join(" ");
      expect(text, key).not.toMatch(/—/);
      expect(text, key).not.toMatch(/\bATS\b|rekruter|perekrut|recruiter|\bHRD?\b/i);
    }
  });

  it("contoh tidak memuat persen atau angka karangan (pakai placeholder)", () => {
    for (const [key, h] of entries) {
      // Skala IPK "4,00" adalah format baku, bukan klaim.
      const example = `${h.good} ${h.weak}`.replace(/\[[^\]]+\]/g, "").replace("4,00", "");
      expect(example, key).not.toMatch(/\d/);
    }
  });
});
