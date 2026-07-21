"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QCategoryIcon } from "./QCategoryIcon";
import type { InterviewQuestion } from "@/data/interview-questions";

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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
