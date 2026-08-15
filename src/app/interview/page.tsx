"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AuthGuard from "@/components/AuthGuard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useBookmarks } from "@/hooks/useBookmarks";
import { PositionModal } from "@/components/interview/PositionModal";
import { useTranslation } from "@/lib/i18n";
import {
  getInterviewPositions,
  getInterviewCategories,
  getPositionsByCategory,
  searchPositions,
  type PositionQuestions,
} from "@/data/interview-questions";

/* ── Main Page ── */
export default function InterviewPage() {
  const router = useRouter();
  const { lang } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPosition, setSelectedPosition] =
    useState<PositionQuestions | null>(null);
  const { isBookmarked, toggleBookmark, bookmarkCount } = useBookmarks();

  const positions = useMemo(() => {
    if (activeCategory === "saved") {
      return getInterviewPositions(lang).filter((p) =>
        p.questions.some((q) => isBookmarked(q.id))
      );
    }
    if (search.trim()) return searchPositions(search, lang);
    if (activeCategory === "all") return getInterviewPositions(lang);
    return getPositionsByCategory(activeCategory, lang);
  }, [activeCategory, search, isBookmarked, lang]);

  const totalPositions = getInterviewPositions(lang).length;
  const totalQuestions = getInterviewPositions(lang).reduce(
    (acc, p) => acc + p.questions.length,
    0
  );

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background text-on-background">
        <AppHeader />

        <main className="flex-1 pt-24 pb-20 px-margin-mobile md:px-gutter">
          <div className="max-w-[1000px] mx-auto">
            {/* ── Hero ── */}
            <section className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                {lang === "en" ? "Free · Ready-to-Use Templates" : "Gratis · Template Siap Pakai"}
              </div>
              <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight text-on-background mb-3">
                {lang === "en" ? "Interview Prep" : "Persiapan Interview"}
              </h1>
              <p className="text-base md:text-lg text-on-surface-variant max-w-[550px] mx-auto mb-6">
                {lang === "en"
                  ? `${totalQuestions} common questions for ${totalPositions} different positions, complete with answering tips.`
                  : `${totalQuestions} pertanyaan umum untuk ${totalPositions} posisi berbeda. Lengkap dengan tips cara menjawabnya.`}
              </p>

              {/* Practice Mode CTA */}
              <AnimatedButton
                onClick={() => router.push("/interview/practice")}
                variant="emerald"
                shimmer
                pulseIcon
                bounceArrow
                icon={<span className="material-symbols-outlined text-[14px]">play_circle</span>}
                iconRight={
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                }
                className="mb-4"
              >
                {lang === "en" ? "Practice Mode · Timer & Random Questions" : "Mode Latihan · Timer & Pertanyaan Acak"}
              </AnimatedButton>

              {/* Search */}
              <div className="relative max-w-[420px] mx-auto">
                <span className="material-symbols-outlined text-outline absolute left-3.5 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value) setActiveCategory("all");
                  }}
                  placeholder={lang === "en" ? "Search positions or questions..." : "Cari posisi atau pertanyaan..."}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-outline-variant/50 shadow-premium-sm text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors"
                    aria-label={lang === "en" ? "Clear search" : "Hapus pencarian"}
                  >
                    <span className="material-symbols-outlined text-sm text-outline">close</span>
                  </button>
                )}
              </div>
            </section>

            {/* ── Category Tabs ── */}
            <section className="mb-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                <button
                  onClick={() => {
                    setActiveCategory("all");
                    setSearch("");
                  }}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    activeCategory === "all"
                      ? "bg-primary text-on-primary border-primary shadow-premium-sm"
                      : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {lang === "en" ? "All Positions" : "Semua Posisi"}
                </button>
                {getInterviewCategories(lang).map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      setActiveCategory(cat.slug);
                      setSearch("");
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      activeCategory === cat.slug
                        ? "bg-primary text-on-primary border-primary shadow-premium-sm"
                        : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
                {/* Saved tab */}
                <button
                  onClick={() => {
                    setActiveCategory("saved");
                    setSearch("");
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    activeCategory === "saved"
                      ? "bg-amber-500 text-white border-amber-500 shadow-premium-sm"
                      : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-amber-400 hover:text-amber-600"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={activeCategory === "saved" ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    bookmark
                  </span>
                  {lang === "en" ? "Saved" : "Tersimpan"}
                  {bookmarkCount > 0 && (
                    <span
                      className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[9px] font-bold px-1 ${
                        activeCategory === "saved"
                          ? "bg-white/25 text-white"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {bookmarkCount}
                    </span>
                  )}
                </button>
              </div>
            </section>

            {/* ── Position Grid ── */}
            {positions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-dashed border-outline-variant text-center shadow-premium-sm">
                <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    {activeCategory === "saved" ? "bookmark_border" : "search_off"}
                  </span>
                </div>
                <h3 className="font-label-bold text-on-surface mb-1">
                  {activeCategory === "saved"
                    ? (lang === "en" ? "No saved questions yet" : "Belum ada pertanyaan tersimpan")
                    : (lang === "en" ? "Position not found" : "Posisi tidak ditemukan")}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {activeCategory === "saved"
                    ? (lang === "en" ? "Click the bookmark icon on a question to save it" : "Klik icon bookmark pada pertanyaan untuk menyimpannya")
                    : (lang === "en" ? "Try another keyword or choose a different category" : "Coba gunakan kata kunci lain atau pilih kategori yang berbeda")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {positions.map((pos, i) => {
                  const savedCount = pos.questions.filter((q) =>
                    isBookmarked(q.id)
                  ).length;
                  return (
                    <motion.button
                      key={pos.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      onClick={() => setSelectedPosition(pos)}
                      className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm hover:shadow-premium-md hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.98] transition-all text-left group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-primary text-lg">
                            {pos.icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-on-surface truncate">
                            {pos.title}
                          </h3>
                          <p className="text-[10px] text-on-surface-variant">
                            {pos.questions.length} {lang === "en" ? "questions" : "pertanyaan"}
                            {savedCount > 0 && (
                              <span className="text-amber-600 ml-1.5">
                                &middot; {savedCount} {lang === "en" ? "saved" : "tersimpan"}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-outline text-lg group-hover:text-primary transition-colors">
                          chevron_right
                        </span>
                      </div>

                      {/* Category badge + Lihat Detail link */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-surface-container-low text-on-surface-variant">
                          {getInterviewCategories(lang).find((c) => c.slug === pos.categorySlug)?.name ||
                            pos.categorySlug}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/interview/${pos.id}`);
                          }}
                          className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                        >
                          {lang === "en" ? "View Details" : "Lihat Detail"}
                          <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* ── Bottom info ── */}
            <section className="mt-10 bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-premium-sm">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl bg-secondary-container/50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary">lightbulb</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-on-surface mb-1">
                    {lang === "en" ? "Tips for Using This Interview Database" : "Tips Menggunakan Database Interview Ini"}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {lang === "en"
                      ? "These templates are general guides. Answer with your own stories and real experience. Click the"
                      : "Template ini adalah panduan umum. Jawablah dengan cerita dan pengalaman nyata Anda. Klik icon"}{" "}
                    <span className="material-symbols-outlined text-[12px] text-amber-500 align-middle">bookmark</span>{" "}
                    {lang === "en"
                      ? "to save favorite questions, or open each position's detail page for easier navigation."
                      : "untuk menyimpan pertanyaan favorit, atau buka halaman detail setiap posisi untuk navigasi yang lebih nyaman."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>

        <AppFooter bordered />

        {/* ── Position Detail Modal ── */}
        <AnimatePresence>
          {selectedPosition && (
            <PositionModal
              position={selectedPosition}
              onClose={() => setSelectedPosition(null)}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
            />
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
