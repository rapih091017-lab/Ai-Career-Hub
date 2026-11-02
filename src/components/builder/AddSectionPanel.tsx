"use client";

import { useId, useState } from "react";
import { QUICK_CUSTOM_TITLES } from "@/lib/section-manager";
import { MAX_CUSTOM_SECTIONS } from "@/lib/builder-format";

interface AddSectionPanelProps {
  /** Section bawaan yang sedang tidak dipakai: [key, label]. */
  unused: { key: string; label: string; hasContent?: boolean }[];
  onRestore: (key: string) => void;
  onAddCustom: (title: string) => void;
  customCount: number;
  /** Judul kustom yang sudah ada, agar pilihan cepat yang sama tidak dobel. */
  existingTitles: string[];
}

/**
 * "+ Tambah bagian": pakai lagi section bawaan yang dihapus atau buat
 * section kustom baru (judul bebas atau pilihan cepat).
 */
export function AddSectionPanel({ unused, onRestore, onAddCustom, customCount, existingTitles }: AddSectionPanelProps) {
  const [title, setTitle] = useState("");
  const inputId = useId();
  const full = customCount >= MAX_CUSTOM_SECTIONS;
  const taken = new Set(existingTitles.map((t) => t.trim().toLowerCase()));
  const quick = QUICK_CUSTOM_TITLES.filter((t) => !taken.has(t.toLowerCase()));
  const chip =
    "inline-flex min-h-11 items-center gap-1 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm font-medium text-on-surface hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 disabled:hover:border-outline-variant/60 disabled:hover:text-on-surface sm:min-h-9";

  const submit = () => {
    const t = title.trim();
    if (!t || full) return;
    onAddCustom(t);
    setTitle("");
  };

  return (
    <div className="space-y-3">
      {unused.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-on-surface-variant">Belum dipakai di CV</p>
          <div className="flex flex-wrap gap-2">
            {unused.map((u) => (
              <button key={u.key} type="button" className={chip} onClick={() => onRestore(u.key)}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{u.hasContent ? "undo" : "add"}</span>
                {u.label}
                {/* Hanya bagian yang benar-benar punya isi yang ditandai; bagian kosong bukan data hilang. */}
                {u.hasContent && <span className="text-xs font-normal text-on-surface-variant">· isi tersimpan</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-on-surface-variant">Bagian baru</p>
        {quick.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {quick.map((t) => (
              <button key={t} type="button" className={chip} disabled={full} onClick={() => onAddCustom(t)}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
                {t}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Judul bagian baru
          </label>
          <input
            id={inputId}
            value={title}
            maxLength={100}
            disabled={full}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Judul lain, mis. Seminar"
            className="min-h-11 min-w-0 flex-1 rounded-lg border-none bg-surface-container-low px-3 text-body-md focus:ring-2 focus:ring-primary disabled:opacity-50 sm:min-h-9"
          />
          <button
            type="button"
            onClick={submit}
            disabled={full || !title.trim()}
            className="min-h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-40 sm:min-h-9"
          >
            Tambah
          </button>
        </div>
        {full && (
          <p className="mt-1.5 text-xs text-on-surface-variant">
            Sudah {MAX_CUSTOM_SECTIONS} bagian tambahan. Hapus salah satu untuk menambah yang baru.
          </p>
        )}
      </div>
    </div>
  );
}
