"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { scoreColor } from "@/components/checker/types";
import { useTranslation } from "@/lib/i18n";
import type { LinkedInSectionScore } from "@/lib/linkedin-optimizer/result";

/**
 * Rincian skor per bagian LinkedIn.
 *
 * Skor bagian memakai skala 0–10 (rubrik), ditampilkan sebagai persentase
 * supaya sebanding dengan cincin skor total. Alasan dan saran muncul saat
 * baris dibuka — daftar tertutup tetap terbaca sebagai ringkasan.
 */
export function ScoreBreakdown({ sections }: { sections: LinkedInSectionScore[] }) {
  return (
    <div className="space-y-2.5">
      {sections.map((section, index) => (
        <SectionRow key={section.key} section={section} index={index} />
      ))}
    </div>
  );
}

function SectionRow({ section, index }: { section: LinkedInSectionScore; index: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const pct = Math.round(section.score * 10);
  const color = scoreColor(pct);
  const label = t(`lo.section.${section.key}`, section.key);
  const hasDetail = section.issues.length > 0 || Boolean(section.suggestion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="overflow-hidden rounded-[14px] border-2 border-ink/80 bg-paper"
    >
      <button
        type="button"
        onClick={() => hasDetail && setOpen((value) => !value)}
        aria-expanded={hasDetail ? open : undefined}
        className={`flex w-full items-center gap-3 p-3.5 text-left ${
          hasDetail ? "cursor-pointer transition-colors hover:bg-surface-container-low" : "cursor-default"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="text-sm font-bold text-ink">{label}</span>
            <span className="font-display text-sm font-bold" style={{ color }}>
              {pct}%
            </span>
          </span>
          <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <span
              className="block h-full rounded-full transition-[width] duration-700"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </span>
          <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
            {t("lo.section.weight").replace("{w}", String(section.weight))}
          </span>
        </span>
        {hasDetail ? (
          <span
            aria-hidden="true"
            className="material-symbols-outlined shrink-0 select-none text-ink-soft transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open && hasDetail ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-hairline px-3.5 pb-3.5 pt-3">
              {section.issues.length > 0 ? (
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-error">
                    {t("lo.section.issue")}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {section.issues.map((issue, issueIndex) => (
                      <li key={issueIndex} className="flex items-start gap-1.5 text-xs leading-snug text-ink-soft">
                        <span aria-hidden="true" className="mt-0.5 select-none text-error/70">
                          •
                        </span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {section.suggestion ? (
                <p className="text-xs leading-relaxed text-ink-soft">
                  <span className="font-extrabold uppercase tracking-[0.06em] text-green-deep">
                    {t("lo.section.suggestion")}:{" "}
                  </span>
                  {section.suggestion}
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
