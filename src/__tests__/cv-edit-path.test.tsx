import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AtsBaseRenderer, TEMPLATE_STYLES, type CvEditTextProps } from "@/components/cv-templates";
import { getCvPath, isInlineEditablePath, setCvPath, stepForPath } from "@/lib/cv-edit-path";
import { sampleCv } from "./cv-pdf.fixture";

describe("path edit pratinjau", () => {
  it("hanya field satu baris, ringkasan, dan judul bagian yang bisa diedit", () => {
    for (const p of ["fullName", "summary", "email", "workHistory.w1.company", "education.e1.field", "organisations.o1.name", "sectionLabels.experience", "customSections.lainnya.title"])
      expect(isInlineEditablePath(p), p).toBe(true);
    for (const p of ["workHistory.w1.description.0", "workHistory.w1.startDate", "skills", "certifications.c1", "jobTitle", "workHistory.w1.company.x", "layout"])
      expect(isInlineEditablePath(p), p).toBe(false);
  });

  it("setCvPath menulis ke entri yang benar dan tidak menyentuh yang lain", () => {
    const next = setCvPath(sampleCv, "workHistory.w1.company", "PT Baru");
    expect(next.workHistory[0].company).toBe("PT Baru");
    expect(next.workHistory.slice(1)).toEqual(sampleCv.workHistory.slice(1));
    expect(getCvPath(next, "workHistory.w1.company")).toBe("PT Baru");
    expect(setCvPath(sampleCv, "workHistory.tidakada.company", "x")).toBe(sampleCv);
    expect(setCvPath(sampleCv, "workHistory.w1.description", "x")).toBe(sampleCv);
    expect(setCvPath(sampleCv, "fullName", "Ani").fullName).toBe("Ani");
  });

  it("judul bagian kosong kembali ke bawaan", () => {
    const a = setCvPath(sampleCv, "sectionLabels.experience", "Riwayat Kerja");
    expect(a.sectionLabels?.experience).toBe("Riwayat Kerja");
    expect(setCvPath(a, "sectionLabels.experience", " ").sectionLabels?.experience).toBeUndefined();
  });

  it("langkah form untuk path", () => {
    expect(stepForPath("fullName")).toBe(0);
    expect(stepForPath("workHistory.w1.description.2")).toBe(2);
    expect(stepForPath("education.e1.startDate")).toBe(3);
    expect(stepForPath("organisations.o1.name")).toBe(4);
    expect(stepForPath("skills")).toBe(5);
    expect(stepForPath("sectionLabels.education")).toBe(3);
  });
});

describe("renderer mode edit vs cetak", () => {
  const style = TEMPLATE_STYLES["industrial-pro"];
  const Text = ({ path, value }: CvEditTextProps) => <span data-test-edit={path}>{value}</span>;
  const edit = { Text, editable: true, onEdit: () => {}, onSession: () => {} };

  it("mode cetak tanpa atribut edit/klik", () => {
    const html = renderToStaticMarkup(<AtsBaseRenderer data={sampleCv} style={style} />);
    expect(html).not.toContain("data-cv-path");
    expect(html).not.toContain("contenteditable");
  });

  it("mode edit: field satu baris lewat komponen edit, poin bullet jadi target lompat", () => {
    const html = renderToStaticMarkup(<AtsBaseRenderer data={sampleCv} style={style} edit={edit} />);
    expect(html).toContain('data-test-edit="fullName"');
    expect(html).toContain('data-test-edit="workHistory.w1.company"');
    expect(html).toContain('data-test-edit="sectionLabels.experience"');
    expect(html).toContain('data-cv-path="workHistory.w1.description.0"');
    expect(html).toContain('data-cv-path="workHistory.w1.startDate"');
  });
});
