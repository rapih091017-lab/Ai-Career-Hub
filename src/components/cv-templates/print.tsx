import type { ReactNode, Ref } from "react";

/**
 * Geometri & CSS cetak CV yang dipakai bersama oleh pratinjau builder dan
 * HTML PDF di server. Modul ini murni (tanpa effect, window, atau fs) agar
 * bisa dirender lewat renderToStaticMarkup.
 */

export const A4_W_MM = 210;
export const A4_H_MM = 297;
/** Jarak antar kolom di simulasi halaman (tidak terlihat, hanya pemisah). */
const COLUMN_GAP_MM = 20;

/**
 * Reset dasar di dalam `.cv-print`. Pratinjau hidup di dalam aplikasi
 * (Tailwind preflight, font aplikasi), PDF di dokumen kosong. Reset ini
 * membuat kedua lingkungan berangkat dari titik yang sama.
 */
export const CV_PRINT_CSS = `
.cv-print{background:#fff;color:#111;font-feature-settings:normal;font-variation-settings:normal;letter-spacing:normal;text-rendering:auto;-webkit-font-smoothing:auto;-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.cv-print *,.cv-print *::before,.cv-print *::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:currentColor;}
.cv-print p,.cv-print h1,.cv-print h2,.cv-print ul,.cv-print li,.cv-print hr,.cv-print header,.cv-print section{margin:0;padding:0;}
.cv-print h1,.cv-print h2{font-size:inherit;font-weight:inherit;}
.cv-print hr{height:0;color:inherit;}
`;

export const contentWidthMm = (marginMm: number) => A4_W_MM - 2 * marginMm;
export const contentHeightMm = (marginMm: number) => A4_H_MM - 2 * marginMm;

interface PagedPreviewProps {
  /** Jumlah halaman yang ditampilkan (hasil ukur, minimal 1). */
  pageCount: number;
  marginMm: number;
  /** Isi CV (AtsBaseRenderer); dirender sekali per halaman. */
  children: ReactNode;
  /** Ref ke kontainer multikolom halaman pertama, untuk mengukur jumlah halaman. */
  measureRef?: Ref<HTMLDivElement>;
  /** Jarak antar halaman di layar. */
  pageGapPx?: number;
}

/**
 * Simulasi halaman A4 di pratinjau.
 *
 * Isi CV dialirkan ke kontainer multikolom setinggi area konten satu halaman
 * (297mm − 2×margin). Chromium memecah multikolom dengan mesin fragmentasi
 * yang sama dengan cetak, jadi `break-inside: avoid` dan `break-after: avoid`
 * berlaku sama seperti di PDF. Halaman ke-k menampilkan kolom ke-k lewat
 * translateX. Tiap halaman merender alur yang sama; halaman selain pertama
 * diberi inert + aria-hidden agar isi ganda tidak bisa difokus atau dibaca.
 * Klik edit section hanya bekerja di halaman pertama.
 */
export function CvPagedPreview({ pageCount, marginMm, children, measureRef, pageGapPx = 16 }: PagedPreviewProps) {
  const w = contentWidthMm(marginMm);
  const h = contentHeightMm(marginMm);
  return (
    <div className="cv-paged" style={{ display: "flex", flexDirection: "column", gap: pageGapPx }}>
      <style dangerouslySetInnerHTML={{ __html: CV_PRINT_CSS }} />
      {Array.from({ length: Math.max(1, pageCount) }, (_, k) => (
        <div
          key={k}
          data-cv-page={k + 1}
          // Halaman k>0 hanya salinan visual: tidak bisa difokus/diklik, tidak dibaca pembaca layar.
          aria-hidden={k > 0 ? true : undefined}
          inert={k > 0 ? true : undefined}
          style={{
            width: `${A4_W_MM}mm`,
            height: `${A4_H_MM}mm`,
            padding: `${marginMm}mm`,
            boxSizing: "border-box",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div style={{ width: `${w}mm`, height: `${h}mm`, overflow: "hidden" }}>
            <div
              ref={k === 0 ? measureRef : undefined}
              className="cv-print"
              style={{
                width: `${w}mm`,
                height: `${h}mm`,
                columnWidth: `${w}mm`,
                columnCount: "auto",
                columnGap: `${COLUMN_GAP_MM}mm`,
                columnFill: "auto",
                transform: k > 0 ? `translateX(-${k * (w + COLUMN_GAP_MM)}mm)` : undefined,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Jumlah halaman dari kontainer multikolom hasil `CvPagedPreview`. */
export function measurePageCount(el: HTMLElement): number {
  const colW = el.clientWidth;
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  if (!(colW > 0)) return 1;
  return Math.max(1, Math.round((el.scrollWidth + gap) / (colW + gap)));
}

/** Dokumen HTML lengkap untuk dicetak Chromium. `body` = markup AtsBaseRenderer. */
export function cvPrintHtml({ body, marginMm, fontCss, title }: { body: string; marginMm: number; fontCss: string; title?: string }): string {
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(title || "CV")}</title><style>
${fontCss}
@page{size:A4;margin:${marginMm}mm;}
html,body{margin:0;padding:0;background:#fff;}
${CV_PRINT_CSS}
</style></head><body><div class="cv-print">${body}</div></body></html>`;
}
