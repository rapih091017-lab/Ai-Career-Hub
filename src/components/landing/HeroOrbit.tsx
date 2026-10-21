"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { ANNOUNCEMENT } from "@/lib/nav-items";

/**
 * Hero sesuai tema Evergreen + Lime.
 *
 * Latar gelap evergreen, aksen lime, grid tipis yang bergeser perlahan
 * (motif dokumen yang dipindai mesin). Kartu orbit miring sedikit supaya
 * halaman tidak terasa seperti grid yang terlalu rapi.
 *
 * Hero memakai permukaan `bg-evergreen` bertema tetap, jadi teksnya
 * memakai pasangan `on-dark` dan tetap terbaca di mode terang maupun gelap.
 */

const NODES = [
  {
    href: "/builder/new",
    tag: "lp.node-1.tag",
    title: "lp.node-1.title",
    desc: "lp.node-1.desc",
    cta: "lp.node-1.cta",
    rot: "-2.5deg",
    delay: "0.45s",
    tone: "paper" as const,
  },
  {
    href: "/checker",
    tag: "lp.node-2.tag",
    title: "lp.node-2.title",
    desc: "lp.node-2.desc",
    cta: "lp.node-2.cta",
    rot: "1.8deg",
    delay: "0.6s",
    tone: "lime" as const,
  },
  {
    href: "/surat-lamaran",
    tag: "lp.node-3.tag",
    title: "lp.node-3.title",
    desc: "lp.node-3.desc",
    cta: "lp.node-3.cta",
    rot: "-1.4deg",
    delay: "0.75s",
    tone: "paper" as const,
  },
  {
    href: "/portfolio",
    tag: "lp.node-4.tag",
    title: "lp.node-4.title",
    desc: "lp.node-4.desc",
    cta: "lp.node-4.cta",
    rot: "2.6deg",
    delay: "0.9s",
    tone: "paper" as const,
  },
];

export default function HeroOrbit() {
  const { t } = useTranslation();

  return (
    <header id="hero" className="relative overflow-hidden bg-evergreen text-on-dark">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#d6ee30 1px, transparent 1px), linear-gradient(90deg, #d6ee30 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(900px 420px at 78% -60px, rgba(214,238,48,0.16), transparent 70%)" }}
      />

      <div className="shell relative pb-16 pt-28 md:pb-24 md:pt-36">
        <Link
          href={ANNOUNCEMENT.href}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-lime/40 bg-evergreen/80 px-4 py-1.5 text-[12px] font-bold text-lime transition-colors hover:border-lime"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            campaign
          </span>
          {t(ANNOUNCEMENT.textKey, ANNOUNCEMENT.text)}
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            arrow_forward
          </span>
        </Link>

        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="lg:-rotate-2 lg:origin-left">
            <p className="flex items-center gap-3 text-[11.5px] font-bold tracking-wide text-lime">
              {t("lp.hero.eyebrow")}
              <span aria-hidden="true" className="inline-block h-0.5 w-8 bg-lime" />
            </p>

            <h1
              className="mt-5 font-display font-bold text-on-dark"
              style={{ fontSize: "clamp(2.5rem, 4.6vw, 4rem)", lineHeight: 1.04, letterSpacing: "-0.03em" }}
            >
              <span className="block">{t("lp.hero.title-a")}</span>
              <span className="block text-lime">
                {t("lp.hero.title-b")},
              </span>
              <span className="block">{t("lp.hero.title-c")}</span>
            </h1>

            <p className="mt-5 max-w-[50ch] text-[16.5px] leading-relaxed text-on-dark/70">
              {t("lp.hero.intro")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/builder/new"
                className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-full border-[3px] border-ink bg-lime px-6 font-display text-[15.5px] font-bold text-on-light shadow-[4px_4px_0_rgb(var(--c-ink))] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgb(var(--c-ink))]"
              >
                {t("lp.hero.cta-primary")}
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/checker"
                className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-bold text-on-dark underline decoration-lime decoration-[3px] underline-offset-[5px] transition-colors hover:text-lime"
              >
                {t("lp.hero.cta-secondary")}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <p className="mt-5 text-[13px] font-semibold leading-relaxed text-on-dark/70">
              {t("lp.hero.proof")} <span className="font-bold text-lime">{t("lp.hero.proof-strong")}</span>
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {["lp.hero.chip-1", "lp.hero.chip-2", "lp.hero.chip-3", "lp.hero.chip-4"].map((key) => (
                <li
                  key={key}
                  className="rounded-full border-[1.5px] border-dashed border-lime/60 px-3 py-1 font-script text-[17px] font-semibold text-on-dark/80"
                >
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 items-start gap-x-8 gap-y-10">
            {NODES.map((node) => (
              <article
                key={node.tag}
                className={[
                  "rounded-xl border-2 border-ink p-3 shadow-[4px_5px_rgba(10,15,13,0.55)] animate-ach-node-in",
                  node.tone === "lime" ? "bg-lime" : "bg-paper text-ink",
                ].join(" ")}
                style={{ ["--node-rot" as string]: node.rot, animationDelay: node.delay }}
              >
                <span className="mb-2 inline-block rounded-full bg-brand-dark px-2 py-1 text-[11px] font-bold text-lime">
                  {t(node.tag)}
                </span>
                <h2
                  className={[
                    "font-display text-[13px] font-bold leading-tight",
                    node.tone === "lime" ? "text-on-light" : "text-ink",
                  ].join(" ")}
                >
                  {t(node.title)}
                </h2>
                <p
                  className={[
                    "mt-2 text-[11.5px] font-semibold leading-[1.45]",
                    node.tone === "lime" ? "text-on-light/80" : "text-ink-soft",
                  ].join(" ")}
                >
                  {t(node.desc)}
                </p>
                <Link
                  href={node.href}
                  className="mt-3 inline-flex items-center rounded-[6px] border-2 border-ink bg-brand-dark px-2.5 py-1.5 text-[11px] font-bold text-lime shadow-[2px_2px_rgba(10,15,13,0.35)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  {t(node.cta)}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
