"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AuthGuard from "@/components/AuthGuard";
import { useBookmarks } from "@/hooks/useBookmarks";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { getQCategoryFilters } from "@/components/interview/QCategoryIcon";
import { ShareButton } from "@/components/interview/ShareButton";
import { useTranslation } from "@/lib/i18n";
import {
  getInterviewPositions,
  getInterviewCategories,
} from "@/data/interview-questions";
import { notFound } from "next/navigation";

type SortMode = "default" | "category";

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useTranslation();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [qFilter, setQFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const positions = getInterviewPositions(lang);
  const position = positions.find((p) => p.id === params.id);
  if (!position) notFound();

  const currentIndex = positions.findIndex((p) => p.id === position.id);
  const prevPosition = currentIndex > 0 ? positions[currentIndex - 1] : null;
  const nextPosition =
    currentIndex < positions.length - 1
      ? positions[currentIndex + 1]
      : null;

  const categoryName =
    getInterviewCategories(lang).find((c) => c.slug === position.categorySlug)?.name ||
    position.categorySlug;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: position.questions.length };
    position.questions.forEach((q) => {
      counts[q.category] = (counts[q.category] || 0) + 1;
    });
    return counts;
  }, [position.questions]);

  const filteredQuestions = useMemo(() => {
    let items = position.questions;
    if (qFilter !== "all") {
      items = items.filter((q) => q.category === qFilter);
    }
    if (sortMode === "category") {
      const order = { hr: 0, technical: 1, "role-specific": 2 };
      return [...items].sort((a, b) => order[a.category] - order[b.category]);
    }
    return items;
  }, [position.questions, qFilter, sortMode]);

  const savedCount = position.questions.filter((q) => isBookmarked(q.id)).length;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background text-on-background">
        <AppHeader />

        <main className="flex-1 pt-24 pb-20 px-margin-mobile md:px-gutter">
          <div className="max-w-[700px] mx-auto">
            {/* ── Back link ── */}
            <button
              onClick={() => router.push("/interview")}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary mb-6 transition-colors group"
            >
              <span className="material-symbols-outlined text-[14px] group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              {lang === "en" ? "Back to position list" : "Kembali ke daftar posisi"}
            </button>

            {/* ── Hero ── */}
            <section className="mb-8">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center shadow-premium-sm shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">{position.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold mb-1">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                    {lang === "en" ? "Interview Template" : "Template Interview"}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-background">
                    {position.title}
                  </h1>
                </div>
                <ShareButton iconOnly className="shrink-0 mt-1" />
              </div>
              <p className="text-sm text-on-surface-variant flex items-center gap-2 flex-wrap">
                <span className="bg-surface-container-low px-2.5 py-0.5 rounded-md text-[10px] font-semibold">
                  {categoryName}
                </span>
                <span>·</span>
                <span>{position.questions.length} {lang === "en" ? "questions" : "pertanyaan"}</span>
                {savedCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-600 flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-[12px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        bookmark
                      </span>
                      {savedCount} {lang === "en" ? "saved" : "tersimpan"}
                    </span>
                  </>
                )}
                <span className="ml-auto">
                  <ShareButton label="Bagikan" />
                </span>
              </p>
            </section>

            {/* ── Practice Mode CTA ── */}
            <section className="mb-6">
              <motion.button
                onClick={() => router.push(`/interview/practice?position=${position.id}`)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all group relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Shimmer overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
                <div className="flex items-center gap-3 relative z-10">
                  <motion.div
                    className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="material-symbols-outlined text-lg">play_circle</span>
                  </motion.div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{lang === "en" ? "Practice" : "Latihan Interview"} {position.title}</p>
                    <p className="text-[10px] text-white/80">
                      {lang === "en" ? "Timer, random questions, and answer evaluation" : "Timer, pertanyaan acak, dan evaluasi jawaban"}
                    </p>
                  </div>
                </div>
                <motion.span
                  className="material-symbols-outlined text-lg relative z-10"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  arrow_forward
                </motion.span>
              </motion.button>
            </section>

            {/* ── Question Filter + Sort ── */}
            <section className="mb-6">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {getQCategoryFilters(lang).map((f) => (
                  <button
                    key={f.slug}
                    onClick={() => {
                      setQFilter(f.slug);
                      if (f.slug === "all") setSortMode("default");
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                      qFilter === f.slug
                        ? "bg-primary text-on-primary border-primary"
                        : f.slug === "all"
                          ? "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30"
                          : f.color
                    }`}
                  >
                    {f.label}
                    {categoryCounts[f.slug] !== undefined && (
                      <span className="ml-1 opacity-70">({categoryCounts[f.slug]})</span>
                    )}
                  </button>
                ))}

                <div className="ml-auto shrink-0">
                  <button
                    onClick={() => setSortMode(sortMode === "category" ? "default" : "category")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                      sortMode === "category"
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30"
                    }`}
                    title={sortMode === "category" ? "Urut default" : "Urut berdasarkan kategori"}
                  >
                    <span className="material-symbols-outlined text-[12px]">sort</span>
                    {sortMode === "category"
                      ? (lang === "en" ? "Category" : "Kategori")
                      : "Default"}
                  </button>
                </div>
              </div>
            </section>

            {/* ── Questions List ── */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl py-12 border border-dashed border-outline-variant text-center shadow-premium-sm">
                <span className="material-symbols-outlined text-outline text-3xl mb-2 block">filter_none</span>
                <p className="text-xs text-on-surface-variant">
                  {lang === "en" ? "No questions match this filter" : "Tidak ada pertanyaan dengan filter ini"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    index={i}
                    isBookmarked={isBookmarked(q.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </div>
            )}

            {/* ── Navigation antar posisi ── */}
            <section className="mt-10 grid grid-cols-2 gap-3">
              {prevPosition ? (
                <motion.button
                  onClick={() => router.push(`/interview/${prevPosition.id}`)}
                  className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm hover:shadow-premium-md hover:-translate-y-0.5 transition-all text-left group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-[9px] text-on-surface-variant flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-[10px]">arrow_back</span>
                    {lang === "en" ? "Previous" : "Sebelumnya"}
                  </span>
                  <p className="text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {prevPosition.title}
                  </p>
                </motion.button>
              ) : (
                <div />
              )}

              {nextPosition ? (
                <motion.button
                  onClick={() => router.push(`/interview/${nextPosition.id}`)}
                  className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm hover:shadow-premium-md hover:-translate-y-0.5 transition-all text-right group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-[9px] text-on-surface-variant flex items-center gap-1 justify-end mb-1">
                    {lang === "en" ? "Next" : "Selanjutnya"}
                    <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                  </span>
                  <p className="text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {nextPosition.title}
                  </p>
                </motion.button>
              ) : (
                <div />
              )}
            </section>

            {/* ── Bottom info ── */}
            <section className="mt-8 bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-premium-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary">lightbulb</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-1">
                    {lang === "en" ? `Interview Tips for ${position.title}` : `Tips Interview untuk ${position.title}`}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {lang === "en"
                      ? "Answer with concrete examples from real experience. Use these answers as a framework, not something to memorize. Click the"
                      : "Jawab dengan contoh konkret dari pengalaman nyata. Gunakan jawaban di sini sebagai kerangka, bukan untuk dihafal. Klik icon"}{" "}
                    <span className="material-symbols-outlined text-[12px] text-amber-500 align-middle">bookmark</span>{" "}
                    {lang === "en"
                      ? "to save favorite questions."
                      : "untuk menyimpan pertanyaan favorit."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>

        <AppFooter bordered />
      </div>
    </AuthGuard>
  );
}
