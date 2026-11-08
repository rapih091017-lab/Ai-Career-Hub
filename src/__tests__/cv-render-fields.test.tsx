import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AtsBaseRenderer, TEMPLATE_STYLES, type CvData } from "@/components/cv-templates";

const base: CvData = {
  fullName: "Budi", phone: "", email: "", address: "", linkedin: "", summary: "",
  jobTitle: "", jobDescription: "", workHistory: [], education: [], skills: [],
  organisations: [], certifications: [], customFields: [], cvLang: "id",
};

const html = (data: Partial<CvData>, order?: string[]) =>
  renderToStaticMarkup(
    <AtsBaseRenderer data={{ ...base, ...data }} style={TEMPLATE_STYLES["industrial-pro"]} sectionOrder={order} />,
  );

describe("field isian tampil di CV", () => {
  it("organisasi yang masih aktif menampilkan Sekarang", () => {
    const out = html({
      organisations: [{ id: "o1", name: "BEM", position: "Ketua", startDate: "2023-01", endDate: "", description: "", isPresent: true }],
    });
    expect(out).toContain("Sekarang");
    expect(out).toContain("Jan 2023 – ");
  });

  it("field kustom yang kosong tidak tercetak setengah", () => {
    const out = html({
      customFields: [
        { id: "a", label: "Domisili", value: "Bandung" },
        { id: "b", label: "", value: "x" },
        { id: "c", label: "SIM", value: " " },
      ],
    });
    expect(out).toContain("Domisili: Bandung");
    expect(out).not.toContain(": x");
    expect(out).not.toContain("SIM:");
  });

  it("baris spasi di bagian tambahan tidak jadi poin kosong", () => {
    const out = html(
      { customSections: [{ id: "lainnya", title: "Lainnya", content: "Juara 1\n   \nRelawan", contentType: "bullets" }] },
      ["lainnya"],
    );
    expect((out.match(/<li/g) || []).length).toBe(2);
  });
});
