"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { useTranslation } from "@/lib/i18n";
import MagneticButton from "@/components/MagneticButton";
import { UploadZone } from "@/components/checker/UploadZone";
import { ScoreDonut } from "@/components/checker/ScoreDonut";
import { SectionScoreCard } from "@/components/checker/SectionScoreCard";
import { PdfExportButton } from "@/components/checker/PdfExportButton";
import { KeywordChip, BulletReviewCard } from "@/components/checker/ResultComponents";
import { scoreColor, gradeColor, atsBadgeColor, fitLabelMeta, type AnalysisResult, type SkillsSection } from "@/components/checker/types";



/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function CheckerPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pageState, setPageState] = useState<"input" | "results">("input");
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const donutRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  /* ---- Donut entrance animation ---- */
  useEffect(() => {
    if (pageState === "results" && donutRef.current) {
      const el = donutRef.current;
      el.style.opacity = "0";
      el.style.transform = "scale(0.8)";
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)";
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      });
    }
  }, [pageState]);

  /* ---- Reset ---- */
  const reset = () => {
    setPageState("input");
    setFile(null);
    setJdText("");
    setResult(null);
    setError("");
    setLoading(false);
  };

  /* ---- Analyze ---- */
  const handleAnalyze = async () => {
    setError("");
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
        setError(extractData.message || t("checker.error-failed"));
        setLoading(false);
        return;
      }

      const extractedText = extractData.extractedText;

      const res = await fetch("/api/checker/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedText,
          jobDescription: jdText.trim(),
          originalFileName: file.name,
        }),
      });

      const resText = await res.text();
      let data: any;
      try {
        data = JSON.parse(resText);
      } catch {
        setError("[analyze] Server error: " + resText.slice(0, 200));
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.message || data.error || t("checker.error-failed"));
        setLoading(false);
        return;
      }
      setResult(data as AnalysisResult);
      setPageState("results");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================ */
  /*  RENDER: Input Screen                                             */
  /* ================================================================ */
  if (pageState === "input") {
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

            <div className="bg-white rounded-xl p-6 md:p-10 flex flex-col gap-8 border border-outline-variant/50 shadow-premium-md">
              <UploadZone
                file={file}
                dragActive={dragActive}
                onFileChange={setFile}
                onDragStateChange={setDragActive}
                label={t("checker.upload-label")}
                hint={t("checker.upload-hint")}
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

              {error && (
                <p className="text-red-600 text-sm font-semibold text-center">{error}</p>
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
  } = result;

  const color = scoreColor(scores.overall);
  const gc = gradeColor(grade);
  const atsBadge = atsBadgeColor(atsPrediction);
  const fitMeta = fitLabelMeta(fitLabel, t);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-on-background">
      <AppHeader />

      <main className="flex-1 w-full max-w-[640px] mx-auto px-5 md:px-6 pt-20 pb-12 space-y-10">
        {/* ── Top Bar: Back + Download ── */}
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors active:scale-[0.97]"
            onClick={reset}
          >
            <span className="material-symbols-outlined text-lg select-none">arrow_back</span>
            {t("checker.back-btn")}
          </button>
          <PdfExportButton targetRef={resultsRef} />
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
                {fitLabel}{fitMeta.desc ? ` — ${fitMeta.desc.split(",")[0]}` : ""}
              </div>
            )}
          </div>
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
            className="bg-white rounded-2xl border border-surface-container-high shadow-premium-md p-6 space-y-5"
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
            className="bg-white rounded-2xl border border-surface-container-high shadow-premium-md p-6 space-y-5"
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
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Hilang — Prioritas ({keywordAnalysis.missing_critical.length})</p>
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
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2">Hilang — Tambahan ({keywordAnalysis.missing_nice_to_have.length})</p>
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
        {/*  5. ACTION PLAN                                               */}
        {/* ============================================================ */}
        {actionPlan && (
          <motion.section
            className="bg-white rounded-2xl border border-surface-container-high shadow-premium-md p-6 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <h2 className="text-xl font-bold text-on-surface">Rencana Tindakan</h2>

            <div className="space-y-4">
              {/* Quick wins */}
              {actionPlan.quick_wins.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">bolt</span>
                    Quick Wins (5-10 menit)
                  </h3>
                  <ul className="space-y-1.5">
                    {actionPlan.quick_wins.map((item, i) => (
                      <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5 select-none">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Short term */}
              {actionPlan.short_term.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">schedule</span>
                    Jangka Pendek (1-2 jam)
                  </h3>
                  <ul className="space-y-1.5">
                    {actionPlan.short_term.map((item, i) => (
                      <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 select-none">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Long term */}
              {actionPlan.long_term.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">flag</span>
                    Jangka Panjang (Restrukturisasi)
                  </h3>
                  <ul className="space-y-1.5">
                    {actionPlan.long_term.map((item, i) => (
                      <li key={i} className="text-xs text-purple-800 flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5 select-none">★</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.section>
        )}

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
        {/*  7. MISSING SECTIONS                                          */}
        {/* ============================================================ */}
        {missingSections && missingSections.length > 0 && (
          <motion.section
            className="bg-white rounded-2xl border border-surface-container-high shadow-premium-md p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <h2 className="text-xl font-bold text-on-surface mb-3">Section yang Belum Ada</h2>
            <div className="flex flex-wrap gap-2">
              {missingSections.map((sec, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium">
                  <span className="material-symbols-outlined text-sm select-none">add_circle</span>
                  {sec}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  8. CTA BANNER                                                */}
        {/* ============================================================ */}
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-10 shadow-premium-lg bg-gradient-to-br from-primary via-primary-container to-primary-deep">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-[32px] leading-10 font-bold text-white mb-2">{t("checker.cta-title")}</h2>
              <p className="text-base text-white/90 max-w-[320px]">{t("checker.cta-subtitle")}</p>
            </div>
            <MagneticButton>
              <button
                onClick={() => { if (jdText.trim()) { try { sessionStorage.setItem("prefill_jobDesc", jdText); } catch (_) {} } router.push("/builder/new"); }}
                className="bg-white text-primary px-8 py-4 rounded-full text-sm font-semibold shadow-premium-md hover:bg-gray-100 active:scale-95 transition-[transform,background-color] flex items-center gap-2"
              >
                {t("checker.cta-btn")}{" "}
                <span className="material-symbols-outlined text-sm select-none">arrow_forward</span>
              </button>
            </MagneticButton>
          </div>
        </div>

        </div>{/* end resultsRef */}
      </main>

      <AppFooter bordered />
    </div>
  );
}
