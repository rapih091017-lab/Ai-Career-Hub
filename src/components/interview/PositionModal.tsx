"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { QuestionCard } from "./QuestionCard";
import { QUESTION_CATEGORY_FILTERS } from "./QCategoryIcon";
import { ShareButton } from "./ShareButton";
import MagneticButton from "@/components/MagneticButton";
import {
  POSITION_QUESTIONS,
  QUESTION_CATEGORIES,
  type PositionQuestions,
} from "@/data/interview-questions";

type SortMode = "default" | "category";

export function PositionModal({
  position,
  onClose,
  isBookmarked,
  onToggleBookmark,
}: {
  position: PositionQuestions;
  onClose: () => void;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (id: string) => void;
}) {
  const [qFilter, setQFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const filteredQuestions = useMemo(() => {
    let items = position.questions;
    if (qFilter !== "all") {
      items = items.filter((q) => q.category === qFilter);
    }
    if (sortMode === "category") {
      const order = { hr: 0, technical: 1, "role-specific": 2 };
      return [...items].sort((a, b) => order[a.category] - order[b.category]);
    }
    return items; // default = original order
  }, [position.questions, qFilter, sortMode]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: position.questions.length };
    position.questions.forEach((q) => {
      counts[q.category] = (counts[q.category] || 0) + 1;
    });
    return counts;
  }, [position.questions]);

  const categoryName =
    QUESTION_CATEGORIES.find((c) => c.slug === position.categorySlug)?.name ||
    position.categorySlug;

  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centering wrapper */}
      <div className="relative z-10 flex items-start justify-center min-h-full pt-12 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-[700px] bg-background rounded-2xl shadow-premium-xl border border-outline-variant/50 overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-outline-variant/30 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{position.icon}</span>
                </div>
                <div>
                  <h2 className="font-label-bold text-on-surface">{position.title}</h2>
                  <p className="text-[11px] text-on-surface-variant">{categoryName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ShareButton iconOnly />
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-outline">close</span>
                </button>
              </div>
            </div>

            {/* ── Question Category Filter + Sort ── */}
            <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto hide-scrollbar">
              {QUESTION_CATEGORY_FILTERS.map((f) => (
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
                  {sortMode === "category" ? "Kategori" : "Default"}
                </button>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-on-surface-variant mb-4">
              {filteredQuestions.length} pertanyaan
              {qFilter !== "all" && ` (dari ${position.questions.length})`} untuk posisi{" "}
              <strong className="text-on-surface">{position.title}</strong>
            </p>

            {filteredQuestions.length === 0 ? (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-outline text-3xl mb-2 block">filter_none</span>
                <p className="text-xs text-on-surface-variant">
                  Tidak ada pertanyaan dengan filter ini
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  isBookmarked={isBookmarked(q.id)}
                  onToggleBookmark={onToggleBookmark}
                />
              ))
            )}
          </div>

          {/* Footer — buka dedicated page + close */}
          <div className="sticky bottom-0 bg-white border-t border-outline-variant/30 p-3 flex items-center justify-between gap-2">
            <div />

            <div className="flex items-center gap-2">
              <MagneticButton>
                <button
                  onClick={() => {
                    router.push(`/interview/${position.id}`);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-[10px] font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-hover hover:text-primary transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  Buka Halaman
                </button>
              </MagneticButton>

              <MagneticButton>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  Tutup
                </button>
              </MagneticButton>
            </div>

            <div />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
