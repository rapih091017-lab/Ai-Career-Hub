import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AtsBaseRenderer, DEFAULT_SECTION_ORDER, TEMPLATE_STYLES, type CvData } from "@/components/cv-templates";
import { migrateSavedFormat, migrateSectionOrder } from "@/lib/builder-format";
import { normalizeCvDocument } from "@/lib/cv-normalize";

const style = TEMPLATE_STYLES["industrial-pro"];

function cv(over: Partial<CvData> = {}): CvData {
  return normalizeCvDocument({ tailoredContent: { fullName: "Budi", ...over } });
}

/** Teks pratinjau (HTML → teks polos). */
function preview(data: CvData, opts: { order?: string[]; showSkillLevel?: boolean } = {}) {
  return renderToStaticMarkup(
    <AtsBaseRenderer data={data} style={style} sectionOrder={opts.order} showSkillLevel={opts.showSkillLevel} />,
  ).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
}

/** Teks PDF: HTML cetak dari renderer yang sama, mode cetak (tanpa handler edit). */
function pdfText(data: CvData, opts: { order?: string[]; showSkillLevel?: boolean } = {}) {
  return renderToStaticMarkup(
    <AtsBaseRenderer data={data} style={style} sectionOrder={opts.order} showSkillLevel={opts.showSkillLevel} />,
  ).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
}

const both = (data: CvData, opts?: { order?: string[]; showSkillLevel?: boolean }) => [
  ["pratinjau", preview(data, opts)],
  ["pdf", pdfText(data, opts)],
] as const;

