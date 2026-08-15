"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ui/toast";
import { QCategoryIcon, getQCategoryFilters } from "@/components/interview/QCategoryIcon";
import { useTranslation } from "@/lib/i18n";
import {
  getInterviewPositions,
  getInterviewCategories,
  getDifficulty,
  type InterviewQuestion,
  type PositionQuestions,
  type Difficulty,
} from "@/data/interview-questions";

/* ── Types ── */
type SessionState = "setup" | "running" | "finished";
type TimerOption = 60 | 120 | 180 | 300;

interface PracticeQuestion {
  question: InterviewQuestion;
  positionTitle: string;
  positionIcon: string;
}

interface SessionResult {
  question: PracticeQuestion;
  timeSpent: number;
  revealedAnswer: boolean;
  rating?: "good" | "okay" | "weak";
}

type RatingOption = "good" | "okay" | "weak";
const RATING_OPTIONS: { value: RatingOption; labelId: string; labelEn: string; icon: string; color: string }[] = [
  { value: "good", labelId: "Udah Bisa", labelEn: "Good", icon: "check_circle", color: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200" },
  { value: "okay", labelId: "Kurang", labelEn: "Fair", icon: "trending_flat", color: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200" },
  { value: "weak", labelId: "Belum", labelEn: "Not Yet", icon: "highlight_off", color: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" },
];

const DIFFICULTY_LABELS: Record<string, { labelId: string; labelEn: string; icon: string; color: string }> = {
  easy: { labelId: "Mudah", labelEn: "Easy", icon: "signal_cellular_alt_1_bar", color: "bg-emerald-100 text-emerald-700" },
  medium: { labelId: "Sedang", labelEn: "Medium", icon: "signal_cellular_alt_2_bar", color: "bg-amber-100 text-amber-700" },
  hard: { labelId: "Sulit", labelEn: "Hard", icon: "signal_cellular_alt_3_bar", color: "bg-red-100 text-red-700" },
};

/* ── Timer Options ── */
const TIMER_OPTIONS: { value: TimerOption; labelId: string; labelEn: string }[] = [
  { value: 60, labelId: "1 menit", labelEn: "1 min" },
  { value: 120, labelId: "2 menit", labelEn: "2 min" },
  { value: 180, labelId: "3 menit", labelEn: "3 min" },
  { value: 300, labelId: "5 menit", labelEn: "5 min" },
];

/* ── Practice Setup Screen ── */
function SetupScreen({
  selectedPositions,
  onTogglePosition,
  selectedCategories,
  onToggleCategory,
  selectedDifficulties,
  onToggleDifficulty,
  onClearAll,
  timerDuration,
  onTimerChange,
  onStart,
  onQuickStart,
}: {
  selectedPositions: Set<string>;
  onTogglePosition: (id: string) => void;
  selectedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  selectedDifficulties: Set<string>;
  onToggleDifficulty: (diff: string) => void;
  onClearAll: () => void;
  timerDuration: TimerOption;
  onTimerChange: (t: TimerOption) => void;
  onStart: () => void;
  onQuickStart: () => void;
}) {
  const { lang } = useTranslation();
  const allPositions = getInterviewPositions(lang);
  const categories = getInterviewCategories(lang);
  const totalSelected = selectedPositions.size;
  const totalQuestions = useMemo(() => {
    return allPositions.filter((p) => selectedPositions.has(p.id))
      .reduce((acc, p) => {
        let qs = p.questions;
        if (!selectedCategories.has("all")) {
          qs = qs.filter((q) => selectedCategories.has(q.category));
        }
        return acc + qs.length;
      }, 0);
  }, [allPositions, selectedPositions, selectedCategories]);

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-200">
          <span className="material-symbols-outlined text-[14px]">play_circle</span>
          {lang === "en" ? "Interview Practice" : "Latihan Interview"}
        </div>
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-on-background mb-3">
          {lang === "en" ? "Practice Mode" : "Mode Latihan"}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-[400px] mx-auto">
          {lang === "en"
            ? "Pick a position and set a timer. Get random questions and practice answering like a real interview."
            : "Pilih posisi dan atur timer. Dapatkan pertanyaan acak dan latih jawabanmu seperti wawancara sungguhan."}
        </p>
      </div>

      {/* ── Step 1: Pilih Posisi ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">1</span>
            {lang === "en" ? "Choose Position" : "Pilih Posisi"}
            <span className="text-[10px] text-on-surface-variant font-normal">
              ({totalSelected} {lang === "en" ? "selected" : "dipilih"})
            </span>
          </h2>
          {totalSelected > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-outline hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-200"
            >
              <span className="material-symbols-outlined text-[11px]">clear</span>
              {lang === "en" ? "Clear All" : "Hapus Semua"}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {categories.map((cat) => {
            const positions = allPositions.filter((p) => p.categorySlug === cat.slug);
            if (positions.length === 0) return null;
            const catSelected = positions.every((p) => selectedPositions.has(p.id));

            return (
              <div key={cat.slug} className="bg-white rounded-xl border border-outline-variant/30 shadow-premium-sm overflow-hidden">
                <button
                  onClick={() => {
                    // Toggle all positions in this category
                    const allSelected = positions.every((p) => selectedPositions.has(p.id));
                    positions.forEach((p) => {
                      if (allSelected) {
                        if (selectedPositions.has(p.id)) onTogglePosition(p.id);
                      } else {
                        if (!selectedPositions.has(p.id)) onTogglePosition(p.id);
                      }
                    });
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container-low hover:bg-surface-container-hover transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">{cat.icon}</span>
                    <span className="text-xs font-semibold text-on-surface">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                      catSelected ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {positions.filter((p) => selectedPositions.has(p.id)).length}/{positions.length}
                    </span>
                    <span className={`text-[9px] font-medium ${
                      catSelected ? "text-outline" : "text-primary"
                    }`}>
                      {catSelected
                        ? (lang === "en" ? "Clear All" : "Hapus Semua")
                        : (lang === "en" ? "Select All" : "Pilih Semua")}
                    </span>
                  </div>
                </button>

                <div className="px-2 pb-2 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {positions.map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => onTogglePosition(pos.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-semibold border transition-all text-left ${
                        selectedPositions.has(pos.id)
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[11px] shrink-0">{pos.icon}</span>
                      <span className="truncate">{pos.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Step 2+3: Filter Kategori & Kesulitan (berdampingan di desktop) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section>
          <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">2</span>
            {lang === "en" ? "Question Category" : "Kategori Pertanyaan"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {getQCategoryFilters(lang).map((cat) => (
              <button
                key={cat.slug}
                onClick={() => onToggleCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                  selectedCategories.has(cat.slug)
                    ? "bg-primary text-on-primary border-primary"
                    : cat.color + " border-outline-variant/40 hover:border-primary/30"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">3</span>
            {lang === "en" ? "Difficulty" : "Tingkat Kesulitan"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { slug: "all", label: lang === "en" ? "All" : "Semua" },
              { slug: "easy", label: lang === "en" ? "Easy" : "Mudah", icon: "signal_cellular_alt_1_bar" },
              { slug: "medium", label: lang === "en" ? "Medium" : "Sedang", icon: "signal_cellular_alt_2_bar" },
              { slug: "hard", label: lang === "en" ? "Hard" : "Sulit", icon: "signal_cellular_alt_3_bar" },
            ].map((d) => (
              <button
                key={d.slug}
                onClick={() => onToggleDifficulty(d.slug)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                  selectedDifficulties.has(d.slug)
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30"
                }`}
              >
                {d.icon && <span className="material-symbols-outlined text-[11px]">{d.icon}</span>}
                {d.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ── Step 4: Timer ── */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">4</span>
          {lang === "en" ? "Timer per Question" : "Timer per Pertanyaan"}
        </h2>
        <div className="flex gap-2">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onTimerChange(opt.value)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                timerDuration === opt.value
                  ? "bg-primary text-on-primary border-primary shadow-premium-sm"
                  : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30"
              }`}
            >
              {lang === "en" ? opt.labelEn : opt.labelId}
            </button>
          ))}
        </div>
      </section>

      {/* ── Action Buttons ── */}
      {totalSelected > 0 && totalQuestions === 0 && (
        <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-600 text-base mt-0.5">info</span>
          <p className="text-[11px] text-amber-800">
            {lang === "en"
              ? "The selected category & difficulty combination produces no questions. Try different filters or add positions."
              : "Kombinasi kategori & kesulitan yang dipilih tidak menghasilkan pertanyaan. Coba pilih ulang filter atau tambah posisi."}
          </p>
        </div>
      )}
      <div className="space-y-3">
        <button
          onClick={onStart}
          disabled={totalSelected === 0 || totalQuestions === 0}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white hover:opacity-90 active:scale-[0.98] shadow-premium-md"
        >
          <span className="material-symbols-outlined text-lg">play_arrow</span>
          {lang === "en" ? "Start Practice" : "Mulai Latihan"}
          {totalSelected > 0 && (
            <span className="text-[10px] opacity-80">({totalQuestions} {lang === "en" ? "questions" : "pertanyaan"})</span>
          )}
        </button>

        {/* Quick Start */}
        <button
          onClick={onQuickStart}
          className="w-full py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90 active:scale-[0.98] shadow-premium-sm relative overflow-hidden group"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="material-symbols-outlined text-lg relative z-10">bolt</span>
          <span className="relative z-10">{lang === "en" ? "Quick Start · Pick Randomly" : "Quick Start · Pilihkan Acak"}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Running Session Screen ── */
function RunningScreen({
  currentQuestion,
  questionIndex,
  totalQuestions,
  timerRemaining,
  timerDuration,
  answered,
  timeUp,
  existingRating,
  onShowAnswer,
  onNext,
  onSkip,
  onEnd,
  onRate,
}: {
  currentQuestion: PracticeQuestion;
  questionIndex: number;
  totalQuestions: number;
  timerRemaining: number;
  timerDuration: number;
  answered: boolean;
  timeUp: boolean;
  existingRating?: RatingOption;
  onShowAnswer: () => void;
  onNext: () => void;
  onSkip: () => void;
  onEnd: () => void;
  onRate: (qId: string, rating: RatingOption) => void;
}) {
  const { lang } = useTranslation();
  const diff = getDifficulty(currentQuestion.question);
  const diffMeta = DIFFICULTY_LABELS[diff];

  const timerPercent = (timerRemaining / timerDuration) * 100;
  const timerColor =
    timerPercent > 50
      ? "bg-emerald-500"
      : timerPercent > 25
        ? "bg-amber-500"
        : "bg-red-500";

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-[650px] mx-auto">
      {/* ── Top bar: progress + timer ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onEnd}
            className="w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center transition-colors"
            title="Akhiri sesi"
          >
            <span className="material-symbols-outlined text-outline text-lg">close</span>
          </button>
          <div>
            <p className="text-[10px] text-on-surface-variant">{lang === "en" ? "Progress" : "Progress"}</p>
            <p className="text-xs font-bold text-on-surface">
              {questionIndex + 1} / {totalQuestions}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-surface-container-hover rounded-full overflow-hidden relative">
            <motion.div
              className={`h-full rounded-full ${timerColor}`}
              initial={{ width: "100%" }}
              animate={timeUp ? { width: "0%" } : { width: `${timerPercent}%` }}
              transition={
                timeUp
                  ? { duration: 0.3 }
                  : { duration: 1, ease: "linear" }
              }
            />
          </div>
          <span className={`text-sm font-bold min-w-[40px] text-right tabular-nums ${
            timeUp ? "text-red-500 animate-pulse" :
            timerPercent <= 25 ? "text-red-500" : timerPercent <= 50 ? "text-amber-500" : "text-on-surface"
          }`}>
            {timeUp ? "⏰" : formatTime(timerRemaining)}
          </span>
        </div>
      </div>

      {/* ── Time's Up overlay ── */}
      <AnimatePresence>
        {timeUp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-center"
          >
            <p className="text-sm font-bold text-red-700 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">timer_off</span>
              {lang === "en" ? "Time's up! Showing the answer..." : "Waktu habis! Menampilkan jawaban..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Question Card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.question.id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-2xl border border-outline-variant/30 shadow-premium-md overflow-hidden"
        >
          {/* Position badge + difficulty */}
          <div className="px-5 pt-4 pb-2 flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[14px]">
                {currentQuestion.positionIcon}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-on-surface-variant">
              {currentQuestion.positionTitle}
            </span>
            {/* Difficulty badge */}
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold ${diffMeta.color}`}>
              <span className="material-symbols-outlined text-[10px]">{diffMeta.icon}</span>
              {lang === "en" ? diffMeta.labelEn : diffMeta.labelId}
            </span>
            <div className="ml-auto">
              <QCategoryIcon cat={currentQuestion.question.category} />
            </div>
          </div>

          {/* Question text */}
          <div className="px-5 pb-5">
            <p className="text-base font-bold text-on-surface leading-relaxed">
              {currentQuestion.question.question}
            </p>
          </div>

          {/* Answer section */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden border-t border-outline-variant/20"
              >
                <div className="px-5 py-4 space-y-3">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lightbulb</span>
                    {lang === "en" ? "Reference Answer" : "Jawaban Referensi"}
                  </p>
                  <div className="p-3.5 bg-surface-container-low rounded-xl border-l-2 border-primary">
                    <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
                      {currentQuestion.question.answer}
                    </p>
                  </div>

                  {currentQuestion.question.tips && currentQuestion.question.tips.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">tips_and_updates</span>
                        Tips
                      </p>
                      <ul className="space-y-1">
                        {currentQuestion.question.tips.map((tip, i) => (
                          <li key={i} className="text-[11px] text-amber-800 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentQuestion.question.followUp && (
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">forum</span>
                        Pertanyaan Lanjutan
                      </p>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        {currentQuestion.question.followUp}
                      </p>
                    </div>
                  )}

                  {/* ── Self Rating ── */}
                  <div className="pt-2 border-t border-outline-variant/20">
                    <p className="text-[10px] font-bold text-on-surface-variant mb-2 text-center">
                      {lang === "en" ? "How was your answer?" : "Bagaimana jawabanmu?"}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {RATING_OPTIONS.map((opt) => {
                        const isActive = existingRating === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => onRate(currentQuestion.question.id, opt.value)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                              isActive
                                ? opt.color + " border-current shadow-premium-sm"
                                : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-current"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">{opt.icon}</span>
                            {lang === "en" ? opt.labelEn : opt.labelId}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[10px] text-on-surface-variant text-center pt-1">
                    {lang === "en"
                      ? "Use as a reference. Answer in your own words!"
                      : "Gunakan sebagai referensi. Jawab dengan kata-katamu sendiri!"}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="px-5 pb-4 pt-0 flex items-center gap-2">
            {!answered ? (
              <>
                <button
                  onClick={onSkip}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-hover transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={onShowAnswer}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-[0.98] transition-all border border-amber-200"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                    {lang === "en" ? "Show Answer" : "Lihat Jawaban"}
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={onNext}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span className="flex items-center justify-center gap-1.5">
                  {questionIndex + 1 < totalQuestions
                    ? (lang === "en" ? "Next Question" : "Pertanyaan Selanjutnya")
                    : (lang === "en" ? "View Results" : "Lihat Hasil")}
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </button>
            )}

            <button
              onClick={onEnd}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-hover transition-all"
            >
              {lang === "en" ? "End" : "Akhiri"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Position indicator dots ── */}
      <div className="flex items-center justify-center gap-1 mt-6">
        {Array.from({ length: Math.min(totalQuestions, 20) }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i < questionIndex
                ? "bg-primary"
                : i === questionIndex
                  ? "bg-primary w-3 h-3"
                  : "bg-outline-variant"
            }`}
          />
        ))}
        {totalQuestions > 20 && (
          <span className="text-[9px] text-on-surface-variant ml-1">+{totalQuestions - 20}</span>
        )}
      </div>
    </div>
  );
}

/* ── Finished Screen ── */
function FinishedScreen({
  results,
  totalQuestions,
  totalTime,
  onRestart,
  onBack,
}: {
  results: SessionResult[];
  totalQuestions: number;
  totalTime: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  const answered = results.filter((r) => r.revealedAnswer).length;
  const rated = results.filter((r) => r.rating).length;
  const good = results.filter((r) => r.rating === "good").length;
  const okay = results.filter((r) => r.rating === "okay").length;
  const weak = results.filter((r) => r.rating === "weak").length;

  const router = useRouter();
  const { lang } = useTranslation();
  const { addToast } = useToast();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}d`;
  };

  const handleShare = async () => {
    const en = lang === "en";
    const lines = en
      ? [
          "🎯 Finished an interview practice session on AI Career Hub!",
          `Answered ${answered} of ${totalQuestions} questions in ${formatTime(totalTime)}.`,
        ]
      : [
          "🎯 Selesai latihan interview di AI Career Hub!",
          `Jawab ${answered} dari ${totalQuestions} pertanyaan dalam ${formatTime(totalTime)}.`,
        ];
    if (rated > 0) {
      lines.push(en
        ? `Self evaluation: ${good} good, ${okay} fair, ${weak} not yet.`
        : `Evaluasi diri: ${good} udah bisa, ${okay} kurang, ${weak} belum.`);
    }
    lines.push(en
      ? "Free practice at https://aicareerhub.com/interview"
      : "Latihan gratis di https://aicareerhub.com/interview");
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      addToast({
        type: "success",
        message: en ? "Results copied! Just paste into chat/WA." : "Hasil disalin! Tinggal paste ke chat/WA.",
        duration: 2500,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast({ type: "error", message: en ? "Failed to copy results" : "Gagal menyalin hasil" });
    }
  };

  return (
    <div className="max-w-[500px] mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
      </div>
      <h1 className="text-2xl font-bold text-on-background mb-2">
        {lang === "en" ? "Session Complete!" : "Sesi Selesai!"}
      </h1>
      <p className="text-sm text-on-surface-variant mb-8">
        {lang === "en"
          ? "You've completed your interview practice session."
          : "Kamu telah menyelesaikan sesi latihan interview."}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm">
          <p className="text-xl font-bold text-on-surface">{totalQuestions}</p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">{lang === "en" ? "Total Questions" : "Total Pertanyaan"}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm">
          <p className="text-xl font-bold text-on-surface">{answered}</p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">{lang === "en" ? "Answers Shown" : "Lihat Jawaban"}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm">
          <p className="text-xl font-bold text-on-surface">{formatTime(totalTime)}</p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">{lang === "en" ? "Total Time" : "Total Waktu"}</p>
        </div>
      </div>

      {/* Self Rating Summary */}
      {rated > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-premium-sm p-4 mb-8 text-left">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">
            {lang === "en" ? `Self Evaluation (${rated} rated)` : `Evaluasi Diri (${rated} dinilai)`}
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] text-on-surface-variant flex-1">{lang === "en" ? "Good" : "Udah Bisa"}</span>
              <span className="text-xs font-bold text-on-surface tabular-nums">{good}</span>
              <span className="text-[10px] text-on-surface-variant tabular-nums">
                ({totalQuestions > 0 ? Math.round((good / rated) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-[11px] text-on-surface-variant flex-1">{lang === "en" ? "Fair" : "Kurang"}</span>
              <span className="text-xs font-bold text-on-surface tabular-nums">{okay}</span>
              <span className="text-[10px] text-on-surface-variant tabular-nums">
                ({totalQuestions > 0 ? Math.round((okay / rated) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-[11px] text-on-surface-variant flex-1">{lang === "en" ? "Not Yet" : "Belum"}</span>
              <span className="text-xs font-bold text-on-surface tabular-nums">{weak}</span>
              <span className="text-[10px] text-on-surface-variant tabular-nums">
                ({totalQuestions > 0 ? Math.round((weak / rated) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Question history — klik untuk review jawaban */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-premium-sm mb-6 text-left">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
          <p className="text-xs font-bold text-on-surface">{lang === "en" ? "Question History" : "Riwayat Pertanyaan"}</p>
          <span className="text-[9px] text-on-surface-variant">{lang === "en" ? "Click to view answer" : "Klik untuk lihat jawaban"}</span>
        </div>
        <div className="divide-y divide-outline-variant/10 max-h-[320px] overflow-y-auto">
          {results.map((r, i) => {
            const open = expandedIdx === i;
            return (
              <div key={i} className={open ? "bg-surface-container-low/60" : ""}>
                <button
                  onClick={() => setExpandedIdx(open ? null : i)}
                  className="w-full px-4 py-2.5 flex items-start gap-3 text-left hover:bg-surface-container-low transition-colors"
                  aria-expanded={open}
                >
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-on-surface truncate">
                      {r.question.question.question}
                    </p>
                    <p className="text-[9px] text-on-surface-variant mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{r.question.positionTitle}</span>
                      <span>·</span>
                      <span>{formatTime(r.timeSpent)}</span>
                      {r.revealedAnswer && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600">Lihat jawaban</span>
                        </>
                      )}
                      {r.rating && (
                        <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                          r.rating === "good" ? "bg-emerald-100 text-emerald-700" :
                          r.rating === "okay" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {r.rating === "good" ? "✅" : r.rating === "okay" ? "🔄" : "❌"}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`material-symbols-outlined text-outline text-sm shrink-0 mt-0.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  >
                    expand_more
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pl-12 space-y-2">
                        <div className="p-3 bg-white rounded-lg border-l-2 border-primary">
                          <p className="text-[11px] text-on-surface leading-relaxed whitespace-pre-line">
                            {r.question.question.answer}
                          </p>
                        </div>
                        {r.question.question.followUp && (
                          <p className="text-[10px] text-blue-700 bg-blue-50 rounded-lg p-2 border border-blue-200 leading-relaxed">
                            <strong>{lang === "en" ? "Follow-up: " : "Pertanyaan lanjutan: "}</strong>
                            {r.question.question.followUp}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Share result */}
      <button
        onClick={handleShare}
        className="w-full mb-3 py-3 rounded-xl text-xs font-bold bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-premium-sm"
      >
        <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "share"}</span>
        {copied
          ? (lang === "en" ? "Copied!" : "Tersalin!")
          : (lang === "en" ? "Share Practice Results" : "Bagikan Hasil Latihan")}
      </button>

      {/* Cross-sell — CTA ke Checker CV */}
      <div className="mb-6 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 text-left shadow-premium-md">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
          {lang === "en" ? "Next Step" : "Langkah Berikutnya"}
        </p>
        <p className="text-sm font-bold mb-1">
          {lang === "en" ? "Is your CV ready to use?" : "CV kamu sudah siap untuk dipakai?"}
        </p>
        <p className="text-[11px] text-white/85 leading-relaxed mb-3">
          {lang === "en"
            ? "Check your CV's ATS score and get specific improvement tips."
            : "Cek skor ATS CV kamu dan dapatkan saran perbaikan yang spesifik."}
        </p>
        <button
          onClick={() => router.push("/checker")}
          className="w-full py-2.5 rounded-xl bg-white text-emerald-600 text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          {lang === "en" ? "Check My CV Now" : "Cek CV Sekarang"}
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-xs font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-hover transition-all border border-outline-variant/40"
        >
          {lang === "en" ? "Back" : "Kembali"}
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          {lang === "en" ? "Practice Again" : "Latihan Lagi"}
        </button>
      </div>
    </div>
  );
}

/* ── Main Practice Page ── */
export default function PracticePage() {
  const router = useRouter();
  const { lang } = useTranslation();

  // ── Deteksi apakah URL punya ?position=xxx — untuk auto-start ──
  const [hasAutoStartParam] = useState(() => {
    if (typeof window !== "undefined") {
      return !!new URLSearchParams(window.location.search).get("position");
    }
    return false;
  });

  // Setup state
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(() => {
    // Check URL for ?position= param (client-side only)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const positionParam = params.get("position");
      if (positionParam) {
        const pos = getInterviewPositions(lang).find((p) => p.id === positionParam);
        if (pos) return new Set([pos.id]);
      }
    }
    return new Set();
  });
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(["all"]));
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(["all"]));
  // Rating state — persist to localStorage
  const [questionRatings, setQuestionRatings] = useState<Record<string, RatingOption>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("practice-ratings");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {};
  });
  const saveRating = useCallback((qId: string, rating: RatingOption) => {
    setQuestionRatings((prev) => {
      const next = { ...prev, [qId]: rating };
      try { localStorage.setItem("practice-ratings", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  // Time's up state
  const [timeUp, setTimeUp] = useState(false);

  const [timerDuration, setTimerDuration] = useState<TimerOption>(120);

  // Session state
  const [session, setSession] = useState<SessionState>("setup");
  const [sessionQuestions, setSessionQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Handlers ──
  const onTogglePosition = useCallback((id: string) => {
    setSelectedPositions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onClearAllPositions = useCallback(() => {
    setSelectedPositions(new Set());
  }, []);

  const onToggleDifficulty = useCallback((diff: string) => {
    setSelectedDifficulties((prev) => {
      // "Semua" bersifat eksklusif: klik selalu kembali ke semua kesulitan
      if (diff === "all") return new Set(["all"]);
      const next = new Set(prev);
      next.delete("all");
      if (next.has(diff)) next.delete(diff);
      else next.add(diff);
      return next.size === 0 ? new Set(["all"]) : next;
    });
  }, []);

  const onToggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) => {
      // "Semua" bersifat eksklusif: klik selalu kembali ke semua kategori
      if (cat === "all") return new Set(["all"]);
      const next = new Set(prev);
      next.delete("all");
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next.size === 0 ? new Set(["all"]) : next;
    });
  }, []);

  const generateQuestions = useCallback(() => {
    const allQuestions: PracticeQuestion[] = [];
    const positions = getInterviewPositions(lang).filter((p) => selectedPositions.has(p.id));

    positions.forEach((pos) => {
      let qs = pos.questions;
      if (!selectedCategories.has("all")) {
        qs = qs.filter((q) => selectedCategories.has(q.category));
      }
      if (!selectedDifficulties.has("all")) {
        qs = qs.filter((q) => selectedDifficulties.has(getDifficulty(q)));
      }
      qs.forEach((q) => {
        allQuestions.push({
          question: q,
          positionTitle: pos.title,
          positionIcon: pos.icon,
        });
      });
    });

    // Fisher-Yates shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    return allQuestions;
  }, [selectedPositions, selectedCategories, selectedDifficulties, lang]);

  const startTimer = useCallback((duration: number) => {
    setTimerRemaining(duration);
    timerRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Quick start: pick random position, start immediately ──
  const handleQuickStart = useCallback(() => {
    const langPositions = getInterviewPositions(lang);
    const randomPos = langPositions[Math.floor(Math.random() * langPositions.length)];
    if (!randomPos) return;
    setSelectedPositions(new Set([randomPos.id]));
    setSelectedCategories(new Set(["all"]));
    setSelectedDifficulties(new Set(["all"]));
    const quickTimer: TimerOption = 120;
    setTimerDuration(quickTimer);
    // Build questions and start
    const allQuestions: PracticeQuestion[] = randomPos.questions.map((q) => ({
      question: q,
      positionTitle: randomPos.title,
      positionIcon: randomPos.icon,
    }));
    // Shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }
    setSessionQuestions(allQuestions);
    setCurrentIndex(0);
    setAnswered(false);
    setResults([]);
    setTimeUp(false);
    setSession("running");
    setSessionStartTime(Date.now());
    setQuestionStartTime(Date.now());
    startTimer(quickTimer);
  }, [startTimer, lang]);

  const handleStart = useCallback(() => {
    const questions = generateQuestions();
    if (questions.length === 0) return;

    setSessionQuestions(questions);
    setCurrentIndex(0);
    setAnswered(false);
    setResults([]);
    setSession("running");
    setSessionStartTime(Date.now());
    setQuestionStartTime(Date.now());
    startTimer(timerDuration);
  }, [generateQuestions, timerDuration, startTimer]);

  const handleShowAnswer = useCallback(() => {
    setTimeUp(false);
    setAnswered(true);
    stopTimer();

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setResults((prev) => [
      ...prev,
      {
        question: sessionQuestions[currentIndex],
        timeSpent: Math.min(timeSpent, timerDuration),
        revealedAnswer: true,
      },
    ]);
  }, [questionStartTime, sessionQuestions, currentIndex, timerDuration, stopTimer]);

  // Shared: move to next question or finish
  const moveToNext = useCallback(() => {
    setTimeUp(false);
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setAnswered(false);
      setQuestionStartTime(Date.now());
      startTimer(timerDuration);
    } else {
      stopTimer();
      setSession("finished");
    }
  }, [currentIndex, sessionQuestions.length, timerDuration, startTimer, stopTimer]);

  // ── Skip: mark as NOT answered, move to next ──
  const handleSkip = useCallback(() => {
    setResults((prev) => [
      ...prev,
      {
        question: sessionQuestions[currentIndex],
        timeSpent: Math.min(Math.floor((Date.now() - questionStartTime) / 1000), timerDuration),
        revealedAnswer: false,
      },
    ]);
    moveToNext();
  }, [sessionQuestions, currentIndex, timerDuration, questionStartTime, moveToNext]);

  // ── Rate a question ──
  const handleRate = useCallback((qId: string, rating: RatingOption) => {
    saveRating(qId, rating);
    // Also update current result if exists
    setResults((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((r) => r.question.question.id === qId);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], rating };
      }
      return updated;
    });
  }, [saveRating]);

  const handleNext = useCallback(() => {
    // If not answered yet, add an unanswered result
    if (!answered) {
      setResults((prev) => {
        // Prevent duplicate if already added by handleShowAnswer/timer
        const already = prev.some((r) => r.question.question.id === sessionQuestions[currentIndex]?.question.id);
        if (already) return prev;
        return [
          ...prev,
          {
            question: sessionQuestions[currentIndex],
            timeSpent: timerDuration,
            revealedAnswer: false,
          },
        ];
      });
    }
    moveToNext();
  }, [answered, sessionQuestions, currentIndex, timerDuration, moveToNext]);

  const handleEnd = useCallback(() => {
    stopTimer();
    setTimeUp(false);
    // Add current question to results (skip if already added)
    if (currentIndex < sessionQuestions.length) {
      setResults((prev) => {
        const already = prev.some(
          (r) => r.question.question.id === sessionQuestions[currentIndex]?.question.id
        );
        if (already) return prev;
        return [
          ...prev,
          {
            question: sessionQuestions[currentIndex],
            timeSpent: Math.min(Math.floor((Date.now() - questionStartTime) / 1000), timerDuration),
            revealedAnswer: answered,
          },
        ];
      });
    }
    setSession("finished");
  }, [stopTimer, currentIndex, sessionQuestions, questionStartTime, timerDuration, answered]);

  const handleRestart = useCallback(() => {
    setSession("setup");
    setSessionQuestions([]);
    setCurrentIndex(0);
    setAnswered(false);
    setResults([]);
    stopTimer();
  }, [stopTimer]);

  // ── Auto-start jika URL punya ?position=xxx ──
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (hasAutoStartParam && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleStart();
    }
  }, [hasAutoStartParam, handleStart]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Auto-advance when timer reaches 0 — with time's up animation
  const timeUpShownRef = useRef(false);
  useEffect(() => {
    if (timerRemaining === 0 && session === "running" && !answered && !timeUpShownRef.current) {
      timeUpShownRef.current = true;
      setTimeUp(true);
      // Brief animation before revealing answer
      const t = setTimeout(() => {
        handleShowAnswer();
        timeUpShownRef.current = false;
      }, 1200);
      return () => { clearTimeout(t); timeUpShownRef.current = false; };
    }
    if (timerRemaining > 0) timeUpShownRef.current = false;
  }, [timerRemaining, session, answered, handleShowAnswer]);

  const totalTime = sessionStartTime
    ? Math.floor((Date.now() - sessionStartTime) / 1000)
    : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background text-on-background">
        <AppHeader />

        <main className="flex-1 pt-24 pb-20 px-margin-mobile md:px-gutter">
          {session === "setup" && (
            <>
              <div className="mb-4 max-w-[600px] mx-auto">
                <button
                  onClick={() => router.push("/interview")}
                  className="flex items-center gap-1.5 text-[10px] text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                  {lang === "en" ? "Back to position list" : "Kembali ke daftar posisi"}
                </button>
              </div>
              <SetupScreen
                selectedPositions={selectedPositions}
                onTogglePosition={onTogglePosition}
                selectedCategories={selectedCategories}
                onToggleCategory={onToggleCategory}
                selectedDifficulties={selectedDifficulties}
                onToggleDifficulty={onToggleDifficulty}
                onClearAll={onClearAllPositions}
                timerDuration={timerDuration}
                onTimerChange={setTimerDuration}
                onStart={handleStart}
                onQuickStart={handleQuickStart}
              />
            </>
          )}

          {session === "running" && sessionQuestions.length > 0 && (
            <>
              <div className="mb-4">
                <button
                  onClick={() => router.push("/interview")}
                  className="flex items-center gap-1.5 text-[10px] text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                  {lang === "en" ? "Back to Interviews" : "Kembali ke Interview"}
                </button>
              </div>
              <RunningScreen
                currentQuestion={sessionQuestions[currentIndex]}
                questionIndex={currentIndex}
                totalQuestions={sessionQuestions.length}
                timerRemaining={timerRemaining}
                timerDuration={timerDuration}
                answered={answered}
                timeUp={timeUp}
                existingRating={questionRatings[sessionQuestions[currentIndex]?.question?.id]}
                onShowAnswer={handleShowAnswer}
                onNext={handleNext}
                onSkip={handleSkip}
                onEnd={handleEnd}
                onRate={handleRate}
              />
            </>
          )}

          {session === "finished" && (
            <FinishedScreen
              results={results}
              totalQuestions={sessionQuestions.length}
              totalTime={totalTime}
              onRestart={handleRestart}
              onBack={() => router.push("/interview")}
            />
          )}
        </main>

        <AppFooter bordered />
      </div>
    </AuthGuard>
  );
}
