"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

type Choice = "light" | "dark" | "system";

const OPTIONS: { value: Choice; icon: string; labelKey: string; fallback: string }[] = [
  { value: "light", icon: "light_mode", labelKey: "footer.theme-light", fallback: "Terang" },
  { value: "dark", icon: "dark_mode", labelKey: "footer.theme-dark", fallback: "Gelap" },
  { value: "system", icon: "brightness_auto", labelKey: "footer.theme-system", fallback: "Sistem" },
];

function apply(choice: Choice) {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = choice === "system" ? (systemDark ? "dark" : "light") : choice;
  root.dataset.theme = theme;
  root.dataset.themeChoice = choice;
  root.style.colorScheme = theme;
}

/**
 * Pemilih tema tiga keadaan. `sistem` mengikuti preferensi OS dan ikut
 * berubah saat OS berganti; `terang`/`gelap` memaksa satu tema dan disimpan
 * di localStorage supaya bertahan setelah reload.
 */
export default function ThemeToggle() {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const initial: Choice = saved === "light" || saved === "dark" ? saved : "system";
    setChoice(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem("theme") ?? "system") === "system") apply("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const pick = (next: Choice) => {
    setChoice(next);
    localStorage.setItem("theme", next);
    apply(next);
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
              "inline-flex min-h-[32px] items-center gap-1.5 overflow-hidden rounded-full px-2.5 text-[12px] font-bold transition-colors",
              active
                ? "bg-lime text-on-light"
                : "text-on-dark/70 hover:text-on-dark",
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
