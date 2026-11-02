"use client";

import { BulletEditor } from "./BulletEditor";
import type { CustomSectionEntry } from "@/components/cv-templates";

/** Tombol "Hapus bagian" di kartu section opsional. Konfirmasi diurus pemanggil. */
export function RemoveSectionButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Hapus bagian ${label} dari CV`}
      className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-on-surface-variant hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error sm:min-h-8"
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
      Hapus dari CV
    </button>
  );
}

/**
 * Pengganti kartu bagian yang dihapus dari CV. Isi tetap tersimpan; "Pakai
 * lagi" memulihkannya. "Hapus permanen" hanya di sini, dengan konfirmasi.
 */
export function UnusedSectionCard({
  label,
  onRestore,
  hasContent = false,
  onPurge,
}: {
  label: string;
  onRestore: () => void;
  hasContent?: boolean;
  onPurge?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-outline-variant/60 px-4 py-3">
      <p className="text-sm text-on-surface-variant">
        <span className="font-semibold text-on-surface">{label}</span> · tidak dipakai di CV
        {hasContent && <span className="block text-xs">Isinya masih tersimpan.</span>}
      </p>
      <div className="flex items-center gap-1">
        {hasContent && onPurge && (
          <button
            type="button"
            onClick={onPurge}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-xs font-semibold text-on-surface-variant hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error sm:min-h-9"
          >
            Hapus permanen isi
          </button>
        )}
        <button
          type="button"
          onClick={onRestore}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-9"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
          Pakai lagi
        </button>
      </div>
    </div>
  );
}

interface CustomSectionCardProps {
  section: CustomSectionEntry;
  onChange: (patch: Partial<Omit<CustomSectionEntry, "id">>) => void;
  onRemove: () => void;
  hiddenNotice?: React.ReactNode;
}

/** Kartu form section kustom (judul bebas + isi poin/paragraf). */
export function CustomSectionCard({ section, onChange, onRemove, hiddenNotice }: CustomSectionCardProps) {
  const label = section.title.trim() || "Bagian tanpa judul";
  return (
    <div className="space-y-4 rounded-xl bg-surface-container-lowest p-6 shadow-soft" data-custom-section={section.id} data-cv-field={`customSections.${section.id}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant" htmlFor={`cs-title-${section.id}`}>
            Judul bagian
          </label>
          <input
            id={`cs-title-${section.id}`}
            value={section.title}
            maxLength={100}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Mis. Penghargaan"
            className="w-full rounded-lg border-none bg-surface-container-low px-3 py-2 font-label-bold text-on-surface focus:ring-2 focus:ring-primary"
          />
        </div>
        <RemoveSectionButton label={label} onRemove={onRemove} />
      </div>
      {hiddenNotice}
      <BulletEditor
        label={`Isi bagian ${label}`}
        value={section.content}
        onChange={(content) => onChange({ content })}
        mode={section.contentType === "paragraph" ? "paragraph" : "bullets"}
        onModeChange={(contentType) => onChange({ contentType })}
        maxLength={5000}
      />
    </div>
  );
}
