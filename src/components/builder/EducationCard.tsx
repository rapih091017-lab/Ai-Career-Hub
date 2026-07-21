"use client";

import { Field } from "@/components/builder/Field";
import type { EducationEntry } from "@/components/cv-templates";

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
}

export function EducationCard({ edu, index, totalItems, jobTitle, skills, jobDescription, onUpdate, onRemove, onMoveUp, onMoveDown, onToggleVisibility }: EducationCardProps) {
  const isHidden = edu.visible === false;

  return (
    <div className={`bg-white rounded-xl p-6 shadow-soft space-y-4 relative transition-opacity duration-200 ${isHidden ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <div className="shrink-0 cursor-grab active:cursor-grabbing text-outline-variant hover:text-on-surface transition-colors p-1 rounded">
            <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
          </div>
          <h3 className="font-label-bold text-on-surface">Pendidikan {index + 1}</h3>
        </div>
        <div className="flex items-center gap-1">
          {/* Visibility toggle — dedicated boolean handler */}
          <button
            type="button"
            onClick={() => onToggleVisibility(index)}
            className={`transition-colors p-0.5 rounded ${isHidden ? "text-outline-variant" : "text-primary hover:text-primary/80"}`}
            title={isHidden ? "Tampilkan di CV" : "Sembunyikan dari CV"}
            aria-label={isHidden ? "Tampilkan" : "Sembunyikan"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isHidden ? "visibility_off" : "visibility"}
            </span>
          </button>
          {index > 0 && (
            <button type="button" onClick={() => onMoveUp(index)}
              className="text-outline hover:text-primary transition-colors p-0.5"
              aria-label="Pindah ke atas"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            </button>
          )}
          {index < totalItems - 1 && (
            <button type="button" onClick={() => onMoveDown(index)}
              className="text-outline hover:text-primary transition-colors p-0.5"
              aria-label="Pindah ke bawah"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-error/70 hover:text-error transition-colors"
            aria-label="Hapus pendidikan"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
      <Field label="Nama Institusi" value={edu.institution} onChange={(v) => onUpdate(index, "institution", v)} enableAiPolish fieldName="institution" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <Field label="Jenjang / Gelar" value={edu.degree} onChange={(v) => onUpdate(index, "degree", v)} enableAiPolish fieldName="degree" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <Field label="Bidang Studi" value={edu.field} onChange={(v) => onUpdate(index, "field", v)} enableAiPolish fieldName="field" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tahun Mulai" type="month" value={edu.startDate} onChange={(v) => onUpdate(index, "startDate", v)} />
        <Field label="Tahun Selesai" type="month" value={edu.endDate} onChange={(v) => onUpdate(index, "endDate", v)} />
      </div>
      <Field label="IPK / GPA (opsional)" value={edu.gpa || ""} onChange={(v) => onUpdate(index, "gpa", v)} placeholder="Contoh: 3.75 / 4.00" />
    </div>
  );
}
