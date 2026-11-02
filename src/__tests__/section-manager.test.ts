import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { AtsBaseRenderer, TEMPLATE_STYLES, type CvData } from "@/components/cv-templates";
import {
  addCustomSection,
  canAddCustomSection,
  isRemovableSection,
  orderOf,
  purgeSectionContent,
  removeSection,
  restoreBuiltinSection,
  restoreSection,
  sectionHasSavedContent,
  unusedBuiltinSections,
} from "@/lib/section-manager";
import { cvPrintFormatFromData, cvRenderProps } from "@/lib/cv-print-format";
import { sanitizeLayout, sectionHasContent } from "@/lib/builder-format";
import { sampleCv } from "./cv-pdf.fixture";

const cv: CvData = { ...sampleCv, layout: undefined, customSections: undefined };

describe("kelola section", () => {
  it("section wajib tidak bisa dihapus", () => {
    for (const k of ["summary", "experience", "education", "skills"]) expect(isRemovableSection(cv, k)).toBe(false);
    expect(removeSection(cv, "experience")).toBeNull();
  });

  it("hapus Organisasi: isi tetap tersimpan, keluar dari urutan & render; Pakai lagi memulihkan", () => {
    const res = removeSection(cv, "organizations")!;
    expect(res.cv.organisations).toEqual(cv.organisations);
    expect(orderOf(res.cv)).not.toContain("organizations");
    expect(res.cv.layout?.removedSections).toEqual(["organizations"]);
    expect(unusedBuiltinSections(res.cv)).toContain("organizations");
    expect(sectionHasSavedContent(res.cv, "organizations")).toBe(true);
    // Sanitasi saat muat tidak mengembalikan bagian yang dihapus walau berisi.
    const sanitized = sanitizeLayout(res.cv.layout, { customSections: [], hasContent: (k) => sectionHasContent(res.cv, k) });
    expect(sanitized.sectionOrder).not.toContain("organizations");
    // Renderer/PDF tidak merender walau ada di urutan.
    const forced = { ...res.cv, layout: { ...res.cv.layout, sectionOrder: [...orderOf(res.cv), "organizations"] } };
    expect(cvRenderProps(forced, cvPrintFormatFromData(forced)).sectionOrder).not.toContain("organizations");
    const back = restoreSection(res.cv, "organizations", res.orderIndex);
    expect(orderOf(back)).toEqual(orderOf(cv));
    expect(back.layout?.removedSections).toEqual([]);
  });

  it("Urungkan memakai state terbaru: editan setelah hapus tidak tertimpa", () => {
    const res = removeSection(cv, "selfEvaluation")!;
    const edited = { ...res.cv, summary: "baru" };
    const back = restoreSection(edited, "selfEvaluation", res.orderIndex);
    expect(back.summary).toBe("baru");
    expect(back.selfEvaluation).toBe(cv.selfEvaluation);
  });

  it("hapus permanen isi hanya untuk bagian tidak dipakai", () => {
    expect(purgeSectionContent(cv, "organizations")).toBe(cv);
    const res = removeSection(cv, "organizations")!;
    expect(purgeSectionContent(res.cv, "organizations").organisations).toEqual([]);
  });

  it("pakai lagi section bawaan di posisi bawaan", () => {
    const res = removeSection(cv, "certifications")!;
    const back = restoreBuiltinSection(res.cv, "certifications");
    expect(orderOf(back).indexOf("certifications")).toBe(orderOf(back).indexOf("skills") + 1);
  });

  it("section kustom: tambah, hapus, urungkan; maksimal 10", () => {
    const added = addCustomSection(cv, "Bahasa")!;
    expect(orderOf(added.cv).at(-1)).toBe(added.id);
    const res = removeSection(added.cv, added.id)!;
    expect(res.cv.customSections?.some((c) => c.id === added.id)).toBe(true);
    expect(orderOf(res.cv)).not.toContain(added.id);
    const back = restoreSection(res.cv, added.id, res.orderIndex);
    expect(orderOf(back)).toContain(added.id);
    expect(purgeSectionContent(res.cv, added.id).customSections?.some((c) => c.id === added.id)).toBe(false);
    let many = cv;
    for (let i = 0; i < 20; i++) many = addCustomSection(many, `B${i}`)?.cv ?? many;
    expect(many.customSections).toHaveLength(10);
    expect(canAddCustomSection(many)).toBe(false);
  });

  it("garis per section ikut section saat diurutkan; garis global bisa ditimpa", () => {
    const html = renderToStaticMarkup(
      createElement(AtsBaseRenderer, {
        data: cv,
        style: TEMPLATE_STYLES["industrial-pro"],
        sectionOrder: ["experience", "education", "skills"],
        showDividers: true,
        dividers: { education: false },
      }),
    );
    // experience pertama (tanpa garis), education ditimpa false, skills dari global → 1 garis.
    expect(html.match(/<hr/g)).toHaveLength(1);
    const skillsAt = html.indexOf('data-cv-section="skills"');
    expect(html.indexOf("<hr", skillsAt)).toBeGreaterThan(skillsAt);
  });

  it("section kustom kosong tidak memunculkan judul", () => {
    const html = renderToStaticMarkup(
      createElement(AtsBaseRenderer, {
        data: { ...cv, customSections: [{ id: "lainnya", title: "Lainnya", content: "" }] },
        style: TEMPLATE_STYLES["industrial-pro"],
        sectionOrder: ["lainnya"],
      }),
    );
    expect(html).not.toContain("Lainnya");
  });
});
