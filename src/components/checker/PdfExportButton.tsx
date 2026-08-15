"use client";

import { useState } from "react";
import { exportElementToPdf, exportPreviewToPdf } from "@/lib/pdf-export";

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
}  /**
   * Unified PDF export button.
   * Primary: html2canvas (auto-download, no dialog).
   * Fallback: html2canvas multi-page A4 (auto-download, no dialog).
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const loading = externalLoading ?? localLoading;

  const handleExport = async () => {
    if (mode === "builder" && onBuilderExport) {
      await onBuilderExport();
      return;
    }

    if (!targetRef.current) return;
    setLocalLoading(true);
    setErrorMsg(null);
    setIsFallback(false);

    try {
      // Primary: html2canvas — auto-download, no dialog
      await exportElementToPdf(targetRef.current, fileName);
    } catch (err) {
      console.warn("[pdf] html2canvas failed, trying A4 fallback:", err);
      try {
        // Fallback: html2canvas multi-page A4 — tetap auto-download, no dialog
        setIsFallback(true);
        await exportPreviewToPdf(targetRef.current, fileName);
        // Reset fallback label after 3s
        setTimeout(() => setIsFallback(false), 3000);
      } catch (fallbackErr) {
        console.error("[pdf] Both methods failed:", fallbackErr);
        setErrorMsg("Gagal export PDF. Coba gunakan browser lain atau screenshot manual.");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:brightness-110 active:scale-[0.97] transition-[filter,transform,opacity] disabled:opacity-60 shadow-premium-sm"
        title={isFallback ? "Menggunakan mode A4" : "Download PDF hasil analisis"}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <span className="material-symbols-outlined text-lg select-none">download</span>
        )}
        {isFallback ? "Mengunduh A4..." : label}
      </button>
      {errorMsg && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 shadow-premium-md w-64 z-10">
          <p className="font-semibold mb-1">Export Gagal</p>
          <p>{errorMsg}</p>
          <button
            onClick={() => setErrorMsg(null)}
            className="mt-1 text-red-500 hover:text-red-700 underline text-[11px]"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}
