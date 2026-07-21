"use client";

import { useState } from "react";
import { exportPdfViaServer } from "@/lib/pdf-export";

interface PdfExportButtonProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  fileName?: string;
  label?: string;
  /** 'checker' = simple capture (default), 'builder' = advanced multi-page export */
  mode?: "checker" | "builder";
  /** Builder-only: callback for advanced export (the builder has its own handleExportPdf) */
  onBuilderExport?: () => Promise<void>;
  /** Builder-only: loading state from parent */
  externalLoading?: boolean;
}

/**
 * Unified PDF export button.
 * Uses Puppeteer server for ATS-readable, auto-download PDF.
 */
export function PdfExportButton({
  targetRef,
  fileName = "cv-analysis-report.pdf",
  label = "Download PDF",
  mode = "checker",
  onBuilderExport,
  externalLoading,
}: PdfExportButtonProps) {
  const [localLoading, setLocalLoading] = useState(false);
  const loading = externalLoading ?? localLoading;

  const handleExport = async () => {
    if (mode === "builder" && onBuilderExport) {
      await onBuilderExport();
      return;
    }

    if (!targetRef.current) return;
    setLocalLoading(true);
    try {
      const result = await exportPdfViaServer(targetRef.current, fileName, 15);
      if (!result.ok) {
        console.warn("PDF export failed:", result.error);
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:brightness-110 active:scale-[0.97] transition-[filter,transform,opacity] disabled:opacity-60 shadow-premium-sm"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <span className="material-symbols-outlined text-lg select-none">download</span>
      )}
      {label}
    </button>
  );
}
