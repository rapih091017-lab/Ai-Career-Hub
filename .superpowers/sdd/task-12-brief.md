### Task 12: Export HTML dari renderer yang sama

Menggantikan `generateExportHtml` yang sekarang mengabaikan tema dan membuang semua gambar.

**Files:**
- Create: `src/lib/portfolio/export-html.ts`
- Create: `src/app/api/portfolio/export/route.ts`
- Modify: `src/app/portfolio/preview/page.tsx` (hapus generator, sambungkan tombol)
- Test: `src/__tests__/portfolio-export.test.ts`

**Interfaces:**
- Produces:
  - `buildHtmlDocument(markup, themeId, title?): string`
  - `inlineAssets(data, ownerId): Promise<PortfolioData>`
  - `GET /api/portfolio/export?draftId=&theme=` → `text/html` + `Content-Disposition`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-export.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    expect(html).not.toMatch(/rel="stylesheet"/);
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
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-export.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/export-html.ts`**

```ts
import type { ThemeId } from "@/components/portfolio/types";
import type { PortfolioData } from "@/components/portfolio-templates/types";
import { THEMES } from "@/components/portfolio/themes";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { portfolioAssets } from "@/db/schema";

const RESET_CSS = `
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; }
img { max-width: 100%; height: auto; display: block; }
.pf-atmosphere { display: none !important; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  .pf-atmosphere, .pf-chrome { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .pf-section > * { box-shadow: none !important; backdrop-filter: none !important; break-inside: avoid; }
  h1, h2, h3, h4 { break-after: avoid; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.75em; word-break: break-all; }
}`;

function escTitle(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Membungkus markup dari PortfolioDocument menjadi dokumen HTML mandiri.
 * Warna latar dan teks diambil dari tema yang sama dengan halaman publik,
 * sehingga hasil export benar-benar sama dengan yang dilihat user.
 */
export function buildHtmlDocument(
  markup: string,
  themeId: ThemeId,
  title = "Portfolio",
): string {
  const theme = THEMES[themeId];
  const bg = theme?.colors.bg ?? "#ffffff";
  const fg = theme?.colors.text ?? "#111111";
  const fontUrl = theme?.fontUrl ?? "";
  const font = theme?.font ?? "system-ui, sans-serif";

  const fontLinks = fontUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n` +
      `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
      `<link href="${fontUrl}" rel="stylesheet">\n`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escTitle(title)}</title>
${fontLinks}<style>
${RESET_CSS}
body { background: ${bg}; color: ${fg}; font-family: ${font}; }
${PRINT_CSS}
</style>
</head>
<body>
${markup}
</body>
</html>`;
}

const ASSET_RE = /^\/api\/portfolio\/assets\/([0-9a-f-]{36})$/i;

function collectAssetIds(data: PortfolioData): string[] {
  const ids = new Set<string>();
  const push = (v: unknown) => {
    if (typeof v !== "string") return;
    const m = ASSET_RE.exec(v);
    if (m) ids.add(m[1]);
  };
  push(data.formData.heroPhotoUrl);
  for (const p of data.projects) push(p.imageUrl);
  for (const e of data.experiences) push(e.imageUrl);
  return [...ids];
}

/**
 * Mengganti URL aset menjadi data URI supaya file export mandiri.
 * Aset yang hilang tidak menggagalkan export: URL-nya dibiarkan apa adanya
 * dan akan tampil sebagai placeholder.
 */
export async function inlineAssets(
  data: PortfolioData,
  ownerId: string,
): Promise<PortfolioData> {
  const ids = collectAssetIds(data);
  if (ids.length === 0) return data;

  const map = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const [row] = await db
        .select({ mime: portfolioAssets.mime, data: portfolioAssets.data })
        .from(portfolioAssets)
        .where(
          and(eq(portfolioAssets.id, id), eq(portfolioAssets.userId, ownerId)),
        )
        .limit(1);
      if (!row) return;
      map.set(
        `/api/portfolio/assets/${id}`,
        `data:${row.mime};base64,${Buffer.from(row.data).toString("base64")}`,
      );
    }),
  );

  const swap = (v: string) => map.get(v) ?? v;
  return {
    ...data,
    formData: { ...data.formData, heroPhotoUrl: swap(data.formData.heroPhotoUrl) },
    projects: data.projects.map((p) =>
      p.imageUrl ? { ...p, imageUrl: swap(p.imageUrl) } : p,
    ),
    experiences: data.experiences.map((e) =>
      e.imageUrl ? { ...e, imageUrl: swap(e.imageUrl) } : e,
    ),
  };
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-export.test.ts`
Expected: 7 test lulus kecuali yang membaca `preview/page.tsx`, yang masih gagal sampai langkah 6.

- [ ] **Step 5: Buat `src/app/api/portfolio/export/route.ts`**

```tsx
import { NextRequest, NextResponse } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { and, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioDrafts } from "@/db/schema";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";
import { buildHtmlDocument, inlineAssets } from "@/lib/portfolio/export-html";
import { portfolioDataSchema } from "@/lib/portfolio/schema";
import { THEMES } from "@/components/portfolio/themes";
import type { ThemeId } from "@/components/portfolio/types";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const draftId = request.nextUrl.searchParams.get("draftId");
  if (!draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  const [row] = await db
    .select({ data: portfolioDrafts.data, name: portfolioDrafts.name })
    .from(portfolioDrafts)
    .where(
      and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId)),
    )
    .limit(1);

  if (!row) {
    return errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404);
  }

  const parsed = portfolioDataSchema.safeParse(row.data);
  if (!parsed.success) {
    return errorResponse("INVALID_DATA", "Data draft rusak", 400);
  }

  const requested = request.nextUrl.searchParams.get("theme") ?? "glass";
  const themeId = (requested in THEMES ? requested : "glass") as ThemeId;

  const data = await inlineAssets(parsed.data, auth.userId);
  const markup = renderToStaticMarkup(
    <PortfolioDocument data={data} themeId={themeId} mode="static" />,
  );
  const html = buildHtmlDocument(markup, themeId, row.name);

  const filename = `${(row.name || "portfolio")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
```

Bila Next.js menolak JSX di file route, tambahkan `import { createElement } from "react"` dan pakai `createElement(PortfolioDocument, props)`.

- [ ] **Step 6: Hapus `generateExportHtml` dan sambungkan tombol export**

Di `src/app/portfolio/preview/page.tsx`:
- Hapus fungsi `generateExportHtml` beserta import `esc` dan `safeUrl` yang hanya dipakai di sana.
- Ganti handler download:

```tsx
setExporting(true);
setExportError(null);
try {
  const res = await fetch(`/api/portfolio/export?draftId=${draftId}&theme=${themeId}`);
  if (!res.ok) throw new Error();
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name || "portfolio"}.html`.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  a.click();
  URL.revokeObjectURL(url);
} catch {
  setExportError("Export gagal. Coba lagi sebentar.");
} finally {
  setExporting(false);
}
```

- [ ] **Step 7: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/lib/portfolio/export-html.ts src/app/api/portfolio/export/route.ts src/app/portfolio/preview/page.tsx src/__tests__/portfolio-export.test.ts
git commit -m "feat(portfolio): export HTML dari renderer yang sama, gambar inline"
```

---
