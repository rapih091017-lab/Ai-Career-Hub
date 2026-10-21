"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import SiteHeader from "@/components/nav/SiteHeader";
import AppFooter from "@/components/AppFooter";
import { ScoreDonut } from "@/components/checker/ScoreDonut";
import { SectionScoreCard } from "@/components/checker/SectionScoreCard";
import { KeywordChip, BulletReviewCard } from "@/components/checker/ResultComponents";
import { ImprovementChecklist } from "@/components/checker/ImprovementChecklist";
import { ImpactForecastCard } from "@/components/checker/ImpactForecastCard";
import HrPointOfView from "@/components/checker/HrPointOfView";
import { scoreColor, gradeColor, atsBadgeColor, type AnalysisResult, type StoredAnalysisResult, type ExperienceSection, type SkillsSection } from "@/components/checker/types";
import MagneticButton from "@/components/MagneticButton";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";

function timeAgo(date: Date, t: (key: string) => string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("checker.detail.time-now");
  if (mins < 60) return `${mins} ${t("checker.detail.time-min")}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t("checker.detail.time-hour")}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${t("checker.detail.time-day")}`;
  return date.toLocaleDateString("id-ID");
}

export default function CheckerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = params?.id as string;

  const [result, setResult] = useState<StoredAnalysisResult | null>(null);
  const [fullResult, setFullResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/checker/history/${id}`)
      .then(async (res) => {
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { throw new Error(t("checker.detail.load-failed")); }
        if (!res.ok) throw new Error(data.error || t("checker.detail.load-error"));
        return data;
      })
      .then((data) => {
        // Shape API response → AnalysisResult
        const full: Record<string, unknown> | null = data.fullResult;
        setFullResult(full);
        setCreatedAt(data.createdAt);

        setResult(
          analysisFromFullResult(data.id, {
            scores: data.scores,
            aiFeedback: data.aiFeedback,
            fullResult: data.fullResult,
          }),
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, t]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-desk text-ink">
        <SiteHeader variant="pill" />
        <main className="mx-auto w-full max-w-[680px] space-y-10 px-5 pb-12 pt-24 md:px-6">
          <div className="animate-pulse space-y-10">
            <div className="flex flex-col items-center">
              <div className="mb-4 h-48 w-48 rounded-full bg-surface-container-high" />
              <div className="mb-2 h-8 w-64 rounded-lg bg-surface-container-high" />
              <div className="h-4 w-48 rounded-lg bg-surface-container-high" />
            </div>
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="space-y-2 rounded-[18px] border-[2.5px] border-ink/15 bg-paper p-4">
                <div className="flex justify-between">
                  <div className="h-5 w-32 bg-surface-container-high rounded" />
                  <div className="h-5 w-10 bg-surface-container-high rounded" />
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full" />
              </div>
            ))}
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  // ── Error State ──
  if (error || !result) {
    return (
      <div className="flex min-h-screen flex-col bg-desk text-ink">
        <SiteHeader variant="pill" />
        <main className="flex flex-1 items-center justify-center px-5 py-24">
          <div className="max-w-[420px] space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[2.5px] border-ink bg-error-container">
              <span className="material-symbols-outlined text-3xl text-on-error-container">error_outline</span>
            </div>
            <h1 className="font-display text-headline-md font-bold text-ink">{t("checker.detail.not-found-title")}</h1>
            <p className="text-sm leading-relaxed text-ink-soft">{error || t("checker.detail.not-found-desc")}</p>
            <MagneticButton>
              <button
                onClick={() => router.push("/checker")}
                className="rounded-full border-[2.5px] border-ink bg-lime px-6 py-3 font-bold text-on-light shadow-[0_4px_0_rgb(var(--c-ink))] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {t("checker.detail.analyze-new")}
              </button>
            </MagneticButton>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const { scores, summary, grade, atsPrediction, breakdown, keywordAnalysis, narrativeFeedback, actionPlan, bulletReview, missingSections, impactForecast } = result;
  const color = scoreColor(scores.overall);
  const gc = gradeColor(grade);
  const atsBadge = atsBadgeColor(atsPrediction);

  // v4, chip "X% terkuantifikasi" pada kartu Experience
  const quantPct = (breakdown?.experience as ExperienceSection | undefined)?.quantification_pct;
  const quantChip = typeof quantPct === "number"
    ? {
        label: t("checker.quant-label"),
        value: `${quantPct}% ${t("checker.quant-label").toLowerCase()}`,
        hint: t("checker.quant-hint").replace("{pct}", String(quantPct)),
        tone: (quantPct >= 50 ? "green" : quantPct >= 25 ? "amber" : "red") as "green" | "amber" | "red",
      }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-desk text-ink">
      <SiteHeader variant="pill" />

      <main className="mx-auto w-full max-w-[680px] space-y-10 px-5 pb-12 pt-24 md:px-6">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between gap-2">
          <button
            className="flex items-center gap-1 text-sm font-semibold text-ink-soft transition-colors hover:text-green-deep active:scale-[0.97]"
            onClick={() => router.push("/dashboard")}
          >
            <span className="material-symbols-outlined select-none text-lg">arrow_back</span>
            {t("checker.detail.back-dashboard")}
          </button>
          <div className="flex items-center gap-2">
            {createdAt && (
              <span className="hidden text-[10px] uppercase tracking-[0.06em] text-ink-soft sm:inline">{timeAgo(new Date(createdAt), t)}</span>
            )}
          </div>
        </div>

        <div ref={resultsRef} className="space-y-10" id="checker-results-detail">

        {/* ============================================================ */}
        {/*  0. SISI HR, di atas skor, sama seperti di /checker supaya     */}
        {/*     hasil baru dan hasil tersimpan terbaca identik.           */}
        {/* ============================================================ */}
        {/* StoredAnalysisResult boleh punya breakdown terpotong, sedangkan
            panel hanya membaca meta, careerVelocity, dan atsPredictionDetail.
            Bentuk penuhnya sama persis di ketiga field itu. */}
        <HrPointOfView result={result as AnalysisResult} keyPrefix="checker.detail." />

        {/* ============================================================ */}
        {/*  1. SCORE OVERVIEW                                            */}
        {/* ============================================================ */}
        <section className="flex flex-col items-center">
          <ScoreDonut score={scores.overall} color={color} label={t("checker.score-label")} />

          <h1 className="mb-2 text-center font-display text-headline-lg font-bold text-ink">{t("checker.detail.title")}</h1>
          <p className="mb-5 max-w-[480px] text-center text-body-md leading-relaxed text-ink-soft">
            {summary?.slice(0, 120) || t("checker.detail.summary-fallback")}
          </p>

          {/* Grade + ATS Prediction */}
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
          </div>
        </section>

        {/* ============================================================ */}
        {/*  1b. IMPACT FORECAST (v4), proyeksi skor                    */}
        {/* ============================================================ */}
        {impactForecast && <ImpactForecastCard forecast={impactForecast} />}

        {/* ============================================================ */}
        {/*  2. PER-SECTION BREAKDOWN                                     */}
        {/* ============================================================ */}
        {/* Kartu hanya dirender untuk section yang benar-benar punya skor. Kolom
         *  jsonb bisa terpotong, dan skor default hanya akan menampilkan
         *  persentase yang tidak pernah dihitung. */}
        {breakdown && Object.keys(breakdown).length > 0 && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h2 className="px-1 font-display text-headline-md font-bold text-ink">{t("checker.detail.section-breakdown")}</h2>
            {breakdown.summary && (
              <SectionScoreCard title={t("checker.detail.section-summary")} score={breakdown.summary.score} issues={breakdown.summary.issues} suggestions={breakdown.summary.suggestions} delay={0.2} />
            )}
            {breakdown.experience && (
              <SectionScoreCard title={t("checker.detail.section-experience")} score={breakdown.experience.score} issues={breakdown.experience.issues} suggestions={breakdown.experience.suggestions} delay={0.25} statChip={quantChip} />
            )}
            {breakdown.skills && (
              <SectionScoreCard title={t("checker.detail.section-skills")} score={breakdown.skills.score} issues={(breakdown.skills as SkillsSection).missing_skills} suggestions={(breakdown.skills as SkillsSection).recommendations} delay={0.3} />
            )}
            {breakdown.education && (
              // relevance bisa kosong di baris lama; tanpa penjaga, SectionScoreCard
              // menampilkan bullet ISSUES tanpa teks apa pun.
              <SectionScoreCard title={t("checker.detail.section-education")} score={breakdown.education.score} issues={breakdown.education.relevance ? [breakdown.education.relevance] : []} suggestions={breakdown.education.suggestions} delay={0.35} />
            )}
            {breakdown.format_ats && (
              <SectionScoreCard title={t("checker.detail.section-format")} score={breakdown.format_ats.score} issues={breakdown.format_ats.issues} suggestions={breakdown.format_ats.tips} delay={0.4} />
            )}
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  3. NARRATIVE FEEDBACK                                        */}
        {/* ============================================================ */}
        {narrativeFeedback && (
          <motion.section
            className="space-y-5 rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h2 className="font-display text-headline-md font-bold text-ink">{t("checker.detail.review-title")}</h2>
            <div className="rounded-xl border-[2.5px] border-ink bg-lime/25 p-4">
              <p className="text-sm leading-relaxed text-ink">{narrativeFeedback.overall_assessment}</p>
            </div>
            {/* Kolom Kelebihan dan Perlu Diperbaiki dihapus karena isinya
                sudah tampil di panel Sisi HR di atas, lengkap dengan kutipan
                CV; menyisakannya berarti kelemahan yang sama tampil dua kali. */}
            {narrativeFeedback.ats_recommendations.length > 0 && (
              <div className="rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">                    <span className="material-symbols-outlined select-none text-sm">description</span>{t("checker.detail.ats-recs")}
                </h3>
                <ul className="space-y-1">
                  {narrativeFeedback.ats_recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft"><span className="mt-0.5 select-none text-green-deep">→</span>{r}</li>
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
            className="space-y-5 rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-headline-md font-bold text-ink">{t("checker.detail.keyword-title")}</h2>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-ink">{keywordAnalysis.match_rate_pct}%</span>
                <div className="h-2 w-16 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, rgb(var(--c-green)), rgb(var(--c-lime)))" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${keywordAnalysis.match_rate_pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {keywordAnalysis.matched.length > 0 && (
                <div>
                  <p className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">{t("checker.detail.keyword-found")} ({keywordAnalysis.matched.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.matched.map((kw, i) => <KeywordChip key={i} text={kw} variant="found" />)}
                  </div>
                </div>
              )}
              {keywordAnalysis.missing_critical.length > 0 && (
                <div>
                  <p className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-error">{t("checker.detail.keyword-missing-critical")} ({keywordAnalysis.missing_critical.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missing_critical.map((kw, i) => <KeywordChip key={i} text={kw} variant="missing" />)}
                  </div>
                </div>
              )}
              {keywordAnalysis.missing_nice_to_have.length > 0 && (
                <div>
                  <p className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-tertiary">{t("checker.detail.keyword-missing-nice")} ({keywordAnalysis.missing_nice_to_have.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missing_nice_to_have.map((kw, i) => <KeywordChip key={i} text={kw} variant="nice" />)}
                  </div>
                </div>
              )}
              {keywordAnalysis.synonym_suggestions.length > 0 && (
                <div className="rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low p-4">
                  <p className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-ink-soft">{t("checker.detail.keyword-synonyms")}</p>
                  <ul className="space-y-1">
                    {keywordAnalysis.synonym_suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft"><span className="mt-0.5 select-none text-green-deep">→</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  5. IMPROVEMENT CHECKLIST, langkah perbaikan interaktif      */}
        {/* ============================================================ */}
        <ImprovementChecklist
          actionPlan={actionPlan}
          missingSections={missingSections}
          keywordAnalysis={keywordAnalysis}
        />

        {/* ============================================================ */}
        {/*  6. BULLET REVIEW, per poin pengalaman                       */}
        {/* ============================================================ */}
        {bulletReview && bulletReview.length > 0 && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <h2 className="px-1 font-display text-headline-md font-bold text-ink">{t("checker.detail.bullet-title")} ({bulletReview.length})</h2>
            <div className="space-y-2">
              {bulletReview.map((item, i) => (
                <BulletReviewCard key={i} item={item} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  6. CTA, Surat Lamaran / Motivation Letter                  */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <p className="px-1 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-ink-soft">
            {t("checker.detail.cta-letters")}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/builder/new?next=surat-formal"
              className="group flex items-center gap-3 rounded-[18px] border-[2.5px] border-ink bg-paper p-4 shadow-hard-sm transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-ink/15 bg-primary-fixed transition-transform group-hover:scale-110">
                <span
                  className="material-symbols-outlined text-on-primary-fixed"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  markunread_mailbox
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{t("checker.detail.cover-letter")}</p>
                <p className="text-[11px] text-ink-soft">{t("checker.detail.cover-formats")}</p>
              </div>
              <span
                className="material-symbols-outlined shrink-0 text-ink-soft transition-colors group-hover:text-green-deep"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
            <Link
              href="/builder/new?next=surat-motivation"
              className="group flex items-center gap-3 rounded-[18px] border-[2.5px] border-ink bg-paper p-4 shadow-hard-sm transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-ink/15 bg-tertiary-container transition-transform group-hover:scale-110">
                <span
                  className="material-symbols-outlined text-on-tertiary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  emoji_events
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{t("checker.detail.motivation-letter")}</p>
                <p className="text-[11px] text-ink-soft">{t("checker.detail.motivation-formats")}</p>
              </div>
              <span
                className="material-symbols-outlined shrink-0 text-ink-soft transition-colors group-hover:text-green-deep"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  8. CTA, Analisis Ulang atau Buat CV                        */}
        {/* ============================================================ */}
        <div className="relative overflow-hidden rounded-[18px] border-[2.5px] border-ink bg-evergreen p-8 shadow-hard md:p-10">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-lime/20 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="text-center md:text-left">
              <h2 className="mb-2 font-display text-headline-md font-bold text-on-dark">
                {scores.overall >= 70 ? t("checker.detail.cta-good") : t("checker.detail.cta-improve")}
              </h2>
              <p className="max-w-[320px] text-body-md leading-relaxed text-mint">
                {scores.overall >= 70
                  ? t("checker.detail.cta-good-desc")
                  : t("checker.detail.cta-improve-desc")}
              </p>
            </div>
            <MagneticButton>
              <button
                onClick={() => router.push("/checker")}
                className="flex items-center gap-2 rounded-full border-[2.5px] border-ink bg-lime px-8 py-4 font-display text-sm font-bold text-on-light shadow-hard-ink transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                {t("checker.detail.reanalyze")}
                <span className="material-symbols-outlined text-sm select-none">refresh</span>
              </button>
            </MagneticButton>
          </div>
        </div>

        </div>
      </main>

      <AppFooter bordered />
    </div>
  );
}
