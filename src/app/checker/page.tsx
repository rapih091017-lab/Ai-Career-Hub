"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { useTranslation } from "@/lib/i18n";
import MagneticButton from "@/components/MagneticButton";
import { UploadZone } from "@/components/checker/UploadZone";
import { ScoreDonut } from "@/components/checker/ScoreDonut";
import { SectionScoreCard } from "@/components/checker/SectionScoreCard";
import { KeywordChip, BulletReviewCard } from "@/components/checker/ResultComponents";
import { ImprovementChecklist } from "@/components/checker/ImprovementChecklist";
import { scoreColor, gradeColor, atsBadgeColor, fitLabelMeta, ROLE_CATEGORY_OPTIONS, type AnalysisResult, type SkillsSection } from "@/components/checker/types";
import { anonIdHeaders } from "@/lib/anon-id";



/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function CheckerPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pageState, setPageState] = useState<"input" | "results">("input");
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [roleCategory, setRoleCategory] = useState("general");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [showOcrButton, setShowOcrButton] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const shareTimerRef = useRef<NodeJS.Timeout | null>(null);

  const donutRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const extractedTextRef = useRef<string | null>(null); // simpan untuk retry
  
  /* ---- Donut entrance animation (dengan cleanup agar bisa repeat) ---- */
  useEffect(() => {
    if (pageState === "results" && donutRef.current) {
      const el = donutRef.current;
      el.style.opacity = "0";
      el.style.transform = "scale(0.8)";
      const raf = requestAnimationFrame(() => {
        el.style.transition = "opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)";
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      });
      return () => {
        cancelAnimationFrame(raf);
        el.style.transition = "none";
      };
    }
  }, [pageState]);

  /* ---- Reset ---- */
  const reset = useCallback(() => {
    // Bersihkan sessionStorage
    try {
      sessionStorage.removeItem("prefill_jobDesc");
      sessionStorage.removeItem("checker_score");
      sessionStorage.removeItem("checker_source");
    } catch {}
    setPageState("input");
    setFile(null);
    setJdText("");
    setResult(null);
    setError("");
    setLoading(false);
    setUploadError("");
    setPastedText("");
    setShowPasteFallback(false);
    setShowOcrButton(false);
    setOcrLoading(false);
    setOcrProgress("");
    extractedTextRef.current = null;
  }, []);

  /* ---- Analyze (dengan retry support) ---- */
  const doAnalyze = useCallback(async (extractedText: string) => {
    const res = await fetch("/api/checker/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Fingerprint anonim per-browser — supaya kuota 2x tidak dishare semua user
        ...anonIdHeaders(),
      },
      body: JSON.stringify({
        extractedText,
        jobDescription: jdText.trim(),
        roleCategory,
        originalFileName: file?.name ?? "cv.pdf",
      }),
    });

    const resText = await res.text();
    let data: any;
    try {
      data = JSON.parse(resText);
    } catch {
      throw new Error("[analyze] Server error: " + resText.slice(0, 200));
    }

    if (!res.ok) {
      throw new Error(data.message || data.error || t("checker.error-failed"));
    }
    return data as AnalysisResult;
  }, [jdText, roleCategory, file, t]);

  /* ---- Analyze with pasted text (skip extract) ---- */
  /* ---- Handle Browser-based OCR for scanned PDFs ---- */
  const handleBrowserOcr = useCallback(async () => {
    if (!file) return;
    setOcrLoading(true);
    setOcrProgress("Memuat PDF...");
    setError("");

    try {
      // Load pdfjs-dist dari bundle lokal (tidak pakai CDN eksternal —
      // jsdelivr/unpkg sering diblokir atau lambat di Indonesia).
      setOcrProgress("Memuat engine PDF...");
      const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
      // Worker disajikan dari domain sendiri (public/pdf.worker.min.mjs) —
      // tidak fetch dari CDN eksternal (jsdelivr/unpkg sering diblokir/lambat
      // di Indonesia) dan tidak bergantung bundling ?url.
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = Math.min(pdf.numPages, 5); // Max 5 halaman untuk performa
      setOcrProgress(`Merender ${totalPages} halaman...`);

      // Process pages one at a time — upload immediately to free memory
      let allText = "";
      for (let i = 1; i <= totalPages; i++) {
        setOcrProgress(`Halaman ${i}/${totalPages} · render...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // 1.5x balance speed/quality

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert to Blob and upload immediately
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png")
        );
        if (!blob) continue;

        // Free canvas memory
        canvas.width = 0;
        canvas.height = 0;

        setOcrProgress(`Halaman ${i}/${totalPages} · OCR...`);
        const pageFormData = new FormData();
        pageFormData.append("images", blob, `page_${i}.png`);

        const ocrRes = await fetch("/api/checker/ocr", {
          method: "POST",
          body: pageFormData,
        });

        const ocrText = await ocrRes.text();
        let ocrData: any;
        try {
          ocrData = JSON.parse(ocrText);
        } catch {
          throw new Error("[ocr] Server error: " + ocrText.slice(0, 200));
        }

        if (!ocrRes.ok) {
          throw new Error(ocrData.message || `OCR gagal di halaman ${i}`);
        }

        const pageText = (ocrData.extractedText || "").trim();
        allText += pageText + "\n\n";
      }

      const extractedText = allText.trim();
      if (extractedText.length < 20) {
        throw new Error("Tidak dapat membaca teks dari PDF. Pastikan halaman tidak kosong.");
      }

      extractedTextRef.current = extractedText;
      setOcrProgress("");
      setOcrLoading(false);

      // Now analyze with the OCR text
      setLoading(true);
      try {
        const data = await doAnalyze(extractedText);
        setResult(data);
        setPageState("results");
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat analisis");
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      setOcrLoading(false);
      setOcrProgress("");
      setError(err.message || "OCR gagal. Tempel teks CV manual sebagai alternatif.");
      setShowPasteFallback(true);
    }
  }, [file, doAnalyze]);

  const handlePasteAnalyze = useCallback(async () => {
    if (!pastedText.trim()) {
      setError("Teks CV tidak boleh kosong");
      return;
    }
    if (!jdText.trim()) {
      setError(t("checker.error-jd"));
      return;
    }

    setError("");
    setLoading(true);
    const trimmedText = pastedText.trim();
    extractedTextRef.current = trimmedText; // cache untuk retry
    try {
      const data = await doAnalyze(trimmedText);
      setResult(data);
      setPageState("results");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [pastedText, jdText, doAnalyze, t]);

  const handleAnalyze = async () => {
    setError("");
    setUploadError("");
    setShowPasteFallback(false);
    if (!file) {
      setError(t("checker.error-upload"));
      return;
    }
    if (!jdText.trim()) {
      setError(t("checker.error-jd"));
      return;
    }

    setLoading(true);
    try {
      // ── Step 1: Extract ──
      const cachedText = extractedTextRef.current;
      let extractedText: string;
      if (!cachedText) {
        const formData = new FormData();
        formData.append("file", file);
        const extractRes = await fetch("/api/checker/extract", {
          method: "POST",
          body: formData,
        });

        const extractText = await extractRes.text();
        let extractData: any;
        try {
          extractData = JSON.parse(extractText);
        } catch {
          setError("[extract] Server error: " + extractText.slice(0, 200));
          setLoading(false);
          return;
        }

        if (!extractRes.ok) {
          // Jika API mengirim suggestOcr, tampilkan tombol OCR
          if (extractData.suggestOcr) {
            setShowOcrButton(true);
          }
          // Jika API mengirim suggestPaste, tampilkan fallback paste
          if (extractData.suggestPaste) {
            setShowPasteFallback(true);
          }
          if (extractData.suggestOcr || extractData.suggestPaste) {
            setError(extractData.message || t("checker.error-failed"));
            setLoading(false);
            return;
          }
          setError(extractData.message || t("checker.error-failed"));
          setLoading(false);
          return;
        }
        extractedText = extractData.extractedText as string;
        extractedTextRef.current = extractedText; // cache untuk retry
      } else {
        extractedText = cachedText;
      }

      // ── Step 2: Analyze ──
      const data = await doAnalyze(extractedText);
      setResult(data);
      setPageState("results");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Retry tanpa re-upload ---- */
  const handleRetry = useCallback(async () => {
    if (!extractedTextRef.current) {
      handleAnalyze();
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await doAnalyze(extractedTextRef.current);
      setResult(data);
      setPageState("results");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [doAnalyze]);

  /* ================================================================ */
  /*  RENDER: Input Screen (or skeleton while loading)                  */
  /* ================================================================ */
  if (pageState === "input") {
    // ── Show skeleton while analyzing ──
    if (loading) {
      return (
        <div className="min-h-screen flex flex-col bg-background text-on-background">
          <AppHeader />
          <main className="flex-1 w-full max-w-[640px] mx-auto px-5 md:px-6 pt-20 pb-12 space-y-10">
            <div className="animate-pulse space-y-10">
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 rounded-full bg-surface-container-high mb-4" />
                <div className="h-8 w-64 bg-surface-container-high rounded-lg mb-2" />
                <div className="h-4 w-48 bg-surface-container-high rounded-lg" />
              </div>
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="bg-surface rounded-xl border border-surface-container-high p-4 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-5 w-32 bg-surface-container-high rounded" />
                    <div className="h-5 w-10 bg-surface-container-high rounded" />
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full" />
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-lg align-middle mr-1 animate-spin select-none">sync</span>
              Menganalisis CV dengan AI...
            </p>
          </main>
          <AppFooter />
        </div>
      );
    }

    // ── Normal input form ──
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-background">
        <AppHeader />

        <main className="flex-1 flex items-center justify-center py-20 px-5">
          <div className="w-full max-w-[600px] flex flex-col gap-8">
            <div className="text-center space-y-4">
              <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-on-background">
                {t("checker.title")}
              </h1>
              <p className="text-lg leading-7 text-on-surface-variant max-w-[500px] mx-auto">
                {t("checker.subtitle")}
              </p>
            </div>

            <div className="bg-surface rounded-xl p-6 md:p-10 flex flex-col gap-8 border border-outline-variant/50 shadow-premium-md">
              <UploadZone
                file={file}
                dragActive={dragActive}
                onFileChange={(f) => { setFile(f); extractedTextRef.current = null; setUploadError(""); }}
                onDragStateChange={setDragActive}
                label={t("checker.upload-label")}
                hint={t("checker.upload-hint")}
                loading={loading}
                error={uploadError}
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">
                  {t("checker.jd-label")}
                </label>
                <textarea
                  className="w-full rounded-lg border border-outline bg-background p-4 text-base text-on-background focus:ring-2 focus:ring-primary focus:border-primary transition-[box-shadow,border-color] resize-none"
                  rows={6}
                  placeholder={t("checker.jd-placeholder")}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>

              {/* Kategori posisi → bobot penilaian per-section (transparansi skor) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">
                  Kategori Posisi
                </label>
                <select
                  value={roleCategory}
                  onChange={(e) => setRoleCategory(e.target.value)}
                  className="w-full rounded-lg border border-outline bg-background px-3 py-3 text-base text-on-background focus:ring-2 focus:ring-primary focus:border-primary transition-[box-shadow,border-color]"
                >
                  {ROLE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} · {opt.desc}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-on-surface-variant ml-1">
                  Bobot penilaian menyesuaikan kategori (mis. fresh graduate tidak dihukum karena pengalaman singkat).
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-500 text-sm mt-0.5 select-none">error</span>
                  <div className="flex-1">
                    <p className="text-red-700 text-sm font-semibold">{error}</p>
                    {extractedTextRef.current && !showPasteFallback && (
                      <button
                        onClick={handleRetry}
                        className="mt-1 text-xs text-red-600 underline hover:text-red-800"
                      >
                        Coba Lagi
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── OCR Button (when scanned PDF detected) ── */}
              {showOcrButton && !ocrLoading && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5 select-none">document_scanner</span>
                    <div>
                      <p className="text-sm font-semibold text-primary">Atau baca dengan OCR AI</p>
                      <p className="text-xs text-primary/80 mt-0.5">
                        Kami akan merender setiap halaman PDF dan membaca teksnya menggunakan AI.
                        Cocok untuk PDF hasil scan/gambar.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleBrowserOcr}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all text-sm"
                  >
                    <span className="material-symbols-outlined text-sm select-none">scan</span>
                    OCR dengan AI (Baca PDF)
                  </button>
                </div>
              )}

              {/* ── OCR Loading State ── */}
              {ocrLoading && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-medium text-primary">{ocrProgress || "Memproses OCR..."}</span>
                  </div>
                  <div className="w-full bg-primary/15 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full w-2/3" />
                  </div>
                </div>
              )}

              {/* ── Paste text fallback (when PDF parsing fails) ── */}
              {showPasteFallback && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5 select-none">content_paste</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Atau tempel teks CV Anda di sini</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Salin seluruh teks dari CV Anda (bisa dari Word, Google Docs, atau PDF viewer) dan tempel di bawah.
                      </p>
                    </div>
                  </div>
                  <textarea
                    className="w-full rounded-lg border border-amber-300 bg-white p-4 text-sm text-on-background focus:ring-2 focus:ring-primary focus:border-primary transition-[box-shadow,border-color] resize-none"
                    rows={8}
                    placeholder="Tempel teks CV Anda di sini...\n\nContoh:\nNama: Andi Pratama\nPengalaman: ...\nPendidikan: ..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handlePasteAnalyze}
                      disabled={loading || !pastedText.trim()}
                      className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-lg hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 text-sm"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Menganalisis...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm select-none">auto_awesome</span>
                          Analisis dengan Teks
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                <MagneticButton className="w-full">
                  <button
                    className="w-full bg-primary text-white font-bold py-4 rounded-lg hover:opacity-90 active:scale-[0.97] transition-[filter,transform,opacity] shadow-premium-md flex items-center justify-center gap-2 disabled:opacity-60"
                    onClick={handleAnalyze}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t("checker.analyzing")}
                      </>
                    ) : (
                      <>
                        <span>{t("checker.analyze-btn")}</span>
                        <span className="material-symbols-outlined select-none">auto_awesome</span>
                      </>
                    )}
                  </button>
                </MagneticButton>
                <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-sm select-none" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>{t("checker.free-badge")}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low border border-dashed border-outline p-4 rounded-xl flex items-start gap-4 opacity-80 select-none pointer-events-none">
              <span className="material-symbols-outlined text-primary select-none">psychology</span>
              <div>
                <p className="text-sm font-semibold text-on-background">{t("checker.insight-title")}</p>
                <p className="text-xs text-on-surface-variant">{t("checker.insight-desc")}</p>
              </div>
            </div>
          </div>
        </main>

        <AppFooter />
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER: Results Screen                                           */
  /* ================================================================ */
  if (!result) return null;

  const {
    scores,
    summary,
    fitLabel,
    grade,
    atsPrediction,
    breakdown,
    keywordAnalysis,
    narrativeFeedback,
    actionPlan,
    bulletReview,
    missingSections,
    weightsApplied,
    aiModel,
  } = result;

  const color = scoreColor(scores.overall);
  const gc = gradeColor(grade);
  const atsBadge = atsBadgeColor(atsPrediction);
  const fitMeta = fitLabelMeta(fitLabel, t);

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-low/50 text-on-background">
      <AppHeader />

      <main className="flex-1 w-full max-w-[640px] mx-auto px-5 md:px-6 pt-20 pb-12 space-y-10">
        {/* ── Top Bar: Back + Share + Download ── */}
        <div className="flex items-center justify-between gap-2">
          <button
            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors active:scale-[0.97]"
            onClick={reset}
          >
            <span className="material-symbols-outlined text-lg select-none">arrow_back</span>
            {t("checker.back-btn")}
          </button>
          <div className="flex items-center gap-2">
            {/* Share button */}
            <div className="relative">
              <button
                onClick={() => {
                  try {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    setShowShareToast(true);
                    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
                    shareTimerRef.current = setTimeout(() => setShowShareToast(false), 2500);
                  } catch {}
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low hover:text-primary transition-all active:scale-[0.97]"
                title="Salin link hasil analisis"
              >
                <span className="material-symbols-outlined text-lg select-none">share</span>
                <span className="hidden sm:inline">Bagikan</span>
              </button>
              {showShareToast && (
                <div className="absolute top-full mt-2 right-0 bg-green-600 text-white text-xs rounded-lg px-3 py-2 shadow-premium-md whitespace-nowrap z-10">
                  Link tersalin! ✓
                </div>
              )}
            </div>
          </div>
        </div>

        <div ref={resultsRef} className="space-y-10">

        {/* ============================================================ */}
        {/*  1. SCORE OVERVIEW                                            */}
        {/* ============================================================ */}
        <section className="flex flex-col items-center">
          <div ref={donutRef}>
            <ScoreDonut score={scores.overall} color={color} label={t("checker.score-label")} />
          </div>

          <h1 className="text-[32px] leading-10 font-bold text-center mb-2">{t("checker.result-title")}</h1>
          <p className="text-base text-on-surface-variant text-center mb-4">{summary || t("checker.result-subtitle")}</p>

          {/* Grade + ATS Prediction + Fit Label */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {grade && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${gc.bg} ${gc.text} ${gc.border}`}>
                <span className="text-lg">Grade {grade}</span>
              </div>
            )}
            {atsPrediction && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${atsBadge.bg} ${atsBadge.text}`}>
                <span className={`w-2 h-2 rounded-full ${atsBadge.dot}`} />
                {atsPrediction}
              </div>
            )}
            {fitMeta.desc && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${fitMeta.bg} ${fitMeta.text}`}>
                <span className="material-symbols-outlined text-lg select-none">{fitMeta.icon}</span>
                {fitLabel}{fitMeta.desc ? ` · ${fitMeta.desc.split(",")[0]}` : ""}
              </div>
            )}
            {aiModel && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
                  aiModel === "V4 Pro"
                    ? "bg-primary/5 text-primary/80 border-primary/30"
                    : "bg-blue-50 text-blue-700 border-blue-300"
                }`}
                title={aiModel === "V4 Pro" ? "DeepSeek V4 Pro · analisis mendalam (Premium)" : "DeepSeek V4 Flash · analisis standar"}
              >
                <span className="material-symbols-outlined text-lg select-none">{aiModel === "V4 Pro" ? "auto_awesome" : "bolt"}</span>
                {aiModel === "V4 Pro" ? "DeepSeek V4 Pro" : "DeepSeek V4 Flash"}
              </div>
            )}
          </div>

          {/* Transparansi bobot penilaian (role category) */}
          {weightsApplied && weightsApplied.role_category !== "general" && (
            <p className="text-[11px] text-on-surface-variant/70 text-center mt-3 flex items-center justify-center gap-1 flex-wrap">
              <span className="material-symbols-outlined text-[13px] select-none">tune</span>
              Skor dihitung dengan bobot {weightsApplied.role_category.replace("_", " ")}: Experience {Math.round((weightsApplied.experience_weight || 0) * 100)}% · Skills {Math.round((weightsApplied.skills_weight || 0) * 100)}% · Education {Math.round((weightsApplied.education_weight || 0) * 100)}%
            </p>
          )}
        </section>

        {/* ============================================================ */}
        {/*  2. PER-SECTION BREAKDOWN                                     */}
        {/* ============================================================ */}
        {breakdown && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h2 className="text-xl font-bold text-on-surface px-1">Skor Per Section</h2>
            <SectionScoreCard title="Ringkasan Profil" score={breakdown.summary.score} issues={breakdown.summary.issues} suggestions={breakdown.summary.suggestions} delay={0.2} />
            <SectionScoreCard title="Pengalaman Kerja" score={breakdown.experience.score} issues={breakdown.experience.issues} suggestions={breakdown.experience.suggestions} delay={0.25} />
            <SectionScoreCard title="Keahlian" score={breakdown.skills.score} issues={(breakdown.skills as SkillsSection).missing_skills} suggestions={(breakdown.skills as SkillsSection).recommendations} delay={0.3} />
            <SectionScoreCard title="Pendidikan" score={breakdown.education.score} issues={[breakdown.education.relevance]} suggestions={breakdown.education.suggestions} delay={0.35} />
            <SectionScoreCard title="Format & ATS" score={breakdown.format_ats.score} issues={breakdown.format_ats.issues} suggestions={breakdown.format_ats.tips} delay={0.4} />
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  3. NARRATIVE FEEDBACK                                        */}
        {/* ============================================================ */}
        {narrativeFeedback && (
          <motion.section
            className="bg-surface rounded-2xl border border-surface-container-high shadow-premium-md p-6 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-on-surface">Review oleh AI</h2>

            {/* Overall assessment */}
            <div className="bg-surface-container-low rounded-xl p-4 border-l-4 border-primary">
              <p className="text-sm text-on-surface leading-relaxed">{narrativeFeedback.overall_assessment}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              {narrativeFeedback.strengths.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                    Kelebihan
                  </h3>
                  <ul className="space-y-1.5">
                    {narrativeFeedback.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5 select-none">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for improvement */}
              {narrativeFeedback.areas_for_improvement.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">warning</span>
                    Perlu Diperbaiki
                  </h3>
                  <ul className="space-y-1.5">
                    {narrativeFeedback.areas_for_improvement.map((a, i) => (
                      <li key={i} className="text-xs text-red-800 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5 select-none">⚠</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ATS Recommendations */}
            {narrativeFeedback.ats_recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm select-none">description</span>
                  Rekomendasi ATS
                </h3>
                <ul className="space-y-1">
                  {narrativeFeedback.ats_recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5 select-none">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  4. KEYWORD ANALYSIS                                          */}
        {/* ============================================================ */}
        {keywordAnalysis && (
          <motion.section
            className="bg-surface rounded-2xl border border-surface-container-high shadow-premium-md p-6 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Keyword Analysis</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-on-surface">{keywordAnalysis.match_rate_pct}%</span>
                <div className="w-16 h-2 bg-surface-container rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${keywordAnalysis.match_rate_pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Matched */}
              {keywordAnalysis.matched.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Ditemukan ({keywordAnalysis.matched.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.matched.map((kw, i) => (
                      <KeywordChip key={i} text={kw} variant="found" />
                    ))}
                  </div>
                </div>
              )}

              {/* Missing critical */}
              {keywordAnalysis.missing_critical.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Hilang · Prioritas ({keywordAnalysis.missing_critical.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missing_critical.map((kw, i) => (
                      <KeywordChip key={i} text={kw} variant="missing" />
                    ))}
                  </div>
                </div>
              )}

              {/* Missing nice-to-have */}
              {keywordAnalysis.missing_nice_to_have.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2">Hilang · Tambahan ({keywordAnalysis.missing_nice_to_have.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missing_nice_to_have.map((kw, i) => (
                      <KeywordChip key={i} text={kw} variant="nice" />
                    ))}
                  </div>
                </div>
              )}

              {/* Synonym suggestions */}
              {keywordAnalysis.synonym_suggestions.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Saran Sinonim</p>
                  <ul className="space-y-1">
                    {keywordAnalysis.synonym_suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 select-none">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  5. IMPROVEMENT CHECKLIST — langkah perbaikan interaktif      */}
        {/* ============================================================ */}
        <ImprovementChecklist
          actionPlan={actionPlan}
          missingSections={missingSections}
          keywordAnalysis={keywordAnalysis}
        />

        {/* ============================================================ */}
        {/*  6. BULLET REVIEW                                             */}
        {/* ============================================================ */}
        {bulletReview && bulletReview.length > 0 && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <h2 className="text-xl font-bold text-on-surface px-1">Review Poin Pengalaman ({bulletReview.length})</h2>
            <div className="space-y-2">
              {bulletReview.map((item, i) => (
                <BulletReviewCard key={i} item={item} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  7. CTA BANNER — score-based routing                          */}
        {/* ============================================================ */}
        {(() => {
          const score = scores?.overall ?? 0;
          const isHighScore = score >= 90;
          const targetRoute = isHighScore ? "/karir" : "/builder/new";
          const ctaTitle = isHighScore
            ? "Skor CV Kamu Istimewa! 🎉"
            : t("checker.cta-title");
          const ctaSubtitle = isHighScore
            ? "CV kamu sudah sangat siap. Langsung cari lowongan yang cocok!"
            : t("checker.cta-subtitle");
          const ctaBtn = isHighScore ? "Cari Lowongan Sekarang" : t("checker.cta-btn");
          const gradientBg = isHighScore
            ? "bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500"
            : "bg-gradient-to-br from-primary via-primary-container to-primary-deep";

          return (
            <div
              className={`relative overflow-hidden rounded-2xl p-8 md:p-10 shadow-premium-lg ${gradientBg}`}
            >
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h2 className="text-[32px] leading-10 font-bold text-white mb-2">
                    {ctaTitle}
                  </h2>
                  <p className="text-base text-white/90 max-w-[320px]">{ctaSubtitle}</p>
                </div>
                <MagneticButton>
                  <button
                    onClick={() => {
                      // Simpan jobDesc + score di sessionStorage untuk back button
                      try {
                        sessionStorage.setItem("prefill_jobDesc", jdText);
                        sessionStorage.setItem("checker_score", String(score));
                        sessionStorage.setItem("checker_source", window.location.href);
                      } catch {}
                      router.push(targetRoute);
                    }}
                    className="bg-white text-primary px-8 py-4 rounded-full text-sm font-semibold shadow-premium-md hover:bg-gray-100 active:scale-95 transition-[transform,background-color] flex items-center gap-2"
                  >
                    {ctaBtn}{" "}
                    <span className="material-symbols-outlined text-sm select-none">
                      {isHighScore ? "work" : "arrow_forward"}
                    </span>
                  </button>
                </MagneticButton>
              </div>
            </div>
          );
        })()}

        </div>{/* end resultsRef */}
      </main>

      <AppFooter bordered />
    </div>
  );
}
