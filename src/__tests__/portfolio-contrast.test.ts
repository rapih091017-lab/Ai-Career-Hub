import { describe, it, expect } from "vitest";
import { THEMES } from "@/components/portfolio/themes";
import { THEME_IDS } from "@/components/portfolio/types";

/** WCAG 2.1 relative luminance. Hanya hex opak; token transparan dicatat terpisah. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const isHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

describe("WCAG AA per tema", () => {
  it("Sherbet: semua teks di permukaan pastel dan putih memenuhi AA", () => {
    const theme = THEMES.sherbet;
    for (const bg of [theme.colors.bg, theme.colors.bgSecondary, theme.colors.secondary, theme.colors.surface]) {
      for (const fg of [theme.colors.text, theme.colors.textSecondary, theme.colors.textMuted, theme.colors.primary]) {
        expect(contrast(fg, bg), `${fg} di ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(theme.focusRing.color, bg)).toBeGreaterThanOrEqual(3);
    }
  });
  it.each(THEME_IDS)("%s: pasangan teks utama >= 4.5", (id) => {
    const theme = THEMES[id];
    const c = theme.colors;
    const pairs: [string, string][] = [
      ["text", c.text],
      ["textSecondary", c.textSecondary],
      ["textMuted", c.textMuted],
      ["primary", c.primary],
    ];
    for (const [label, value] of pairs) {
      if (!isHex(value)) continue; // token transparan tidak bisa dihitung statis
      expect(contrast(value, c.bg), `${id}.${label} (${value})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(THEME_IDS)("%s: onPrimary di atas primary >= 4.5", (id) => {
    const c = THEMES[id].colors;
    expect(isHex(c.onPrimary), `${id}: onPrimary harus hex opak`).toBe(true);
    expect(contrast(c.onPrimary, c.primary), `${id}: ${c.onPrimary} di ${c.primary}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(THEME_IDS)("%s: focus ring >= 3.0 (WCAG 1.4.11)", (id) => {
    const fr = THEMES[id].focusRing.color;
    expect(isHex(fr), `${id}: focusRing harus hex opak, dapat ${fr}`).toBe(true);
    expect(contrast(fr, THEMES[id].colors.bg), `${id}: focusRing ${fr}`).toBeGreaterThanOrEqual(3);
  });

  it.each(THEME_IDS)("%s: primary tiap sectionColors >= 4.5", (id) => {
    const theme = THEMES[id];
    for (const [section, colors] of Object.entries(theme.sectionColors ?? {})) {
      const primary = (colors as { primary?: string }).primary;
      if (!primary || !isHex(primary)) continue;
      expect(
        contrast(primary, theme.colors.bg),
        `${id}.${section}.primary (${primary})`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
/* ─── Kontras pada render nyata ───
 * Pasangan statis di atas tidak menangkap tinta yang benar-benar dipakai di
 * atas latar accent/secondary/sectionColors (badge, chip, tombol). Bagian ini
 * merender dokumen lengkap per tema, menelusuri warna latar dan teks efektif
 * tiap elemen bertext (warna turunan dan latar semi-transparan dikomposit ke
 * leluhurnya), lalu menguji AA: 4.5 teks normal, 3 teks besar.
 */
type RGBA = [number, number, number, number];

function parseColor(v: string | null | undefined): RGBA | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  return null;
}

function over(top: RGBA, base: RGBA): RGBA {
  const a = top[3];
  return [0, 1, 2].map((i) => top[i] * a + base[i] * (1 - a)).concat(1) as RGBA;
}

const toHex = (c: RGBA) => "#" + c.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { beforeAll } from "vitest";
import { PortfolioDocument, EMPTY_FORM_DATA } from "@/components/portfolio/render/PortfolioDocument";
import type { PortfolioData } from "@/components/portfolio/types";

