import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CV_FONT_FACE_CSS_PUBLIC, CV_FONTS, cvFontFaceCss } from "@/lib/cv-fonts";

describe("font-display font CV", () => {
  it("halaman web memakai swap, HTML PDF tetap block", () => {
    expect(CV_FONT_FACE_CSS_PUBLIC).toContain("font-display:swap");
    expect(CV_FONT_FACE_CSS_PUBLIC).not.toContain("font-display:block");
    expect(cvFontFaceCss(CV_FONTS, (f) => f)).toContain("font-display:block");
  });

  it("CvFontFaces tidak di root layout, hanya di layout yang butuh", () => {
    const root = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(root).not.toContain("CvFontFaces");
    for (const d of ["builder", "dashboard", "my-resumes"]) {
      const p = join(process.cwd(), "src/app", d, "layout.tsx");
      expect(existsSync(p)).toBe(true);
      expect(readFileSync(p, "utf8")).toContain("<CvFontFaces />");
    }
  });
});
