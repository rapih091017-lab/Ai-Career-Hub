"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import CountUp from "@/components/CountUp";

/**
 * Angka platform yang diambil dari API publik, bukan angka karangan.
 * Baris ini disembunyikan kalau datanya belum ada.
 */
export default function StatsStrip() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<{
    totalCvs: number;
    totalUsers: number;
    totalAnalyses: number;
    avgAtsScore: number;
  } | null>(null);

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

  if (!stats) return null;

  const items = [
    { value: stats.totalCvs, suffix: "+", label: t("cta.stats-cv") },
    { value: stats.totalAnalyses, suffix: "+", label: t("cta.stats-analyzed") },
    { value: stats.avgAtsScore, suffix: "%", label: t("cta.stats-avg-ats") },
    { value: stats.totalUsers, suffix: "+", label: t("cta.stats-users") },
  ];

  return (
    <section className="section-rule bg-desk py-12">
      <div className="shell">
        <dl className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <dd>
                <CountUp
                  end={item.value}
                  suffix={item.suffix}
                  className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold tabular-nums text-green-deep"
                />
              </dd>
              <dt className="mt-1 text-[13px] font-semibold text-ink-soft">{item.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
