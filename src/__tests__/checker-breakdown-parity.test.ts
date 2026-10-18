import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Hasil segar (/checker) dan hasil tersimpan (/checker/[id]) wajib memakai
 * penjaga breakdown yang sama. Tanpa paritas, satu halaman bisa menampilkan
 * kartu skor palsu (skor default 50 dari .catch schema) atau bullet ISSUES
 * tanpa teks, sementara halaman satunya tidak.
 *
 * Tes membaca sumber kedua halaman karena perilaku render itu berasal dari
 * guard di JSX — kalau guard salah satu halaman dihapus, langsung ketahuan.
 */
const PAGES = ["src/app/checker/page.tsx", "src/app/checker/[id]/page.tsx"];

const GUARDS = [
  // breakdown kosong total → blok section disembunyikan, jangan judul tanpa kartu
  "Object.keys(breakdown).length > 0",
  // section yang tidak ada tidak boleh dirender (kolom jsonb bisa terpotong)
  "breakdown.summary &&",
  "breakdown.experience &&",
  "breakdown.skills &&",
  "breakdown.education &&",
  "breakdown.format_ats &&",
  // relevance kosong tidak boleh jadi bullet ISSUES tanpa teks
  "breakdown.education.relevance ? [breakdown.education.relevance] : []",
];

describe("penjaga breakdown paritas antara /checker dan /checker/[id]", () => {
  for (const file of PAGES) {
    it(`${file} memakai semua penjaga breakdown`, () => {
      const source = readFileSync(file, "utf8");
      for (const guard of GUARDS) {
        expect(source, `guard hilang: ${guard}`).toContain(guard);
      }
    });
  }
});
