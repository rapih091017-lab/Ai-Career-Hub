import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AtsBaseRenderer, TEMPLATE_STYLES } from "@/components/cv-templates";
import { normalizeCvDocument } from "@/lib/cv-normalize";

const style = TEMPLATE_STYLES["industrial-pro"];

function html(descriptionType?: unknown) {
  const data = normalizeCvDocument({
    tailoredContent: {
      fullName: "Budi",
      workHistory: [{ id: "w1", position: "Staf", company: "PT A", description: "Satu\nDua", descriptionType }],
      organisations: [{ id: "o1", name: "Himpunan", position: "Ketua", description: "Tiga\nEmpat", descriptionType }],
    },
  });
  return { data, markup: renderToStaticMarkup(<AtsBaseRenderer data={data} style={style} />) };
}

describe("descriptionType deskripsi kerja/organisasi", () => {
  it("data lama (tanpa field) tetap poin", () => {
    const { data, markup } = html(undefined);
    expect(data.workHistory[0].descriptionType).toBeUndefined();
    expect(markup).toContain("<li");
    expect(markup).toMatch(/<li[^>]*>Satu<\/li>/);
    expect(markup).toMatch(/<li[^>]*>Empat<\/li>/);
  });

  it("paragraph dirender sebagai <p>, bukan <ul>", () => {
    const { markup } = html("paragraph");
    expect(markup).not.toMatch(/<li[^>]*>Satu<\/li>/);
    expect(markup).toMatch(/<p[^>]*white-space:pre-line[^>]*>Satu\nDua<\/p>/);
    expect(markup).toMatch(/<p[^>]*white-space:pre-line[^>]*>Tiga\nEmpat<\/p>/);
  });

  it("nilai invalid dibuang, bukan diganti default", () => {
    const { data } = html("tabel");
    expect(data.workHistory[0].descriptionType).toBeUndefined();
    expect(data.organisations[0].descriptionType).toBeUndefined();
    expect(html("bullets").data.workHistory[0].descriptionType).toBe("bullets");
  });
});
