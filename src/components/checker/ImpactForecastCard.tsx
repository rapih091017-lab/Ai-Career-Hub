"use client";

import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import { SectionKicker } from "./ResultComponents";
import type { ImpactForecast } from "./types";

/**
 * ImpactForecastCard, proyeksi skor jika saran dieksekusi (v4).
 * Sumber: AI (impact_forecast), dijamin monoton oleh prompt:
 * current ≤ quick_wins ≤ all_fixes ≤ 96.
 */
export function ImpactForecastCard({ forecast }: { forecast: ImpactForecast }) {
  const { t } = useTranslation();

  if (
    typeof forecast?.current_score !== "number" ||
    typeof forecast?.projected_after_all_fixes !== "number"
  ) {
    return null;
  }

  const now = forecast.current_score;
  const quick = forecast.projected_after_quick_wins ?? now;
  const all = forecast.projected_after_all_fixes;
  const gain = Math.max(0, all - now);

  const steps = [
    { label: t("checker.impact-now"), score: now, active: true },
    { label: t("checker.impact-quick"), score: Math.max(quick, now), active: quick > now },
    { label: t("checker.impact-all"), score: Math.max(all, quick, now), active: true },
  ];

  return (
    <motion.section
      className="rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionKicker>{t("checker.kicker-impact")}</SectionKicker>
          <h2 className="flex items-center gap-1.5 font-display text-[19px] font-bold text-ink">
            <span className="material-symbols-outlined select-none text-lg text-green-deep" style={{ fontVariationSettings: "'FILL' 1" }}>
              trending_up
            </span>
            {t("checker.impact-title")}
          </h2>
          <p className="mt-1 text-xs text-ink-soft">{t("checker.impact-sub")}</p>
        </div>
        {gain > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink/20 bg-primary-fixed px-2.5 py-1 text-xs font-bold text-on-primary-fixed">
            <span className="material-symbols-outlined select-none text-sm">add_chart</span>
            +{gain}%
          </span>
        )}
      </div>

      {/* Track */}
      <div className="relative mb-5 h-3 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-ink/15" style={{ width: `${Math.max(4, now)}%` }} />
        <motion.div
          className="absolute top-0 h-full rounded-full"
          style={{ background: "linear-gradient(90deg, rgb(var(--c-green)), rgb(var(--c-lime)))" }}
          initial={{ width: `${Math.max(4, now)}%` }}
          animate={{ width: `${Math.min(96, all)}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-0 h-full rounded-full bg-lime/80"
          initial={{ width: `${Math.max(4, now)}%` }}
          animate={{ width: `${Math.min(96, quick)}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {steps.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border-[1.5px] px-3 py-2 text-center ${
              s.active ? "border-ink/15 bg-surface-container-low" : "border-ink/10 opacity-70"
            }`}
          >
            <p className="truncate text-xs font-bold uppercase tracking-[0.06em] text-ink-soft">{s.label}</p>
            <p className="font-display text-lg font-bold text-ink">{s.score}%</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
