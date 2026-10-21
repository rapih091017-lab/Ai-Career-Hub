"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

const THEMES = [
  { name: "Glassmorphism", swatch: "#f3f6f2" },
  { name: "Neo Brutal", swatch: "#0a0f0d" },
  { name: "Editorial Luxe", swatch: "#122922" },
  { name: "Minimalist", swatch: "#d6ee30" },
];

/** Spotlight satu fitur: Portfolio Web. Split layout, preview tipografis
 * berlabel contoh, bukan fake screenshot. */
export default function PortfolioSpotlight() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  const bullets = [
    { icon: "palette", text: t("portfolio.spot.b1") },
    { icon: "link", text: t("portfolio.spot.b2") },
    { icon: "auto_awesome", text: t("portfolio.spot.b3") },
    { icon: "smartphone", text: t("portfolio.spot.b4") },
  ];

  return (
    <section id="portfolio-spotlight" className="section section-rule bg-desk">
      <div className="shell grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Teks */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="kicker">{t("portfolio.spot.badge")}</p>
          <h2 className="max-w-[17ch] font-display text-headline-lg font-bold text-ink">
            {t("portfolio.spot.title")}
          </h2>
          <p className="mt-4 max-w-[46ch] text-body-lg text-ink-soft">{t("portfolio.spot.desc")}</p>
          <ul className="mt-8 space-y-4">
            {bullets.map((bullet, index) => (
              <motion.li
                key={bullet.text}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border-2 border-ink bg-lime">
                  <span className="material-symbols-outlined text-[18px] text-ink" aria-hidden>
                    {bullet.icon}
                  </span>
                </span>
                <span className="text-body-md text-ink">{bullet.text}</span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-10">
            <Link
              href="/portfolio/build"
              className="inline-flex min-h-[54px] items-center gap-2 rounded-full border-[2.5px] border-ink bg-lime px-7 font-display text-[15.5px] font-bold text-on-light shadow-[0_4px_0_rgb(var(--c-ink))] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {t("portfolio.spot.cta")}
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                arrow_forward
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Visual: mini-preview tipografis berlabel contoh */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard md:p-8">
            <p className="mb-4 font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-ink-soft">
              {t("portfolio.spot.preview-label")}
            </p>
            {/* Mini hero portfolio */}
            <div className="rounded-xl border-2 border-ink bg-evergreen p-6 text-on-dark md:p-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-dark/60">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden />
                Rizki Firmansyah
              </div>
              <p className="mt-3 font-display text-xl leading-tight md:text-2xl">{t("portfolio.spot.sample-title")}</p>
              <p className="mt-2 text-xs text-on-dark/60">{t("portfolio.spot.sample-sub")}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Projects", "Skills", "Contact"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-md border border-lime/40 px-2.5 py-1 text-xs font-semibold text-lime"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            {/* Tema */}
            <div className="mt-5 grid grid-cols-4 gap-3">
              {THEMES.map((theme) => (
                <div key={theme.name} className="rounded-lg border-2 border-ink/20 bg-paper p-3 text-center">
                  <span
                    className="mx-auto mb-2 block h-6 w-6 rounded-full border-2 border-ink"
                    style={{ backgroundColor: theme.swatch }}
                    aria-hidden
                  />
                  <p className="text-[11px] font-bold text-ink-soft">{theme.name}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-soft">{t("portfolio.spot.sample-note")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
