/**
 * Uji paritas pratinjau ↔ PDF builder CV.
 *
 * Jalankan: PDF_CHROME_PATH=/path/ke/chrome npx tsx --tsconfig scripts/tsconfig.cv-parity.json scripts/cv-pdf-parity.tsx
 *
 * Untuk tiap fixture:
 *  1. PDF dibuat persis seperti route /api/cv-documents/[id]/pdf
 *     (buildCvPdfHtml + printStandaloneHtml).
 *  2. Pratinjau (CvPagedPreview + AtsBaseRenderer) dirender di Chromium,
 *     tiap halaman di-screenshot.
 *  3. Halaman PDF dirasterisasi dengan pdfjs-dist pada skala yang sama,
 *     lalu dibandingkan piksel per halaman. Lulus bila selisih < 0,5%.
 *  4. Teks PDF diekstrak dengan pdf-parse (harus bisa dibaca).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { AtsBaseRenderer, type CvData } from "@/components/cv-templates";
import { CvPagedPreview } from "@/components/cv-templates/print";
import { cvRenderProps, type CvPrintFormat } from "@/lib/cv-print-format";
import { buildCvPdfHtml, embeddedFontCss } from "@/lib/pdf/cv-html";
import { launchPdfBrowser, printStandaloneHtml } from "@/lib/pdf/chromium";
import { resolveCvFont } from "@/lib/cv-fonts";
import { sampleCv } from "@/__tests__/cv-pdf.fixture";

const SCALE = 2; // device pixel ratio screenshot = skala raster PDF
const PX_TOLERANCE = 64; // selisih kanal maksimum yang dianggap sama (anti-alias)
const MAX_DIFF_RATIO = 0.005;

const longCv: CvData = {
  ...sampleCv,
  workHistory: Array.from({ length: 7 }, (_, i) => ({
    id: `w${i}`,
    position: `Engineer Level ${i + 1}`,
    company: `PT Contoh Perusahaan ${i + 1}`,
    location: "Jakarta",
    startDate: `20${10 + i}-01`,
    endDate: `20${11 + i}-12`,
    description: Array.from(
      { length: 5 },
      (_, j) => `Poin pencapaian ${j + 1} yang cukup panjang untuk memenuhi satu baris penuh dan sedikit melipat ke baris berikutnya di kertas A4`,
    ).join("\n"),
  })),
};

const fixtures: { name: string; data: CvData; format: CvPrintFormat }[] = [
  { name: "1-halaman", data: sampleCv, format: { fontFamily: "'CV Inter', sans-serif", fontSize: 9, marginMode: "tight", spacingMode: "compact" } },
  { name: "multi-halaman-entri-terbelah", data: longCv, format: { fontFamily: "Arial, sans-serif", fontSize: 11, showDividers: true } },
  { name: "serif-margin-mepet", data: longCv, format: { fontFamily: "'Times New Roman', serif", fontSize: 11, marginMode: "tight", templateId: "executive-serif" } },
];

// Sebagian preflight Tailwind + gaya aplikasi, supaya pratinjau diuji di
// lingkungan yang mirip aplikasi (reset .cv-print harus menetralkannya).
const APP_NOISE = `*,::before,::after{box-sizing:border-box;border:0 solid}html{line-height:1.5;font-family:system-ui,sans-serif;-webkit-font-smoothing:antialiased}body{margin:0;background:#eee}p,h1,h2{margin:0}ul{list-style:none;margin:0;padding:0}h1,h2{font-size:inherit;font-weight:inherit}`;

async function decode(png: Uint8Array) {
  const img = await loadImage(Buffer.from(png));
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

async function rasterizePdf(pdf: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdf), useSystemFonts: false, disableFontFace: true }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: (SCALE * 96) / 72 });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;
    pages.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }
  return pages;
}

async function dump(base: string, a: Img, b: Img) {
  const { writeFile } = await import("node:fs/promises");
  for (const [suffix, img] of [["pratinjau", a], ["pdf", b]] as const) {
    const c = createCanvas(img.width, img.height);
    const ctx = c.getContext("2d");
    const id = ctx.createImageData(img.width, img.height);
    id.data.set(img.data);
    ctx.putImageData(id, 0, 0);
    await writeFile(`${base}-${suffix}.png`, c.toBuffer("image/png"));
  }
}

type Img = { width: number; height: number; data: Uint8ClampedArray };
/**
 * Selisih piksel per halaman. Halaman dibagi pita horizontal setinggi
 * BAND px; tiap pita boleh bergeser ±3 px perangkat (= ±1,5px CSS) dan
 * memakai pergeseran dengan selisih terkecil. Alasannya: layar membulatkan
 * posisi baris ke grid piksel, cetak tidak, jadi baris bisa meleset 1px CSS
 * tanpa beda tata letak. Pergeseran lebih besar (baris/entri pindah) tetap
 * terhitung sebagai selisih. Pergeseran terbesar yang dipakai dilaporkan.
 */
