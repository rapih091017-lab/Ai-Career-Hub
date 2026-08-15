"use client";

import { useTranslation } from "@/lib/i18n";

type QCat = "hr" | "technical" | "role-specific";

const ICONS: Record<QCat, string> = {
  hr: "record_voice_over",
  technical: "code",
  "role-specific": "work",
};

const LABELS: Record<QCat, { id: string; en: string }> = {
  hr: { id: "HR / General", en: "HR / General" },
  technical: { id: "Teknis", en: "Technical" },
  "role-specific": { id: "Role-Specific", en: "Role-Specific" },
};

const COLORS: Record<QCat, string> = {
  hr: "bg-purple-100 text-purple-700 border-purple-200",
  technical: "bg-blue-100 text-blue-700 border-blue-200",
  "role-specific": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/** Filter chips (labels follow the current language) */
export function getQCategoryFilters(lang: "id" | "en") {
  return [
    { slug: "all", label: lang === "en" ? "All" : "Semua", color: "bg-surface-container-low text-on-surface-variant border-outline-variant/40" },
    { slug: "hr" as QCat, label: LABELS.hr[lang], color: "bg-purple-100 text-purple-700 border-purple-200" },
    { slug: "technical" as QCat, label: LABELS.technical[lang], color: "bg-blue-100 text-blue-700 border-blue-200" },
    { slug: "role-specific" as QCat, label: LABELS["role-specific"][lang], color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  ];
}

export function QCategoryIcon({ cat }: { cat: QCat }) {
  const { lang } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${COLORS[cat]}`}
    >
      <span className="material-symbols-outlined text-[12px]">{ICONS[cat]}</span>
      {LABELS[cat][lang]}
    </span>
  );
}
