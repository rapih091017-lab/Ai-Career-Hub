import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("@/db", () => ({
  db: { select: vi.fn() },
}));

import { buildHtmlDocument } from "@/lib/portfolio/export-html";

const markup = '<div data-theme="brutal"><h1>Teguh</h1></div>';

describe("buildHtmlDocument", () => {
  it("menghasilkan dokumen HTML lengkap", () => {
    const html = buildHtmlDocument(markup, "brutal");
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<html lang="id">');
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
  });

  it("menyisipkan style inline, bukan stylesheet eksternal", () => {
    const html = buildHtmlDocument(markup, "brutal");
    expect(html).toMatch(/<style>/);
    expect(html).not.toMatch(/rel="stylesheet"\s+href="[^"]*\.css"/);
  });

  it("memuat font tema lewat Google Fonts", () => {
    expect(buildHtmlDocument(markup, "luxe")).toContain("fonts.googleapis.com");
  });

  it("menyertakan gaya cetak", () => {
    expect(buildHtmlDocument(markup, "glass")).toContain("@media print");
  });

  it("meloloskan markup mentah tanpa meng-escape", () => {
    expect(buildHtmlDocument(markup, "glass")).toContain("<h1>Teguh</h1>");
  });

  it("meloloskan judul ke-escape", () => {
    const html = buildHtmlDocument(markup, "glass", '"><script>alert(1)</script>');
    expect(html).not.toContain('"><script>alert(1)</script>');
  });

  it("memakai warna latar dari tema", () => {
    expect(buildHtmlDocument(markup, "brutal")).toContain("#FFFAF0");
  });
});

describe("preview tidak lagi membangun HTML sendiri", () => {
  it("generateExportHtml sudah dihapus", () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/portfolio/preview/page.tsx"),
      "utf8",
    );
    expect(src).not.toContain("generateExportHtml");
    expect(src).not.toContain("<!DOCTYPE html>");
    expect(src).toContain("/api/portfolio/export");
  });
});
