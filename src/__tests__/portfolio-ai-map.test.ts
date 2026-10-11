import { describe, it, expect } from "vitest";
import { applyAiSuggestion, mergeExperiences } from "@/lib/portfolio/ai-map";

const formData = {
  heroPhotoUrl: "",
  heroHeadline: "Taufferan Lama",
  heroSubHeadline: "",
  heroFirstName: "Teguh",
  heroLastName: "Surya",
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

const base = {
  formData,
  projects: [],
  experiences: [],
  educations: [],
  certifications: [],
  organizations: [],
  hobbies: [],
  testimonials: [],
  extraLinks: [],
} as never;

describe("applyAiSuggestion", () => {
  it("menulis ke field datar yang benar, bukan objek baru", () => {
    const res = {
      hero: { headline: "Frontend Developer", sub_headline: "React & TypeScript" },
      about: { meta_description: "Deskripsi baru", paragraphs: ["Paragraf 1."] },
    } as never;

    const { data } = applyAiSuggestion(base, res);
    const f = (data as never as { formData: Record<string, string> }).formData;

    expect(f.heroHeadline).toBe("Frontend Developer");
    expect(f.heroSubHeadline).toBe("React & TypeScript");
    expect(f.aboutText).toContain("Paragraf 1.");
    expect(f.hero).toBeUndefined();
  });

  it("mempertahankan nilai yang tidak disentuh AI", () => {
    const { data } = applyAiSuggestion(base, { hero: { headline: "Baru" } } as never);
    const f = (data as never as { formData: Record<string, string> }).formData;
    expect(f.heroFirstName).toBe("Teguh");
    expect(f.heroBio).toBe("Bio lama");
  });

  it("melaporkan field yang berubah untuk ditampilkan sebagai diff", () => {
    const { changes } = applyAiSuggestion(base, { hero: { headline: "Baru" } } as never);
    expect(changes.map((c) => c.field)).toContain("heroHeadline");
  });

  it("mengembalikan input apa adanya bila respons kosong", () => {
    const { data, changes } = applyAiSuggestion(base, {} as never);
    expect(data).toBe(base);
    expect(changes).toHaveLength(0);
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
    const r = mergeExperiences(cur as never, incoming as never);
    expect(r.merged).toHaveLength(2);
    expect(r.keptCount).toBe(1);
    expect(r.addedCount).toBe(1);
  });

  it("tidak menggandakan entri dengan perusahaan dan posisi sama", () => {
    const incoming = [
      { id: "ai2", company: "Acme", position: "Dev", startDate: "2022-01", endDate: "2023-01", description: "" },
    ];
    expect(mergeExperiences(cur as never, incoming as never).addedCount).toBe(0);
  });

  it("mengembalikan array kosong tanpa merusak input", () => {
    expect(mergeExperiences([] as never, [] as never).merged).toEqual([]);
  });
});
