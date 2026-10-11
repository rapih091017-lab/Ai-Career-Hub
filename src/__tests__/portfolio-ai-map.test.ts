import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applyAiSuggestion, mergeExperiences } from "@/lib/portfolio/ai-map";
import { useUndoStack } from "@/lib/portfolio/useUndoStack";
import { renderHook, act } from "@testing-library/react";
import type { PortfolioData } from "@/components/portfolio-templates/types";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

const formData = {
  heroPhotoUrl: "",
  heroHeadline: "Taufferan Lama",
  heroSubHeadline: "",
  heroBgUrl: "",
  heroFirstName: "Teguh",
  heroLastName: "Surya",
  heroCreativeTitle: "",
  heroBio: "Bio lama",
  aboutText: "About lama",
  aboutYearsExp: "",
  aboutProjectsDone: "",
  aboutClientsHappy: "",
  skillsMain: "Lama",
  skillsTools: "",
  skillsLanguages: "",
  contactEmail: "",
  contactPhone: "",
  contactLinkedin: "",
  contactGithub: "",
};

const base: PortfolioData = {
  formData,
  projects: [],
  experiences: [],
  educations: [],
  certifications: [],
  organizations: [],
  hobbies: [],
  testimonials: [],
  extraLinks: [],
};

describe("applyAiSuggestion", () => {
  it("menulis ke field datar yang benar, bukan objek baru", () => {
    const res = {
      hero: { headline: "Frontend Developer", sub_headline: "React & TypeScript" },
      about: { meta_description: "Deskripsi baru", paragraphs: ["Paragraf 1."] },
    };

    const { data } = applyAiSuggestion(base, res);
    const f = data.formData;

    expect(f.heroHeadline).toBe("Frontend Developer");
    expect(f.heroSubHeadline).toBe("React & TypeScript");
    expect(f.aboutText).toContain("Paragraf 1.");
    expect((f as unknown as Record<string, unknown>).hero).toBeUndefined();
  });

  it("mempertahankan nilai yang tidak disentuh AI", () => {
    const { data } = applyAiSuggestion(base, { hero: { headline: "Baru" } });
    const f = data.formData;
    expect(f.heroFirstName).toBe("Teguh");
    expect(f.heroBio).toBe("Bio lama");
  });

  it("melaporkan field yang berubah untuk ditampilkan sebagai diff", () => {
    const { changes } = applyAiSuggestion(base, { hero: { headline: "Baru" } });
    expect(changes.map((c) => c.field)).toContain("heroHeadline");
  });

  it("mengembalikan input apa adanya bila respons kosong", () => {
    const { data, changes } = applyAiSuggestion(base, {});
    expect(data).toBe(base);
    expect(changes).toHaveLength(0);
  });
});

describe("applyAiSuggestion key fallbacks", () => {
  it("resolves sub_headline fallback to subheadline", () => {
    const res1 = {
      hero: {
        headline: "Software Engineer",
        sub_headline: "Sub headline 1",
      },
    };
    const res2 = {
      hero: {
        headline: "Software Engineer",
        subheadline: "Sub headline 2",
      },
    };

    const out1 = applyAiSuggestion(base, res1);
    expect(out1.data.formData.heroSubHeadline).toBe("Sub headline 1");

    const out2 = applyAiSuggestion(base, res2);
    expect(out2.data.formData.heroSubHeadline).toBe("Sub headline 2");
  });

  it("resolves paragraphs array vs paragraph_1..3 + meta_description", () => {
    const res1 = {
      about: {
        paragraphs: ["Para A", "Para B"],
      },
    };
    const res2 = {
      about: {
        paragraph_1: "Para 1",
        paragraph_2: "Para 2",
        paragraph_3: "Para 3",
        meta_description: "Meta desc",
      },
    };

    const out1 = applyAiSuggestion(base, res1);
    expect(out1.data.formData.aboutText).toBe("Para A\n\nPara B");

    const out2 = applyAiSuggestion(base, res2);
    expect(out2.data.formData.aboutText).toBe("Para 1\n\nPara 2\n\nPara 3\n\nMeta desc");
  });

  it("resolves skills.skills vs skills.primary", () => {
    const res1 = {
      skills_display: {
        skills: ["React", "TypeScript"],
      },
    };
    const res2 = {
      skills_display: {
        primary: ["Node.js", "GraphQL"],
      },
    };

    const out1 = applyAiSuggestion(base, res1);
    expect(out1.data.formData.skillsMain).toBe("React, TypeScript");

    const out2 = applyAiSuggestion(base, res2);
    expect(out2.data.formData.skillsMain).toBe("Node.js, GraphQL");
  });
});

