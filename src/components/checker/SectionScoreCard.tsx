"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sectionScoreColor } from "./types";

/** Section breakdown score bar with expandable issues/suggestions */
export function SectionScoreCard({ title, score, issues, suggestions, delay }: {
  title: string;
  score: number;
  issues?: string[];
  suggestions?: string[];
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const barColor = sectionScoreColor(score);

  return (
    <motion.div
      className="bg-white rounded-xl border border-surface-container-high shadow-premium-sm overflow-hidden"
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
            <span className="text-sm font-bold" style={{ color: score >= 60 ? "#16a34a" : score >= 40 ? "#ca8a04" : "#dc2626" }}>
              {score}%
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
              {issues && issues.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Issues</p>
                  <ul className="space-y-1">
                    {issues.map((iss, i) => (
                      <li key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 select-none">•</span>
                        {iss}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {suggestions && suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Saran</p>
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
              {(!issues || issues.length === 0) && (!suggestions || suggestions.length === 0) && (
                <p className="text-xs text-on-surface-variant italic">Tidak ada catatan tambahan.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
