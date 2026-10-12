import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children?: ReactNode } & Record<string, unknown>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import PortfolioDocument, { EMPTY_FORM_DATA } from "@/components/portfolio/render/PortfolioDocument";
import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
import { THEME_IDS, type PortfolioData, type ThemeId } from "@/components/portfolio/types";

beforeAll(() => {
  const w = window as unknown as Record<string, unknown>;
  w.matchMedia = () =>
    ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  w.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
});

function thumbnailData(first: string, last: string, headline: string, sub: string, bio: string): PortfolioData {
  return {
    formData: { ...EMPTY_FORM_DATA, heroFirstName: first, heroLastName: last, heroHeadline: headline, heroSubHeadline: sub, heroBio: bio },
    projects: [], experiences: [], educations: [], certifications: [], organizations: [], hobbies: [], testimonials: [], extraLinks: [],
  } as unknown as PortfolioData;
}

const HERO_ONLY: Record<ThemeId, PortfolioData> = {
  glass: thumbnailData("Alex", "Morgan", "Full-Stack Developer", "Designing scalable digital ecosystems", "Antarmuka cepat dengan arsitektur modern."),
  brutal: thumbnailData("Riley", "K.", "Creative Developer & Motion Designer", "Breaking boundaries with code", "Eksperimen interaksi web dan gerak."),
  luxe: thumbnailData("Maya", "Chen", "UI/UX Designer & Brand Strategist", "Crafting human-centered experiences", "Masalah rumit jadi produk yang enak dipakai."),
};

const RICH: PortfolioData = {
  formData: {
    ...EMPTY_FORM_DATA,
    heroFirstName: "Alex", heroLastName: "Morgan", heroHeadline: "Full-Stack Developer",
    heroSubHeadline: "Designing scalable digital ecosystems",
    heroBio: "Antarmuka cepat dengan arsitektur modern.",
    aboutText: "Sembilan tahun membangun produk digital untuk tim lintas negara.",
    aboutYearsExp: "9", aboutProjectsDone: "24", aboutClientsHappy: "18",
    skillsMain: "TypeScript, React, Node", skillsTools: "Figma, Playwright", skillsLanguages: "ID, EN",
    contactEmail: "alex@example.com", contactLinkedin: "linkedin.com/in/alex",
  },
  projects: [
    { id: "p1", name: "Portal Rekrutmen", description: "Portal karier untuk 40 kampus.", techStack: "Next.js, Postgres", link: "" },
    { id: "p2", name: "Dompet", description: "Pembayaran roommates.", techStack: "Node", link: "" },
    { id: "p3", name: "Peta", description: "Dashboard logistik.", techStack: "React", link: "" },
  ],
  experiences: [
    { id: "e1", company: "Studio Nusantara", position: "Lead Engineer", startDate: "2023", endDate: "2026", description: "Mengsatukan enam tim produk.", isPresent: true },
    { id: "e2", company: "Karya Digital", position: "Frontend Dev", startDate: "2021", endDate: "2023", description: "Migrasi design system." },
    { id: "e3", company: "Freelance", position: "Developer", startDate: "2020", endDate: "2021", description: "Aplikasi internal." },
  ],
  educations: [{ id: "ed1", institution: "Universitas Indonesia", degree: "S1", field: "Informatika", startDate: "2016", endDate: "2020" }],
  certifications: [{ id: "c1", name: "AWS SAA", issuer: "Amazon", year: "2024" }],
  organizations: [{ id: "o1", name: "DevSquad", role: "Mentor", period: "2022-2025", description: "Kelas frontend." }],
  hobbies: [{ id: "h1", name: "Fotografi", description: "Jalan pagi" }],
  testimonials: [{ id: "t1", name: "Rina", position: "Product Manager", testimonial: "Kerja paling rapi yang saya temui." }],
  extraLinks: [],
} as unknown as PortfolioData;

function card(id: ThemeId, data: PortfolioData, width = 360): string {
  const { container } = render(<PortfolioDocument themeId={id} data={data} mode="static" />);
  return `<figure style="margin:0;width:${width}px">
  <div data-thumb-viewport style="position:relative;width:100%;overflow:hidden;background:${THEMES[id].colors.bg};height:220px">
    <style>[data-thumb-viewport] [data-section-id="hero"]{display:none !important}</style>
    <div aria-hidden="true" style="position:absolute;top:0;left:0;transform:scale(0.8);transform-origin:top left;width:calc(100% / 0.8)">
      ${container.innerHTML}
    </div>
  </div>
  <figcaption style="font:14px system-ui;color:#111">${THEMES[id].name}</figcaption>
</figure>`;
}

function shell(title: string, body: string): string {
  // Meniru kondisi "tanpa JS": fallback noscript repo (STATIC_REVEAL_FALLBACK_CSS)
  // diaktifkan sebagai <style> biasa, karena di harness JS hidup dan
  // <noscript> tidak berlaku sehingga motion initial opacity:0 tidak pernah dibuka.
  const reveal = `[data-mode="static"] [style*="opacity:0;"],[data-mode="static"] [style$=";opacity:0"],[data-mode="static"] [style="opacity:0"],[data-mode="static"] [style*="opacity: 0;"],[data-mode="static"] [style$=";opacity: 0"],[data-mode="static"] [style="opacity: 0;"]{opacity:1 !important;transform:none !important}`;
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>${title}</title>
<link rel="stylesheet" href="/_next/static/css/app/layout.css">
<style>${reveal}
body{margin:0;background:#777} .row{display:flex;gap:16px;padding:12px;align-items:flex-start}
h1,h2,h3,p,span,li,div{max-width:100%}</style>
</head><body><div class="row">${body}</div></body></html>`;
}

describe.skipIf(process.env.QA_HARNESS !== "1")("harness visual tema", () => {
  it("tulis 3 halaman tema penuh + 1 halaman kartu ke direktori temp", () => {
    // Ditulis ke temp, bukan public/: file QA tidak boleh ikut ter-deploy.
    const dir = join(tmpdir(), "portfolio-qa");
    mkdirSync(dir, { recursive: true });

    for (const id of THEME_IDS) {
      const { container } = render(
        <PortfolioDocument themeId={id} data={RICH} mode="static" />,
      );
      const full = shell(`${id} penuh`, `<div style="width:1100px">${container.innerHTML}</div>`);
      writeFileSync(join(dir, `qa-theme-${id}.html`), full, "utf8");
    }

    const rowA = THEME_IDS.map((id) => card(id, HERO_ONLY[id])).join("");
    const rowB = THEME_IDS.map((id) => card(id, RICH)).join("");
    writeFileSync(
      join(dir, "qa-theme-cards.html"),
      shell("kartu picker", `<div><p style="font:13px system-ui;color:#fff;margin:0 0 6px">A — fixture sekarang (hero saja)</p><div class="row">${rowA}</div></div>
<div><p style="font:13px system-ui;color:#fff;margin:12px 0 6px">B — fixture dengan semua section terisi</p><div class="row">${rowB}</div></div>`),
      "utf8",
    );

    for (const id of THEME_IDS) {
      const { container } = render(<PortfolioDocument themeId={id} data={RICH} mode="static" />);
      writeFileSync(
        join(dir, `qa-theme-${id}.html`),
        shell(`${id} penuh`, `<div style="width:1100px">${container.innerHTML}</div>`),
        "utf8",
      );
    }
  });
});



