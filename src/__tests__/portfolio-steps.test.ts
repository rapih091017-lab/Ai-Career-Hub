import { describe, it, expect } from "vitest";
import { PORTFOLIO_STEP_IDS, isTypingTarget, portfolioStepCompletion } from "@/components/portfolio/builder/steps";
import type { PortfolioData } from "@/components/portfolio-templates/types";

const base = (): PortfolioData =>
  ({
    formData: {
      heroPhotoUrl: "", heroHeadline: "", heroSubHeadline: "", heroFirstName: "", heroLastName: "", heroBio: "",
      aboutText: "", aboutYearsExp: "", aboutProjectsDone: "", aboutClientsHappy: "",
      skillsMain: "", skillsTools: "", skillsLanguages: "",
      contactEmail: "", contactPhone: "", contactLinkedin: "", contactGithub: "",
    },
    projects: [], experiences: [], educations: [], certifications: [], organizations: [], hobbies: [], testimonials: [], extraLinks: [],
  }) as PortfolioData;

describe("langkah builder portofolio", () => {
  it("draft kosong: hanya Tampilan yang lengkap", () => {
    const c = portfolioStepCompletion(base());
    expect(c).toHaveLength(PORTFOLIO_STEP_IDS.length);
    expect(c.filter(Boolean)).toHaveLength(1);
    expect(c[PORTFOLIO_STEP_IDS.indexOf("appearance")]).toBe(true);
  });

  it("status dihitung dari data, termasuk langkah yang tidak tampil", () => {
    const p = base();
    p.formData.heroFirstName = "Ayu";
    p.formData.heroHeadline = "Desainer Produk";
    p.projects = [{ id: "a", name: "Aplikasi kasir", description: "Merancang alur bayar", techStack: "", link: "" }];
    p.educations = [{ id: "e", institution: "Universitas [nama]", degree: "S1", field: "", startDate: "", endDate: "" }];
    const c = portfolioStepCompletion(p);
    expect(c[PORTFOLIO_STEP_IDS.indexOf("hero")]).toBe(true);
    expect(c[PORTFOLIO_STEP_IDS.indexOf("projects")]).toBe(true);
    expect(c[PORTFOLIO_STEP_IDS.indexOf("experience")]).toBe(true);
    expect(c[PORTFOLIO_STEP_IDS.indexOf("contact")]).toBe(false);
  });

  it("Ctrl+panah tidak direbut saat mengetik", () => {
    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
