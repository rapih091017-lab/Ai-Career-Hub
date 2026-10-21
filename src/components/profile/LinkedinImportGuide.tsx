"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

/**
 * Cara mendapatkan PDF profil LinkedIn sendiri.
 *
 * LinkedIn tidak mengizinkan aplikasi membaca tautan profilnya secara
 * otomatis, jadi langkah yang bisa dilakukan hanya satu: pengguna menyimpan
 * salinan profilnya sendiri, lalu mengunggahnya di sini. Berisi profil dari
 * PDF itu dibaca sama seperti CV.
 *
 * Dua cara yang dipakai orang:
 * 1. Cetak ke PDF dari browser (cepat, isi yang terlihat publik).
 * 2. Minta arsip data dari LinkedIn (lengkap, tapi perlu menunggu email).
 */
export function LinkedinImportGuide({ onPickFile }: { onPickFile: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">menu_book</span>
          <span className="text-label-bold text-on-surface">{t("linkedin.guide-title")}</span>
        </span>
        <span className="material-symbols-outlined text-on-surface-variant">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open ? (
        <div className="mt-3 space-y-4">
          {/* Cara 1: cetak ke PDF. Paling cepat dan cukup untuk mengisi profil. */}
          <section>
            <h3 className="text-label-bold text-on-surface">{t("linkedin.guide-print-title")}</h3>
            <ol className="mt-1.5 space-y-1.5 list-decimal list-inside text-sm text-on-surface-variant">
              <li>{t("linkedin.guide-print-1")}</li>
              <li>{t("linkedin.guide-print-2")}</li>
              <li>{t("linkedin.guide-print-3")}</li>
              <li>{t("linkedin.guide-print-4")}</li>
            </ol>
            <p className="mt-1.5 text-xs text-on-surface-variant">{t("linkedin.guide-print-note")}</p>
          </section>

          {/* Cara 2: arsip data LinkedIn. Lebih lengkap, perlu menunggu. */}
          <section>
            <h3 className="text-label-bold text-on-surface">{t("linkedin.guide-archive-title")}</h3>
            <ol className="mt-1.5 space-y-1.5 list-decimal list-inside text-sm text-on-surface-variant">
              <li>{t("linkedin.guide-archive-1")}</li>
              <li>{t("linkedin.guide-archive-2")}</li>
              <li>{t("linkedin.guide-archive-3")}</li>
            </ol>
            <p className="mt-1.5 text-xs text-on-surface-variant">{t("linkedin.guide-archive-note")}</p>
          </section>

          <div className="flex flex-wrap items-center gap-2 border-t border-primary/20 pt-3">
            <button
              type="button"
              onClick={onPickFile}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-label-bold text-on-primary hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              {t("linkedin.guide-upload")}
            </button>
            <span className="text-xs text-on-surface-variant">{t("linkedin.guide-upload-note")}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}