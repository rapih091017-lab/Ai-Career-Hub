"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/nav/SiteHeader";
import AppFooter from "@/components/AppFooter";
import { CheckerResultView } from "@/components/checker/CheckerResultView";
import { type StoredAnalysisResult } from "@/components/checker/types";
import MagneticButton from "@/components/MagneticButton";
import Link from "next/link";
import { localeFor, useTranslation } from "@/lib/i18n";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";

function timeAgo(date: Date, t: (key: string) => string, locale = "id-ID"): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("checker.detail.time-now");
  if (mins < 60) return `${mins} ${t("checker.detail.time-min")}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t("checker.detail.time-hour")}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${t("checker.detail.time-day")}`;
  return date.toLocaleDateString(locale);
}

export default function CheckerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const id = params?.id as string;

  const [result, setResult] = useState<StoredAnalysisResult | null>(null);
  const [fullResult, setFullResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [cvText, setCvText] = useState<string | null>(null);

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
        setCvText(typeof data.cvTextExtracted === "string" ? data.cvTextExtracted : null);

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

  const { scores } = result;

  return (
    <div className="flex min-h-screen flex-col bg-desk text-ink">
      <SiteHeader variant="pill" />

      <main className="mx-auto w-full max-w-[680px] space-y-10 lg:max-w-[960px] px-5 pb-12 pt-24 md:px-6">
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
              <span className="hidden text-xs uppercase tracking-[0.06em] text-ink-soft sm:inline">{timeAgo(new Date(createdAt), t, localeFor(lang))}</span>
            )}
          </div>
        </div>

        <CheckerResultView result={result} variant="stored" resultId={id} resultsRef={resultsRef} wrapperId="checker-results-detail" cvText={cvText}>
        {/* ============================================================ */}
        {/*  6. CTA, Surat Lamaran / Motivation Letter                  */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <p className="px-1 text-xs font-extrabold uppercase tracking-[0.06em] text-ink-soft">
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
                <p className="text-xs text-ink-soft">{t("checker.detail.cover-formats")}</p>
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
                <p className="text-xs text-ink-soft">{t("checker.detail.motivation-formats")}</p>
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

        </CheckerResultView>
      </main>

      <AppFooter bordered />
    </div>
  );
}
