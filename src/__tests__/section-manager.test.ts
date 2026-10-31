import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { AtsBaseRenderer, TEMPLATE_STYLES, type CvData } from "@/components/cv-templates";
import {
  addCustomSection,
  canAddCustomSection,
  isRemovableSection,
  orderOf,
  removeSection,
  restoreBuiltinSection,
  undoRemoveSection,
  unusedBuiltinSections,
} from "@/lib/section-manager";
import { sampleCv } from "./cv-pdf.fixture";

const cv: CvData = { ...sampleCv, layout: undefined, customSections: undefined };

describe("kelola section", () => {
  it("section wajib tidak bisa dihapus", () => {
    for (const k of ["summary", "experience", "education", "skills"]) expect(isRemovableSection(cv, k)).toBe(false);
    expect(removeSection(cv, "experience")).toBeNull();
  });

  it("hapus Organisasi mengosongkan data & urutan; Urungkan mengembalikan", () => {
    const withDivider = { ...cv, layout: { dividers: { organizations: true } } };
    const res = removeSection(withDivider, "organizations")!;
    expect(res.cv.organisations).toEqual([]);
    expect(orderOf(res.cv)).not.toContain("organizations");
    expect(res.cv.layout?.dividers).toEqual({});
    expect(unusedBuiltinSections(res.cv)).toContain("organizations");
    const back = undoRemoveSection(res.cv, res.removed);
    expect(back.organisations).toEqual(cv.organisations);
    expect(orderOf(back)).toEqual(orderOf(withDivider));
    expect(back.layout?.dividers).toEqual({ organizations: true });
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
    expect(res.cv.customSections?.some((c) => c.id === added.id)).toBe(false);
    const back = undoRemoveSection(res.cv, res.removed);
    expect(back.customSections?.find((c) => c.id === added.id)?.title).toBe("Bahasa");
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
