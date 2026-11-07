import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Kedua halaman hasil (/checker dan /checker/[id]) merender lewat
 * CheckerResultView, jadi pemeriksaan panel Sisi HR cukup di komponen itu
 * ditambah memastikan kedua halaman benar-benar memakainya.
 */
const PAGES = ["src/app/checker/page.tsx", "src/app/checker/[id]/page.tsx"];
const VIEW = "src/components/checker/CheckerResultView.tsx";

describe("panel sisi HR terpasang di hasil cek CV", () => {
  for (const file of PAGES) {
    it(`${file} memakai CheckerResultView`, () => {
      expect(readFileSync(file, "utf8")).toContain("<CheckerResultView");
    });
  }

  it("CheckerResultView merender skor ringkas dulu, panel Sisi HR menyusul dalam lipatan", () => {
    // Urutan baru: skor di atas, lalu "Mulai dari sini"; panel HR dilipat
    // dengan wrapper id section-hr supaya tombol "Lihat" tetap punya tujuan.
    const source = readFileSync(VIEW, "utf8");
    const panel = source.indexOf("<HrPointOfView");
    const score = source.indexOf("{t(L.title)}");
    const start = source.indexOf("<StartHereCard");
    expect(panel).toBeGreaterThan(-1);
    expect(score).toBeGreaterThan(-1);
    expect(score).toBeLessThan(start);
    expect(start).toBeLessThan(panel);
    expect(source).toContain('<Collapsible id="section-hr"');
  });

  it("tidak lagi menampilkan kolom yang isinya sudah ada di panel", () => {
    const source = readFileSync(VIEW, "utf8");
    // strengths dan areas_for_improvement sudah tampil di panel Sisi HR.
    expect(source).not.toContain("narrativeFeedback.strengths");
    expect(source).not.toContain("narrativeFeedback.areas_for_improvement");
  });

  it("tetap menampilkan ringkasan dan rekomendasi ATS", () => {
    const source = readFileSync(VIEW, "utf8");
    expect(source).toContain("narrativeFeedback.overall_assessment");
    expect(source).toContain("narrativeFeedback.ats_recommendations");
  });
});
