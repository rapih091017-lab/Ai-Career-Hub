"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { priorityBadge, type BulletItem } from "./types";

/** Keyword tag chip */
export function KeywordChip({ text, variant }: { text: string; variant: "found" | "missing" | "nice" | "synonym" }) {
  const styles = {
    found: "bg-green-100 text-green-700 border-green-200",
    missing: "bg-red-100 text-red-700 border-red-200",
    nice: "bg-yellow-100 text-yellow-700 border-yellow-200",
    synonym: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${styles[variant]}`}>
      {text}
    </span>
  );
}

/** Bullet review card with expand */
export function BulletReviewCard({ item, index }: { item: BulletItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="bg-white rounded-xl border border-surface-container-high shadow-premium-sm overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-surface-container-low transition-colors"
      >
        <div className="shrink-0 mt-0.5">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityBadge(item.priority)}`}>
            {item.priority}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary mb-0.5">{item.section}</p>
          <p className="text-sm text-on-surface line-clamp-2">{item.original_text}</p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant select-none transition-transform duration-200 shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-surface-container-high pt-3">
              {item.issues.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Issues</p>
                  <ul className="space-y-0.5">
                    {item.issues.map((iss, i) => (
                      <li key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 select-none">⚠</span>
                        {iss}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.suggested_rewrite && (
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Saran Perbaikan</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">{item.suggested_rewrite}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
