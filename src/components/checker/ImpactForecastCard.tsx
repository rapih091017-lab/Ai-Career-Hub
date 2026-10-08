"use client";

import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
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
      className="bg-surface rounded-2xl border border-surface-container-high shadow-premium-md p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
    >
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-lg select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
              trending_up
            </span>
            {t("checker.impact-title")}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">{t("checker.impact-sub")}</p>
        </div>
        {gain > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
            <span className="material-symbols-outlined text-sm select-none">add_chart</span>
            +{gain}%
          </span>
        )}
      </div>

      {/* Track */}
      <div className="relative h-2.5 bg-surface-container rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-surface-container-high rounded-full"
          style={{ width: `${Math.max(4, now)}%` }}
        />
        <motion.div
          className="absolute top-0 h-full bg-gradient-to-r from-primary/70 to-primary rounded-full"
          initial={{ width: `${Math.max(4, now)}%` }}
          animate={{ width: `${Math.min(96, all)}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-0 h-full bg-gradient-to-r from-amber-400/80 to-green-500/80 rounded-full"
          initial={{ width: `${Math.max(4, now)}%` }}
          animate={{ width: `${Math.min(96, quick)}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          style={{ opacity: 0.85 }}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {steps.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border px-3 py-2 text-center ${
              s.active ? "border-outline-variant/40 bg-surface-container-low" : "border-outline-variant/20 opacity-70"
            }`}
          >
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide truncate">{s.label}</p>
            <p className="text-lg font-extrabold text-on-surface">{s.score}%</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
