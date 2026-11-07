import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PortfolioDocument, { EMPTY_FORM_DATA } from "@/components/portfolio/render/PortfolioDocument";
import { THEMES } from "@/components/portfolio/themes";
import type { ThemeId } from "@/components/portfolio/types";
import type { PortfolioData } from "@/components/portfolio-templates/types";

const data = (desc: string) =>
  ({
    formData: { ...EMPTY_FORM_DATA, heroFirstName: "Ayu" },
    projects: [{ id: "p", name: "Proyek", description: desc, techStack: "", link: "" }],
    experiences: [{ id: "e", company: "[perusahaan]", position: "Desainer", startDate: "2023-01", endDate: "", description: desc }],
    educations: [], certifications: [], organizations: [], hobbies: [], testimonials: [], extraLinks: [],
  }) as PortfolioData;

describe("deskripsi multi-baris di semua tema", () => {
  for (const id of Object.keys(THEMES)) {
    it(`${id}: baris BulletEditor terjaga (pre-line) untuk project & pengalaman`, () => {
      const html = renderToStaticMarkup(<PortfolioDocument data={data("Poin satu\nPoin dua")} themeId={id as ThemeId} mode="static" />);
      const hits = html.match(/<span style="white-space:pre-line">Poin satu\nPoin dua<\/span>/g) ?? [];
      expect(hits.length).toBeGreaterThanOrEqual(2);
    });
  }
});
