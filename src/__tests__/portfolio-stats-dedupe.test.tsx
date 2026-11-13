import { describe, it, expect, beforeAll } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PortfolioDocument, EMPTY_FORM_DATA } from "@/components/portfolio/render/PortfolioDocument";
import { THEME_IDS, type PortfolioData } from "@/components/portfolio/types";

beforeAll(() => {
  const w = window as unknown as Record<string, unknown>;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
});

const data = {
  formData: { ...EMPTY_FORM_DATA, heroFirstName: "A", aboutText: "Teks tentang.", aboutYearsExp: "987", aboutProjectsDone: "654", aboutClientsHappy: "321" },
  projects: [], experiences: [], educations: [], certifications: [], organizations: [], hobbies: [], testimonials: [], extraLinks: [],
} as unknown as PortfolioData;

function aboutHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.querySelector('[data-section-id="about"]')?.innerHTML ?? "";
}

describe("statistik tidak dobel", () => {
  it.each(THEME_IDS)("%s: About tanpa angka saat Statistik terlihat", (id) => {
    const html = renderToStaticMarkup(<PortfolioDocument themeId={id} data={data} mode="static" />);
    const about = aboutHtml(html);
    expect(about).toContain("tentang.");
    expect(about).not.toMatch(/987|654|321/);
  });
  it("Statistik disembunyikan: About boleh menampilkan angka seperti sebelumnya", () => {
    const html = renderToStaticMarkup(<PortfolioDocument themeId="minimalist" data={data} mode="static" sectionVisibility={{ stats: false }} />);
    expect(aboutHtml(html)).toContain("987");
  });
});
