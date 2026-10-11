import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("entry point builder", () => {
  it("halaman build/[draftId] ada", () => {
    expect(existsSync(join(process.cwd(), "src/app/portfolio/build/[draftId]/page.tsx"))).toBe(true);
  });

  it("live builder menjadi pengalihan, bukan editor kedua", () => {
    const src = read("src/app/portfolio/live/page.tsx");
    expect(src).toContain("router.replace");
    expect(src).not.toContain("portfolio_live_data");
  });

  it("tidak ada lagi kunci localStorage lama", () => {
    const files = [
      "src/app/portfolio/build/page.tsx",
      "src/app/portfolio/live/page.tsx",
      "src/app/portfolio/preview/page.tsx",
    ];
    for (const f of files) {
      const src = read(f);
      expect(src).not.toContain('"portfolio_draft"');
      expect(src).not.toContain('"portfolio_live_data"');
    }
  });

  it("halaman portfolio tidak lagi menawarkan tombol Live Builder", () => {
    expect(read("src/app/portfolio/page.tsx")).not.toContain("/portfolio/live");
  });
});
