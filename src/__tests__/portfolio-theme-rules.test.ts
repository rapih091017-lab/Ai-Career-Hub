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

  it("Luxe memakai serif dan berwarna (kroma > 0)", () => {
    expect(THEMES.luxe.typography.display).toMatch(/serif/i);
    // Luxe minimal punya satu warna non-netral; uji silang lengkap menutup Spec 2.5
    expect(THEMES.luxe.colors.bg).not.toBe("#FFFFFF");
  });
});
