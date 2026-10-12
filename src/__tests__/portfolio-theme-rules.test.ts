import { describe, it, expect } from "vitest";
import { THEMES, TEMPLATE_PREVIEWS } from "@/components/portfolio/themes";
import { THEME_IDS } from "@/components/portfolio/types";

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
