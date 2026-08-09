"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { ScoreDonut } from "@/components/checker/ScoreDonut";
import { SectionScoreCard } from "@/components/checker/SectionScoreCard";
import { KeywordChip, BulletReviewCard } from "@/components/checker/ResultComponents";
import { PdfExportButton } from "@/components/checker/PdfExportButton";
import { scoreColor, gradeColor, atsBadgeColor, type AnalysisResult, type SkillsSection } from "@/components/checker/types";
import MagneticButton from "@/components/MagneticButton";
import Link from "next/link";

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID");
}

export default function CheckerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [result, setResult] = useState<AnalysisResult | null>(null);
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
        try { data = JSON.parse(text); } catch { throw new Error("Gagal memuat data"); }
        if (!res.ok) throw new Error(data.error || "Gagal memuat hasil analisis");
        return data;
      })
      .then((data) => {
        // Shape API response → AnalysisResult
        const full: Record<string, unknown> | null = data.fullResult;
        setFullResult(full);
        setCreatedAt(data.createdAt);

        const scores = data.scores;
        const aiFeedback = data.aiFeedback;

        setResult({
          id: data.id,
          scores: {
            overall: scores?.overall ?? 0,
            keywordGap: scores?.keywordGap ?? 0,
            contextRelevance: scores?.contextRelevance ?? 0,
            atsRules: scores?.atsRules ?? 0,
          },
          aiFeedback: {
            keywordGap: aiFeedback?.keywordGap ?? "",
            contextRelevance: aiFeedback?.contextRelevance ?? "",
            atsRules: aiFeedback?.atsRules ?? "",
            summary: aiFeedback?.summary ?? "",
          },
          summary: aiFeedback?.summary ?? "",
          grade: (full?.grade as any) ?? null,
          atsPrediction: (full?.atsPrediction as any) ?? null,
          fitLabel: (full?.breakdown as any)?.overall ? ("Good" as const) : undefined,
          breakdown: (full?.breakdown as any) ?? null,
          keywordAnalysis: (full?.keywordAnalysis as any) ?? null,
          narrativeFeedback: (full?.narrativeFeedback as any) ?? null,
          actionPlan: (full?.actionPlan as any) ?? null,
          bulletReview: (full?.bulletReview as any) ?? [],
          missingSections: (full?.missingSections as any) ?? [],
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading State ──
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
        </main>
        <AppFooter />
      </div>
    );
  }

  // ── Error State ──
  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-background">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center py-20 px-5">
          <div className="max-w-[400px] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-red-500 text-3xl">error_outline</span>
            </div>
            <h1 className="text-xl font-bold text-on-surface">Hasil Tidak Ditemukan</h1>
            <p className="text-sm text-on-surface-variant">{error || "Hasil analisis tidak ditemukan atau sudah dihapus."}</p>
            <MagneticButton>
              <button
                onClick={() => router.push("/checker")}
                className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Analisis CV Baru
              </button>
            </MagneticButton>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const { scores, summary, grade, atsPrediction, breakdown, keywordAnalysis, narrativeFeedback, actionPlan, bulletReview, missingSections } = result;
  const color = scoreColor(scores.overall);
  const gc = gradeColor(grade);
  const atsBadge = atsBadgeColor(atsPrediction);

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-low/50 text-on-background">
      <AppHeader />

      <main className="flex-1 w-full max-w-[640px] mx-auto px-5 md:px-6 pt-20 pb-12 space-y-10">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between gap-2">
          <button
            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors active:scale-[0.97]"
            onClick={() => router.push("/dashboard")}
          >
            <span className="material-symbols-outlined text-lg select-none">arrow_back</span>
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            {createdAt && (
              <span className="text-[10px] text-on-surface-variant hidden sm:inline">{timeAgo(new Date(createdAt))}</span>
            )}
            <PdfExportButton targetRef={resultsRef} fileName="cv-analysis-detail.pdf" />
          </div>
        </div>

        <div ref={resultsRef} className="space-y-10" id="checker-results-detail">

        {/* ============================================================ */}
        {/*  1. SCORE OVERVIEW                                            */}
        {/* ============================================================ */}
        <section className="flex flex-col items-center">
          <ScoreDonut score={scores.overall} color={color} label="Skor CV" />

          <h1 className="text-[32px] leading-10 font-bold text-center mb-2">Hasil Analisis CV</h1>
          <p className="text-base text-on-surface-variant text-center mb-4 max-w-[480px]">
            {summary?.slice(0, 120) || "Analisis CV telah selesai. Lihat detail di bawah untuk saran perbaikan."}
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
            <div className="bg-surface-container-low rounded-xl p-4 border-l-4 border-primary">
              <p className="text-sm text-on-surface leading-relaxed">{narrativeFeedback.overall_assessment}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {narrativeFeedback.strengths.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">check_circle</span>Kelebihan
                  </h3>
                  <ul className="space-y-1.5">
                    {narrativeFeedback.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-green-800 flex items-start gap-2"><span className="text-green-500 mt-0.5 select-none">✓</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {narrativeFeedback.areas_for_improvement.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">warning</span>Perlu Diperbaiki
                  </h3>
                  <ul className="space-y-1.5">
                    {narrativeFeedback.areas_for_improvement.map((a, i) => (
                      <li key={i} className="text-xs text-red-800 flex items-start gap-2"><span className="text-red-400 mt-0.5 select-none">⚠</span>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {narrativeFeedback.ats_recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm select-none">description</span>Rekomendasi ATS
                </h3>
                <ul className="space-y-1">
                  {narrativeFeedback.ats_recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-blue-800 flex items-start gap-2"><span className="text-blue-500 mt-0.5 select-none">→</span>{r}</li>
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
              {keywordAnalysis.matched.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Ditemukan ({keywordAnalysis.matched.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.matched.map((kw, i) => <KeywordChip key={i} text={kw} variant="found" />)}
                  </div>
                </div>
              )}
              {keywordAnalysis.missing_critical.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Hilang · Prioritas ({keywordAnalysis.missing_critical.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missing_critical.map((kw, i) => <KeywordChip key={i} text={kw} variant="missing" />)}
                  </div>
                </div>
              )}
              {keywordAnalysis.missing_nice_to_have.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2">Hilang · Tambahan ({keywordAnalysis.missing_nice_to_have.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missing_nice_to_have.map((kw, i) => <KeywordChip key={i} text={kw} variant="nice" />)}
                  </div>
                </div>
              )}
              {keywordAnalysis.synonym_suggestions.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Saran Sinonim</p>
                  <ul className="space-y-1">
                    {keywordAnalysis.synonym_suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-blue-800 flex items-start gap-2"><span className="text-blue-500 mt-0.5 select-none">→</span>{s}</li>
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
            className="bg-surface rounded-2xl border border-surface-container-high shadow-premium-md p-6 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <h2 className="text-xl font-bold text-on-surface">Rencana Tindakan</h2>
            <div className="space-y-4">
              {actionPlan.quick_wins.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">bolt</span>Quick Wins (5-10 menit)
                  </h3>
                  <ul className="space-y-1.5">
                    {actionPlan.quick_wins.map((item, i) => (
                      <li key={i} className="text-xs text-green-800 flex items-start gap-2"><span className="text-green-500 mt-0.5 select-none">✓</span>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {actionPlan.short_term.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">schedule</span>Jangka Pendek (1-2 jam)
                  </h3>
                  <ul className="space-y-1.5">
                    {actionPlan.short_term.map((item, i) => (
                      <li key={i} className="text-xs text-blue-800 flex items-start gap-2"><span className="text-blue-500 mt-0.5 select-none">→</span>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {actionPlan.long_term.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">flag</span>Jangka Panjang (Restrukturisasi)
                  </h3>
                  <ul className="space-y-1.5">
                    {actionPlan.long_term.map((item, i) => (
                      <li key={i} className="text-xs text-purple-800 flex items-start gap-2"><span className="text-purple-500 mt-0.5 select-none">★</span>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/*  6. BULLET REVIEW — per poin pengalaman                       */}
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
            className="bg-surface rounded-2xl border border-surface-container-high shadow-premium-md p-6"
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
        {/*  7b. CTA — Surat Lamaran / Motivation Letter                 */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
            Lanjutkan · Buat Surat dari CV Ini
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/builder/new?next=surat-formal"
              className="group flex items-center gap-3 bg-surface rounded-xl p-4 border border-outline-variant/50 hover:border-primary/40 hover:shadow-premium-md transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-violet-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  markunread_mailbox
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">Surat Lamaran</p>
                <p className="text-[11px] text-on-surface-variant">Formal · Formal Lengkap · ATS · Kasual</p>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
            <Link
              href="/builder/new?next=surat-motivation"
              className="group flex items-center gap-3 bg-surface rounded-xl p-4 border border-outline-variant/50 hover:border-amber-400/60 hover:shadow-premium-md transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-amber-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  emoji_events
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">Motivation Letter</p>
                <p className="text-[11px] text-on-surface-variant">Beasiswa · Program · Fresh grad</p>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant group-hover:text-amber-500 transition-colors shrink-0"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  8. CTA — Analisis Ulang atau Buat CV                        */}
        {/* ============================================================ */}
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-10 shadow-premium-lg bg-gradient-to-br from-primary via-primary-container to-primary-deep">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-[32px] leading-10 font-bold text-white mb-2">
                {scores.overall >= 70 ? "Skor CV Kamu Sudah Baik!" : "Masih Bisa Ditingkatkan!"}
              </h2>
              <p className="text-base text-white/90 max-w-[320px]">
                {scores.overall >= 70
                  ? "Gunakan insight di atas untuk fine-tuning CV-mu."
                  : "Terapkan saran perbaikan di atas untuk naikkan skor CV-mu."}
              </p>
            </div>
            <MagneticButton>
              <button
                onClick={() => router.push("/checker")}
                className="bg-white text-primary px-8 py-4 rounded-full text-sm font-semibold shadow-premium-md hover:bg-gray-100 active:scale-95 transition-[transform,background-color] flex items-center gap-2"
              >
                Analisis Ulang
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
