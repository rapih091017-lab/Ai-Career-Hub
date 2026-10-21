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
export default function ThemeToggle({ variant = "group" }: { variant?: "group" | "icon" }) {
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
    // Saklar lain (header/footer) memberi tahu instance ini supaya ikon dan
    // label tidak berbeda dari tema yang sedang tampil.
    const onChoice = (event: Event) => {
      const detail = (event as CustomEvent<Choice>).detail;
      if (detail === "light" || detail === "dark" || detail === "system") setChoice(detail);
    };
    media.addEventListener("change", onChange);
    window.addEventListener("themechange", onChoice);
    return () => {
      media.removeEventListener("change", onChange);
      window.removeEventListener("themechange", onChoice);
    };
  }, []);

  const pick = (next: Choice) => {
    setChoice(next);
    localStorage.setItem("theme", next);
    apply(next);
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  };

  const current = OPTIONS.find((option) => option.value === choice) ?? OPTIONS[2];
  const currentLabel = t(current.labelKey, current.fallback);

  if (variant === "icon") {
    // Tombol tunggal untuk header: klik bergiliran terang → gelap → sistem.
    const nextOption = OPTIONS[(OPTIONS.indexOf(current) + 1) % OPTIONS.length];
    return (
      <button
        type="button"
        onClick={() => pick(nextOption.value)}
        title={`${t("footer.theme-label", "Mode tampilan")}: ${currentLabel}`}
        aria-label={`${t("footer.theme-label", "Mode tampilan")}: ${currentLabel}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
          {current.icon}
        </span>
      </button>
    );
  }

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
