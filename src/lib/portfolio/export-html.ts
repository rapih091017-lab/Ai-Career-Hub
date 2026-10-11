import { esc } from "@/lib/portfolio-safety";
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
<title>${esc(title)}</title>
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
  for (const e of data.experiences) {
    push(e.imageUrl);
    push(e.companyLogo);
  }
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
    experiences: data.experiences.map((e) => {
      if (!e.imageUrl && !e.companyLogo) return e;
      return {
        ...e,
        imageUrl: e.imageUrl ? swap(e.imageUrl) : e.imageUrl,
        companyLogo: e.companyLogo ? swap(e.companyLogo) : e.companyLogo,
      };
    }),
  };
}
