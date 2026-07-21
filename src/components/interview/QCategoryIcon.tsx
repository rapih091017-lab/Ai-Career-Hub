"use client";

type QCat = "hr" | "technical" | "role-specific";

const ICONS: Record<QCat, string> = {
  hr: "record_voice_over",
  technical: "code",
  "role-specific": "work",
};

const LABELS: Record<QCat, string> = {
  hr: "HR / General",
  technical: "Teknis",
  "role-specific": "Role-Specific",
};

const COLORS: Record<QCat, string> = {
  hr: "bg-purple-100 text-purple-700 border-purple-200",
  technical: "bg-blue-100 text-blue-700 border-blue-200",
  "role-specific": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const QUESTION_CATEGORY_FILTERS = [
  { slug: "all", label: "Semua", color: "bg-surface-container-low text-on-surface-variant border-outline-variant/40" },
  { slug: "hr" as QCat, label: "HR / General", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { slug: "technical" as QCat, label: "Teknis", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { slug: "role-specific" as QCat, label: "Role-Specific", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

export function QCategoryIcon({ cat }: { cat: QCat }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${COLORS[cat]}`}
    >
      <span className="material-symbols-outlined text-[12px]">{ICONS[cat]}</span>
      {LABELS[cat]}
    </span>
  );
}