describe("Keahlian, sertifikasi, evaluasi diri — pratinjau & PDF", () => {
  it("skill terisi tampil", () => {
    for (const [, text] of both(cv({ skills: [{ id: "1", name: "React", level: "advanced" }] }))) {
      expect(text).toContain("KEAHLIAN");
      expect(text).toContain("React");
      expect(text).not.toContain("(Mahir)");
    }
  });

  it("sertifikasi tampil walau skill kosong, di section sendiri", () => {
    const data = cv({ skills: [], certifications: [{ id: "c", name: "AWS SAA", issuer: "Amazon", year: "2024" }] });
    for (const [, text] of both(data)) {
      expect(text).toContain("SERTIFIKASI");
      expect(text).toContain("AWS SAA · Amazon (2024)");
      expect(text).not.toContain("KEAHLIAN");
    }
  });

  it("evaluasi diri terisi tampil dengan urutan bawaan", () => {
    for (const [, text] of both(cv({ selfEvaluation: "Teliti dan rapi." }))) {
      expect(text).toContain("EVALUASI DIRI");
      expect(text).toContain("Teliti dan rapi.");
    }
  });

  it("toggle level → React (Mahir); label ikut bahasa CV", () => {
    const skills = [
      { id: "1", name: "React", level: "advanced" },
      { id: "2", name: "Go", level: "" },
    ];
    for (const [, text] of both(cv({ skills } as Partial<CvData>), { showSkillLevel: true })) {
      expect(text).toContain("React (Mahir)");
      expect(text).toMatch(/Go(?! \()/);
    }
    for (const [, text] of both(cv({ skills, cvLang: "en" } as Partial<CvData>), { showSkillLevel: true })) {
      expect(text).toContain("React (Advanced)");
    }
  });

  it("skill nama kosong & kategori tanpa skill bernama tidak dirender", () => {
    const data = cv({
      skills: [
        { id: "1", name: "", level: "advanced", category: "soft" },
        { id: "2", name: "Excel", level: "", category: "tools" },
      ],
    } as Partial<CvData>);
    for (const [, text] of both(data)) {
      expect(text).toContain("Excel");
      expect(text).not.toContain("Soft Skills");
    }
    for (const [, text] of both(cv({ skills: [{ id: "x", name: " ", level: "" }] } as Partial<CvData>))) {
      expect(text).not.toContain("KEAHLIAN");
    }
  });

  it("CV lama tanpa layout/format tetap tampil (urutan bawaan)", () => {
    const old = normalizeCvDocument({
      tailoredContent: {
        personalInfo: { fullName: "Lama" },
        skills: [{ name: "Excel", level: "intermediate" }],
        certifications: [{ name: "K3 Umum" }],
      },
    });
    for (const [, text] of both(old)) {
      expect(text).toContain("Excel");
      expect(text).toContain("K3 Umum");
    }
  });
});

describe("migrasi urutan section tersimpan", () => {
  it("tanpa certifications → disisipkan tepat setelah skills; tanpa selfEvaluation → setelah summary", () => {
    expect(migrateSectionOrder(["summary", "experience", "education", "skills", "organizations", "lainnya"], ["lainnya"])).toEqual([
      "summary",
      "selfEvaluation",
      "experience",
      "education",
      "skills",
      "certifications",
      "organizations",
      "lainnya",
    ]);
  });

  it("section bawaan yang hilang dikembalikan, urutan user dipertahankan, nilai invalid dibuang", () => {
    const out = migrateSectionOrder(["skills", "summary", 5, "hacker", "skills", "lainnya"], ["lainnya"])!;
    expect(out).toEqual([
      "skills",
      "certifications",
      "organizations",
      "summary",
      "selfEvaluation",
      "experience",
      "education",
      "lainnya",
    ]);
    expect(out).not.toContain("hacker");
    expect(new Set(out).size).toBe(out.length);
    for (const k of DEFAULT_SECTION_ORDER) expect(out).toContain(k);
  });

  it("bukan array → null (pakai bawaan)", () => {
    expect(migrateSectionOrder("x", [])).toBeNull();
  });

  it("migrateSavedFormat membuang nilai invalid & menjaga sertifikasi CV lama tetap tersembunyi bila skills disembunyikan", () => {
    const f = migrateSavedFormat({
      fontSize: "besar",
      marginMode: "lebar",
      textAlign: "justify",
      showSkillLevel: "ya",
      sectionVisibility: { skills: false, summary: "no" },
      sectionOrder: ["summary", "skills"],
    });
    expect(f.fontSize).toBeUndefined();
    expect(f.marginMode).toBeUndefined();
    expect(f.textAlign).toBe("justify");
    expect(f.showSkillLevel).toBeUndefined();
    expect(f.sectionVisibility).toEqual({ skills: false, certifications: false });
    expect(f.sectionOrder).toContain("certifications");
  });
});

describe("SkillSection — catatan section tersembunyi", () => {
  it("kartu berisi data tapi tersembunyi menampilkan catatan + tombol Tampilkan; label level Bahasa Indonesia", async () => {
    const { SkillSection } = await import("@/components/builder/SkillSection");
    const noop = () => {};
    const html = renderToStaticMarkup(
      <SkillSection
        skills={[{ id: "1", name: "React", level: "" }]}
        certifications={[]}
        lainnyaContent=""
        selfEvaluation="Teliti"
        onSkillChange={noop}
        onSkillRemove={noop}
        onSkillAdd={noop}
        onCertChange={noop}
        onCertRemove={noop}
        onCertAdd={noop}
        onLainnyaChange={noop}
        onSelfEvaluationChange={noop}
        isSectionHidden={(k) => k === "skills" || k === "certifications" || k === "lainnya"}
        onShowSection={noop}
      />,
    );
    // skills tersembunyi & berisi → 1 catatan; sertifikasi & lainnya kosong → tidak; evaluasi diri tampil → tidak.
    expect(html.match(/Bagian ini disembunyikan dari CV\./g)?.length).toBe(1);
    expect(html).toContain("Tampilkan");
    expect(html).toContain("Pemula");
    expect(html).toContain("Menengah");
    expect(html).toContain("Mahir");
    expect(html).not.toContain(">Beginner<");
  });
});
