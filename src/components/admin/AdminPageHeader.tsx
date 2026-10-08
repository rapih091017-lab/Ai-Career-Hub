import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Ikon Material Symbols di kiri judul. */
  icon?: string;
  /** Tombol aksi di kanan (mis. "Tambah Loker"). */
  actions?: ReactNode;
}

/**
 * Judul + deskripsi + aksi untuk setiap halaman admin.
 *
 * Dipakai seragam supaya setiap halaman terasa sebagai bagian dari satu
 * panel, bukan halaman yang berdiri sendiri (dulu tiap halaman mengulang
 * tombol "Kembali ke Admin").
 */
export default function AdminPageHeader({ title, description, icon, actions }: AdminPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-outline-variant/50 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 font-headline-md text-[22px] leading-tight text-on-surface md:text-2xl">
          {icon ? (
            <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-body-md text-on-surface-variant">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
