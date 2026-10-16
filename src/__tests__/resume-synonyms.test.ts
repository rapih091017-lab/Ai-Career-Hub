import { describe, it, expect } from "vitest";
import { RESUME_SYNONYMS, type SynonymEntry } from "@/data/resume-synonyms";

/**
 * Daftar sinonim dibaca pengguna sambil menulis CV. Duplikat di sini terlihat
 *bodoh di layar ("mengurus" muncul dua kali) dan bikin daftar terasa Tambak.
 */
const languages = ["id", "en"] as const;

describe("daftar sinonim", () => {
  it("tidak punya frasa lemah yang sama dua kali", () => {
    for (const lang of languages) {
      const seen = new Map<string, number>();
      const duplicates: string[] = [];
      RESUME_SYNONYMS[lang].forEach((entry, index) => {
        const key = entry.weak.trim().toLowerCase();
        if (seen.has(key)) duplicates.push(`${entry.weak} (baris ${seen.get(key)} dan ${index})`);
        seen.set(key, index);
      });
      expect(duplicates, `duplikat di ${lang}: ${duplicates.join(", ")}`).toEqual([]);
    }
  });

  it("tidak punya frasa yang hanya berbeda spasi atau huruf besar", () => {
    for (const lang of languages) {
      const normalized = RESUME_SYNONYMS[lang].map((entry) =>
        entry.weak.replace(/\s+/g, " ").trim().toLowerCase(),
      );
      expect(new Set(normalized).size).toBe(normalized.length);
    }
  });

  it("setiap entri punya minimal satu pengganti", () => {
    for (const lang of languages) {
      for (const entry of RESUME_SYNONYMS[lang]) {
        expect(entry.weak.trim().length, `frasa kosong di ${lang}`).toBeGreaterThan(0);
        expect(entry.alternatives.length, `${entry.weak} tidak punya pengganti`).toBeGreaterThan(0);
      }
    }
  });

  it("pengganti tidak mengulang diri di dalam satu entri", () => {
    for (const lang of languages) {
      for (const entry of RESUME_SYNONYMS[lang]) {
        const normalized = entry.alternatives.map((alt) => alt.trim().toLowerCase());
        expect(
          new Set(normalized).size,
          `${entry.weak} punya pengganti yang sama berulang`,
        ).toBe(normalized.length);
      }
    }
  });

  it("tidak ada pengganti yang sama dengan frasa aslinya", () => {
    // "mengurus -> mengurus" tidak menolong siapa pun.
    for (const lang of languages) {
      for (const entry of RESUME_SYNONYMS[lang]) {
        const weak = entry.weak.trim().toLowerCase();
        for (const alt of entry.alternatives) {
          expect(alt.trim().toLowerCase(), `${entry.weak} diganti dengan dirinya sendiri`).not.toBe(weak);
        }
      }
    }
  });

  it("panjang daftar cukup untuk layak dipublikasikan", () => {
    for (const lang of languages) {
      expect(RESUME_SYNONYMS[lang].length, `daftar ${lang} terlalu sedikit`).toBeGreaterThanOrEqual(40);
    }
  });

  it("struktur data konsisten antar bahasa", () => {
    const typed: Record<"id" | "en", SynonymEntry[]> = RESUME_SYNONYMS;
    for (const lang of languages) {
      for (const entry of typed[lang]) {
        expect(typeof entry.weak).toBe("string");
        expect(Array.isArray(entry.alternatives)).toBe(true);
      }
    }
  });
});