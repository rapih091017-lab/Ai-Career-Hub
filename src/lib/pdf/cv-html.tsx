import { readFile } from "node:fs/promises";
import path from "node:path";
import { AtsBaseRenderer } from "@/components/cv-templates";
import { cvPrintHtml } from "@/components/cv-templates/print";
import { CV_FONT_VARIANTS, cvFontFaceCss, cvFontFile, resolveCvFont, type CvFont } from "@/lib/cv-fonts";
import type { CvRenderProps } from "@/lib/cv-print-format";

/** Folder font CV; sama dengan yang dilayani ke peramban di /fonts/cv. */
export const CV_FONT_DIR = path.join(process.cwd(), "public", "fonts", "cv");

const fontCache = new Map<string, string>();

/** @font-face dengan data: URI, hanya untuk font yang dipakai. */
export async function embeddedFontCss(fonts: CvFont[]): Promise<string> {
  const unique = [...new Map(fonts.map((f) => [f.id, f])).values()];
  const files = unique.flatMap((f) => CV_FONT_VARIANTS.map((v) => cvFontFile(f, v)));
  await Promise.all(
    files.map(async (file) => {
      if (fontCache.has(file)) return;
      const buf = await readFile(path.join(CV_FONT_DIR, file));
      fontCache.set(file, `data:font/woff2;base64,${buf.toString("base64")}`);
    }),
  );
  return cvFontFaceCss(unique, (file) => fontCache.get(file)!);
}

/** HTML cetak CV: renderer yang sama dengan pratinjau, mode cetak (tanpa handler edit). */
export async function buildCvPdfHtml(props: CvRenderProps, marginMm: number): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const body = renderToStaticMarkup(<AtsBaseRenderer {...props} />);
  const fontCss = await embeddedFontCss([resolveCvFont(props.style.bodyFont), resolveCvFont(props.style.headingFont)]);
  return cvPrintHtml({ body, marginMm, fontCss, title: props.data.fullName || "CV" });
}
