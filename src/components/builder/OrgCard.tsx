"use client";

import { Field } from "@/components/builder/Field";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";
import { BulletEditor } from "./BulletEditor";
import { aiTextForField } from "@/lib/bullet-lines";
import type { OrganizationEntry } from "@/components/cv-templates";

interface OrgCardProps {
  org: OrganizationEntry;
  index: number;
  totalItems: number;
  /** CV context for AI Polish */
  jobTitle?: string;
  skills?: string[];
  jobDescription?: string;
  onUpdate: (index: number, field: keyof OrganizationEntry, value: string) => void;
  onSetPresent: (index: number, isPresent: boolean) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  /** Tombol seret dari SortableList. */
  dragHandle?: React.ReactNode;
}

export function OrgCard({ org, index, totalItems, jobTitle, skills, jobDescription, onUpdate, onSetPresent, onRemove, onMoveUp, onMoveDown, onToggleVisibility, dragHandle }: OrgCardProps) {
  const isHidden = org.visible === false;

  return (
    <div className={`bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-4 relative transition-opacity duration-200 ${isHidden ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dragHandle}
          <h3 className="font-label-bold text-on-surface">Organisasi {index + 1}</h3>
        </div>
        <div className="flex items-center gap-1">
          {/* Visibility toggle, dedicated boolean handler */}
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
              className="text-on-surface-variant hover:text-primary transition-colors p-0.5"
              aria-label="Pindah ke atas"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            </button>
          )}
          {index < totalItems - 1 && (
            <button type="button" onClick={() => onMoveDown(index)}
              className="text-on-surface-variant hover:text-primary transition-colors p-0.5"
              aria-label="Pindah ke bawah"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-error/70 hover:text-error transition-colors"
            aria-label="Hapus organisasi"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
      <Field label="Nama Organisasi" value={org.name} onChange={(v) => onUpdate(index, "name", v)} enableAiPolish fieldName="nama organisasi" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <Field label="Posisi / Jabatan" value={org.position} onChange={(v) => onUpdate(index, "position", v)} enableAiPolish fieldName="posisi organisasi" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tanggal Mulai" type="month" value={org.startDate} onChange={(v) => onUpdate(index, "startDate", v)} />
        {org.isPresent ? (
          <div>
            <label className="block text-label-bold text-on-surface mb-1.5">Tanggal Selesai</label>
            <div className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-body-md text-on-surface-variant">Sekarang</div>
          </div>
        ) : (
          <Field label="Tanggal Selesai" type="month" value={org.endDate} onChange={(v) => onUpdate(index, "endDate", v)} />
        )}
      </div>
      <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={org.isPresent ?? false}
          onChange={(e) => onSetPresent(index, e.target.checked)}
          className="peer sr-only"
        />
        <div className="w-5 h-5 rounded-md border-2 border-outline-variant bg-surface-container-lowest flex items-center justify-center transition-colors duration-200 peer-checked:bg-primary peer-checked:border-primary">
          {org.isPresent && (
            <span className="material-symbols-outlined text-sm text-white" aria-hidden="true">check</span>
          )}
        </div>
        <span className="text-xs text-on-surface-variant">Sampai Sekarang</span>
      </label>
      <BulletEditor
        label="Deskripsi Kegiatan"
        value={org.description}
        onChange={(v) => onUpdate(index, "description", v)}
        mode={org.descriptionType ?? "bullets"}
        onModeChange={(m) => onUpdate(index, "descriptionType", m)}
        placeholder="Contoh: Mengoordinasi acara seminar kampus"
        headerAction={
          org.description ? (
            <AIPolishButton
              content={org.description}
              onApply={(text) => onUpdate(index, "description", aiTextForField(text, org.descriptionType))}
              jobTitle={jobTitle}
              skills={skills}
              jobDescription={jobDescription}
              field="deskripsi organisasi"
              format={org.descriptionType ?? "bullets"}
              onRevert={(text) => onUpdate(index, "description", text)}
              size="sm"
            />
          ) : null
        }
      />
    </div>
  );
}
