/**
 * Ekstraksi dan render PDF di browser memakai pdfjs-dist.
 * Dipakai checker (dan nanti import resume) supaya file besar tidak perlu
 * diunggah ke server dulu: serverless punya batas body yang sering menolak
 * PDF beberapa MB, padahal browser bisa membacanya langsung.
 */

/** Worker pdfjs lokal (di public/), versinya harus sama dengan pdfjs-dist. */
const PDFJS_WORKER_SRC = "/pdf.worker.min.mjs";

let pdfjsPromise: Promise<any> | null = null;

/** Muat pdfjs sekali, set workerSrc sekali (set berkali-kali tidak apa-apa,
 * tapi satu kali lebih hemat). */
function getPdfjs(): Promise<any> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/build/pdf.mjs").then((mod: any) => {
      mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      return mod;
    });
  }
  return pdfjsPromise;
}

async function openPdf(file: Blob): Promise<any> {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data }).promise;
}

/** Ekstrak lapisan teks PDF di browser. Hasil < 50 karakter berarti PDF
 * tidak punya lapisan teks (scan/gambar) dan perlu jalur OCR. */
export async function extractPdfTextClient(file: Blob, maxPages = 20): Promise<string> {
  const pdf = await openPdf(file);
  try {
    const total = Math.min(pdf.numPages, maxPages);
    const parts: string[] = [];
    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      parts.push(
        content.items
          .map((item: any) => item.str ?? "")
          .join(" "),
      );
    }
    return parts.join("\n").trim();
  } finally {
    try {
      await pdf.destroy();
    } catch {}
  }
}

/** Render halaman PDF ke PNG blob untuk OCR. Skala mengikuti lebar asli,
 * dijaga di rentang 1x-2x dengan target lebar ~1600px supaya hasil OCR
 * tajam tanpa membuat canvas raksasa. */
export async function renderPdfPagesToBlobs(file: Blob, maxPages = 5): Promise<Blob[]> {
  const pdf = await openPdf(file);
  try {
    const total = Math.min(pdf.numPages, maxPages);
    const blobs: Blob[] = [];
    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, Math.max(1, 1600 / Math.max(1, baseViewport.width)));
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context tidak tersedia di browser ini.");

      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/png"),
      );
      canvas.width = 0;
      canvas.height = 0;
      if (blob) blobs.push(blob);
    }
    return blobs;
  } finally {
    try {
      await pdf.destroy();
    } catch {}
  }
}
