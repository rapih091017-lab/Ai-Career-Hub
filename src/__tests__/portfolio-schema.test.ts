import { describe, it, expect } from "vitest";
import type { PortfolioData } from "@/components/portfolio-templates/types";
import { SECTION_IDS } from "@/components/portfolio/types";
import {
  portfolioDataSchema,
  publishPayloadSchema,
  draftPayloadSchema,
  emptySectionIds,
  LIMITS,
} from "@/lib/portfolio/schema";

const validFormData = {
  heroPhotoUrl: "",
  heroHeadline: "Frontend Developer",
  heroSubHeadline: "Bangun antarmuka yang cepat",
  heroFirstName: "Teguh",
  heroLastName: "Surya",
  heroBio: "Developer frontend dengan 4 tahun pengalaman.",
  aboutText: "Saya fokus pada aksesibilitas dan performa web.",
  aboutYearsExp: "4",
  aboutProjectsDone: "18",
  aboutClientsHappy: "12",
  skillsMain: "React, TypeScript",
  skillsTools: "Vite, Playwright",
  skillsLanguages: "Bahasa Indonesia, Inggris",
  contactEmail: "teguh@example.com",
  contactPhone: "",
  contactLinkedin: "https://linkedin.com/in/teguh",
  contactGithub: "https://github.com/teguh",
};

const emptyData = {
  formData: validFormData,
  projects: [],
  experiences: [],
  educations: [],
  certifications: [],
  organizations: [],
  hobbies: [],
  testimonials: [],
  extraLinks: [],
};

