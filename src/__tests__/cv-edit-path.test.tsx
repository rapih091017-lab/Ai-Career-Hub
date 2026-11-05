import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AtsBaseRenderer, TEMPLATE_STYLES, type CvEditDateProps, type CvEditTextProps } from "@/components/cv-templates";
import { STEP } from "@/lib/builder-steps";
import { getCvPath, isBulletPath, isDatePath, isInlineEditablePath, removeBullet, setCvPath, splitBullet, stepForPath } from "@/lib/cv-edit-path";
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
    expect(stepForPath("fullName")).toBe(STEP.PERSONAL);
    expect(stepForPath("summary")).toBe(STEP.PERSONAL);
    expect(stepForPath("workHistory.w1.description.2")).toBe(STEP.EXPERIENCE);
    expect(stepForPath("education.e1.startDate")).toBe(STEP.EDUCATION);
    expect(stepForPath("organisations.o1.name")).toBe(STEP.ORGANIZATIONS);
    expect(stepForPath("skills")).toBe(STEP.SKILLS);
    expect(stepForPath("sectionLabels.education")).toBe(STEP.EDUCATION);
    expect(stepForPath("sectionLabels.header")).toBe(STEP.PERSONAL);
    expect(stepForPath("jobTitle")).toBe(STEP.TARGET);
    expect(STEP.TARGET).toBe(0);
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

describe("poin & tanggal di pratinjau (issue 10)", () => {
  it("baca/tulis poin dan tanggal lewat path", () => {
    expect(isBulletPath("workHistory.w1.description.1")).toBe(true);
    expect(isBulletPath("education.e1.description.0")).toBe(false);
    expect(isDatePath("education.e1.endDate")).toBe(true);
    expect(getCvPath(sampleCv, "workHistory.w1.description.1")).toBe("Meningkatkan skor Lighthouse dari 62 ke 95");
    const a = setCvPath(sampleCv, "workHistory.w1.description.0", "Baru\nbaris");
    expect(a.workHistory[0].description.split("\n")).toEqual(["Baru baris", "Meningkatkan skor Lighthouse dari 62 ke 95"]);
    expect(setCvPath(sampleCv, "workHistory.w1.description.5", "x")).toBe(sampleCv);
    expect(setCvPath(sampleCv, "workHistory.w2.endDate", "2022-05").workHistory[1].endDate).toBe("2022-05");
    expect(setCvPath(sampleCv, "workHistory.w2.endDate", "Mei 2022")).toBe(sampleCv);
    expect(setCvPath(sampleCv, "workHistory.w2.endDate", "").workHistory[1].endDate).toBe("");
  });

  it("Enter memecah poin, Backspace di poin kosong menghapusnya", () => {
    const s = splitBullet(sampleCv, "workHistory.w1.description.0", "")!;
    expect(s.focusPath).toBe("workHistory.w1.description.1");
    expect(s.cv.workHistory[0].description.split("\n")).toHaveLength(3);
    expect(removeBullet(sampleCv, "workHistory.w1.description.0")).toBeNull(); // poin berisi tidak dihapus
    const r = removeBullet(s.cv, "workHistory.w1.description.1")!;
    expect(r.cv.workHistory[0].description).toBe(sampleCv.workHistory[0].description);
    expect(r.focusPath).toBe("workHistory.w1.description.0");
  });

  it("renderer: poin & tanggal lewat komponen edit hanya bila disediakan; mode cetak tetap", () => {
    const style = TEMPLATE_STYLES["industrial-pro"];
    const Text = ({ path, value }: CvEditTextProps) => <span data-test-edit={path}>{value}</span>;
    const DateField = ({ path, display }: CvEditDateProps) => <span data-test-date={path}>{display}</span>;
    const data = { ...sampleCv, workHistory: [{ ...sampleCv.workHistory[0], description: "Satu\n\nDua" }] };
    const base = { Text, editable: true, onEdit: () => {}, onSession: () => {} };
    const inline = renderToStaticMarkup(<AtsBaseRenderer data={data} style={style} edit={{ ...base, onSplit: () => {}, onRemoveEmpty: () => {}, DateField }} />);
    expect(inline).toContain('data-test-edit="workHistory.w1.description.0"');
    expect(inline).toContain('data-test-edit="workHistory.w1.description.1"'); // baris kosong tampil saat edit
    expect(inline).toContain('data-test-edit="workHistory.w1.description.2"');
    expect(inline).toContain('data-test-date="workHistory.w1.startDate"');
    const click = renderToStaticMarkup(<AtsBaseRenderer data={data} style={style} edit={base} />);
    expect(click).not.toContain("data-test-date");
    expect(click).not.toContain('data-cv-path="workHistory.w1.description.1"');
    expect(click).toContain('data-cv-path="workHistory.w1.description.2"');
    const print = renderToStaticMarkup(<AtsBaseRenderer data={data} style={style} />);
    expect(print).toContain("<li");
    expect(print.match(/<li /g)?.length).toBe(renderToStaticMarkup(<AtsBaseRenderer data={{ ...data, workHistory: [{ ...data.workHistory[0], description: "Satu\nDua" }] }} style={style} />).match(/<li /g)?.length);
  });
});
