"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { priorityBadge, severityMeta, toIssueItems, type BulletItem } from "./types";
import { CopyButton } from "./CopyButton";
import { PlaceholderText } from "./PlaceholderText";
import { useTranslation } from "@/lib/i18n";

/** Keyword tag chip */
export function KeywordChip({ text, variant }: { text: string; variant: "found" | "missing" | "nice" | "synonym" }) {
  const styles = {
    found: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed",
    missing: "border-error/50 bg-error-container text-on-error-container",
    nice: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container",
    synonym: "border-ink/20 bg-surface-container-low text-ink",
  };
  return (
    <span className={`inline-flex items-center rounded-full border-[1.5px] px-2.5 py-1 text-xs font-semibold ${styles[variant]}`}>
      {text}
    </span>
  );
}

/* ── CARI meter ─────────────────────────────────────────── */
function cariColor(score: number) {
  if (score >= 70) return { bar: "bg-green-deep", text: "text-green-deep", bg: "bg-primary-fixed border-green-deep/40" };
  if (score >= 40) return { bar: "bg-tertiary", text: "text-on-tertiary-container", bg: "bg-tertiary-container border-tertiary/50" };
  return { bar: "bg-error", text: "text-error", bg: "bg-error-container border-error/50" };
}

function cariLabel(score: number, t: (key: string) => string) {
  if (score >= 70) return t("checker.detail.cari-strong");
  if (score >= 40) return t("checker.detail.cari-fair");
  return t("checker.detail.cari-weak");
}

/** Skor CARI (Context-Action-Result-Impact) 0-100 dengan meter visual */
function CariMeter({ score }: { score: number }) {
  const { t } = useTranslation();
  const c = cariColor(score);
  return (
    <div className={`flex items-center gap-3 rounded-xl border-[1.5px] px-3 py-2 ${c.bg}`}>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] opacity-80">{t("checker.detail.cari-score")}</span>
          <span className={`text-[11px] font-bold ${c.text}`}>{score}/100 · {cariLabel(score, t)}</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-ink/10"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("checker.detail.cari-aria").replace("{score}", String(score))}
        >
          <motion.div
            className={`h-full rounded-full ${c.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, score)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/** Bullet review card with expand */
export function BulletReviewCard({ item, index }: { item: BulletItem; index: number }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const cari = typeof item.cari_score === "number" ? item.cari_score : null;
  // Normalisasi bentuk issue lama (string) & baru ({ text, source_excerpt })
  const issues = toIssueItems(item.issues);

  return (
    <motion.div
      className="overflow-hidden rounded-[18px] border-[2.5px] border-ink bg-paper shadow-hard-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`bullet-detail-${index}`}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-container-low"
      >
        <div className="mt-0.5 shrink-0">
          <span className={`inline-block rounded-full border-[1.5px] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] ${priorityBadge(item.priority)}`}>
            {item.priority}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">{item.section}</p>
          <p className="line-clamp-2 text-sm text-ink">{item.original_text}</p>
          {/* Ringkasan skor CARI di header (kalau tersedia) */}
          {cari !== null && (
            <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold ${cariColor(cari).text}`}>
              <span className="material-symbols-outlined text-[12px] select-none">speed</span>
              CARI {cari}/100 · {cariLabel(cari, t)}
            </span>
          )}
        </div>
        <span className="material-symbols-outlined shrink-0 select-none text-ink-soft transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={`bullet-detail-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t-[1.5px] border-hairline px-4 pb-4 pt-3">
              {/* CARI meter detail */}
              {cari !== null && (
                <div>
                  <p className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-ink-soft">
                    {t("checker.detail.cari-strength-title")}
                  </p>
                  <CariMeter score={cari} />
                  <p className="mt-1.5 text-[10px] leading-relaxed text-ink-soft">
                    {t("checker.detail.cari-desc")}
                  </p>
                </div>
              )}

              {issues.length > 0 && (
                <div>
                  <p className="mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-error">{t("checker.detail.issues-found")}</p>
                  <ul className="space-y-1">
                    {issues.map((iss, i) => {
                      const sev = severityMeta(iss.severity, t);
                      return (
                        <li key={i} className="flex items-start gap-1.5 rounded-lg bg-surface-container-low px-2.5 py-1.5 text-xs text-ink-soft">
                          <span className="mt-0.5 select-none text-error/70">⚠</span>
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
                              <span className="mt-1 block rounded-md border-l-2 border-error/40 bg-paper px-2 py-1 text-[11px] italic text-ink-soft">
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

              {/* Sebelum vs Sesudah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sebelum */}
                <div>
                  <p className="mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-ink-soft">{t("checker.detail.before")}</p>
                  <div className="rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low p-3">
                    <p className="text-sm text-ink">{item.original_text}</p>
                  </div>
                </div>
                {/* Sesudah */}
                {item.suggested_rewrite && (
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">{t("checker.detail.after")}</p>
                      <CopyButton text={item.suggested_rewrite} label={t("checker.detail.copy", "Salin")} />
                    </div>
                    <div className="rounded-xl border-[1.5px] border-green-deep/40 bg-primary-fixed p-3">
                      <p className="text-sm text-on-primary-fixed">
                        <PlaceholderText text={item.suggested_rewrite} />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
