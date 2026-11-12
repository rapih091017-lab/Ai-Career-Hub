"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * Tiga langkah jalur utama: cek CV, perbaiki di builder, unduh PDF.
 * Alat lain yang memakai data CV yang sama cukup jadi satu baris tautan di
 * bawahnya, supaya landing tidak perlu section fitur terpisah.
 * Nomor langkah pakai mono kecil, sesuai aturan tipografi tema.
 */

const STEPS = [
  {
    title: "lp.steps.n1.title",
    sub: "lp.steps.n1.sub",
    desc: "lp.steps.n1.desc",
    cta: "lp.steps.n1.cta",
    href: "/checker",
  },
  {
    title: "lp.steps.n2.title",
    sub: "lp.steps.n2.sub",
    desc: "lp.steps.n2.desc",
    cta: "lp.steps.n2.cta",
    href: "/builder/new",
  },
  {
    title: "lp.steps.n3.title",
    sub: "lp.steps.n3.sub",
    desc: "lp.steps.n3.desc",
    cta: "lp.steps.n3.cta",
    href: "/surat-lamaran",
  },
];

const MORE = [
  { label: "lp.steps.more.letter", href: "/surat-lamaran" },
  { label: "lp.steps.more.portfolio", href: "/portfolio" },
  { label: "lp.steps.more.interview", href: "/interview" },
  { label: "lp.steps.more.tracker", href: "/tracker" },
  { label: "lp.steps.more.linkedin", href: "/linkedin-optimizer" },
];

export default function CaraKerja() {
  const { t } = useTranslation();

  return (
    <section id="cara-kerja" className="section section-rule bg-desk">
      <div className="shell">
        <div data-reveal className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-x-16">
          <div>
            <p className="kicker">{t("lp.steps.kicker")}</p>
            <h2 className="max-w-[20ch] font-display text-headline-lg font-bold text-ink">
              {t("lp.steps.title")}
            </h2>
          </div>
          <p className="max-w-[40ch] text-body-md leading-relaxed text-ink-soft md:pb-2">
            {t("lp.steps.lede")}
          </p>
        </div>

        <ol className="mt-10 grid gap-5 md:mt-14 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              data-reveal
              style={{ ["--reveal-delay" as string]: `${index * 0.08}s` }}
              className="card-hard flex flex-col bg-paper p-6 md:p-7"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-dark px-3 py-1 font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-lime">
                  {t("lp.steps.side-title")} {index + 1}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
              </div>
              <h3 className="mt-4 font-display text-headline-md font-bold text-ink">{t(step.title)}</h3>
              <p className="mt-1 font-display text-[15px] font-bold text-green-deep">{t(step.sub)}</p>
              <p className="mt-3 max-w-[46ch] flex-1 text-[15px] leading-relaxed text-ink-soft">{t(step.desc)}</p>
              <Link
                href={step.href}
                className="mt-5 inline-flex min-h-[44px] w-fit items-center gap-2 text-[14px] font-bold text-green-deep underline decoration-green decoration-[3px] underline-offset-4 transition-colors hover:text-ink"
              >
                {t(step.cta)}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </li>
          ))}
        </ol>

        <div data-reveal className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-[14px] font-bold text-ink">{t("lp.steps.more-title")}:</p>
          <ul className="flex flex-wrap gap-2">
            {MORE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-[40px] items-center rounded-full border-[1.5px] border-ink/30 bg-paper px-3.5 text-[13.5px] font-bold text-ink transition-colors hover:border-ink hover:bg-lime hover:text-on-light"
                >
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
