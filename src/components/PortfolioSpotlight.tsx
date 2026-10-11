"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

const THEMES = [
  { name: "Modern Slate", dot: "#1e293b", accent: "#0ea5e9" },
  { name: "Minimal Dark", dot: "#0f172a", accent: "#2563eb" },
  { name: "Modern Blue", dot: "#0891b2", accent: "#0284c7" },
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
    <section id="portfolio-spotlight" className="relative overflow-hidden bg-surface-container-lowest px-margin-mobile py-20 md:px-gutter md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Teks */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-wider text-primary">
            <span className="material-symbols-outlined text-[14px]" aria-hidden>grid_view</span>
            {t("portfolio.spot.badge")}
          </span>
          <h2 className="font-headline-lg text-on-background">{t("portfolio.spot.title")}</h2>
          <p className="mt-4 max-w-xl text-body-lg text-on-surface-variant">{t("portfolio.spot.desc")}</p>
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
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>{bullet.icon}</span>
                </span>
                <span className="text-body-md text-on-surface">{bullet.text}</span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-10">
            <Link
              href="/portfolio/build"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 font-label-bold text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
            >
              {t("portfolio.spot.cta")}
              <span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_forward</span>
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
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-premium-md md:p-8">
            <p className="mb-4 text-label-sm text-outline">{t("portfolio.spot.preview-label")}</p>
            {/* Mini hero portfolio */}
            <div className="rounded-xl border border-outline-variant/40 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 text-white md:p-8">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" aria-hidden />
                Rizki Firmansyah
              </div>
              <p className="mt-3 font-display text-xl leading-tight md:text-2xl">{t("portfolio.spot.sample-title")}</p>
              <p className="mt-2 text-xs text-white/60">{t("portfolio.spot.sample-sub")}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Projects", "Skills", "Contact"].map((chip) => (
                  <span key={chip} className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium">{chip}</span>
                ))}
              </div>
            </div>
            {/* Tema */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {THEMES.map((theme) => (
                <div key={theme.name} className="rounded-lg border border-outline-variant/40 p-3 text-center">
                  <span className="mx-auto mb-2 block h-6 w-6 rounded-full" style={{ backgroundColor: theme.dot }} aria-hidden />
                  <span className="block h-1.5 w-8 mx-auto rounded-full mb-1.5" style={{ backgroundColor: theme.accent, opacity: 0.7 }} aria-hidden />
                  <p className="text-xs font-medium text-on-surface-variant">{theme.name}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-outline">{t("portfolio.spot.sample-note")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
