"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * Bento fitur: sembilan alat dengan lebar dan warna berbeda, bukan sembilan
 * kartu identik. Kartu lime dipakai untuk alat yang paling sering dipakai.
 */

const FEATURES = [
  {
    tag: "lp.bento.f1.tag",
    title: "lp.bento.f1.title",
    desc: "lp.bento.f1.desc",
    bullets: ["lp.bento.f1.b1", "lp.bento.f1.b2", "lp.bento.f1.b3"],
    cta: "lp.bento.f1.cta",
    href: "/builder/new",
    span: "md:col-span-3",
    tone: "paper" as const,
  },
  {
    tag: "lp.bento.f2.tag",
    title: "lp.bento.f2.title",
    desc: "lp.bento.f2.desc",
    bullets: ["lp.bento.f2.b1", "lp.bento.f2.b2", "lp.bento.f2.b3"],
    cta: "lp.bento.f2.cta",
    href: "/checker",
    span: "md:col-span-3",
    tone: "lime" as const,
  },
  {
    tag: "lp.bento.f3.tag",
    title: "lp.bento.f3.title",
    desc: "lp.bento.f3.desc",
    bullets: ["lp.bento.f3.b1", "lp.bento.f3.b2"],
    cta: "lp.bento.f3.cta",
    href: "/surat-lamaran",
    span: "md:col-span-2",
    tone: "paper" as const,
  },
  {
    tag: "lp.bento.f4.tag",
    title: "lp.bento.f4.title",
    desc: "lp.bento.f4.desc",
    bullets: ["lp.bento.f4.b1", "lp.bento.f4.b2"],
    cta: "lp.bento.f4.cta",
    href: "/portfolio",
    span: "md:col-span-2",
    tone: "paper" as const,
  },
  {
    tag: "lp.bento.f5.tag",
    title: "lp.bento.f5.title",
    desc: "lp.bento.f5.desc",
    bullets: ["lp.bento.f5.b1", "lp.bento.f5.b2"],
    cta: "lp.bento.f5.cta",
    href: "/interview",
    span: "md:col-span-2",
    tone: "paper" as const,
  },
  {
    tag: "lp.bento.f6.tag",
    title: "lp.bento.f6.title",
    desc: "lp.bento.f6.desc",
    bullets: ["lp.bento.f6.b1", "lp.bento.f6.b2"],
    cta: "lp.bento.f6.cta",
    href: "/tracker",
    span: "md:col-span-2",
    tone: "paper" as const,
  },
  {
    tag: "lp.bento.f7.tag",
    title: "lp.bento.f7.title",
    desc: "lp.bento.f7.desc",
    bullets: ["lp.bento.f7.b1", "lp.bento.f7.b2", "lp.bento.f7.b3"],
    cta: "lp.bento.f7.cta",
    href: "/career-hub",
    span: "md:col-span-3",
    tone: "paper" as const,
  },
  {
    tag: "lp.bento.f8.tag",
    title: "lp.bento.f8.title",
    desc: "lp.bento.f8.desc",
    bullets: ["lp.bento.f8.b1", "lp.bento.f8.b2"],
    cta: "lp.bento.f8.cta",
    href: "/career-path",
    span: "md:col-span-3",
    tone: "dark" as const,
  },
  {
    tag: "lp.bento.f9.tag",
    title: "lp.bento.f9.title",
    desc: "lp.bento.f9.desc",
    bullets: ["lp.bento.f9.b1", "lp.bento.f9.b2"],
    cta: "lp.bento.f9.cta",
    href: "/linkedin-optimizer",
    span: "md:col-span-3",
    tone: "paper" as const,
  },
];

export default function BentoFeatures() {
  const { t } = useTranslation();

  return (
    <section id="fitur" className="section section-rule bg-paper">
      <div className="shell">
        <div data-reveal className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-x-16">
          <div>
            <p className="kicker">{t("lp.bento.kicker")}</p>
            <h2 className="max-w-[17ch] font-display text-headline-lg font-bold text-ink">
              {t("lp.bento.title")}
            </h2>
          </div>
          <p className="max-w-[42ch] text-body-md leading-relaxed text-ink-soft md:pb-2">{t("lp.bento.lede")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-[18px] md:mt-14 md:grid-cols-6">
          {FEATURES.map((feature, index) => {
            const dark = feature.tone === "dark";
            const lime = feature.tone === "lime";
            return (
              <article
                key={feature.title}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${index * 0.06}s` }}
                className={[
                  "grid content-start gap-3 rounded-xl border-[2.5px] p-6 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5",
                  feature.span,
                  // Hanya kartu lime yang tetap terang di malam; kartu kertas
                  // dan evergreen memakai garis panel malam.
                  lime ? "border-on-light" : "border-edge",
                  dark
                    ? "bg-evergreen text-on-dark shadow-hard-ink-sm"
                    : lime
                      ? "bg-lime text-on-light shadow-hard-ink-sm"
                      : "bg-paper shadow-hard",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-fit -rotate-1 rounded-full px-3 py-1 text-[11.5px] font-bold",
                    dark ? "bg-lime text-on-light" : "bg-brand-dark text-lime",
                  ].join(" ")}
                >
                  {t(feature.tag)}
                </span>
                <h3
                  className={[
                    "font-display text-[clamp(1.25rem,1.9vw,1.625rem)] font-bold tracking-[-0.025em]",
                    dark ? "text-on-dark" : lime ? "text-on-light" : "text-ink",
                  ].join(" ")}
                >
                  {t(feature.title)}
                </h3>
                <p
                  className={[
                    "max-w-[42ch] text-[15px] leading-[1.55]",
                    dark ? "text-on-dark/75" : lime ? "text-on-light/80" : "text-ink-soft",
                  ].join(" ")}
                >
                  {t(feature.desc)}
                </p>
                <ul className="grid gap-2">
                  {feature.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className={[
                        "relative pl-5 text-[14px] font-semibold leading-[1.45]",
                        dark ? "text-on-dark/75" : lime ? "text-on-light/80" : "text-ink-soft",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          // Titik bullet memakai skala radius tema; versi 2px
                          // membuat kotak setengah bulat yang tidak ada di skala.
                          "absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full",
                          dark ? "bg-lime" : lime ? "bg-brand-dark" : "bg-green",
                        ].join(" ")}
                      />
                      {t(bullet)}
                    </li>
                  ))}
                </ul>
                <Link
                  href={feature.href}
                  className={[
                    "mt-1 inline-flex w-fit items-center gap-2 text-[14px] font-bold underline decoration-[3px] underline-offset-4 transition-colors",
                    dark
                      ? "text-lime decoration-lime hover:text-on-dark"
                      : lime
                        ? "text-on-light decoration-on-light hover:text-on-light/80"
                        : "text-green-deep decoration-green hover:text-ink",
                  ].join(" ")}
                >
                  {t(feature.cta)}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
