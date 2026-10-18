import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Dua halaman hasil harus menampilkan panel Sisi HR dengan urutan yang sama.
 *
 * Anchor judul blok skor sengaja dibedakan per halaman: `/checker` memakai
 * `checker.result-title`, sedangkan `/checker/[id]` memakai
 * `checker.detail.title`. Kalau anchor `/checker` dipakai untuk keduanya,
 * `indexOf` mengembalikan -1 di halaman detail dan perbandingan urutan jadi
 * tidak bermakna — testnya lulus tanpa memeriksa apa pun.
 */
const PAGES = [
  { file: "src/app/checker/page.tsx", scoreAnchor: "checker.result-title" },
  { file: "src/app/checker/[id]/page.tsx", scoreAnchor: "checker.detail.title" },
];

describe("panel sisi HR terpasang di kedua halaman hasil", () => {
  for (const { file, scoreAnchor } of PAGES) {
    it(`${file} merender panel Sisi HR sebelum skor`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("HrPointOfView");
      // Panel harus muncul sebelum blok skor, bukan di bawah.
      expect(source.indexOf("<HrPointOfView")).toBeGreaterThan(-1);
      // Anchor harus benar-benar ada, kalau tidak indexOf -1 dan "< -1" selalu
      // gagal tanpa menjelaskan apa pun.
      expect(source.indexOf(scoreAnchor)).toBeGreaterThan(-1);
      expect(source.indexOf("<HrPointOfView")).toBeLessThan(source.indexOf(scoreAnchor));
    });

    it(`${file} tidak lagi menampilkan kolom yang isinya sudah ada di panel`, () => {
      const source = readFileSync(file, "utf8");
      // strengths dan areas_for_improvement sudah tampil di panel Sisi HR.
      // Penulisan tanpa `?.` yang dicari: kedua halaman memanggilnya di dalam
      // penjaga `{narrativeFeedback && (`, jadi bentuk dengan `?.` tidak pernah
      // muncul dan assertion-nya lulus tanpa memeriksa apa pun.
      expect(source).not.toContain("narrativeFeedback.strengths");
      expect(source).not.toContain("narrativeFeedback.areas_for_improvement");
    });

    it(`${file} tetap menampilkan ringkasan dan rekomendasi ATS`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("narrativeFeedback.overall_assessment");
      expect(source).toContain("narrativeFeedback.ats_recommendations");
    });
  }
});