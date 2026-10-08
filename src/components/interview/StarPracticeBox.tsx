"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { fetchRemoteStarScore, readStarScore, saveStarScore, starScoreLabel } from "@/lib/star-score";

interface StarPracticeBoxProps {
  questionId: string;
  questionText: string;
  category?: string;
  /** Panel terbuka saat pertama dirender (default: tertutup). */
  defaultOpen?: boolean;
}

interface EvaluationResult {
  scores: { situation: number; task: number; action: number; result: number };
  feedback: string;
  improved: string;
}

/**
 * Kotak latihan STAR: user menulis draf jawaban, AI menilai dengan rubrik
 * S/T/A/R 0-5, memberi umpan balik dan versi perbaikan. Skor terakhir
 * disimpan per pertanyaan untuk badge. Dipakai di halaman latihan (practice).
 */
export function StarPracticeBox({
  questionId,
  questionText,
  category,
  defaultOpen = false,
}: StarPracticeBoxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const [myAnswer, setMyAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState("");
  const [savedScore, setSavedScore] = useState<number | null>(null);

  useEffect(() => {
    const local = readStarScore(questionId);
    setSavedScore(local);
    // Reset form saat pindah pertanyaan (practice berganti soal dalam satu sesi)
    setMyAnswer("");
    setResult(null);
    setError("");
    setLoading(false);
    if (local === null) {
      // Sinkron dari server (skor yang tersimpan dari perangkat lain).
      let cancelled = false;
      fetchRemoteStarScore(questionId).then((remote) => {
        if (cancelled || remote === null) return;
        saveStarScore(questionId, remote);
        setSavedScore(remote);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [questionId]);

  const handleEvaluate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/interview/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText, category, userAnswer: myAnswer.trim(), questionId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Gagal menilai jawaban. Coba lagi.");
      }
      const evaluation = data.evaluation as EvaluationResult;
      setResult(evaluation);
      const average =
        (evaluation.scores.situation +
          evaluation.scores.task +
          evaluation.scores.action +
          evaluation.scores.result) /
        4;
      saveStarScore(questionId, average);
      setSavedScore(average);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menilai jawaban. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-outline-variant/20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left transition-colors hover:bg-surface-container-low"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden>
          fact_check
        </span>
        <span className="text-[11px] font-bold text-on-surface">{t("interview.star-practice-title")}</span>
        {savedScore !== null ? (
          <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            STAR {starScoreLabel(savedScore)}/5
          </span>
        ) : null}
        <span
          className={`material-symbols-outlined text-[16px] text-on-surface-variant ${savedScore !== null ? "" : "ml-auto"} transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          expand_more
        </span>
      </button>

      {open ? (
        <div className="space-y-2 px-5 pb-4">
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
              disabled={loading || myAnswer.trim().length < 40}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className={`material-symbols-outlined text-[13px] ${loading ? "animate-spin" : ""}`}>
                {loading ? "progress_activity" : "auto_awesome"}
              </span>
              {loading ? t("interview.star-evaluating") : t("interview.star-evaluate")}
            </button>
          </div>

          {error ? <p className="text-[11px] text-error">{error}</p> : null}

          {result ? (
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
                ] as Array<[keyof EvaluationResult["scores"], string]>
              ).map(([key, label]) => {
                const value = result.scores[key] ?? 0;
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
              {result.feedback ? (
                <div className="rounded-lg bg-surface-container-lowest p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("interview.star-feedback")}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-on-surface">{result.feedback}</p>
                </div>
              ) : null}
              {result.improved ? (
                <div className="rounded-lg bg-surface-container-lowest p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("interview.star-improved")}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-on-surface">{result.improved}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}