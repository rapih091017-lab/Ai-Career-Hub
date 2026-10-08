"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QCategoryIcon } from "./QCategoryIcon";
import type { InterviewQuestion } from "@/data/interview-questions";
import { useTranslation } from "@/lib/i18n";
import { fetchRemoteStarScore, readStarScore, saveStarScore, starScoreLabel } from "@/lib/star-score";

export function QuestionCard({
  q,
  index,
  isBookmarked,
  onToggleBookmark,
  numberPrefix,
}: {
  q: InterviewQuestion;
  index: number;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  /** Optional link to dedicated page */
  numberPrefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [starLoading, setStarLoading] = useState(false);
  const [starResult, setStarResult] = useState<{
    situation: string;
    task: string;
    action: string;
    result: string;
    full: string;
  } | null>(null);
  const [starError, setStarError] = useState("");
  const [starCopied, setStarCopied] = useState(false);

  /** Susun jawaban STAR via AI; dipersonalisasi dari profil bila user login. */
  const handleGenerateStar = async () => {
    setStarLoading(true);
    setStarError("");
    try {
      const response = await fetch("/api/interview/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, category: q.category }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Gagal menyusun jawaban. Coba lagi.");
      }
      setStarResult(data.star);
    } catch (err) {
      setStarError(err instanceof Error ? err.message : "Gagal menyusun jawaban. Coba lagi.");
    } finally {
      setStarLoading(false);
    }
  };

  const handleCopyStar = async () => {
    if (!starResult) return;
    const text =
      starResult.full ||
      [starResult.situation, starResult.task, starResult.action, starResult.result]
        .filter(Boolean)
        .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setStarCopied(true);
      setTimeout(() => setStarCopied(false), 1500);
    } catch {}
  };

  const starSections: Array<[string, string]> = starResult
    ? [
        ["S", starResult.situation],
        ["T", starResult.task],
        ["A", starResult.action],
        ["R", starResult.result],
      ]
    : [];

  /* ── Latihan: jawaban sendiri dinilai rubrik STAR ── */
  const [myAnswer, setMyAnswer] = useState("");
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    scores: { situation: number; task: number; action: number; result: number };
    feedback: string;
    improved: string;
  } | null>(null);
  const [evalError, setEvalError] = useState("");
  const [starBadge, setStarBadge] = useState<number | null>(null);

  useEffect(() => {
    const local = readStarScore(q.id);
    setStarBadge(local);
    if (local === null) {
      // Sinkron dari server (skor yang tersimpan dari perangkat lain).
      let cancelled = false;
      fetchRemoteStarScore(q.id).then((remote) => {
        if (cancelled || remote === null) return;
        saveStarScore(q.id, remote);
        setStarBadge(remote);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [q.id]);

  const handleEvaluate = async () => {
    setEvalLoading(true);
    setEvalError("");
    try {
      const response = await fetch("/api/interview/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          category: q.category,
          userAnswer: myAnswer.trim(),
          questionId: q.id,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Gagal menilai jawaban. Coba lagi.");
      }
      setEvalResult(data.evaluation);
      const evaluation = data.evaluation as { scores: { situation: number; task: number; action: number; result: number } };
      const average =
        (evaluation.scores.situation + evaluation.scores.task + evaluation.scores.action + evaluation.scores.result) / 4;
      saveStarScore(q.id, average);
      setStarBadge(average);
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Gagal menilai jawaban. Coba lagi.");
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <motion.div
      layout
      className={`bg-white rounded-xl border overflow-hidden transition-colors ${
        isBookmarked
          ? "border-amber-300 shadow-premium-sm"
          : "border-outline-variant/30 shadow-premium-sm"
      }`}
    >
      <div className="flex items-start">
        {/* Clickable question area */}
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-start gap-3 p-4 text-left hover:bg-surface-container-low transition-colors min-w-0"
        >
          <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
            {numberPrefix ? `${numberPrefix}.${index + 1}` : index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <QCategoryIcon cat={q.category} />
            </div>
            <p className="text-sm font-semibold text-on-surface leading-relaxed pr-2">
              {q.question}
            </p>
          </div>
          <span
            className={`material-symbols-outlined text-outline shrink-0 mt-1 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </button>

        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(q.id);
          }}
          className="shrink-0 p-4 pl-2 hover:scale-110 active:scale-95 transition-transform"
          aria-label={isBookmarked ? "Hapus dari tersimpan" : "Simpan pertanyaan"}
          title={isBookmarked ? "Hapus dari tersimpan" : "Simpan pertanyaan"}
        >
          <span
            className={`material-symbols-outlined text-lg transition-all ${
              isBookmarked
                ? "text-amber-500 font-bold"
                : "text-outline hover:text-amber-400"
            }`}
            style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            bookmark
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-outline-variant/20">
              {/* Answer */}
              <div className="mt-3 p-3 bg-surface-container-low rounded-lg border-l-2 border-primary">
                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
                  {q.answer}
                </p>
              </div>

              {/* STAR: panduan singkat + contoh + generator AI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">account_tree</span>
                      {t("interview.star-title")}
                    </p>
                    {starBadge !== null ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        STAR {starScoreLabel(starBadge)}/5
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateStar}
                    disabled={starLoading}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[13px] ${starLoading ? "animate-spin" : ""}`}>
                      {starLoading ? "progress_activity" : "auto_awesome"}
                    </span>
                    {starLoading ? t("interview.star-generating") : t("interview.star-generate")}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
                  {[
                    { key: "S", label: t("interview.star-s"), desc: t("interview.star-s-desc") },
                    { key: "T", label: t("interview.star-t"), desc: t("interview.star-t-desc") },
                    { key: "A", label: t("interview.star-a"), desc: t("interview.star-a-desc") },
                    { key: "R", label: t("interview.star-r"), desc: t("interview.star-r-desc") },
                  ].map((item) => (
                    <div key={item.key} className="rounded-lg bg-surface-container-low px-2.5 py-2">
                      <p className="text-[10px] font-bold text-primary">
                        {item.key} · {item.label}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-snug text-on-surface-variant">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {q.star ? (
                  <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {t("interview.star-example")}
                    </p>
                    {(
                      [
                        ["S", q.star.situation],
                        ["T", q.star.task],
                        ["A", q.star.action],
                        ["R", q.star.result],
                      ] as Array<[string, string]>
                    ).map(([letter, text]) => (
                      <div key={letter} className="flex gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                          {letter}
                        </span>
                        <p className="text-[11px] leading-relaxed text-on-surface">{text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {starError ? <p className="text-[11px] text-error">{starError}</p> : null}

                {starResult ? (
                  <div className="space-y-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {t("interview.star-result")}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyStar}
                        className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-500/20"
                      >
                        {starCopied ? t("interview.star-copied") : t("interview.star-copy")}
                      </button>
                    </div>
                    {starSections.map(([letter, text]) => (
                      <div key={letter} className="flex gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                          {letter}
                        </span>
                        <p className="text-[11px] leading-relaxed text-on-surface">{text}</p>
                      </div>
                    ))}
                    {starResult.full ? (
                      <p className="border-t border-emerald-500/20 pt-2 text-[11px] font-medium leading-relaxed text-on-surface">
                        {starResult.full}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Latihan: tulis jawaban sendiri, nilai dengan rubrik STAR */}
                <div className="space-y-2 rounded-lg bg-surface-container-low p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("interview.star-practice-title")}
                  </p>
                  <textarea
                    value={myAnswer}
                    onChange={(event) => setMyAnswer(event.target.value)}
                    placeholder={t("interview.star-answer-placeholder")}
                    rows={3}
                    maxLength={4000}
                    className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-[11px] leading-relaxed text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-on-surface-variant">{myAnswer.trim().length}/4000</p>
                    <button
                      type="button"
                      onClick={handleEvaluate}
                      disabled={evalLoading || myAnswer.trim().length < 40}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className={`material-symbols-outlined text-[13px] ${evalLoading ? "animate-spin" : ""}`}>
                        {evalLoading ? "progress_activity" : "fact_check"}
                      </span>
                      {evalLoading ? t("interview.star-evaluating") : t("interview.star-evaluate")}
                    </button>
                  </div>
                  {evalError ? <p className="text-[11px] text-error">{evalError}</p> : null}
                  {evalResult ? (
                    <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {t("interview.star-eval-title")}
                      </p>
                      {(
                        [
                          ["situation", t("interview.star-s")],
                          ["task", t("interview.star-t")],
                          ["action", t("interview.star-a")],
                          ["result", t("interview.star-r")],
                        ] as Array<[keyof typeof evalResult.scores, string]>
                      ).map(([key, label]) => {
                        const value = evalResult.scores[key] ?? 0;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="w-16 text-[10px] font-bold text-on-surface-variant">{label}</span>
                            <div className="flex flex-1 gap-1">
                              {[1, 2, 3, 4, 5].map((step) => (
                                <span
                                  key={step}
                                  className={`h-1.5 flex-1 rounded-full ${step <= value ? "bg-primary" : "bg-surface-container-high"}`}
                                />
                              ))}
                            </div>
                            <span className="w-8 text-right text-[10px] font-bold text-on-surface">{value}/5</span>
                          </div>
                        );
                      })}
                      {evalResult.feedback ? (
                        <div className="rounded-lg bg-surface-container-lowest p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            {t("interview.star-feedback")}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-on-surface">{evalResult.feedback}</p>
                        </div>
                      ) : null}
                      {evalResult.improved ? (
                        <div className="rounded-lg bg-surface-container-lowest p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            {t("interview.star-improved")}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-on-surface">{evalResult.improved}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Tips */}
              {q.tips && q.tips.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lightbulb</span>
                    Tips
                  </p>
                  <ul className="space-y-1">
                    {q.tips.map((tip, i) => (
                      <li key={i} className="text-[11px] text-amber-800 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up question */}
              {q.followUp && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">forum</span>
                    Pertanyaan Lanjutan
                  </p>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    {q.followUp}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}