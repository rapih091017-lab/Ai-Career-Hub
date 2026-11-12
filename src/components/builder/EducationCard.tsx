"use client";

import { Field } from "@/components/builder/Field";
import type { EducationEntry } from "@/components/cv-templates";
import { useTranslation } from "@/lib/i18n";

interface EducationCardProps {
  edu: EducationEntry;
  index: number;
  totalItems: number;
  /** CV context for AI Polish */
  jobTitle?: string;
  skills?: string[];
  jobDescription?: string;
  onUpdate: (index: number, field: keyof EducationEntry, value: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  /** Tombol seret dari SortableList. */
  dragHandle?: React.ReactNode;
}

export function EducationCard({ edu, index, totalItems, jobTitle, skills, jobDescription, onUpdate, onRemove, onMoveUp, onMoveDown, onToggleVisibility, dragHandle }: EducationCardProps) {
  const isHidden = edu.visible === false;
  const { t } = useTranslation();

  return (
    <div data-cv-entry={`education.${edu.id}`} className={`bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-4 relative transition-opacity duration-200 ${isHidden ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dragHandle}
          <h3 className="font-label-bold text-on-surface">{t("edu.title")} {index + 1}</h3>
        </div>
        <div className="flex items-center gap-1">
          {/* Visibility toggle, dedicated boolean handler */}
          <button
            type="button"
            onClick={() => onToggleVisibility(index)}
            className={`transition-colors p-0.5 rounded ${isHidden ? "text-outline-variant" : "text-primary hover:text-primary/80"}`}
            title={isHidden ? t("entry.show-in-cv") : t("entry.hide-from-cv")}
            aria-label={isHidden ? t("section.show") : t("entry.hide")}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isHidden ? "visibility_off" : "visibility"}
            </span>
          </button>
          {index > 0 && (
            <button type="button" onClick={() => onMoveUp(index)}
              className="text-on-surface-variant hover:text-primary transition-colors p-0.5"
              aria-label={t("entry.move-up")}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            </button>
          )}
          {index < totalItems - 1 && (
            <button type="button" onClick={() => onMoveDown(index)}
              className="text-on-surface-variant hover:text-primary transition-colors p-0.5"
              aria-label={t("entry.move-down")}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-error/70 hover:text-error transition-colors"
            aria-label={t("edu.remove")}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
      <Field cvField="institution" label={t("edu.institution")} value={edu.institution} onChange={(v) => onUpdate(index, "institution", v)} enableAiPolish fieldName="institution" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <Field cvField="degree" label={t("edu.degree")} value={edu.degree} onChange={(v) => onUpdate(index, "degree", v)} enableAiPolish fieldName="degree" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <Field cvField="field" label={t("edu.field")} value={edu.field} onChange={(v) => onUpdate(index, "field", v)} enableAiPolish fieldName="field" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <div className="grid grid-cols-2 gap-4">
        <Field cvField="startDate" label={t("edu.start")} type="month" value={edu.startDate} onChange={(v) => onUpdate(index, "startDate", v)} />
        <Field label={t("edu.end")} type="month" value={edu.endDate} onChange={(v) => onUpdate(index, "endDate", v)} />
      </div>
      <Field cvField="gpa" label={t("edu.gpa")} help="gpa" value={edu.gpa || ""} onChange={(v) => onUpdate(index, "gpa", v)} placeholder={t("edu.gpa-ph")} />
    </div>
  );
}
