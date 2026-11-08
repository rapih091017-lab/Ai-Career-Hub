import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen, fireEvent } from "@testing-library/react";
import PortfolioDocument, { EMPTY_FORM_DATA } from "@/components/portfolio/render/PortfolioDocument";
import { HiddenNote } from "@/components/portfolio/builder/BuilderEditor";
import { THEMES } from "@/components/portfolio/themes";
import type { ThemeId } from "@/components/portfolio/types";
import type { PortfolioData } from "@/components/portfolio-templates/types";
import {
  aboutStatsHidden,
  hiddenEntryNote,
  isAboutShown,
  isCertificationShown,
  isEducationShown,
  isExperienceShown,
  isExtraLinkShown,
  isHobbyShown,
  isOrganizationShown,
  isProjectShown,
  isTestimonialShown,
} from "@/lib/portfolio/visibility";

const proj = (name: string) => ({ id: "p", name, description: "Deskripsi-unik-proyek", techStack: "", link: "" });

describe("predikat entri tampil", () => {
  it("proyek butuh nama", () => {
    expect(isProjectShown(proj(""))).toBe(false);
    expect(isProjectShown(proj("Aplikasi"))).toBe(true);
  });
  it("pengalaman cukup perusahaan ATAU posisi", () => {
    const e = { id: "e", company: "", position: "", startDate: "", endDate: "", description: "x" };
    expect(isExperienceShown(e)).toBe(false);
    expect(isExperienceShown({ ...e, position: "Desainer" })).toBe(true);
    expect(isExperienceShown({ ...e, company: "PT A" })).toBe(true);
  });
  it("pendidikan cukup institusi ATAU gelar", () => {
    const e = { id: "e", institution: "", degree: "", field: "Informatika", startDate: "", endDate: "" };
    expect(isEducationShown(e)).toBe(false);
    expect(isEducationShown({ ...e, degree: "S1" })).toBe(true);
  });
  it("sertifikat, organisasi, hobi butuh nama", () => {
    expect(isCertificationShown({ id: "c", name: "", issuer: "X", year: "2024" })).toBe(false);
    expect(isOrganizationShown({ id: "o", name: "", role: "Ketua", period: "", description: "" })).toBe(false);
    expect(isHobbyShown({ id: "h", name: "", description: "lari" })).toBe(false);
    expect(isHobbyShown({ id: "h", name: "Lari", description: "" })).toBe(true);
  });
  it("testimoni cukup nama ATAU isi", () => {
    const t = { id: "t", name: "", position: "CTO", testimonial: "" };
    expect(isTestimonialShown(t)).toBe(false);
    expect(isTestimonialShown({ ...t, testimonial: "Bagus" })).toBe(true);
  });
  it("link kontak butuh URL", () => {
    expect(isExtraLinkShown({ id: "l", label: "Dribbble", url: "" })).toBe(false);
    expect(isExtraLinkShown({ id: "l", label: "", url: "https://x.y" })).toBe(true);
  });
  it("Tentang butuh teks; statistik tanpa teks ditandai", () => {
    const f = { ...EMPTY_FORM_DATA, aboutYearsExp: "3+" };
    expect(isAboutShown(f)).toBe(false);
    expect(aboutStatsHidden(f)).toBe(true);
    expect(aboutStatsHidden({ ...f, aboutText: "Halo" })).toBe(false);
    expect(aboutStatsHidden(EMPTY_FORM_DATA)).toBe(false);
  });
  it("catatan menyebut field yang perlu diisi", () => {
    expect(hiddenEntryNote("project")).toBe("Belum tampil di portofolio: isi Nama Project.");
    expect(hiddenEntryNote("experience")).toContain("Perusahaan atau Posisi");
  });
});

describe("renderer mengikuti predikat yang sama di semua tema", () => {
  const data = (name: string) =>
    ({
      formData: { ...EMPTY_FORM_DATA, heroFirstName: "Ayu" },
      projects: [proj(name)],
      experiences: [], educations: [], certifications: [], organizations: [], hobbies: [], testimonials: [], extraLinks: [],
    }) as PortfolioData;
  for (const id of Object.keys(THEMES)) {
    it(`${id}: proyek tanpa nama tidak dirender, dengan nama dirender`, () => {
      const html = (n: string) => renderToStaticMarkup(<PortfolioDocument data={data(n)} themeId={id as ThemeId} mode="static" />);
      expect(html("")).not.toContain("Deskripsi-unik-proyek");
      expect(html("Aplikasi")).toContain("Deskripsi-unik-proyek");
    });
  }
});

describe("HiddenNote", () => {
  it("diumumkan sebagai status dan tombol aksinya jalan", () => {
    const onClick = vi.fn();
    render(<HiddenNote action={{ label: "Tampilkan", onClick }}>Bagian Proyek disembunyikan</HiddenNote>);
    expect(screen.getByRole("status")).toHaveTextContent("Bagian Proyek disembunyikan");
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan" }));
    expect(onClick).toHaveBeenCalled();
  });
});
