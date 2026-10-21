"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  THEME_EVENT,
  applyTheme,
  readThemeChoice,
  setThemeChoice,
  type ThemeChoice,
} from "@/lib/theme";

const OPTIONS: { value: ThemeChoice; icon: string; labelKey: string; fallback: string }[] = [
  { value: "light", icon: "light_mode", labelKey: "footer.theme-light", fallback: "Terang" },
  { value: "dark", icon: "dark_mode", labelKey: "footer.theme-dark", fallback: "Gelap" },
  { value: "system", icon: "brightness_auto", labelKey: "footer.theme-system", fallback: "Sistem" },
];

/**
 * Pemilih tema tiga keadaan untuk footer. `sistem` mengikuti preferensi OS dan
 * ikut berubah saat OS berganti; `terang`/`gelap` memaksa satu tema dan
 * disimpan supaya bertahan setelah reload.
 *
 * Header dan halaman masuk memakai SkyToggle (dua keadaan) karena ruangnya
 * sempit; pilihan "sistem" sengaja tinggal di sini.
 */
export default function ThemeToggle() {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    setChoice(readThemeChoice());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (readThemeChoice() === "system") applyTheme("system");
    };
    // Saklar lain (header/login) memberi tahu instance ini supaya labelnya
    // tidak berbeda dari tema yang sedang tampil.
    const onChoice = (event: Event) => {
      const detail = (event as CustomEvent<ThemeChoice>).detail;
      if (detail === "light" || detail === "dark" || detail === "system") setChoice(detail);
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener(THEME_EVENT, onChoice);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener(THEME_EVENT, onChoice);
    };
  }, []);

  const pick = (next: ThemeChoice) => {
    setChoice(next);
    setThemeChoice(next);
  };

  return (
    <div
      role="group"
      aria-label={t("footer.theme-label", "Mode tampilan")}
      className="inline-flex max-w-full flex-wrap items-center gap-1 overflow-hidden rounded-full border border-on-dark/25 p-1"
    >
      {OPTIONS.map((option) => {
        const active = choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => pick(option.value)}
            aria-pressed={active}
            title={t(option.labelKey, option.fallback)}
            className={[
              "inline-flex min-h-[32px] items-center gap-1.5 overflow-hidden rounded-full px-2.5 text-[12px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime",
              active ? "bg-lime text-on-light" : "text-on-dark/70 hover:text-on-dark",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined w-4 shrink-0 overflow-hidden text-[16px]"
            >
              {option.icon}
            </span>
            <span className="hidden sm:inline">{t(option.labelKey, option.fallback)}</span>
            <span className="sr-only sm:hidden">{t(option.labelKey, option.fallback)}</span>
          </button>
        );
      })}
    </div>
  );
}
