"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import type { ActionPlan, KeywordAnalysis, MissingSection } from "./types";

/**
 * ImprovementChecklist, mengubah rekomendasi analisis CV menjadi langkah
 * perbaikan yang bisa ditandai satu per satu (checklist interaktif).
 *
 * Input: actionPlan (quick_wins/short_term/long_term), missingSections,
 * dan keywordAnalysis.missing_critical. Output: daftar langkah terurut
 * dengan prioritas, progress bar, dan tombol salin seluruh rencana.
 */
interface ImprovementChecklistProps {
  actionPlan?: ActionPlan | null;
  /** Objek sejak prompt 4; mapper menormalkan string lama jadi { name }. */
  missingSections?: MissingSection[];
  keywordAnalysis?: KeywordAnalysis | null;
}

type ChecklistItem = {
  id: string;
  text: string;
  group: "quick" | "short" | "long" | "section" | "keyword";
};

// `chip` dipakai untuk lencana kelompok. Dulu isinya kelas latar yang dipotong
// lalu dipasang sebagai warna teks, jadi judul kelompok tidak pernah berwarna.
const GROUP_KEYS: Record<ChecklistItem["group"], { label: string; short: string; chip: string; icon: string }> = {
  quick: { label: "checker.detail.group-quick", short: "checker.detail.group-quick-short", chip: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed", icon: "bolt" },
  short: { label: "checker.detail.group-short", short: "checker.detail.group-short-short", chip: "border-ink/20 bg-surface-container-low text-ink", icon: "schedule" },
  long: { label: "checker.detail.group-long", short: "checker.detail.group-long-short", chip: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container", icon: "flag" },
  section: { label: "checker.detail.group-section", short: "checker.detail.group-section-short", chip: "border-ink/20 bg-surface-container text-ink", icon: "add_circle" },
  keyword: { label: "checker.detail.group-keyword", short: "checker.detail.group-keyword-short", chip: "border-error/50 bg-error-container text-on-error-container", icon: "key" },
};

export function ImprovementChecklist({ actionPlan, missingSections, keywordAnalysis }: ImprovementChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const items = useMemo<ChecklistItem[]>(() => {
    const out: ChecklistItem[] = [];
    const push = (group: ChecklistItem["group"], list: string[] | undefined) => {
      (list ?? []).forEach((text, i) => {
        if (text.trim()) out.push({ id: `${group}-${i}`, text: text.trim(), group });
      });
    };
    push("quick", actionPlan?.quick_wins);
    push("short", actionPlan?.short_term);
    push("long", actionPlan?.long_term);
    // Bentuk objek (prompt 4): hanya namanya yang masuk daftar langkah.
    push("section", (missingSections ?? []).map((section) => section?.name ?? ""));
    push("keyword", keywordAnalysis?.missing_critical);
    return out;
  }, [actionPlan, missingSections, keywordAnalysis]);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const done = checked.size;
  const pct = Math.round((done / items.length) * 100);

  const copyAll = useCallback(async () => {
    const lines = items.map((it) => `[${t(GROUP_KEYS[it.group].short)}] ${it.text}`);
    const header = t("checker.detail.checklist-copy-header").replace("{n}", String(items.length));
    try {
      await navigator.clipboard.writeText(`${header}\n${lines.join("\n")}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable, fallback diam
    }
  }, [items, t]);

  if (items.length === 0) return null;

  return (
    <motion.section
      className="space-y-5 rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.42 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] font-bold text-ink">{t("checker.detail.checklist-title")}</h2>
          <p className="mt-1 text-xs text-ink-soft">
            {t("checker.detail.checklist-sub").replace("{done}", String(done)).replace("{total}", String(items.length))}
          </p>
        </div>
        <button
          onClick={copyAll}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-ink/20 px-3 py-2 text-xs font-bold text-ink transition-all hover:border-ink hover:bg-surface-container-low active:scale-[0.97]"
          title={t("checker.detail.copy-plan")}
        >
          <span className="material-symbols-outlined select-none text-base">
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? t("checker.detail.copied") : t("checker.detail.copy")}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length} aria-label={t("checker.detail.checklist-progress").replace("{pct}", String(pct))}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, rgb(var(--c-green)), rgb(var(--c-lime)))" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Grouped items */}
      <div className="space-y-4">
        {(["quick", "short", "long", "section", "keyword"] as const).map((group) => {
          const groupItems = items.filter((it) => it.group === group);
          if (groupItems.length === 0) return null;
          const meta = { ...GROUP_KEYS[group], label: t(GROUP_KEYS[group].label) };
          return (
            <div key={group}>
              <p className={`mb-2 inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.06em] ${meta.chip}`}>
                <span className="material-symbols-outlined select-none text-sm">{meta.icon}</span>
                {meta.label} ({groupItems.length})
              </p>
              <ul className="space-y-1.5">
                {groupItems.map((item) => {
                  const isChecked = checked.has(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => toggle(item.id)}
                        role="checkbox"
                        aria-checked={isChecked}
                        className={`flex w-full items-start gap-3 rounded-xl border-[1.5px] px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                          isChecked
                            ? "border-green-deep/40 bg-primary-fixed/50"
                            : "border-transparent hover:border-ink/15 hover:bg-surface-container-low"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                            isChecked
                              ? "border-ink bg-lime text-on-light"
                              : "border-ink/30 bg-paper"
                          }`}
                        >
                          {isChecked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`text-sm leading-relaxed ${
                            isChecked ? "text-ink-soft line-through" : "text-ink"
                          }`}
                        >
                          {item.text}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
