import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { THEMES, TEMPLATE_PREVIEWS } from "@/components/portfolio/themes";
import { THEME_IDS } from "@/components/portfolio/types";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";

describe("token layer", () => {
  it("THEME_IDS dan Object.keys(THEMES) saling paritas", () => {
    expect([...THEME_IDS].sort()).toEqual(Object.keys(THEMES).sort());
    expect(Object.keys(TEMPLATE_PREVIEWS).sort()).toEqual([...THEME_IDS].sort());
  });

  it("setiap tema punya token lengkap", () => {
    for (const id of THEME_IDS) {
      const t = THEMES[id];
      for (const group of ["radii", "blur", "shadow", "typography", "focusRing"] as const) {
        expect(t[group], `tema ${id} kehilangan ${group}`).toBeDefined();
      }
      expect(t.radii.card).toBeTruthy();
      expect(t.typography.display).toBeTruthy();
      expect(t.focusRing.color).toBeTruthy();
    }
  });

  it("cssVars sudah dihapus dari definisi", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const types = readFileSync(join(process.cwd(), "src/components/portfolio/types.ts"), "utf8");
    const themes = readFileSync(join(process.cwd(), "src/components/portfolio/themes.ts"), "utf8");
    expect(types).not.toContain("cssVars");
    expect(themes).not.toContain("cssVars");
  });

  it("signature tema sesuai spec (brutal radius 0, luxe tanpa shadow, glass blur terisi)", () => {
    expect(THEMES.brutal.radii.card).toBe("0");
    expect(THEMES.brutal.radii.button).toBe("0");
    expect(THEMES.brutal.radii.pill).toBe("0");
    expect(THEMES.brutal.radii.image).toBe("0");
    expect(THEMES.luxe.shadow.card).toBe("none");
    expect(THEMES.glass.blur.card).toBeTruthy();
  });

  it("tema minimal: monokrom, radius 0, tanpa bayangan, font Google", () => {
    const m = THEMES.minimalist;
    expect(m.colors.bg).toBe("#FFFFFF");
    expect(m.colors.text).toBe("#111111");
    expect(m.colors.primary).toBe("#111111");
    expect(m.colors.onPrimary).toBe("#FFFFFF");
    expect(m.radii.card).toBe("0");
    expect(m.shadow.card).toBe("none");
    expect(m.blur.card).toBe("none");
    expect(m.fontUrl).toContain("fonts.googleapis.com");
    expect(m.fontUrl).toContain("Instrument+Sans");
    expect(m.typography.display).toContain("Instrument Sans");
  });

  it("token circle ada di semua tema (lingkaran hero tidak boleh literal)", () => {
    for (const id of THEME_IDS) {
      expect(THEMES[id].radii.circle, `tema ${id} tidak punya radii.circle`).toBeTruthy();
    }
  });

  it("focusRing tidak lagi memakai teal app", () => {
    for (const id of THEME_IDS) {
      expect(THEMES[id].focusRing.color.toLowerCase()).not.toBe("#0d7377");
    }
  });
});

const SECTIONS_DIR = join(process.cwd(), "src/components/portfolio/sections");
const RENDER_DIR = join(process.cwd(), "src/components/portfolio/render");