const RENDER_DATA = {
  formData: {
    ...EMPTY_FORM_DATA,
    heroFirstName: "Laras", heroLastName: "W", heroHeadline: "Product Designer", heroSubHeadline: "Alur pembayaran", heroBio: "Bio singkat.",
    aboutText: "Teks tentang saya.", aboutYearsExp: "5", aboutProjectsDone: "32", aboutClientsHappy: "11",
    skillsMain: "Riset, Desain", skillsTools: "Figma, Maze", skillsLanguages: "Indonesia, Inggris",
    contactEmail: "a@b.com", contactPhone: "+62 812", contactLinkedin: "https://linkedin.com/in/a", contactGithub: "https://github.com/a",
  },
  projects: [1, 2, 3].map((i) => ({ id: `p${i}`, name: `Proyek ${i}`, description: "Deskripsi.", techStack: "Figma, Maze", link: "https://example.com" })),
  experiences: [1, 2, 3].map((i) => ({ id: `e${i}`, company: "PT Contoh", position: "Desainer", startDate: "2020-01", endDate: "2021-01", isPresent: i === 1, description: "Tugas." })),
  educations: [1, 2].map((i) => ({ id: `ed${i}`, institution: "Kampus", degree: "S1", field: "DKV", startDate: "2014", endDate: "2018", description: "Catatan." })),
  certifications: [1, 2, 3].map((i) => ({ id: `c${i}`, name: "Sertifikat", issuer: "Lembaga", year: "2021", link: "" })),
  organizations: [1, 2, 3].map((i) => ({ id: `o${i}`, name: "Komunitas", role: "Koordinator", period: "2021 - 2024", description: "Acara." })),
  hobbies: [1, 2, 3].map((i) => ({ id: `h${i}`, name: `Hobi ${i}`, description: "Catatan" })),
  testimonials: [1, 2].map((i) => ({ id: `t${i}`, name: "Andre", position: "PM", testimonial: "Kerja rapi." })),
  extraLinks: [{ id: "l1", label: "Dribbble", url: "https://dribbble.com/a" }, { id: "l2", label: "Behance", url: "https://behance.net/a" }],
} as unknown as PortfolioData;

describe("WCAG AA pada render nyata", () => {
  beforeAll(() => {
    const w = window as unknown as Record<string, unknown>;
    w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
    w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
  });

  it.each(THEME_IDS)("%s: setiap teks di atas latarnya >= AA", (id) => {
    const html = renderToStaticMarkup(createElement(PortfolioDocument, { themeId: id, data: RENDER_DATA, mode: "static" }));
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    const failures: string[] = [];
    const walk = (el: Element, bg: RGBA, fg: RGBA) => {
      const st = (el as HTMLElement).style;
      if (el.closest("[aria-hidden='true'], svg, noscript, style")) return;
      // Gradien/gambar latar tidak bisa dihitung statis: telusuri anaknya dengan latar yang sama.
      const ownBg = parseColor(st.backgroundColor);
      const nextBg = ownBg && ownBg[3] > 0 ? over(ownBg, bg) : bg;
      const ownFg = parseColor(st.color);
      const nextFg = ownFg ? over(ownFg, nextBg) : fg;
      const opacity = st.opacity ? Number(st.opacity) : 1;
      if (opacity < 1 && opacity > 0) return; // teks dekoratif pudar dikecualikan secara sengaja di tema
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join("").trim();
      if (text) {
        const size = parseFloat(st.fontSize) || 16;
        const weight = Number(st.fontWeight) || (/^(h1|h2|h3|strong|b)$/i.test(el.tagName) ? 700 : 400);
        const large = size >= 24 || (size >= 18.66 && weight >= 700) || /^h[12]$/i.test(el.tagName);
        const ratio = contrast(toHex(nextFg), toHex(nextBg));
        if (ratio < (large ? 3 : 4.5)) failures.push(`${el.closest("[data-section-id]")?.getAttribute("data-section-id")} <${el.tagName.toLowerCase()}> "${text.slice(0, 24)}" ${toHex(nextFg)} di ${toHex(nextBg)} = ${ratio.toFixed(2)}`);
      }
      for (const c of el.children) walk(c, nextBg, nextFg);
    };
    const root = doc.querySelector("[data-theme]")!;
    const c = THEMES[id].colors;
    walk(root, parseColor(c.bg)!, parseColor(c.text)!);
    expect(failures, failures.join("\n")).toEqual([]);
  });
});

import { inkOn } from "@/components/portfolio/ink";

describe("tinta di atas accent tiap section", () => {
  it.each(THEME_IDS)("%s: inkOn(accent/secondary/primary) >= 4.5 untuk tema & sectionColors", (id) => {
    const theme = THEMES[id];
    const sets = [theme.colors, ...Object.values(theme.sectionColors ?? {}).map((p) => ({ ...theme.colors, ...p }))];
    for (const c of sets) {
      for (const bg of [c.accent, c.secondary, c.primary]) {
        if (!isHex(bg)) continue;
        const ink = inkOn(bg, c);
        expect(contrast(ink, bg), `${id}: ${ink} di ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
