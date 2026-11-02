import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AtsBaseRenderer } from "@/components/cv-templates";
import { sanitizeLayout, sanitizeSectionStyles } from "@/lib/builder-format";
import { cvPrintFormatFromData, cvRenderProps } from "@/lib/cv-print-format";
import { buildCvPdfHtml } from "@/lib/pdf/cv-html";
import { sampleCv } from "./cv-pdf.fixture";

const ctx = { customSections: [], hasContent: () => true };

describe("sanitasi gaya per bagian", () => {
  it("nilai invalid dibuang, bukan diganti default", () => {
    const out = sanitizeSectionStyles({
      summary: { textAlign: "justify", fontSize: 20, lineHeight: 1.4, titleColor: "merah", fontFamily: "Comic Sans" },
      experience: { fontFamily: "'CV Tinos', serif", fontSize: 9, titleColor: "#1e3a5f" },
      kosong: { fontSize: 7 },
      [""]: { fontSize: 10 },
      header: "bukan objek",
    });
    expect(out).toEqual({
      summary: { textAlign: "justify", lineHeight: 1.4 },
      experience: { fontFamily: "'CV Tinos', serif", fontSize: 9, titleColor: "#1e3a5f" },
    });
  });

  it("layout tanpa sectionStyles tidak mendapat field baru", () => {
    expect(sanitizeLayout({ fontSize: 11 }, ctx)).toEqual({ fontSize: 11 });
    expect(sanitizeLayout({ sectionStyles: { x: { fontSize: 99 } } }, ctx)).toEqual({});
  });
});

describe("renderer gaya per bagian", () => {
  const cv = { ...sampleCv, layout: { textAlign: "left" as const, sectionStyles: { summary: { textAlign: "justify" as const }, experience: { fontFamily: "'CV Tinos', serif", fontSize: 9 } } } };
  const { marginMm, ...props } = cvRenderProps(cv, cvPrintFormatFromData(cv, "industrial-pro"));
  const html = renderToStaticMarkup(<AtsBaseRenderer {...props} />);
  const section = (key: string) => html.split(`data-cv-section="${key}"`)[1].split("data-cv-section=")[0];

  it("ringkasan justify, pengalaman tetap kiri dengan font sendiri", () => {
    expect(section("summary")).toContain("text-align:justify");
    expect(section("experience")).not.toContain("text-align:justify");
    expect(section("experience")).toContain("CV Tinos");
    expect(section("experience")).toContain("font-size:9pt");
    expect(section("education")).not.toContain("CV Tinos");
  });

  it("PDF menyematkan font bagian", async () => {
    const pdf = await buildCvPdfHtml(props, marginMm);
    expect(pdf).toMatch(/font-family:(&#x27;|')CV Tinos/);
    expect(pdf).toContain("text-align:justify");
  });

  it("reset bagian = kembali ke global", () => {
    const plain = { ...sampleCv, layout: { textAlign: "left" as const } };
    const { marginMm: _m, ...p2 } = cvRenderProps(plain, cvPrintFormatFromData(plain, "industrial-pro"));
    const html2 = renderToStaticMarkup(<AtsBaseRenderer {...p2} />);
    expect(html2).not.toContain("text-align:justify");
  });
});
