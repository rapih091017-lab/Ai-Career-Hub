import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildCvSaveBody } from "@/lib/builder-save";
import type { CvData } from "@/components/cv-templates";

// API hanya membaca `tailoredContent`. Simpan manual dulu mengirim cvData
// mentah sehingga tidak tersimpan apa pun.
describe("buildCvSaveBody", () => {
  it("membungkus cvData di key tailoredContent", () => {
    const cv = { fullName: "Budi" } as CvData;
    expect(JSON.parse(buildCvSaveBody(cv))).toEqual({ tailoredContent: { fullName: "Budi" } });
  });

  it("dipakai handleSave di halaman builder", () => {
    const src = readFileSync(path.join(process.cwd(), "src/app/builder/[id]/page.tsx"), "utf8");
    // Simpan manual lewat autosave (yang memakai buildCvSaveBody + cek konflik).
    expect(src).toContain("await flushAutoSave()");
    expect(src).not.toMatch(/body:\s*JSON\.stringify\(cvData\)/);
  });
});

describe("tombol Optimalkan", () => {
  it("tidak memakai ikon spark yang tidak ada di Material Symbols", () => {
    for (const f of ["src/components/builder/WorkCard.tsx", "src/components/builder/SummarySection.tsx"]) {
      const src = readFileSync(path.join(process.cwd(), f), "utf8");
      expect(src).not.toContain('"spark"');
    }
  });
});
