"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { scoreColor, sectionScoreColor, severityMeta, toIssueItems, type IssueItem } from "./types";
import { useTranslation } from "@/lib/i18n";

/** Section breakdown score bar with expandable issues/suggestions */
export function SectionScoreCard({ title, score, issues, suggestions, delay, statChip }: {
  title: string;
  score: number;
  issues?: unknown;
  suggestions?: string[];
  delay: number;
  /** Chip stat tambahan di samping skor (mis. persentase bullet terkuantifikasi) */
  statChip?: { label: string; value: string; hint?: string; tone?: "green" | "amber" | "red" };
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const barColor = sectionScoreColor(score);
  // Normalisasi bentuk lama (string[]) & baru ({text, source_excerpt, severity}[])
  const issueItems: IssueItem[] = toIssueItems(issues);

  return (
    <motion.div
      className="overflow-hidden rounded-[18px] border-[2.5px] border-ink bg-paper shadow-hard-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-container-low"
      >
        <div className="mr-4 flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-bold text-ink">{title}</span>
            <span className="ml-2 flex shrink-0 items-center gap-2">
              {statChip && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    statChip.tone === "green"
                      ? "border-green-deep/40 bg-primary-fixed text-on-primary-fixed"
                      : statChip.tone === "red"
                        ? "border-error/50 bg-error-container text-on-error-container"
                        : "border-tertiary/50 bg-tertiary-container text-on-tertiary-container"
                  }`}
                  title={statChip.hint}
                >
                  <span className="material-symbols-outlined text-[12px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                  {statChip.value}
                </span>
              )}
              <span className="font-display text-base font-bold" style={{ color: scoreColor(score) }}>
                {score}%
              </span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: "0%" }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
        <span className="material-symbols-outlined select-none text-ink-soft transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t-[1.5px] border-hairline px-4 pb-4 pt-3">
              {issueItems.length > 0 && (
                <div>
                  <p className="mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-error">{t("checker.detail.issues")}</p>
                  <ul className="space-y-1">
                    {issueItems.map((iss, i) => {
                      const sev = severityMeta(iss.severity, t);
                      return (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-ink-soft">
                          <span className="mt-0.5 select-none text-error/70">•</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                              <span>{iss.text}</span>
                              {sev && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide ${sev.cls}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                                  {sev.label}
                                </span>
                              )}
                            </span>
                            {iss.source_excerpt && (
                              <span className="mt-1 block rounded-md border-l-2 border-error/40 bg-surface-container-low px-2 py-1 text-[11px] italic text-ink-soft">
                                &ldquo;{iss.source_excerpt}&rdquo;
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {suggestions && suggestions.length > 0 && (
                <div>
                  <p className="mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">{t("checker.detail.suggestions")}</p>
                  <ul className="space-y-1">
                    {suggestions.map((sug, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-ink-soft">
                        <span className="mt-0.5 select-none text-green-deep">→</span>
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {issueItems.length === 0 && (!suggestions || suggestions.length === 0) && (
                <p className="text-xs italic text-ink-soft">{t("checker.detail.no-notes")}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
