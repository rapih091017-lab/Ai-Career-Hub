"use client";

import { motion } from "motion/react";

interface DashboardStatsProps {
  totalCvs: number;
  recentCount: number; // CVs created/updated in last 7 days
  completions: number; // CVs with jobTitle filled
}

const statCards = [
  { key: "total", icon: "description", label: "Total CV", color: "bg-primary/10", iconColor: "text-primary" },
  { key: "recent", icon: "history", label: "7 Hari Terakhir", color: "bg-amber-50", iconColor: "text-amber-600" },
  { key: "complete", icon: "check_circle", label: "CV Siap Pakai", color: "bg-green-50", iconColor: "text-green-600" },
];

export function DashboardStats({ totalCvs, recentCount, completions }: DashboardStatsProps) {
  const values = [totalCvs, recentCount, completions];

  return (
    <div className="grid grid-cols-3 gap-3">
      {statCards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
          className="bg-white rounded-xl p-4 shadow-premium-sm border border-outline-variant/30 flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
            <span className={`material-symbols-outlined ${card.iconColor} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-extrabold text-on-surface">{values[i]}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{card.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
