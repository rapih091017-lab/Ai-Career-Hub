"use client";

import { useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";
import { RESUME_SYNONYMS } from "@/data/resume-synonyms";

/**
 * Halaman publik (tanpa login) berisi daftar kurasi frasa CV yang lemah dan
 * penggantinya. Klik pengganti untuk menyalin ke clipboard.
 */
export default function SinonimPage() {
  const { t, lang } = useTranslation();
  const { addToast } = useToast();
  const [query, setQuery] = useState("");

  const entries = RESUME_SYNONYMS[lang === "en" ? "en" : "id"];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (entry) =>
        entry.weak.toLowerCase().includes(q) ||
        entry.alternatives.some((alt) => alt.toLowerCase().includes(q)),
    );
  }, [entries, query]);

  const handleCopy = async (word: string) => {
    try {
      await navigator.clipboard.writeText(word);
      addToast({ type: "success", message: t("sinonim.copied") });
    } catch {
      addToast({ type: "error", message: t("sinonim.copy-failed") });
    }
  };

  const tips = [t("sinonim.tip-1"), t("sinonim.tip-2"), t("sinonim.tip-3")];

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <AppHeader />

      <main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter">
        <div className="mx-auto max-w-[900px]">
          <section className="mb-8 text-center">
            <h1 className="mb-2 font-headline-lg text-headline-lg text-on-background">{t("sinonim.title")}</h1>
            <p className="mx-auto max-w-[560px] text-body-md text-on-surface-variant">{t("sinonim.subtitle")}</p>
            <p className="mt-2 text-label-sm text-on-surface-variant/80">
              {t("sinonim.count").replace("{n}", String(entries.length))}
            </p>
          </section>

          <div className="relative mb-6">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
              aria-hidden
            >
              search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("sinonim.search-placeholder")}
              className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-10 pr-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-outline-variant px-4 py-10 text-center text-body-md text-on-surface-variant">
              {t("sinonim.empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((entry) => (
                <li
                  key={entry.weak}
                  className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-label-bold text-on-surface-variant line-through decoration-error/50">
                      {entry.weak}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
                      arrow_forward
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.alternatives.map((alt) => (
                        <button
                          key={alt}
                          type="button"
                          onClick={() => handleCopy(alt)}
                          title={t("sinonim.copy")}
                          className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-label-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98]"
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <section className="mt-12">
            <h2 className="mb-4 font-headline-md text-headline-md text-on-background">{t("sinonim.tips-title")}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-outline-variant/70 bg-surface-container-low p-4 text-body-md text-on-surface-variant"
                >
                  {tip}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <AppFooter bordered />
    </div>
  );
}
