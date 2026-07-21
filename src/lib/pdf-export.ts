/**
 * Shared PDF export utilities using html2canvas + jsPDF.
 * Both checker and builder use these functions.
 */

/**
 * Simple PDF export: capture a DOM element and save as PDF.
 * Used by the Checker page.
 * 
 * Strategy: clone the element, expand it to full content height,
 * render with html2canvas, then split into A4 pages.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string = "document.pdf"
): Promise<void> {
  const [html2canvasMod, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const html2canvas = html2canvasMod.default || html2canvasMod;

  // ── Clone element & expand to full content height ──
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Force the clone to be fully visible (no overflow hidden)
  clone.style.overflow = "visible";
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.zIndex = "-1000";
  clone.style.width = element.offsetWidth + "px";
  clone.style.boxShadow = "none";
  clone.style.background = "#ffffff";
  
  // Remove any animation or transition classes that might hide content
  clone.querySelectorAll("[style]").forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.animation = "none";
    htmlEl.style.transition = "none";
  });
  
  document.body.appendChild(clone);
  
  // Wait for fonts to load and layout to settle
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 100));

  // ── Capture with html2canvas ──
  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: clone.scrollWidth,
    height: clone.scrollHeight,
    windowWidth: clone.scrollWidth,
    windowHeight: clone.scrollHeight,
  });

  document.body.removeChild(clone);

  // ── Build PDF ──
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const usableWidth = pdfWidth - margin * 2;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;
  const usablePageHeight = pageHeight - margin * 2;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "PNG", margin, margin, usableWidth, imgHeight);
  heightLeft -= usablePageHeight;

  // Additional pages if content overflows
  while (heightLeft > 0.5) {
    position += usablePageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, margin - position, usableWidth, imgHeight);
    heightLeft -= usablePageHeight;
  }

  pdf.save(fileName);
}

/**
 * Advanced PDF export: clone element with print styles, multi-page with canvas cropping.
 * Used by the Builder page for CV export.
 */
export async function exportPreviewToPdf(
  element: HTMLElement,
  fileName: string = "CV.pdf",
  contentAreaMm?: number,  // tinggi konten per halaman (agar konsisten dengan preview)
  marginMm?: number        // margin per sisi (agar konsisten dengan preview)
): Promise<void> {
  const html2canvasMod = await import("html2canvas");
  const html2canvasFn = html2canvasMod.default || html2canvasMod;
  const { default: jsPDF } = await import("jspdf");

  // ── Clone element & apply print styles ──
  const clone = element.cloneNode(true) as HTMLElement;
  const previewStyle = getComputedStyle(element);
  clone.style.overflow = "visible";
  clone.style.height = "";
  clone.style.transform = "none";
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.zIndex = "-1000";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.pointerEvents = "none";
  clone.style.fontFamily = previewStyle.fontFamily;
  document.body.appendChild(clone);

  await document.fonts.ready;
  await new Promise(requestAnimationFrame);

  const canvas = await html2canvasFn(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: clone.scrollWidth,
    height: clone.scrollHeight,
  });

  document.body.removeChild(clone);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pdfW = 210;
  const pdfH = 297;
  const margin = marginMm ?? 15;
  const imgW = pdfW - margin * 2; // lebar gambar di PDF — dinamis sesuai margin
  const ELEMENT_WIDTH = 210; // lebar asli previewRef (mm)

  // ── Kalkulasi dalam pixel canvas ──
  // Canvas mencakup full element + padding (misal: 20mm di setiap sisi)
  // Content dimulai SETELAH padding-top
  // Kita slicing per-page berdasarkan contentAreaMm (bukan full A4 agar konsisten preview)
  const paddingPx = contentAreaMm
    ? canvas.width * ((297 - contentAreaMm) / 2 / ELEMENT_WIDTH)
    : 0;
  const contentPerPagePx = contentAreaMm
    ? canvas.width * (contentAreaMm / ELEMENT_WIDTH)
    : canvas.height; // fallback: 1 page

  // Total konten (exclude top + bottom padding agar tidak ikut terpotong)
  const totalContentPx = Math.max(0, canvas.height - (contentAreaMm ? 2 * paddingPx : 0));

  // ── Reusable page canvas ──
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = canvas.width;

  let remainingPx = totalContentPx;
  let srcY = contentAreaMm ? paddingPx : 0; // mulai dari konten (skip padding-top)
  let pageNum = 0;

  while (remainingPx > 0.5) { // 0.5px threshold
    if (pageNum > 0) pdf.addPage();

    const srcH = Math.min(contentPerPagePx, remainingPx);
    const ratio = srcH / canvas.height;
    const pageSliceMm = ratio * (canvas.height * imgW / canvas.width); // konversi pixel → mm

    pageCanvas.height = srcH;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const pageImgData = pageCanvas.toDataURL("image/png");
    pdf.addImage(pageImgData, "PNG", margin, margin, imgW, pageSliceMm);

    srcY += srcH;
    remainingPx -= srcH;
    pageNum++;
  }

  pageCanvas.width = 0;
  pageCanvas.height = 0;

  pdf.save(fileName);
}

/**
 * Serialize a DOM element to HTML string for server-side PDF generation.
 * Collects style tags and fetches external stylesheet content.
 * Falls back gracefully on CORS errors.
 */