describe("portfolioDataSchema", () => {
  it("menerima data portfolio yang valid", () => {
    expect(portfolioDataSchema.safeParse(emptyData).success).toBe(true);
  });

  it("menolak URL dengan skema terlarang", () => {
    const bad = {
      ...emptyData,
      formData: { ...validFormData, contactGithub: "javascript:alert(1)" },
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak teks melebihi panjang maksimum", () => {
    const bad = {
      ...emptyData,
      formData: { ...validFormData, heroBio: "x".repeat(501) },
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak array yang melebihi batas", () => {
    const tooMany = Array.from({ length: LIMITS.projects + 1 }, (_, i) => ({
      id: `p${i}`,
      name: "P",
      description: "D",
      techStack: "React",
      link: "",
    }));
    expect(
      portfolioDataSchema.safeParse({ ...emptyData, projects: tooMany }).success,
    ).toBe(false);
  });

  it("menolak tanggal yang bukan format YYYY-MM", () => {
    const bad = {
      ...emptyData,
      experiences: [
        { id: "e1", company: "Acme", position: "Dev", startDate: "01/2024", endDate: "2025-03", description: "" },
      ],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak endDate yang lebih awal dari startDate", () => {
    const bad = {
      ...emptyData,
      experiences: [
        { id: "e1", company: "Acme", position: "Dev", startDate: "2024-01", endDate: "2023-01", description: "" },
      ],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak skema terlarang pada URL aset dan tautan project", () => {
    const asset = "javascript:alert(1)";
    expect(
      portfolioDataSchema.safeParse({
        ...emptyData,
        formData: { ...validFormData, heroPhotoUrl: asset },
      }).success,
    ).toBe(false);

    for (const key of ["imageUrl", "liveUrl", "repoUrl"]) {
      const project = {
        id: "p1",
        name: "N",
        description: "D",
        techStack: "React",
        link: "",
        imageUrl: "",
        liveUrl: "",
        repoUrl: "",
        [key]: asset,
      };
      expect(portfolioDataSchema.safeParse({ ...emptyData, projects: [project] }).success).toBe(false);
    }
  });

  it("menolak skema terlarang pada certifications[].url", () => {
    const bad = {
      ...emptyData,
      certifications: [{ id: "c1", name: "AWS", issuer: "Amazon", year: "2025", url: "javascript:alert(1)" }],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menerima path aset lokal pada heroPhotoUrl dan projects[].imageUrl", () => {
    const assetPath = "/api/portfolio/assets/6f1c2d3e-4a5b-4c7d-8e9f-0a1b2c3d4e5f";
    const r = portfolioDataSchema.parse({
      ...emptyData,
      formData: { ...validFormData, heroPhotoUrl: assetPath },
      projects: [
        { id: "p1", name: "N", description: "D", techStack: "React", link: "", imageUrl: assetPath },
      ],
    });
    expect(r.formData.heroPhotoUrl).toBe(assetPath);
    expect(r.projects[0].imageUrl).toBe(assetPath);
  });

  it("mempertahankan companyLogo pada experiences", () => {
    const logo = "/api/portfolio/assets/9a8b7c6d-5e4f-4a3b-9c2d-1e2f3a4b5c6d";
    const r = portfolioDataSchema.parse({
      ...emptyData,
      experiences: [
        {
          id: "e1",
          company: "Acme",
          position: "Dev",
          startDate: "2024-01",
          endDate: "",
          description: "",
          companyLogo: logo,
        },
      ],
    });
    expect(r.experiences[0].companyLogo).toBe(logo);
  });

  it("menolak skema terlarang pada experiences[].companyLogo", () => {
    const bad = {
      ...emptyData,
      experiences: [
        {
          id: "e1",
          company: "Acme",
          position: "Dev",
          startDate: "2024-01",
          endDate: "",
          description: "",
          companyLogo: "javascript:alert(1)",
        },
      ],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak isPresent yangdisambiguation dengan tanggal selesai", () => {
    const bad = {
      ...emptyData,
      experiences: [
        {
          id: "e1",
          company: "Acme",
          position: "Dev",
          startDate: "2024-01",
          endDate: "2023-01",
          description: "",
          isPresent: true,
        },
      ],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak tanggal selesai tanpa tanggal mulai", () => {
    const bad = {
      ...emptyData,
      educations: [
        {
          id: "ed1",
          institution: "Universitas X",
          degree: "S1",
          field: "Informatika",
          startDate: "",
          endDate: "2024-01",
        },
      ],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menerima rentang tanggal yang konsisten", () => {
    const ok = {
      ...emptyData,
      experiences: [
        { id: "e1", company: "Acme", position: "Dev", startDate: "2023-01", endDate: "2024-01", description: "" },
      ],
      educations: [
        {
          id: "ed1",
          institution: "Universitas X",
          degree: "S1",
          field: "Informatika",
          startDate: "2019-08",
          endDate: "",
          isPresent: true,
        },
      ],
    };
    expect(portfolioDataSchema.safeParse(ok).success).toBe(true);
  });

  it("menolak skema terlarang pada experiences[].imageUrl", () => {
    const bad = {
      ...emptyData,
      experiences: [
        {
          id: "e1",
          company: "Acme",
          position: "Dev",
          startDate: "2024-01",
          endDate: "",
          description: "",
          imageUrl: "javascript:alert(1)",
        },
      ],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menerima path aset lokal pada experiences[].imageUrl", () => {
    const assetPath = "/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f";
    const r = portfolioDataSchema.parse({
      ...emptyData,
      experiences: [
        {
          id: "e1",
          company: "Acme",
          position: "Dev",
          startDate: "2024-01",
          endDate: "",
          description: "",
          imageUrl: assetPath,
        },
      ],
    });
    expect(r.experiences[0].imageUrl).toBe(assetPath);
  });

  it("menolak section id yang tidak dikenal pada sectionOrder", () => {
    const bad = {
      ...emptyData,
      sectionOrder: ["hero", "footer"],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak section id yang tidak dikenal pada sectionVisibility", () => {
    const bad = {
      ...emptyData,
      sectionVisibility: { hero: true, footer: false },
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("mempertahankan sectionOrder dan sectionVisibility yang sah", () => {
    const sectionOrder = ["hero", "about", "contact"] as const;
    const r = portfolioDataSchema.parse({
      ...emptyData,
      sectionOrder: [...sectionOrder],
      sectionVisibility: { hero: true, about: false },
    });
    expect(r.sectionOrder).toEqual([...sectionOrder]);
    expect(r.sectionVisibility).toEqual({ hero: true, about: false });
  });

  it("mempertahankan heroBgUrl dan heroCreativeTitle saat parse", () => {
    const r = portfolioDataSchema.parse({
      ...emptyData,
      formData: {
        ...validFormData,
        heroBgUrl: "/uploads/hero-bg.jpg",
        heroCreativeTitle: "Frontend Engineer",
      },
    });
    expect(r.formData.heroBgUrl).toBe("/uploads/hero-bg.jpg");
    expect(r.formData.heroCreativeTitle).toBe("Frontend Engineer");
  });

  it("hasil parse tetap memenuhi tipe PortfolioData", () => {
    const parsed: PortfolioData = portfolioDataSchema.parse(emptyData);
    expect(parsed.formData.heroBgUrl).toBe("");
    expect(parsed.formData.heroCreativeTitle).toBe("");
  });

  it("menerapkan default pada field opsional", () => {
    const r = portfolioDataSchema.parse({
      ...emptyData,
      projects: [{ id: "p1", name: "N", description: "D", techStack: "React", link: "" }],
      experiences: [
        { id: "e1", company: "Acme", position: "Dev", startDate: "2024-01", endDate: "", description: "" },
      ],
    });
    expect(r.projects[0].imageUrl).toBe("");
    expect(r.projects[0].featured).toBe(false);
    expect(r.experiences[0].isPresent).toBe(false);
  });
});

describe("emptySectionIds", () => {
  it("mengembalikan dua belas id saat seluruh data kosong", () => {
    const parsed = portfolioDataSchema.parse({
      ...emptyData,
      formData: {
        heroPhotoUrl: "",
        heroHeadline: "",
        heroSubHeadline: "",
        heroBgUrl: "",
        heroFirstName: "",
        heroLastName: "",
        heroCreativeTitle: "",
        heroBio: "",
        aboutText: "",
        aboutYearsExp: "",
        aboutProjectsDone: "",
        aboutClientsHappy: "",
        skillsMain: "",
        skillsTools: "",
        skillsLanguages: "",
        contactEmail: "",
        contactPhone: "",
        contactLinkedin: "",
        contactGithub: "",
      },
    });
    expect(emptySectionIds(parsed)).toEqual([...SECTION_IDS]);
  });

  it("tidak menandai hero yang sudah terisi", () => {
    const parsed = portfolioDataSchema.parse({
      ...emptyData,
      formData: {
        ...validFormData,
        aboutText: "",
        aboutYearsExp: "",
        aboutProjectsDone: "",
        aboutClientsHappy: "",
        skillsMain: "",
        contactEmail: "",
        contactLinkedin: "",
        contactGithub: "",
      },
    });
    const empty = emptySectionIds(parsed);
    expect(empty).not.toContain("hero");
    expect(empty).toContain("about");
    expect(empty).toHaveLength(SECTION_IDS.length - 1);
  });

  it("tetap menandai hero kosong saat hanya headline yang terisi", () => {
    const parsed = portfolioDataSchema.parse({
      ...emptyData,
      formData: { ...validFormData, heroFirstName: "" },
    });
    expect(emptySectionIds(parsed)).toContain("hero");
  });
});

describe("publishPayloadSchema", () => {
  it("menolak slug terlarang", () => {
    expect(
      publishPayloadSchema.safeParse({ slug: "dashboard", themeId: "glass", data: emptyData }).success,
    ).toBe(false);
  });

  it("menolak tema yang tidak dikenal", () => {
    expect(
      publishPayloadSchema.safeParse({ slug: "teguh-surya", themeId: "neon-hacker", data: emptyData }).success,
    ).toBe(false);
  });

  it("menolak publish tanpa nama depan", () => {
    expect(
      publishPayloadSchema.safeParse({
        slug: "teguh-surya",
        themeId: "glass",
        data: { ...emptyData, formData: { ...validFormData, heroFirstName: "" } },
      }).success,
    ).toBe(false);
  });

  it("menerima payload valid lengkap dengan opsi tampilan", () => {
    expect(
      publishPayloadSchema.safeParse({
        slug: "teguh-surya",
        themeId: "luxe",
        data: emptyData,
        fontSize: "large",
        alignment: { hero: "center", contact: "center" },
      }).success,
    ).toBe(true);
  });
});

describe("draftPayloadSchema", () => {
  it("menerima nama kosong dan memakai default", () => {
    expect(draftPayloadSchema.parse({ data: emptyData }).name).toBe("Portfolio saya");
  });

  it("memotong nama draft lebih dari 120 karakter", () => {
    expect(draftPayloadSchema.parse({ name: "a".repeat(200), data: emptyData }).name.length).toBe(120);
  });
});