/** Literal yang dilarang — wajib lewat token tema. */
const BANNED: { label: string; re: RegExp }[] = [
  { label: "rounded-*", re: /\brounded-(full|[a-z0-9]+)\b/ },
  { label: "rounded bracket", re: /\brounded-\[[^\]]+\]/ },
  { label: "shadow-*", re: /\bshadow-(xs|sm|md|lg|xl|2xl|inner|none|premium[\w-]*|\[[^\]]+\])/ },
  { label: "backdrop-blur*", re: /\bbackdrop-blur\b/ },
  { label: "borderRadius literal", re: /borderRadius:\s*["'`]/ },
  // Jangkarnya kunci, bukan kutip: nilai literal masih tertangkap walau
  // diawali kondisi (boxShadow dengan ternary lalu template). Berhenti di
  // koma supaya baris gaya ber-token lalu properti lain tetap lolos.
  { label: "boxShadow literal", re: /boxShadow:\s*[^,;\n]*["'`]/ },
  { label: "backdropFilter literal", re: /backdropFilter:\s*["'`]/ },
  { label: "inline fontFamily", re: /fontFamily:\s*["'`]/ },
  { label: "hex warna", re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6})\b/ },
];

const sourceFiles = [
  ...readdirSync(SECTIONS_DIR).map((f) => join(SECTIONS_DIR, f)),
  ...readdirSync(RENDER_DIR).filter((f) => f.endsWith(".tsx")).map((f) => join(RENDER_DIR, f)),
];

function stripAllowed(src: string): string {
  // allowlist putih; komentar diabaikan agar aturan tidak menangkap diskusi
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/#fff(?:fff)?\b/gi, "");
}

describe("Layer A: larangan literal di section & render", () => {
  it.each(sourceFiles.map((f) => [f]))("%s bebas literal", (file: string) => {
    const name = file.split(/[\\/]/).pop()!;
    const src = stripAllowed(readFileSync(file, "utf8"));
    const found = BANNED.filter((b) => b.re.test(src)).map((b) => b.label);
    expect(found, `${name}: literal terlarang`).toEqual([]);
  });
});

/**
 * Sasaran pass copy publik: frasa Inggris yang pernah muncul sebagai teks
 * tampilan dan kini dilarang kembali. Huruf besar-sensitif supaya identifier
 * seperti `isPresent`/`EducationItem` tidak ikut tertangkap.
 */
const FORBIDDEN_COPY = [
  "View Work", "Get in Touch", "INTRODUCING", "Selected Projects", "View Project",
  "Core Competencies", "Work History", "Send Email", "Kind Words", "About Me",
  "GET IN TOUCH", "Work Together", "always open to discussing",
  "EXPERIENCE", "EDUCATION", "ORGANIZATIONS", "CERTIFICATIONS", "INTERESTS",
  "TESTIMONIALS", "SKILLS", "WORK", "ABOUT",
];

describe("Layer C: copy publik section berbahasa Indonesia", () => {
  const sectionFiles = readdirSync(SECTIONS_DIR).map((f) => join(SECTIONS_DIR, f));
  it.each(sectionFiles.map((f) => [f]))("%s tanpa string Inggris terdeteksi", (file: string) => {
    const name = file.split(/[\\/]/).pop()!;
    const src = stripAllowed(readFileSync(file, "utf8"));
    const found = FORBIDDEN_COPY.filter((w) => src.includes(w));
    expect(found, `${name}: string Inggris tersisa`).toEqual([]);
  });
});

/**
 * Dua API browser yang dipakai section saat merender di jsdom: matchMedia
 * (useReducedMotion dari motion/react) dan IntersectionObserver (whileInView).
 * Tanpa keduanya renderToStaticMarkup melempar, bukan dokumennya yang salah.
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

const miniData = { formData: { heroFirstName: "A", heroLastName: "B", aboutText: "x" } } as never;

function staticFor(id: string) {
  return renderToStaticMarkup(
    createElement(PortfolioDocument, { data: miniData, themeId: id as never, mode: "static" }),
  );
}

describe("Layer B: aturan semantik per tema terlihat di markup", () => {
  it("token data memegang aturan signature", () => {
    for (const id of ["card", "button", "pill", "image"] as const) {
      expect(THEMES.brutal.radii[id]).toBe("0");
    }
    expect(THEMES.glass.blur.card).not.toBe("");
    expect(THEMES.luxe.shadow.card).toBe("none");
  });

  it("markup Glass memuat backdrop blur; Brutal tanpa radius non-nol; Luxe tanpa bayangan", () => {
    const glass = staticFor("glass");
    expect(glass).toContain("backdrop-filter:blur(");
    const brutal = staticFor("brutal");
    const radii = [...brutal.matchAll(/border-radius:\s*([^;"]+)/g)].map((m) => m[1].trim());
    expect(radii.filter((r) => r !== "0" && r !== "0px" && !r.startsWith("9999"))).toEqual([]);
    const luxe = staticFor("luxe");
    const shadows = [...luxe.matchAll(/box-shadow:\s*([^;"]+)/g)].map((m) => m[1].trim());
    expect(shadows.filter((s) => s !== "none" && s !== "")).toEqual([]);
  });

  it("varian minimal tidak memakai kolom tetap (harus auto-fit)", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "src/components/portfolio/sections");
    // Kolom tetap seperti `minmax(120px, 200px) 1fr` tidak menyempit di
    // layar sempit: teks tergencet, dan thumbnail picker jadi pita sempit.
    const fixed = /gridTemplateColumns:\s*"(?![^"]*auto-fit)[^"]*\bminmax\(\s*\d+px/;
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), "utf8");
      if (!src.includes("Minimalist")) continue;
      expect(src.match(fixed), `${f} masih memakai kolom tetap`).toBeNull();
    }
  });

  it("setiap tema punya case eksplisit di switch section (bukan default diam-diam ke glass)", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "src/components/portfolio/sections");
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), "utf8");
      for (const id of THEME_IDS) {
        expect(src, `${f} tidak menangani tema ${id}`).toMatch(new RegExp(`["']${id}["']`));
      }
    }
  });

  it("Luxe memakai serif untuk display (bukan sans yang kebetulan mengandung 'serif')", () => {
    const display = THEMES.luxe.typography.display;
    expect(display).toMatch(/^'Playfair Display',\s*serif/i);
    expect(display.toLowerCase()).not.toContain("sans-serif");
    // Luxe harus berwarna (kromatik) — uji silang lengkap menutup Spec 2.5
    expect(THEMES.luxe.colors.bg.toLowerCase()).not.toBe("#ffffff");
  });

  it("Glass dan Brutal memakai sans-serif untuk display", () => {
    expect(THEMES.glass.typography.display.toLowerCase()).toContain("sans-serif");
    expect(THEMES.brutal.typography.display.toLowerCase()).toContain("sans-serif");
    expect(THEMES.brutal.typography.display.toLowerCase()).not.toContain("playfair");
  });
});

describe("font tema", () => {
  it("semua fontUrl memakai origin Google Fonts", () => {
    for (const id of THEME_IDS) {
      expect(THEMES[id].fontUrl, `fontUrl ${id}`).toContain("fonts.googleapis.com");
      expect(THEMES[id].fontUrl).not.toContain("cdnfonts");
    }
  });

  it("ThemeFonts ada dan dipasang di preview (kedua cabang render)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const comp = readFileSync(
      join(process.cwd(), "src/components/portfolio/render/ThemeFonts.tsx"), "utf8");
    expect(comp).toContain('rel="stylesheet"');
    expect(comp).toContain("preconnect");
    const preview = readFileSync(join(process.cwd(), "src/app/portfolio/preview/page.tsx"), "utf8");
    const mounts = preview.match(/<ThemeFonts /g) ?? [];
    // cabang print + cabang utama
    expect(mounts.length).toBeGreaterThanOrEqual(2);
  });

  it("export tidak lagi merujuk cdnfonts", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/portfolio/export-html.ts"), "utf8");
    expect(src).not.toContain("cdnfonts");
  });
});
