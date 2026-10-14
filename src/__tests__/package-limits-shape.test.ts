import { describe, it, expect } from "vitest";
import { normalizePackageLimits } from "@/lib/package-limits";
import { mergeLimits } from "@/lib/package-selection";

/**
 * Insiden nyata: 7 dari 10 paket (termasuk semua paket bulanan berbayar)
 * menyimpan `limits` sebagai teks JSON di dalam kolom jsonb. Akibatnya
 * `limits.cv_analyzer` bernilai undefined, paket yang sudah dibayar tidak
 * membuka fiturnya, dan `mergeLimits` membaca karakter demi karakter.
 */
describe("limits paket harus selalu objek", () => {
  const asText = JSON.stringify({
    ai_cv_generate: "unlimited",
    cv_analyzer: 1,
    ai_revision: "unlimited",
    ai_suggestion: "unlimited",
    cover_letter: "unlimited",
    portfolio_web: false,
    pdf_export: "unlimited",
    bulk_analyzer: false,
    white_label: false,
  });

  it("limits berbentuk teks tetap dibaca sebagai objek", () => {
    const limits = normalizePackageLimits(asText);
    expect(limits).not.toBeNull();
    expect(limits?.ai_cv_generate).toBe("unlimited");
    expect(limits?.cv_analyzer).toBe(1);
  });

  it("limits yang sudah objek tidak berubah", () => {
    const limits = normalizePackageLimits({ ai_revision: 3 });
    expect(limits?.ai_revision).toBe(3);
  });

  it("nilai tidak terbaca mengembalikan null supaya jatuh ke paket bawaan", () => {
    expect(normalizePackageLimits("bukan json")).toBeNull();
    expect(normalizePackageLimits(null)).toBeNull();
    expect(normalizePackageLimits(undefined)).toBeNull();
  });

  it("paket berbayar tidak kehilangan hak saat digabung", () => {
    const premium = normalizePackageLimits(asText)!;
    const monthly = normalizePackageLimits(
      JSON.stringify({ ai_cv_generate: "unlimited", cv_analyzer: 5, ai_revision: "unlimited" }),
    )!;
    const merged = mergeLimits({}, premium as never);
    const mergedBoth = mergeLimits(merged as never, monthly as never);
    expect(mergedBoth.ai_cv_generate).toBe("unlimited");
    // Angka tertinggi menang; "unlimited" hanya menang kalau salah satu memang
    // tanpa batas. Di sini cv_analyzer 1 vs 5, jadi hasilnya 5.
    expect(mergedBoth.cv_analyzer).toBe(5);
    expect(mergedBoth.ai_revision).toBe("unlimited");
  });

  it("unlimited menang terhadap angka saat digabung", () => {
    const unlimitedRevision = normalizePackageLimits(JSON.stringify({ ai_revision: "unlimited" }))!;
    const numbered = normalizePackageLimits(JSON.stringify({ ai_revision: 3 }))!;
    const merged = mergeLimits(numbered as never, unlimitedRevision as never) as Record<string, unknown>;
    expect(merged.ai_revision).toBe("unlimited");
  });

  it("menggabung dua teks JSON tidak menghasilkan karakter acak", () => {
    const a = normalizePackageLimits(asText)!;
    const b = normalizePackageLimits(asText)!;
    const merged = mergeLimits(a as never, b as never) as Record<string, unknown>;
    // Kalau teks tidak diparsing, Object.entries() akan iterating per karakter.
    for (const value of Object.values(merged)) {
      expect(["number", "string", "boolean"]).toContain(typeof value);
    }
    expect(Object.keys(merged)).toContain("ai_cv_generate");
  });
});