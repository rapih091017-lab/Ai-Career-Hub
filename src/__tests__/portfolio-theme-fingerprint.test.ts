import { describe, it, expect, beforeAll } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";
import { DEFAULT_SECTION_ORDER } from "@/components/portfolio/themes";
import type { SectionId, ThemeId } from "@/components/portfolio/types";

/**
 * Potongan sumber per `case "<tema>":` tidak dipakai: di tiap file section
 * cabang case hanya berbeda nama komponen (`return <GlassX />` vs
 * `return <BrutalX />`), jadi bedanya kosmetik dan tidak menjamin komposisi
 * beda. Fingerprint diambil dari render nyata: struktur tag HTML per tema.
 */
const THEME_IDS: readonly ThemeId[] = ["glass", "brutal", "luxe", "interstella", "sherbet"];

/**
 * Dua API browser yang dipakai section di jsdom: matchMedia (useReducedMotion
 * dari motion/react) dan IntersectionObserver (whileInView). Tanpa keduanya
 * renderToStaticMarkup melempar.
 */
beforeAll(() => {
  const w = window as unknown as Record<string, unknown>;
  w.matchMedia = () =>
    ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }) as unknown as MediaQueryList;
  w.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
});

/** Data minimal yang tetap membuat dua belas section merender isi (bukan null). */
const richData = {
  formData: {
    heroPhotoUrl: "",
    heroHeadline: "Headline",
    heroSubHeadline: "Subheadline",
    heroFirstName: "A",
    heroLastName: "B",
    heroBio: "Bio singkat",
    aboutText: "Teks tentang saya",
    aboutYearsExp: "4",
    aboutProjectsDone: "10",
    aboutClientsHappy: "5",
    skillsMain: "React,Vue",
    skillsTools: "Vite",
    skillsLanguages: "TypeScript",
    contactEmail: "a@b.com",
    contactPhone: "+6281234567",
    contactLinkedin: "https://linkedin.com/in/a",
    contactGithub: "https://github.com/a",
  },
  experiences: [
    {
      id: "e1",
      company: "PT X",
      position: "Dev",
      startDate: "2020-01",
      endDate: "2022-01",
      description: "Deskripsi",
      isPresent: false,
    },
  ],
  educations: [
    {
      id: "ed1",
      institution: "UI",
      degree: "S1",
      field: "TI",
      startDate: "2016-01",
      endDate: "2020-01",
      isPresent: false,
    },
  ],
  projects: [{ id: "p1", name: "Nama", description: "Deskripsi", techStack: "React", link: "" }],
  certifications: [{ id: "c1", name: "AWS CCP", issuer: "AWS", year: "2023" }],
  organizations: [{ id: "o1", name: "HMTI", role: "Ketua", period: "2021", description: "Deskripsi" }],
  hobbies: [{ id: "h1", name: "Fotografi", description: "Deskripsi" }],
  testimonials: [{ id: "t1", name: "Budi", position: "CTO", testimonial: "Mantap sekali" }],
  extraLinks: [{ id: "x1", label: "Blog", url: "https://blog.example.com" }],
} as never;

const markupCache = new Map<string, string>();

function staticFor(id: ThemeId): string {
  const cached = markupCache.get(id);
  if (cached) return cached;
  const html = renderToStaticMarkup(
    createElement(PortfolioDocument, { data: richData, themeId: id, mode: "static" }),
  );
  markupCache.set(id, html);
  return html;
}

function sectionMarkup(themeId: ThemeId, sectionId: SectionId): string {
  const host = document.createElement("div");
  host.innerHTML = staticFor(themeId);
  const el = host.querySelector(`[data-section-id="${sectionId}"]`);
  return el ? el.innerHTML : "";
}

/** Kerangka = urutan tag saja. Teks, atribut, dan style dibuang supaya beda
 *  warna/angka antar tema tidak dihitung beda struktur. */
function skeleton(sectionHtml: string): string {
  const tags: string[] = [];
  for (const m of sectionHtml.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) tags.push(m[1].toLowerCase());
  return tags.join(">");
}

/** Section yang kerangkanya BELUM dibedakan per tema (diisi ulang oleh Task 7). */
const PENDING_SECTIONS: SectionId[] = []; // Task 7 memastikan tetap kosong

describe("DOM-fingerprint: kerangka struktur berbeda antar tema", () => {
  for (const id of DEFAULT_SECTION_ORDER) {
    const run = PENDING_SECTIONS.includes(id) ? it.skip : it;
    run(`${id}: tema menghasilkan kerangka tag berbeda`, () => {
      const skels = THEME_IDS.map((t) => skeleton(sectionMarkup(t, id)));
      expect(
        skels.every(Boolean),
        `${id}: ada tema yang tidak merender section (kerangka kosong, assert jadi bodoh)`,
      ).toBe(true);
      expect(
        new Set(skels).size,
        `${id}: kerangka dua tema identik — komposisi belum dibedakan`,
      ).toBe(THEME_IDS.length);
    });
  }
});
