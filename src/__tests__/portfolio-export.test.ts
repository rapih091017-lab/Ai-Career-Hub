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

/* ─── Pengunci perbaikan: sumber draftId & visibilitas error ─── */

describe("alur ekspor preview", () => {
  const preview = readFileSync(
    join(process.cwd(), "src/app/portfolio/preview/page.tsx"),
    "utf8",
  );

  it("mengambil draftId dari API draft, bukan sumber yang tidak ada", () => {
    // Regresi: draftId pernah dibaca dari ?draftId= dan localStorage
    // "portfolio_draft_id" yang tidak pernah ditulis di mana pun →
    // selalu kosong → route 400 → tombol ekspor mati diam-diam.
    expect(preview).not.toContain("portfolio_draft_id");
    expect(preview).not.toContain('params.get("draftId")');
    expect(preview).toContain('fetch("/api/portfolio/draft")');
  });

  it("menyinkronkan data preview ke draft server sebelum ekspor", () => {
    // Supaya isi file == yang dilihat user, data preview harus dikirim
    // (PATCH bila sudah ada draft, POST bila belum) sebelum minta ekspor.
    expect(preview).toContain('method: latest?.draftId ? "PATCH" : "POST"');
  });

  it("menampilkan error ekspor yang bisa dibaca user", () => {
    // Regresi: exportError pernah ditulis tapi tidak pernah dirender.
    expect(preview).toContain('role="alert"');
    expect(preview).toContain("exportError ?");
  });

  it("memakai kunci i18n, bukan string hardcoded / fallback Inggris", () => {
    expect(preview).not.toContain('|| "Exporting..."');
    expect(preview).toContain('t("preview.exporting")');
    expect(preview).toContain('t("preview.export-error")');
  });

  const i18n = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");
  it("kunci i18n export ada dengan salinan Indonesia", () => {
    expect(i18n).toContain('"preview.exporting": { id: "Mengekspor');
    expect(i18n).toContain('"preview.export-error"');
    expect(i18n).toContain('"preview.export-error-save"');
  });
});

describe("route export meneruskan tampilan yang dilihat user", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/portfolio/export/route.ts"),
    "utf8",
  );

  it("meneruskan sectionOrder, sectionVisibility, dan fontSize", () => {
    expect(route).toContain("sectionOrder:");
    expect(route).toContain("sectionVisibility:");
    expect(route).toContain("fontSize:");
  });

  it("fontSize berasal dari hasil parse schema, bukan jsonb mentah", () => {
    // Regresi: kunci ini pernah dibaca dari jsonb mentah padahal tidak pernah
    // tersimpan (satu-satunya penulis lewat API draft), jadi selalu undefined
    // dan export selalu tampil "medium" apa pun yang dipilih user.
    expect(route).toContain("fontSize: parsed.data.fontSize");
    expect(route).not.toContain("row.data as { fontSize");
  });

  it("portfolioDataSchema mempertahankan fontSize lewat parse", async () => {
    const { portfolioDataSchema } = await import("@/lib/portfolio/schema");
    const formData = {
      heroPhotoUrl: "",
      heroHeadline: "Frontend Developer",
      heroSubHeadline: "",
      heroFirstName: "Teguh",
      heroLastName: "Surya",
      heroBio: "",
      aboutText: "Tentang saya",
      aboutYearsExp: "",
      aboutProjectsDone: "",
      aboutClientsHappy: "",
      skillsMain: "React",
      skillsTools: "",
      skillsLanguages: "",
      contactEmail: "teguh@example.com",
      contactPhone: "",
      contactLinkedin: "",
      contactGithub: "",
    };
    const parsed = portfolioDataSchema.parse({ formData, fontSize: "large" });
    expect(parsed.fontSize).toBe("large");
    expect(portfolioDataSchema.parse({ formData }).fontSize).toBeUndefined();
  });

  it("menolak tema lewat Object.hasOwn, bukan operator in", () => {
    // Regresi: `requested in THEMES` loloskan ?theme=__proto__ lalu
    // THEMES[themeId].colors melempar → 500 dari query yang dibuat user.
    expect(route).toContain("Object.hasOwn(THEMES");
    expect(route).not.toMatch(/requested\s+in\s+THEMES/);
  });

  it("memakai draftId opsi terbaru bila tidak dikirim", () => {
    expect(route).toContain("desc(portfolioDrafts.updatedAt)");
  });
});
