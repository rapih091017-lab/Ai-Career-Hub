"use client";

import type { ReactNode } from "react";

interface CollapsibleProps {
  /** Id anchor; dipakai daftar isi dan tombol lompat. */
  id?: string;
  title: string;
  /** Ringkasan satu baris yang terlihat saat tertutup. */
  summary?: string;
  /** Terbuka sejak awal. Default tertutup. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Bagian yang bisa dilipat, dibangun di atas <details>/<summary> sehingga
 * keyboard (Enter/Spasi) dan pembaca layar langsung bekerja. Sengaja tidak
 * dikontrol React: tombol lompat bisa membukanya lewat `details.open = true`.
 */
export function Collapsible({ id, title, summary, defaultOpen = false, children }: CollapsibleProps) {
  return (
    <details id={id} open={defaultOpen || undefined} className="group scroll-mt-32 lg:scroll-mt-28">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[18px] border-[2.5px] border-ink bg-paper px-5 py-4 shadow-hard-sm transition-colors hover:bg-surface-container-low group-open:mb-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold text-ink">{title}</span>
          {summary && <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{summary}</span>}
        </span>
        <span
          className="material-symbols-outlined shrink-0 select-none text-ink transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          expand_more
        </span>
      </summary>
      {children}
    </details>
  );
}