const BAND = 48;
function diffRatio(a0: Img, b0: Img): { ratio: number; maxShift: number } {
  const a = blur(a0);
  const b = blur(b0);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  let diff = 0;
  let maxShift = 0;
  for (let y0 = 3; y0 < h - 3; y0 += BAND) {
    const y1 = Math.min(h - 3, y0 + BAND);
    let best = Infinity;
    let shift = 0;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const d = diffBand(a, b, y0, y1, w, dx, dy);
        if (d < best) {
          best = d;
          shift = Math.max(Math.abs(dx), Math.abs(dy));
        }
      }
    diff += best;
    maxShift = Math.max(maxShift, shift);
  }
  return { ratio: diff / ((w - 6) * (h - 6)), maxShift };
}

function diffBand(a: Img, b: Img, y0: number, y1: number, w: number, dx: number, dy: number) {
  let diff = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = 3; x < w - 3; x++) {
      const ia = (y * a.width + x) * 4;
      const ib = ((y + dy) * b.width + (x + dx)) * 4;
      if (Math.abs(a.data[ia] - b.data[ib]) > PX_TOLERANCE) diff++;
    }
  }
  return diff;
}

/**
 * Blur kotak 3×3 (luminans). Teks Chromium (Skia, hinting layar) dan pdfjs
 * (glyph sebagai path) beda anti-alias di tepi glyph; blur meredam tepi itu
 * tanpa menyembunyikan glyph/baris yang bergeser.
 */
function blur(img: Img): Img {
  const { width: w, height: h, data } = img;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) sum += lum[(y + j) * w + x + i];
      const v = sum / 9;
      const o = (y * w + x) * 4;
      out[o] = out[o + 1] = out[o + 2] = v;
    }
  return { width: w, height: h, data: out };
}

async function main() {
  const { PDFParse } = await import("pdf-parse");
  const browser = await launchPdfBrowser();
  let failed = false;
  try {
    for (const fx of fixtures) {
      const { marginMm, ...props } = cvRenderProps(fx.data, fx.format);
      const pdf = await printStandaloneHtml(await buildCvPdfHtml(props, marginMm));
      const pdfPages = await rasterizePdf(pdf);

      // Pratinjau: font yang sama (byte identik) + simulasi halaman.
      const fontCss = await embeddedFontCss([resolveCvFont(props.style.bodyFont)]);
      const markup = renderToStaticMarkup(
        <CvPagedPreview pageCount={pdfPages.length + 1} marginMm={marginMm} pageGapPx={0}>
          <AtsBaseRenderer {...props} onSectionClick={() => {}} />
        </CvPagedPreview>,
      );
      const page = await browser.newPage();
      await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: SCALE });
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${APP_NOISE}\n${fontCss}</style></head><body>${markup}</body></html>`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const measured = await page.evaluate(() => {
        const el = document.querySelector('[data-cv-page="1"] .cv-print') as HTMLElement;
        const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
        return Math.max(1, Math.round((el.scrollWidth + gap) / (el.clientWidth + gap)));
      });

      const ratios: string[] = [];
      for (let i = 0; i < Math.min(measured, pdfPages.length); i++) {
        const el = await page.$(`[data-cv-page="${i + 1}"]`);
        const shot = await el!.screenshot({ type: "png" });
        const prev = await decode(shot);
        const { ratio: r, maxShift } = diffRatio(prev, pdfPages[i]);
        if (process.env.PARITY_DUMP) await dump(`${process.env.PARITY_DUMP}/${fx.name}-${i + 1}`, prev, pdfPages[i]);
        ratios.push(`${(r * 100).toFixed(3)}% (geser maks ${maxShift}px)`);
        if (r >= MAX_DIFF_RATIO) failed = true;
      }
      await page.close();

      const parser = new PDFParse({ data: new Uint8Array(pdf) });
      const text = (await parser.getText()).text;
      await parser.destroy();
      const lower = text.toLowerCase();
      const textOk = lower.includes(fx.data.fullName.toLowerCase()) && lower.includes(fx.data.workHistory[0].company.toLowerCase());
      if (measured !== pdfPages.length || !textOk) failed = true;

      console.log(
        `${fx.name}: halaman pratinjau=${measured} pdf=${pdfPages.length} | selisih piksel per halaman: ${ratios.join(", ")} | teks PDF terbaca: ${textOk ? "ya" : "TIDAK"}`,
      );
    }
  } finally {
    await browser.close();
  }
  if (failed) {
    console.error("GAGAL: paritas pratinjau ↔ PDF di luar batas.");
    process.exit(1);
  }
  console.log("LULUS: semua halaman < 0,5% selisih piksel.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
