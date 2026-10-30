import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { countPages } from "@/lib/builder-format";

describe("countPages", () => {
  const mm = 257; // A4 dengan margin 20 mm
  const pagePx = mm * (96 / 25.4);
  it("menghitung halaman dari tinggi konten", () => {
    expect(countPages(pagePx - 1, mm)).toBe(1);
    expect(countPages(pagePx + 1, mm)).toBe(2);
  });
  it("tinggi 0/invalid → 1", () => {
    expect(countPages(0, mm)).toBe(1);
    expect(countPages(NaN, mm)).toBe(1);
  });
});

describe("ResizeObserver builder", () => {
  it("effect punya deps (tidak jalan tiap render)", () => {
    const src = readFileSync(path.join(process.cwd(), "src/app/builder/[id]/page.tsx"), "utf8");
    expect(src).toContain("}, [pageContentAreaMm, contentMounted]);");
    expect(src).toContain("return () => ro.disconnect();");
  });
});
