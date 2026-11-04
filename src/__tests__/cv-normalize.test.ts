import { describe, it, expect } from "vitest";
import { normalizeCvDocument, aiSkillNames } from "@/lib/cv-normalize";

describe("normalizeCvDocument", () => {
  it("format datar: field tak dikenal dipertahankan (additive)", () => {
    const cv = normalizeCvDocument({
      tailoredContent: {
        fullName: "Budi",
        extraTop: 1,
        skills: [{ id: "s1", name: "React", level: "advanced", custom: "x" }],
        workHistory: [{ id: "w1", position: "Dev", bulletMeta: [1] }],
      },
    });
    expect((cv as unknown as Record<string, unknown>).extraTop).toBe(1);
    expect(cv.skills[0]).toMatchObject({ id: "s1", name: "React", level: "advanced", custom: "x" });
    expect(cv.workHistory[0]).toMatchObject({ id: "w1", position: "Dev", company: "", visible: true, bulletMeta: [1] });
  });

  it("level skill kosong/invalid tidak dipaksa intermediate", () => {
    const cv = normalizeCvDocument({
      tailoredContent: { skills: [{ name: "A" }, { name: "B", level: "jago" }, { name: "C", level: "beginner" }] },
    });
    expect(cv.skills.map((s) => s.level)).toEqual(["", "", "beginner"]);
  });

  it("format bersarang: personalInfo diratakan lalu dibuang", () => {
    const cv = normalizeCvDocument({
      jobTitle: "PM",
      tailoredContent: {
        personalInfo: { fullName: "Sari", summary: "Ringkas", customFields: [{ label: "Umur", value: 30 }] },
        skills: [{ name: "Excel" }],
        foo: "bar",
      },
    });
    expect(cv.fullName).toBe("Sari");
    expect(cv.summary).toBe("Ringkas");
    expect(cv.jobTitle).toBe("PM");
    expect(cv.customFields?.[0]).toMatchObject({ label: "Umur", value: "30" });
    expect(cv.skills[0].level).toBe("");
    expect("personalInfo" in cv).toBe(false);
    expect((cv as unknown as Record<string, unknown>).foo).toBe("bar");
  });

  it("array rusak / null tidak membuat crash", () => {
    const cv = normalizeCvDocument({ tailoredContent: { skills: null, education: "x", workHistory: [null, 3] } });
    expect(cv.skills).toEqual([]);
    expect(cv.education).toEqual([]);
    expect(cv.workHistory).toEqual([]);
  });

  it("tanpa tailoredContent → CV kosong", () => {
    expect(normalizeCvDocument({}).fullName).toBe("");
    expect(normalizeCvDocument(null).skills).toEqual([]);
  });
});

describe("aiSkillNames", () => {
  it("menyertakan skill tanpa level, membuang Pemula & nama kosong", () => {
    expect(
      aiSkillNames([
        { id: "1", name: "React", level: "" },
        { id: "2", name: "Go", level: "beginner" },
        { id: "3", name: " ", level: "advanced" },
        { id: "4", name: "SQL", level: "intermediate" },
      ]),
    ).toEqual(["React", "SQL"]);
  });
});

describe("normalizeCvDocument — bentuk skill lama", () => {
  it("array string jadi skill bernama", () => {
    const cv = normalizeCvDocument({ tailoredContent: { skills: ["React", " ", "SQL"] } });
    expect(cv.skills.map((s) => s.name)).toEqual(["React", "SQL"]);
  });
  it("objek per kategori diratakan dengan kategorinya", () => {
    const cv = normalizeCvDocument({
      tailoredContent: { personalInfo: {}, skills: { technical: ["React"], soft: [{ name: "Komunikasi" }], languages: ["Inggris"] } },
    });
    expect(cv.skills.map((s) => [s.name, s.category])).toEqual([
      ["React", "technical"],
      ["Komunikasi", "soft"],
      ["Inggris", "tools"],
    ]);
  });
});
