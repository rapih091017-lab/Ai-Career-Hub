"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * Empat pintu masuk sesuai situasi pengguna, bukan empat tingkat harga.
 * Pintu gratis dibuat menonjol karena itu pintu yang paling sering dipakai.
 */

const DOORS = [
  { tag: "lp.level.d1.tag", title: "lp.level.d1.title", desc: "lp.level.d1.desc", note: "lp.level.d1.note", cta: "lp.level.d1.cta", href: "/builder/new", free: true },
  { tag: "lp.level.d2.tag", title: "lp.level.d2.title", desc: "lp.level.d2.desc", note: "lp.level.d2.note", cta: "lp.level.d2.cta", href: "/checkout?plan=cek_cv", free: false },
  { tag: "lp.level.d3.tag", title: "lp.level.d3.title", desc: "lp.level.d3.desc", note: "lp.level.d3.note", cta: "lp.level.d3.cta", href: "/checkout?plan=pro_bulanan", free: false },
  { tag: "lp.level.d4.tag", title: "lp.level.d4.title", desc: "lp.level.d4.desc", note: "lp.level.d4.note", cta: "lp.level.d4.cta", href: "/checkout?plan=paket_lamaran", free: false },
];

export default function LevelStrip() {
  const { t } = useTranslation();

  return (
    <section className="section section-rule bg-paper">
      <div className="shell">
        <h2 className="max-w-[20ch] font-display text-headline-lg font-bold text-ink">{t("lp.level.kicker")}</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DOORS.map((door) => (
            <div
              key={door.tag}
              className={[
                "grid content-start gap-2 rounded-xl p-4",
                door.free
                  ? "border-[2.5px] border-ink bg-lime shadow-hard-ink-sm"
                  : "border-2 border-dashed border-ink/40 bg-paper",
              ].join(" ")}
            >
              <p
                className={[
                  "font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em]",
                  door.free ? "text-ink" : "text-green-deep",
                ].join(" ")}
              >
                {t(door.tag)}
              </p>
              <h3 className="font-display text-[18px] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
                {t(door.title)}
              </h3>
              <p className={door.free ? "text-[14px] font-semibold text-ink" : "text-[14px] font-semibold text-ink-soft"}>
                {t(door.desc)}
              </p>
              <small className={door.free ? "mt-1 text-[12px] font-bold text-ink" : "mt-1 text-[12px] font-bold text-ink-soft"}>
                {t(door.note)}
              </small>
              <Link
                href={door.href}
                className={[
                  "mt-2 inline-flex min-h-[44px] w-fit items-center gap-2 text-[14px] font-bold underline decoration-[3px] underline-offset-4 transition-colors",
                  door.free ? "text-ink decoration-ink" : "text-ink decoration-green",
                ].join(" ")}
              >
                {t(door.cta)}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
