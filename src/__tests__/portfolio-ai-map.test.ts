import { describe, it, expect } from "vitest";
import { applyAiSuggestion, mergeExperiences } from "@/lib/portfolio/ai-map";
import { useUndoStack } from "@/lib/portfolio/useUndoStack";
import { renderHook, act } from "@testing-library/react";
import type { PortfolioData } from "@/components/portfolio-templates/types";

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
