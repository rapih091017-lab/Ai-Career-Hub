"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { priorityBadge, type BulletItem } from "./types";
import { useTranslation } from "@/lib/i18n";

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

/* ── CARI meter ─────────────────────────────────────────── */
function cariColor(score: number) {
  if (score >= 70) return { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50 border-green-200" };
  if (score >= 40) return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  return { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200" };
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
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${c.bg}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t("checker.detail.cari-score")}</span>
          <span className={`text-[11px] font-bold ${c.text}`}>{score}/100 · {cariLabel(score, t)}</span>
        </div>
        <div
          className="h-1.5 w-full bg-white/70 rounded-full overflow-hidden"
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
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const copyRewrite = async () => {
    if (!item.suggested_rewrite) return;
    try {
      await navigator.clipboard.writeText(item.suggested_rewrite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — diam
    }
  };

  const cari = typeof item.cari_score === "number" ? item.cari_score : null;

  return (
    <motion.div
      className="bg-white rounded-xl border border-surface-container-high shadow-premium-sm overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`bullet-detail-${index}`}
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
          {/* Ringkasan skor CARI di header (kalau tersedia) */}
          {cari !== null && (
            <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold ${cariColor(cari).text}`}>
              <span className="material-symbols-outlined text-[12px] select-none">speed</span>
              CARI {cari}/100 · {cariLabel(cari, t)}
            </span>
          )}
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
            id={`bullet-detail-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-surface-container-high pt-3">
              {/* CARI meter detail */}
              {cari !== null && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    {t("checker.detail.cari-strength-title")}
                  </p>
                  <CariMeter score={cari} />
                  <p className="text-[10px] text-on-surface-variant/70 mt-1.5 leading-relaxed">
                    {t("checker.detail.cari-desc")}
                  </p>
                </div>
              )}

              {item.issues.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">{t("checker.detail.issues-found")}</p>
                  <ul className="space-y-1">
                    {item.issues.map((iss, i) => (
                      <li key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5 bg-red-50/50 rounded-lg px-2.5 py-1.5">
                        <span className="text-red-400 mt-0.5 select-none">⚠</span>
                        {iss}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sebelum vs Sesudah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sebelum */}
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("checker.detail.before")}</p>
                  <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/30">
                    <p className="text-sm text-on-surface">{item.original_text}</p>
                  </div>
                </div>
                {/* Sesudah */}
                {item.suggested_rewrite && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wider">{t("checker.detail.after")}</p>
                      <button
                        onClick={copyRewrite}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-green-700 bg-green-100 hover:bg-green-200 transition-colors active:scale-[0.97]"
                        title={t("checker.detail.copy-fix")}
                      >
                        <span className="material-symbols-outlined text-[13px] select-none">
                          {copied ? "check" : "content_copy"}
                        </span>
                        {copied ? t("checker.detail.copied") : t("checker.detail.copy")}
                      </button>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">{item.suggested_rewrite}</p>
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
