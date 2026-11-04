import { describe, it, expect } from "vitest";
import { sanitizeLayout } from "@/lib/builder-format";
import { normalizeCvDocument } from "@/lib/cv-normalize";
import { sampleCv } from "./cv-pdf.fixture";

const ctx = (hasContent: string[] = [], custom = [{ id: "lainnya", title: "Lainnya", content: "" }]) => ({
  customSections: custom,
  hasContent: (k: string) => hasContent.includes(k),
});

describe("sanitizeLayout", () => {
  it("nilai invalid dibuang, bukan diganti default", () => {
    const out = sanitizeLayout(
      { fontSize: 99, textAlign: "miring", primaryColor: "red;x", marginMode: "wide", showDividers: "ya", dividers: { skills: true, x: "y" }, foo: 1 },
      ctx(),
    );
    expect(out).toEqual({ marginMode: "wide", dividers: { skills: true } });
  });

  it("section wajib & bawaan berisi yang hilang dikembalikan; opsional kosong tidak", () => {
    const out = sanitizeLayout({ sectionOrder: ["skills", "hacker", "skills", 5] }, ctx(["certifications"]));
    expect(out.sectionOrder).toEqual(["summary", "experience", "education", "skills", "certifications"]);
  });

  it("section kustom tak dikenal dibuang, kustom berisi yang hilang ditambah di akhir", () => {
    const out = sanitizeLayout(
      { sectionOrder: ["summary", "ghost"] },
      ctx([], [{ id: "lainnya", title: "Lainnya", content: "" }, { id: "cs1", title: "Bahasa", content: "Inggris" }]),
    );
    expect(out.sectionOrder).toEqual(["summary", "experience", "education", "skills", "cs1"]);
  });

  it("bukan objek → kosong", () => {
    expect(sanitizeLayout("rusak", ctx())).toEqual({});
  });
});

describe("normalizeCvDocument + layout", () => {
  it("CV lama tanpa layout tetap tanpa layout", () => {
    const cv = normalizeCvDocument({ tailoredContent: { ...sampleCv } });
    expect("layout" in cv).toBe(false);
  });

  it("layout dari DB dirapikan saat muat", () => {
    const cv = normalizeCvDocument({ tailoredContent: { ...sampleCv, layout: { fontSize: "besar", marginMode: "tight" } } });
    expect(cv.layout).toEqual({ marginMode: "tight" });
  });

  it("layout bukan objek dibuang", () => {
    const cv = normalizeCvDocument({ tailoredContent: { ...sampleCv, layout: [1, 2] } });
    expect(cv.layout).toBeUndefined();
  });
});
