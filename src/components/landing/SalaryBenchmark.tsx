"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * Kisaran gaji per level.
 *
 * Angkanya gabungan dari peta jalur karier di /career-path (guru, perawat,
 * staf administrasi, staf logistik, IT support, social media specialist),
 * bukan angka karangan dan bukan klaim rata-rata nasional. Rincian per
 * posisi tetap di halaman jalur karier, jadi section ini hanya memberi
 * patokan kasar sebelum orang membuka halaman itu.
 */

const LEVELS = [
  {
    name: "lp.bench.l1.name",
    years: "lp.bench.l1.years",
    range: "Rp3–6",
    note: "lp.bench.l1.note",
    accent: false,
  },
  {
    name: "lp.bench.l2.name",
    years: "lp.bench.l2.years",
    range: "Rp4,5–10",
    note: "lp.bench.l2.note",
    accent: false,
  },
  {
    name: "lp.bench.l3.name",
    years: "lp.bench.l3.years",
    range: "Rp7–20",
    note: "lp.bench.l3.note",
    accent: true,
  },
];

export default function SalaryBenchmark() {
  const { t } = useTranslation();

  return (
    <section id="benchmark-gaji" className="section section-rule bg-paper">
      <div className="shell">
        <div
          data-reveal
          className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-x-16"
        >
          <div>
            <p className="kicker">{t("lp.bench.kicker")}</p>
            <h2 className="max-w-[20ch] font-display text-headline-lg font-bold text-ink">
              {t("lp.bench.title")}
            </h2>
          </div>
          <p className="max-w-[42ch] text-body-md leading-relaxed text-ink-soft md:pb-2">
            {t("lp.bench.lede")}
          </p>
        </div>

        <ul className="mt-10 grid gap-5 md:mt-12 md:grid-cols-3">
          {LEVELS.map((level, index) => {
            // Kartu lime tetap terang di mode gelap, jadi teksnya memakai
            // pasangan tetap `on-light`. Token `ink` ikut berbalik jadi terang
            // di mode gelap dan akan hilang di atas lime.
            const ink = level.accent ? "text-on-light" : "text-ink";
            const soft = level.accent ? "text-on-light" : "text-ink-soft";

            return (
              <li
                key={level.range}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${index * 0.08}s` }}
                className={[
                  "card-hard flex flex-col p-6 md:p-7",
                  level.accent ? "bg-lime" : "bg-desk",
                ].join(" ")}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className={`font-display text-[18px] font-bold leading-[1.15] tracking-[-0.02em] ${ink}`}
                  >
                    {t(level.name)}
                  </h3>
                  <span
                    className={`font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em] ${soft}`}
                  >
                    {t(level.years)}
                  </span>
                </div>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span
                    className={`font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold leading-none tabular-nums tracking-[-0.03em] ${ink}`}
                  >
                    {level.range}
                  </span>
                  <span className={`text-[13px] font-bold ${soft}`}>
                    {t("lp.bench.unit")}
                  </span>
                </p>

                <p className={`mt-3 text-[14px] leading-relaxed ${soft}`}>
                  {t(level.note)}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[62ch] text-[13px] leading-relaxed text-ink-soft">
            {t("lp.bench.disclaimer")}
          </p>
          <Link
            href="/career-path"
            className="inline-flex min-h-[44px] w-fit shrink-0 items-center gap-2 text-[14px] font-bold text-green-deep underline decoration-green decoration-[3px] underline-offset-4 transition-colors hover:text-ink"
          >
            {t("lp.bench.cta")}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
