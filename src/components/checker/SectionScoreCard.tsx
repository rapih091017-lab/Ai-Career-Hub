"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sectionScoreColor, severityMeta, toIssueItems, type IssueItem } from "./types";
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
      className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-premium-sm overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left"
      >
        <div className="flex-1 mr-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-on-surface">{title}</span>
            <span className="flex items-center gap-2 shrink-0 ml-2">
              {statChip && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
                  title={statChip.hint}
                  style={{
                    color: statChip.tone === "green" ? "#15803d" : statChip.tone === "red" ? "#b91c1c" : "#b45309",
                    background: statChip.tone === "green" ? "#f0fdf4" : statChip.tone === "red" ? "#fef2f2" : "#fffbeb",
                    borderColor: statChip.tone === "green" ? "#bbf7d0" : statChip.tone === "red" ? "#fecaca" : "#fde68a",
                  }}
                >
                  <span className="material-symbols-outlined text-[12px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                  {statChip.value}
                </span>
              )}
              <span className="text-sm font-bold" style={{ color: score >= 60 ? "#16a34a" : score >= 40 ? "#ca8a04" : "#dc2626" }}>
                {score}%
              </span>
            </span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: "0%" }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant select-none transition-transform duration-200"
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
            <div className="px-4 pb-4 space-y-2 border-t border-surface-container-high pt-3">
              {issueItems.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">{t("checker.detail.issues")}</p>
                  <ul className="space-y-1">
                    {issueItems.map((iss, i) => {
                      const sev = severityMeta(iss.severity, t);
                      return (
                        <li key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5 select-none">•</span>
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
                              <span className="block mt-1 text-[11px] italic text-on-surface-variant/70 bg-surface-container-low rounded-md px-2 py-1 border-l-2 border-red-300">
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
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{t("checker.detail.suggestions")}</p>
                  <ul className="space-y-1">
                    {suggestions.map((sug, i) => (
                      <li key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 select-none">→</span>
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {issueItems.length === 0 && (!suggestions || suggestions.length === 0) && (
                <p className="text-xs text-on-surface-variant italic">{t("checker.detail.no-notes")}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
