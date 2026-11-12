"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import CountUp from "@/components/CountUp";

/**
 * Angka platform yang diambil dari API publik, bukan angka karangan.
 * Tiap angka tampil hanya bila melewati ambang; bila kurang dari dua yang
 * lolos, seluruh baris disembunyikan. Rata-rata skor tidak ditampilkan
 * karena terbaca sebagai klaim ATS.
 */
/** Ambang minimum tiap angka sebelum layak ditampilkan. Angka kecil lebih
 * merugikan daripada tidak ada angka sama sekali. */
export const STATS_THRESHOLDS = { users: 500, cvs: 1000, analyses: 1000 } as const;

export interface PublicStats {
  totalCvs: number;
  totalUsers: number;
  totalAnalyses: number;
}

/** Item yang lolos ambang; kosong bila kurang dari dua yang lolos. */
export function visibleStats(stats: PublicStats): { key: "cvs" | "analyses" | "users"; value: number }[] {
  const items = [
    { key: "cvs" as const, value: Number(stats.totalCvs) || 0 },
    { key: "analyses" as const, value: Number(stats.totalAnalyses) || 0 },
    { key: "users" as const, value: Number(stats.totalUsers) || 0 },
  ].filter((item) => item.value >= STATS_THRESHOLDS[item.key]);
  return items.length >= 2 ? items : [];
}

const LABELS = { cvs: "cta.stats-cv", analyses: "cta.stats-analyzed", users: "cta.stats-users" } as const;

export default function StatsStrip() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/public/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setStats(d);
      })
      .catch(() => {
        /* biarkan null, baris disembunyikan */
      });
    return () => {
      active = false;
    };
  }, []);

  const items = stats ? visibleStats(stats) : [];
  if (items.length === 0) return null;

  return (
    <section className="section-rule bg-desk py-12">
      <div className="shell">
        <dl className={`grid grid-cols-2 gap-y-8 ${items.length === 3 ? "md:grid-cols-3" : ""}`}>
          {items.map((item) => (
            <div key={item.key} className="text-center">
              <dd>
                <CountUp
                  end={item.value}
                  suffix="+"
                  className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold tabular-nums text-green-deep"
                />
              </dd>
              <dt className="mt-1 text-[13px] font-semibold text-ink-soft">{t(LABELS[item.key])}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
