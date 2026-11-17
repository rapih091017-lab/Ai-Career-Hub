import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { GUIDE_FEATURES, type GuideFeatureId } from "@/lib/guide-features";
import { FeatureTour } from "@/components/guide/FeatureTour";

// Berkas yang memuat elemen bertanda data-tour untuk tiap fitur ber-tur.
const SOURCES: Partial<Record<GuideFeatureId, string[]>> = {
  checker: ["src/app/checker/page.tsx"],
  resumes: ["src/app/my-resumes/page.tsx"],
  linkedin: ["src/app/linkedin-optimizer/page.tsx"],
  letter: ["src/components/cover-letter/SuratLamaranApp.tsx"],
  portfolio: ["src/app/portfolio/page.tsx"],
  interview: ["src/app/interview/page.tsx"],
  tracker: ["src/app/tracker/page.tsx"],
  careerpath: ["src/app/career-path/page.tsx"],
  karir: ["src/app/karir/page.tsx"],
  dashboard: ["src/app/dashboard/page.tsx"],
};

describe("selector tur ada di halaman fiturnya", () => {
  for (const f of GUIDE_FEATURES.filter((x) => x.tour)) {
    it(f.id, () => {
      const files = SOURCES[f.id];
      expect(files, `daftarkan berkas sumber untuk ${f.id}`).toBeTruthy();
      const src = files!.map((p) => readFileSync(join(process.cwd(), p), "utf8")).join("\n");
      for (const step of f.tour!) {
        // Setiap langkah harus punya minimal satu selector yang ada di sumber.
        const found = step.anchors.filter((a) => src.includes(`data-tour="${a}"`));
        expect(found.length, `${f.id}: ${step.anchors.join(", ")}`).toBeGreaterThan(0);
      }
    });
  }
});

describe("target tur tidak ditemukan", () => {
  it("dialog tampil tanpa sorotan, tidak crash, dan bisa lanjut sampai selesai", () => {
    const steps = [
      { title: "t1", body: "b1", anchors: ["tidak-ada"] },
      { title: "t2", body: "b2", anchors: [] },
    ];
    let closed = 0;
    const { container } = render(<FeatureTour open onClose={() => closed++} steps={steps} storageKey="tes_tur" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Lapisan gelap penuh, bukan kotak sorotan bercincin.
    expect(container.querySelector(".ring-2")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
    fireEvent.click(screen.getByRole("button", { name: "Selesai" }));
    expect(closed).toBe(1);
  });
});