describe("applyAiSuggestion seo", () => {
  it("memetakan snake_case respons AI ke data.seo dan melaporkan perubahan", () => {
    const { data, changes } = applyAiSuggestion(base, {
      seo: {
        page_title: "Frontend Developer | Teguh Surya",
        meta_description: "Portofolio Teguh Surya, developer frontend.",
        keywords: ["react", "typescript"],
      },
    });

    expect(data.seo).toEqual({
      pageTitle: "Frontend Developer | Teguh Surya",
      metaDescription: "Portofolio Teguh Surya, developer frontend.",
      keywords: ["react", "typescript"],
    });

    const fields = changes.map((c) => c.field);
    expect(fields).toContain("seo.pageTitle");
    expect(fields).toContain("seo.metaDescription");
    expect(fields).toContain("seo.keywords");
    const labels = changes.map((c) => c.label);
    expect(labels).toContain("Judul SEO");
    expect(labels).toContain("Deskripsi SEO");
    expect(labels).toContain("Kata kunci SEO");
  });

  it("menerima kunci camelCase", () => {
    const { data, changes } = applyAiSuggestion(base, {
      seo: {
        pageTitle: "Judul Camel",
        metaDescription: "Deskripsi Camel",
        keywords: ["nextjs"],
      },
    });
    expect(data.seo?.pageTitle).toBe("Judul Camel");
    expect(data.seo?.metaDescription).toBe("Deskripsi Camel");
    expect(data.seo?.keywords).toEqual(["nextjs"]);
    expect(changes.map((c) => c.field)).toContain("seo.pageTitle");
  });

  it("hanya melaporkan field seo yang nilainya berubah", () => {
    const existing: PortfolioData = {
      ...base,
      seo: { pageTitle: "Sama Persis", metaDescription: "Deskripsi lama", keywords: ["lama"] },
    };
    const { data, changes } = applyAiSuggestion(existing, {
      seo: { page_title: "Sama Persis", meta_description: "Deskripsi lama", keywords: ["lama"] },
    });
    expect(changes).toHaveLength(0);
    expect(data).toBe(existing);
  });

  it("kata kunci identik dengan lebih dari satu entri tidak dianggap berubah", () => {
    const existing: PortfolioData = {
      ...base,
      seo: { keywords: ["react", "typescript"] },
    };
    const { data, changes } = applyAiSuggestion(existing, {
      seo: { keywords: ["react", "typescript"] },
    });
    expect(changes).toHaveLength(0);
    expect(data).toBe(existing);
  });
});

describe("editor membawa seo dari AI sampai data tersimpan", () => {
  const build = read("src/app/portfolio/build/page.tsx");
  const live = read("src/app/portfolio/live/page.tsx");

  it("build: seo ikut load draft, semua payload simpan, dep auto-save, dan applyAllAi", () => {
    expect(build).toMatch(/seo:\s*draft\.seo/);
    const payloads = [...build.matchAll(/const payload = \{([^}]*)\}/g)].map((m) => m[1]);
    expect(payloads.length).toBeGreaterThanOrEqual(3);
    for (const p of payloads) expect(p).toContain("seo");
    expect(build).toMatch(/testimonials, extraLinks, seo\]/);
    expect(build).toMatch(/currentPortfolioData: PortfolioData = \{[^}]*\bseo\b/);
    expect(build).toContain("seo: merged.seo");
  });

  it("live: seo ada di LiveData, load, auto-save, canvasData publish, dan hasil generate AI", () => {
    expect(live).toMatch(/seo\?: \{ pageTitle\?: string; metaDescription\?: string; keywords\?: string\[\] \}/);
    expect(live).toMatch(/seo:\s*draft\.seo/);
    expect(live).toMatch(/saveDraft\(\{[^}]*\bseo\b/);
    expect(live).toMatch(/alignment, seo, mounted\]/);
    expect(live).toMatch(/currentPortfolio: PortfolioData = \{[^}]*\bseo\b/);
    expect(live).toContain("seo: updatedPortfolio.seo");
    expect(live).toMatch(/const canvasData = \{[^}]*\bseo\b/);
  });
});

describe("mergeExperiences", () => {
  const cur = [
    { id: "e1", company: "Acme", position: "Dev", startDate: "2022-01", endDate: "2023-01", description: "" },
  ];

  it("menambah entri baru tanpa menghapus entri lama", () => {
    const incoming = [
      { id: "ai1", company: "Globex", position: "FE", startDate: "2023-02", endDate: "2024-01", description: "" },
    ];
    const r = mergeExperiences(cur, incoming);
    expect(r.merged).toHaveLength(2);
    expect(r.keptCount).toBe(1);
    expect(r.addedCount).toBe(1);
  });

  it("tidak menggandakan entri dengan perusahaan dan posisi sama", () => {
    const incoming = [
      { id: "ai2", company: "Acme", position: "Dev", startDate: "2022-01", endDate: "2023-01", description: "" },
    ];
    expect(mergeExperiences(cur, incoming).addedCount).toBe(0);
  });

  it("mengembalikan array kosong tanpa merusak input", () => {
    expect(mergeExperiences([], []).merged).toEqual([]);
  });
});

describe("useUndoStack", () => {
  it("handles basic state, set, undo, redo, reset", () => {
    const { result } = renderHook(() => useUndoStack<string>("initial"));

    expect(result.current.state).toBe("initial");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.set("step 1");
    });

    expect(result.current.state).toBe("step 1");
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.set("step 2");
    });

    expect(result.current.state).toBe("step 2");

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toBe("step 1");
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toBe("step 2");

    act(() => {
      result.current.reset("reset state");
    });

    expect(result.current.state).toBe("reset state");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
