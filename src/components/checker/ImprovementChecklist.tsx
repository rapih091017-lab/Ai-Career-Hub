"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import type { ActionPlan, KeywordAnalysis } from "./types";

/**
 * ImprovementChecklist — mengubah rekomendasi analisis CV menjadi langkah
 * perbaikan yang bisa ditandai satu per satu (checklist interaktif).
 *
 * Input: actionPlan (quick_wins/short_term/long_term), missingSections,
 * dan keywordAnalysis.missing_critical. Output: daftar langkah terurut
 * dengan prioritas, progress bar, dan tombol salin seluruh rencana.
 */
interface ImprovementChecklistProps {
  actionPlan?: ActionPlan | null;
  missingSections?: string[];
  keywordAnalysis?: KeywordAnalysis | null;
}

type ChecklistItem = {
  id: string;
  text: string;
  group: "quick" | "short" | "long" | "section" | "keyword";
};

const GROUP_KEYS: Record<ChecklistItem["group"], { label: string; short: string; color: string; icon: string }> = {
  quick: { label: "checker.detail.group-quick", short: "checker.detail.group-quick-short", color: "bg-green-50 border-green-200", icon: "bolt" },
  short: { label: "checker.detail.group-short", short: "checker.detail.group-short-short", color: "bg-blue-50 border-blue-200", icon: "schedule" },
  long: { label: "checker.detail.group-long", short: "checker.detail.group-long-short", color: "bg-purple-50 border-purple-200", icon: "flag" },
  section: { label: "checker.detail.group-section", short: "checker.detail.group-section-short", color: "bg-orange-50 border-orange-200", icon: "add_circle" },
  keyword: { label: "checker.detail.group-keyword", short: "checker.detail.group-keyword-short", color: "bg-red-50 border-red-200", icon: "key" },
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
    push("section", missingSections);
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
      // clipboard unavailable — fallback diam
    }
  }, [items, t]);

  if (items.length === 0) return null;

  return (
    <motion.section
      className="bg-white rounded-2xl border border-surface-container-high shadow-premium-md p-6 space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.42 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface">{t("checker.detail.checklist-title")}</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t("checker.detail.checklist-sub").replace("{done}", String(done)).replace("{total}", String(items.length))}
          </p>
        </div>
        <button
          onClick={copyAll}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all active:scale-[0.97]"
          title={t("checker.detail.copy-plan")}
        >
          <span className="material-symbols-outlined text-base select-none">
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? t("checker.detail.copied") : t("checker.detail.copy")}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length} aria-label={t("checker.detail.checklist-progress").replace("{pct}", String(pct))}>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-green-400 to-primary"
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
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${meta.color.split(" ")[0]} text-on-surface-variant px-2 py-1 rounded-lg`}>
                <span className="material-symbols-outlined text-sm select-none">{meta.icon}</span>
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
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
                          isChecked
                            ? "bg-green-50/60 border-green-200"
                            : "bg-surface-container-low/40 border-transparent hover:border-outline-variant/50 hover:bg-surface-container-low"
                        }`}
                      >
                        <span
                          className={`shrink-0 w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-outline-variant bg-white"
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
                            isChecked ? "text-on-surface-variant line-through" : "text-on-surface"
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
