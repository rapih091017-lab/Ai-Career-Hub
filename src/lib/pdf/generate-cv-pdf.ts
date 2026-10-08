/**
 * generate-cv-pdf — Client-side vector PDF generation.
 *
 * Uses @react-pdf/renderer to produce a TRUE text PDF (ATS-readable,
 * selectable, crisp at any zoom) entirely in the browser.
 * Auto-download — no print dialog, no server, no cold start, works on
 * every Vercel plan.
 *
 * Both modules are dynamic-imported so the main bundle stays lean.
 */
import { createElement } from "react";
import type { CvData, SectionKey, TemplateStyle } from "@/components/cv-templates";

export interface GenerateCvPdfOptions {
  fileName?: string;
  /** Page margin in mm — matches the builder's margin mode. */
  marginMm?: number;
  /** Section ordering (already filtered by visibility). */
  sectionOrder?: (SectionKey | string)[];
  /** Resolved TemplateStyle — mirrors the builder preview exactly. */
  templateStyle: TemplateStyle;
  showDividers?: boolean;
  headerLayout?: "centered" | "left";
  lineHeight?: number;
  lang?: "id" | "en";
}

/** Render the CV to a PDF Blob (works in browser AND Node). */
export async function generateCvPdfBlob(
  data: CvData,
  options: GenerateCvPdfOptions
): Promise<Blob> {
  const [{ pdf }, { CvPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./CvPdfDocument"),
  ]);

  const doc = createElement(CvPdfDocument, { data, ...options }) as any;
  return pdf(doc).toBlob();
}

/** Render + auto-download the PDF. */
export async function downloadCvPdf(
  data: CvData,
  options: GenerateCvPdfOptions
): Promise<void> {
  const blob = await generateCvPdfBlob(data, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = options.fileName || "CV.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}