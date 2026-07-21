"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/toast";

/**
 * Grammar Error Interface
 */
interface GrammarError {
  context: string;
  text: string;
  suggestion: string;
  reason: string;
  type: "spelling" | "punctuation";
  position?: number;
}

/**
 * Grammar Check Result Interface
 */
interface GrammarCheckResult {
  errors: GrammarError[];
  totalErrors: number;
  summary: string;
}

/**
 * GrammarCheckDrawer — Komponen drawer untuk menampilkan hasil grammar check
 * Menggunakan Material Symbols icons dan useToast
 */
interface GrammarCheckDrawerProps {
  open: boolean;
  onClose: () => void;
  content: string;
  onApplyFix: (original: string, suggestion: string) => void;
}

export function GrammarCheckDrawer({
  open,
  onClose,
  content,
  onApplyFix,
}: GrammarCheckDrawerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<GrammarCheckResult | null>(null);
  const [expandedError, setExpandedError] = useState<number | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<Set<number>>(new Set());
  const { addToast } = useToast();

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setResult(null);
      setExpandedError(null);
      setAppliedFixes(new Set());
    }
  }, [open]);

  // Handle grammar check
  const handleCheck = useCallback(async () => {
    if (!content || content.trim().length === 0) {
      addToast({ type: "error", message: "Tidak ada teks untuk diperiksa" });
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          language: "auto",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memeriksa grammar");
      }

      const data = await response.json();

      if (data.success) {
        setResult({
          errors: data.errors || [],
          totalErrors: data.totalErrors || 0,
          summary: data.summary || "Pemeriksaan selesai",
        });

        if (data.totalErrors === 0) {
          addToast({ type: "success", message: "Tidak ditemukan error!" });
        } else {
          addToast({ type: "info", message: `Ditemukan ${data.totalErrors} error` });
        }
      } else {
        throw new Error("Response tidak valid");
      }
    } catch (error) {
      console.error("Grammar check error:", error);
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal memeriksa grammar",
      });
    } finally {
      setIsChecking(false);
    }
  }, [content, addToast]);

  // Handle apply single fix
  const handleApplyFix = useCallback(
    (errorIndex: number, original: string, suggestion: string) => {
      onApplyFix(original, suggestion);
      setAppliedFixes((prev) => new Set(prev).add(errorIndex));
      addToast({ type: "success", message: "Perbaikan berhasil diterapkan!" });
    },
    [onApplyFix, addToast]
  );

  // Handle apply all fixes
  const handleApplyAll = useCallback(() => {
    if (!result?.errors) return;

    result.errors.forEach((error) => {
      onApplyFix(error.text, error.suggestion);
    });

    setAppliedFixes(new Set(result.errors.map((_, i) => i)));
    addToast({ type: "success", message: "Semua perbaikan berhasil diterapkan!" });
  }, [result, onApplyFix, addToast]);

  // Toggle error expansion
  const toggleError = useCallback((index: number) => {
    setExpandedError((prev) => (prev === index ? null : index));
  }, []);

  if (!open) return null;

  const spellingErrors = result?.errors.filter((e) => e.type === "spelling") || [];
  const punctuationErrors = result?.errors.filter((e) => e.type === "punctuation") || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="material-symbols-outlined text-blue-600 text-xl">spellcheck</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Grammar Check</h2>
              <p className="text-sm text-gray-500">Periksa ejaan dan tanda baca</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Check Button */}
          {!result && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-gray-300 text-6xl block mb-4">spellcheck</span>
              <p className="text-gray-500 mb-4">Klik tombol di bawah untuk memulai pemeriksaan</p>
              <button
                onClick={handleCheck}
                disabled={isChecking || !content}
                className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isChecking ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    Memeriksa...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">spellcheck</span>
                    Mulai Pemeriksaan
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary */}
              <div className={`p-4 rounded-xl mb-4 ${
                result.totalErrors === 0
                  ? "bg-green-50 border border-green-200"
                  : "bg-amber-50 border border-amber-200"
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-2xl ${
                    result.totalErrors === 0 ? "text-green-600" : "text-amber-600"
                  }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {result.totalErrors === 0 ? "check_circle" : "warning"}
                  </span>
                  <div>
                    <p className={`font-medium ${
                      result.totalErrors === 0 ? "text-green-800" : "text-amber-800"
                    }`}>
                      {result.summary}
                    </p>
                    {result.totalErrors > 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        {spellingErrors.length} typo, {punctuationErrors.length} error tanda baca
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error List */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Daftar Error</h3>
                    {result.errors.length > 1 && (
                      <button
                        onClick={handleApplyAll}
                        className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Perbaiki Semua
                      </button>
                    )}
                  </div>

                  {result.errors.map((error, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        appliedFixes.has(index)
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Error Header */}
                      <button
                        onClick={() => toggleError(index)}
                        className="w-full p-3 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${
                            error.type === "spelling" ? "bg-red-100" : "bg-amber-100"
                          }`}>
                            <span className={`material-symbols-outlined text-sm ${
                              error.type === "spelling" ? "text-red-600" : "text-amber-600"
                            }`}>
                              {error.type === "spelling" ? "error" : "warning"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{error.text}</p>
                            <p className="text-xs text-gray-500">{error.reason}</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 text-lg">
                          {expandedError === index ? "expand_less" : "expand_more"}
                        </span>
                      </button>

                      {/* Error Details */}
                      {expandedError === index && (
                        <div className="p-3 pt-0 border-t border-gray-100">
                          <div className="mt-3 space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Konteks:</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{error.context}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Saran:</p>
                              <p className="text-sm text-green-700 bg-green-50 p-2 rounded font-medium">{error.suggestion}</p>
                            </div>
                            {!appliedFixes.has(index) && (
                              <button
                                onClick={() => handleApplyFix(index, error.text, error.suggestion)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">check</span>
                                Terapkan Perbaikan
                              </button>
                            )}
                            {appliedFixes.has(index) && (
                              <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                <span className="text-sm font-medium">Sudah diperbaiki</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Tutup
          </button>
          {result && (
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isChecking ? "animate-spin" : ""}`}>refresh</span>
              Periksa Ulang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
