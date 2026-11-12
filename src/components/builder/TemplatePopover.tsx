"use client";

import { useEffect, useRef, useState } from "react";
import CvTemplatePreview from "@/components/CvTemplatePreview";
import { TEMPLATE_STYLES } from "@/components/cv-templates";
import { useTranslation } from "@/lib/i18n";

/** Satu kalimat beda tiap template: apa yang terlihat dan kapan cocok. */
export const TEMPLATE_BLURBS_EN: Record<string, string> = {
  "industrial-pro": "Carlito type with a thin line under each title; neutral for almost any field.",
  "clean-slate": "Inter type with boxed titles; tidy for office and tech roles.",
  "executive-serif": "Navy serif type; suits managerial roles and formal applications.",
  "fresh-graduate": "Open Sans type with a teal accent; friendly for new graduates.",
  "compact-pro": "9.5pt type with boxed titles; fits more content per page.",
};

export const TEMPLATE_BLURBS: Record<string, string> = {
  "industrial-pro": "Huruf Carlito dengan garis tipis di bawah judul; netral untuk hampir semua bidang.",
  "clean-slate": "Huruf Inter dengan judul berbingkai; rapi untuk posisi kantor dan teknologi.",
  "executive-serif": "Huruf serif warna biru tua; cocok untuk posisi manajerial dan lamaran formal.",
  "fresh-graduate": "Huruf Open Sans dengan aksen hijau toska; ramah untuk lulusan baru.",
  "compact-pro": "Huruf 9,5pt dengan judul berbingkai; memuat lebih banyak isi per halaman.",
};

interface TemplatePopoverProps {
  templateId: string;
  onSelect: (id: string) => void;
  /** Ada font/ukuran/rata/warna pilihan user yang menimpa gaya template. */
  hasOverrides: boolean;
  /** Minta konfirmasi lalu hapus override (diurus pemanggil). */
  onResetStyle: () => void;
}

/**
 * Tombol "Template" + galeri kecil 5 gaya. Ganti template tidak menimpa
 * pilihan font/ukuran/warna user; "Kembalikan ke gaya template" yang
 * menghapusnya.
 */
export function TemplatePopover({ templateId, onSelect, hasOverrides, onResetStyle }: TemplatePopoverProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const { t, lang } = useTranslation();
  const blurbs = lang === "en" ? TEMPLATE_BLURBS_EN : TEMPLATE_BLURBS;
  const current = TEMPLATE_STYLES[templateId]?.name ?? "Template";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="template-popover"
        aria-label={`Template: ${current}`}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          open ? "bg-primary/10 text-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant"
        }`}
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">dashboard</span>
        <span className="hidden sm:inline">Template</span>
      </button>
      {open && (
        <div
          ref={panelRef}
          id="template-popover"
          role="dialog"
          aria-label={t("tpl.pick")}
          // Layar kecil: lembar bawah fixed (toolbar ada di dekat bawah layar, panel bisa terpotong).
          className="fixed inset-x-2 bottom-2 z-[95] max-h-[75vh] overflow-y-auto lg:absolute lg:inset-x-auto lg:left-2 lg:right-2 lg:bottom-auto lg:top-full lg:mt-1 lg:max-h-[70vh] lg:max-w-[640px] rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3 shadow-2xl"
        >
          <p className="mb-2 px-1 text-xs text-on-surface-variant">
            {t("tpl.note")}
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.values(TEMPLATE_STYLES).map((tpl) => {
              const active = tpl.id === templateId;
              return (
                <li key={tpl.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(tpl.id)}
                    aria-pressed={active}
                    className={`flex h-full w-full flex-col gap-1.5 rounded-xl border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active ? "border-primary bg-primary/5" : "border-outline-variant/50 hover:border-primary/60"
                    }`}
                  >
                    <CvTemplatePreview templateId={tpl.id} />
                    <span className="flex items-center gap-1 text-sm font-semibold text-on-surface">
                      {tpl.name}
                      {active && (
                        <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                          check_circle
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] leading-snug text-on-surface-variant">{blurbs[tpl.id]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-3">
            <p className="text-[11px] text-on-surface-variant">
              {hasOverrides ? t("tpl.overrides") : t("tpl.no-overrides")}
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onResetStyle();
              }}
              disabled={!hasOverrides}
              className="min-h-11 rounded-lg px-3 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 sm:min-h-9"
            >
              {t("tpl.reset")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
