"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AuthGuard from "@/components/AuthGuard";
import { QCategoryIcon } from "@/components/interview/QCategoryIcon";
import {
  POSITION_QUESTIONS,
  QUESTION_CATEGORIES,
  type InterviewQuestion,
  type PositionQuestions,
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
}

/* ── Timer Options ── */
const TIMER_OPTIONS: { value: TimerOption; label: string }[] = [
  { value: 60, label: "1 menit" },
  { value: 120, label: "2 menit" },
  { value: 180, label: "3 menit" },
  { value: 300, label: "5 menit" },
];

/* ── Practice Setup Screen ── */
function SetupScreen({
  selectedPositions,
  onTogglePosition,
  selectedCategories,
  onToggleCategory,
  timerDuration,
  onTimerChange,
  onStart,
}: {
  selectedPositions: Set<string>;
  onTogglePosition: (id: string) => void;
  selectedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  timerDuration: TimerOption;
  onTimerChange: (t: TimerOption) => void;
  onStart: () => void;
}) {
  const totalSelected = selectedPositions.size;
  const totalQuestions = useMemo(() => {
    return POSITION_QUESTIONS.filter((p) => selectedPositions.has(p.id))
      .reduce((acc, p) => {
        let qs = p.questions;
        if (!selectedCategories.has("all")) {
          qs = qs.filter((q) => selectedCategories.has(q.category));
        }
        return acc + qs.length;
      }, 0);
  }, [selectedPositions, selectedCategories]);

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-200">
          <span className="material-symbols-outlined text-[14px]">play_circle</span>
          Latihan Interview
        </div>
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-on-background mb-3">
          Mode Latihan
        </h1>
        <p className="text-sm text-on-surface-variant max-w-[400px] mx-auto">
          Pilih posisi dan atur timer. Dapatkan pertanyaan acak dan latih
          jawabanmu seperti wawancara sungguhan.
        </p>
      </div>

      {/* ── Step 1: Pilih Posisi ── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">1</span>
          Pilih Posisi
          <span className="text-[10px] text-on-surface-variant font-normal">
            ({totalSelected} dipilih)
          </span>
        </h2>

        <div className="space-y-2">
          {QUESTION_CATEGORIES.map((cat) => {
            const positions = POSITION_QUESTIONS.filter((p) => p.categorySlug === cat.slug);
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
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    catSelected ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"
                  }`}>
                    {positions.filter((p) => selectedPositions.has(p.id)).length}/{positions.length}
                  </span>
                </button>

                <div className="px-2 pb-2 pt-1 flex flex-wrap gap-1.5">
                  {positions.map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => onTogglePosition(pos.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                        selectedPositions.has(pos.id)
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[11px]">{pos.icon}</span>
                      {pos.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Step 2: Filter Kategori Pertanyaan ── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">2</span>
          Kategori Pertanyaan
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { slug: "all", label: "Semua", color: "bg-surface-container-low text-on-surface-variant" },
            { slug: "hr", label: "HR / General", color: "bg-purple-100 text-purple-700 border-purple-200" },
            { slug: "technical", label: "Teknis", color: "bg-blue-100 text-blue-700 border-blue-200" },
            { slug: "role-specific", label: "Role-Specific", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
          ].map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                onToggleCategory(cat.slug);
                if (cat.slug === "all") {
                  // Unselect all others
                }
              }}
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

      {/* ── Step 3: Timer ── */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">3</span>
          Timer per Pertanyaan
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
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Start ── */}
      <button
        onClick={onStart}
        disabled={totalSelected === 0}
        className="w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white hover:opacity-90 active:scale-[0.98] shadow-premium-md"
      >
        <span className="material-symbols-outlined text-lg">play_arrow</span>
        Mulai Latihan
        {totalSelected > 0 && (
          <span className="text-[10px] opacity-80">({totalQuestions} pertanyaan)</span>
        )}
      </button>
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
  onShowAnswer,
  onNext,
  onEnd,
}: {
  currentQuestion: PracticeQuestion;
  questionIndex: number;
  totalQuestions: number;
  timerRemaining: number;
  timerDuration: number;
  answered: boolean;
  onShowAnswer: () => void;
  onNext: () => void;
  onEnd: () => void;
}) {
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
            <p className="text-[10px] text-on-surface-variant">Progress</p>
            <p className="text-xs font-bold text-on-surface">
              {questionIndex + 1} / {totalQuestions}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-surface-container-hover rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timerColor}`}
              initial={{ width: "100%" }}
              animate={{ width: `${timerPercent}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
          <span className={`text-sm font-bold min-w-[40px] text-right tabular-nums ${
            timerPercent <= 25 ? "text-red-500" : timerPercent <= 50 ? "text-amber-500" : "text-on-surface"
          }`}>
            {formatTime(timerRemaining)}
          </span>
        </div>
      </div>

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
          {/* Position badge */}
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[14px]">
                {currentQuestion.positionIcon}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-on-surface-variant">
              {currentQuestion.positionTitle}
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
                    Jawaban Referensi
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

                  <div className="text-[10px] text-on-surface-variant text-center pt-1">
                    Gunakan sebagai referensi. Jawab dengan kata-katamu sendiri!
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="px-5 pb-4 pt-0 flex items-center gap-2">
            {!answered ? (
              <button
                onClick={onShowAnswer}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-[0.98] transition-all border border-amber-200"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                  Lihat Jawaban
                </span>
              </button>
            ) : (
              <button
                onClick={onNext}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span className="flex items-center justify-center gap-1.5">
                  {questionIndex + 1 < totalQuestions ? "Pertanyaan Selanjutnya" : "Lihat Hasil"}
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </button>
            )}

            <button
              onClick={onEnd}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-hover transition-all"
            >
              Akhiri
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
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}d`;
  };

  return (
    <div className="max-w-[500px] mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
      </div>
      <h1 className="text-2xl font-bold text-on-background mb-2">Sesi Selesai!</h1>
      <p className="text-sm text-on-surface-variant mb-8">
        Kamu telah menyelesaikan sesi latihan interview.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm">
          <p className="text-xl font-bold text-on-surface">{totalQuestions}</p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">Total Pertanyaan</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm">
          <p className="text-xl font-bold text-on-surface">{answered}</p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">Lihat Jawaban</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-premium-sm">
          <p className="text-xl font-bold text-on-surface">{formatTime(totalTime)}</p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">Total Waktu</p>
        </div>
      </div>

      {/* Question history */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-premium-sm mb-8 text-left">
        <div className="px-4 py-3 border-b border-outline-variant/20">
          <p className="text-xs font-bold text-on-surface">Riwayat Pertanyaan</p>
        </div>
        <div className="divide-y divide-outline-variant/10 max-h-[240px] overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-on-surface truncate">
                  {r.question.question.question}
                </p>
                <p className="text-[9px] text-on-surface-variant mt-0.5 flex items-center gap-2">
                  <span>{r.question.positionTitle}</span>
                  <span>·</span>
                  <span>{formatTime(r.timeSpent)}</span>
                  {r.revealedAnswer && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-600">Lihat jawaban</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-xs font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-hover transition-all border border-outline-variant/40"
        >
          Kembali
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          Latihan Lagi
        </button>
      </div>
    </div>
  );
}

/* ── Main Practice Page ── */
export default function PracticePage() {
  const router = useRouter();

  // Setup state
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(() => {
    // Check URL for ?position= param (client-side only)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const positionParam = params.get("position");
      if (positionParam) {
        const pos = POSITION_QUESTIONS.find((p) => p.id === positionParam);
        if (pos) return new Set([pos.id]);
      }
    }
    // Default: select first category's positions
    const firstCat = QUESTION_CATEGORIES[0];
    return new Set(
      POSITION_QUESTIONS.filter((p) => p.categorySlug === firstCat.slug).map((p) => p.id)
    );
  });
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(["all"]));
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

  const onToggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (cat === "all") {
        if (next.has("all")) return new Set(); // unselect all
        return new Set(["all"]);
      }
      next.delete("all");
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next.size === 0 ? new Set(["all"]) : next;
    });
  }, []);

  const generateQuestions = useCallback(() => {
    const allQuestions: PracticeQuestion[] = [];
    const positions = POSITION_QUESTIONS.filter((p) => selectedPositions.has(p.id));

    positions.forEach((pos) => {
      let qs = pos.questions;
      if (!selectedCategories.has("all")) {
        qs = qs.filter((q) => selectedCategories.has(q.category));
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
  }, [selectedPositions, selectedCategories]);

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

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setAnswered(false);
      setQuestionStartTime(Date.now());
      startTimer(timerDuration);

      // Add unanswered result for questions that timed out
      if (!answered) {
        setResults((prev) => [
          ...prev,
          {
            question: sessionQuestions[currentIndex],
            timeSpent: timerDuration,
            revealedAnswer: false,
          },
        ]);
      }
    } else {
      // Session finished
      stopTimer();
      if (!answered) {
        setResults((prev) => [
          ...prev,
          {
            question: sessionQuestions[currentIndex],
            timeSpent: timerDuration,
            revealedAnswer: false,
          },
        ]);
      }
      setSession("finished");
    }
  }, [currentIndex, sessionQuestions, timerDuration, answered, startTimer, stopTimer]);

  const handleEnd = useCallback(() => {
    stopTimer();
    // Add current unanswered question to results
    if (currentIndex < sessionQuestions.length) {
      setResults((prev) => [
        ...prev,
        {
          question: sessionQuestions[currentIndex],
          timeSpent: Math.min(Math.floor((Date.now() - questionStartTime) / 1000), timerDuration),
          revealedAnswer: answered,
        },
      ]);
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Auto-advance when timer reaches 0
  useEffect(() => {
    if (timerRemaining === 0 && session === "running" && !answered) {
      handleShowAnswer();
    }
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
            <SetupScreen
              selectedPositions={selectedPositions}
              onTogglePosition={onTogglePosition}
              selectedCategories={selectedCategories}
              onToggleCategory={onToggleCategory}
              timerDuration={timerDuration}
              onTimerChange={setTimerDuration}
              onStart={handleStart}
            />
          )}

          {session === "running" && sessionQuestions.length > 0 && (
            <>
              <div className="mb-4">
                <button
                  onClick={() => router.push("/interview")}
                  className="flex items-center gap-1.5 text-[10px] text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                  Kembali ke Interview
                </button>
              </div>
              <RunningScreen
                currentQuestion={sessionQuestions[currentIndex]}
                questionIndex={currentIndex}
                totalQuestions={sessionQuestions.length}
                timerRemaining={timerRemaining}
                timerDuration={timerDuration}
                answered={answered}
                onShowAnswer={handleShowAnswer}
                onNext={handleNext}
                onEnd={handleEnd}
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