export async function serializePreviewHtml(
  element: HTMLElement,
  options?: { removeSelectors?: string[]; }
): Promise<string> {
  const clone = element.cloneNode(true) as HTMLElement;

  // Hapus UI-only artifacts
  const removeSelectors = options?.removeSelectors || [
    "[data-page-indicator]",
    "[style*='background-image: repeating-linear-gradient']",
    ".cv-page-break",
  ];
  for (const sel of removeSelectors) {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  }

  // Hapus script tags dari clone (gak perlu di PDF)
  clone.querySelectorAll("script").forEach((el) => el.remove());

  // ── Collect CSS dari document head ──
  const cssParts: string[] = [];

  // 1. Inline <style> tags (Next.js dev mode injects CSS here)
  document.querySelectorAll("style").forEach((el) => {
    cssParts.push(el.innerHTML);
  });

  // 2. <link rel="stylesheet"> tags — fetch contentnya
  const linkPromises = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  ).map(async (link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    try {
      const res = await fetch(href);
      if (res.ok) {
        cssParts.push(await res.text());
      }
    } catch {
      // CORS error — skip, Tailwind CDN di pdf-server akan handle
    }
  });
  await Promise.allSettled(linkPromises);

  const allCss = cssParts.filter(Boolean).join("\n\n");

  // ── A4 preview overrides untuk PDF server ──
  const printOverrides = `
    .a4-preview {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0 !important;
      box-shadow: none !important;
      border: 0 !important;
      background: white !important;
      overflow: visible !important;
    }
    .a4-preview [data-page-indicator] { display: none !important; }
    .a4-preview [style*="background-image: repeating-linear-gradient"] {
      background-image: none !important;
    }
    body { margin: 0; padding: 0; background: white; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  `;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${allCss}</style>
  <style>${printOverrides}</style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;
}

/**
 * Export preview element to PDF via Puppeteer server.
 * Auto-downloads — no print dialog. ATS-readable text PDF.
 *
 * FALLBACK: Jika server Puppeteer mati/unreachable,
 * otomatis fallback ke window.print() (dengan dialog, tapi ATS-readable).
 */
export async function exportPdfViaServer(
  element: HTMLElement,
  fileName?: string,
  marginMm?: number
): Promise<{ ok: boolean; error?: string; redirectUrl?: string }> {
  // ── Try Puppeteer server first (auto-download) ──
  const html = await serializePreviewHtml(element);

  try {
    const res = await fetch("/api/export-pdf-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        margin: `${marginMm ?? 20}mm`,
        fileName: fileName || "document.pdf",
      }),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "UNKNOWN", message: "Gagal export PDF" }));
      return { ok: false, error: err.message, redirectUrl: err.redirectUrl };
    }

    // Trigger download
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "document.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { ok: true };
  } catch (err) {
    // ── Fallback: server unreachable — gunakan window.print() ──
    console.warn("[pdf] Server unreachable, falling back to window.print():", err);
    try {
      await exportPreviewToPrintPdf(element, fileName, marginMm);
      return { ok: true, error: "pdf-server unavailable, used browser print fallback" };
    } catch (fallbackErr) {
      return { ok: false, error: "Gagal export PDF (server & fallback)" };
    }
  }
}

/**
 * Print-style PDF export: uses CSS @page + window.print()
 * instead of html2canvas.
 *
 * Advantages:
 * - Native browser print engine — text is SELECTABLE, not a screenshot
 * - No html2canvas/jspdf dependencies for this code path
 * - Smaller file size, better quality
 * - Respects @page CSS margins (matches the user's margin mode)
 *
 * Usage: call this from the builder's handleExportPdf.
 * It adds a dynamic @page rule, triggers window.print(),
 * and cleans up after the print dialog closes.
 */
export async function exportPreviewToPrintPdf(
  element: HTMLElement,
  fileName?: string,
  marginMm?: number
): Promise<void> {
  // ── Save inline styles to restore after print ──
  const origOverflow = element.style.overflow;
  const origMaxHeight = element.style.maxHeight;
  const origHeight = element.style.height;

  return new Promise((resolve) => {
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearTimeout(safetyTimer);
      document.body.classList.remove("printing-cv");
      const s = document.getElementById("print-style-cv");
      if (s) s.remove();
      document.title = origTitle;
      // Restore inline styles
      element.style.overflow = origOverflow;
      element.style.maxHeight = origMaxHeight;
      element.style.height = origHeight;
      window.removeEventListener("afterprint", cleanup);
      resolve();
    };

    // ── Inject dynamic @page rule ──
    const style = document.createElement("style");
    style.id = "print-style-cv";
    style.textContent = `@page { size: A4 portrait; margin: ${marginMm ?? 20}mm; }`;
    document.head.appendChild(style);

    // ── Mark body for print media queries ──
    document.body.classList.add("printing-cv");

    // ── Set document title → becomes default PDF filename ──
    const origTitle = document.title;
    if (fileName) {
      document.title = fileName.replace(/\.pdf$/i, "");
    }

    // ── Expand preview for full content ──
    element.style.overflow = "visible";
    element.style.maxHeight = "none";
    element.style.height = "";

    // ── Listen for afterprint (fires after save/cancel) ──
    window.addEventListener("afterprint", cleanup);

    // ── Safety fallback for browsers without afterprint support ──
    const safetyTimer = setTimeout(() => {
      if (!cleanedUp) cleanup();
    }, 60_000);

    // ── Open native print dialog ──
    window.print();
  });
}
