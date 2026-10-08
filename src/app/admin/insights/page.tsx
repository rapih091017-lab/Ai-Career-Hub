"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface InsightsData {
  funnel: { totalUsers: number; usersWithCv: number; usersWithTracker: number; usersPaid: number };
  totals: { cvs: number; checkerRuns: number; coverLetters: number };
  featureUsage: { action: string; total: number }[];
  registrations: { week: string; total: number }[];
}

const ACTION_LABELS: Record<string, string> = {
  checker_analysis: "Analisis Checker",
  cv_generation: "Generate CV (AI)",
  cv_revision: "Revisi CV (AI)",
  cover_letter: "Surat Lamaran",
  profile_import: "Import Profil",
  portfolio_suggest: "Saran Portfolio",
};

/** Admin: insight penggunaan aplikasi (funnel, aktivitas fitur, registrasi). */
export default function AdminInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/insights");
      if (response.status === 401 || response.status === 403) {
        setError("Akses ditolak. Halaman ini hanya untuk admin.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("load failed");
      setData(await response.json());
      setError(null);
    } catch {
      setError("Gagal memuat insight.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const funnel = data?.funnel;
  const maxFeature = Math.max(1, ...(data?.featureUsage ?? []).map((row) => row.total));
  const maxWeek = Math.max(1, ...(data?.registrations ?? []).map((row) => row.total));

  const funnelSteps = funnel
    ? [
        { label: "Total user", value: funnel.totalUsers },
        { label: "Punya CV", value: funnel.usersWithCv },
        { label: "Pakai job tracker", value: funnel.usersWithTracker },
        { label: "Pernah membayar", value: funnel.usersPaid },
      ]
    : [];

  return (
    <div>
      <AdminPageHeader
        icon="insights"
        title="Insight Pengguna"
        description="Funnel perjalanan user, aktivitas fitur 30 hari terakhir, dan tren registrasi 8 minggu."
      />

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
      ) : error ? (
        <p className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
          {error}
        </p>
      ) : data ? (
        <div className="space-y-6">
            {/* Funnel */}
            <section className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6">
              <h2 className="text-label-bold text-on-surface">Funnel User</h2>
              <div className="mt-4 space-y-4">
                {funnelSteps.map((step, index) => {
                  const percent = funnel && funnel.totalUsers > 0 ? Math.round((step.value / funnel.totalUsers) * 100) : 0;
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between text-label-sm">
                        <span className="text-on-surface-variant">
                          {index + 1}. {step.label}
                        </span>
                        <span className="font-semibold text-on-surface">
                          {step.value.toLocaleString("id-ID")} ({percent}%)
                        </span>
                      </div>
                      <div className="mt-1 h-3 overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.max(percent, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-outline-variant/50 pt-4">
                <div>
                  <p className="text-label-sm text-on-surface-variant">Total CV dibuat</p>
                  <p className="text-title-lg font-semibold text-on-surface">{data.totals.cvs.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Checker dijalankan</p>
                  <p className="text-title-lg font-semibold text-on-surface">{data.totals.checkerRuns.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Surat lamaran</p>
                  <p className="text-title-lg font-semibold text-on-surface">{data.totals.coverLetters.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </section>

            {/* Aktivitas fitur */}
            <section className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6">
              <h2 className="text-label-bold text-on-surface">Aktivitas Fitur (30 hari)</h2>
              {data.featureUsage.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-outline-variant px-4 py-6 text-center text-body-md text-on-surface-variant">
                  Belum ada aktivitas tercatat pada periode ini.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.featureUsage.map((row) => (
                    <div key={row.action}>
                      <div className="flex items-center justify-between text-label-sm">
                        <span className="text-on-surface-variant">{ACTION_LABELS[row.action] ?? row.action}</span>
                        <span className="font-semibold text-on-surface">{row.total.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="h-full rounded-full bg-primary/80 transition-all duration-700"
                          style={{ width: `${Math.max(Math.round((row.total / maxFeature) * 100), 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Registrasi per minggu */}
            <section className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6">
              <h2 className="text-label-bold text-on-surface">Registrasi per Minggu (8 minggu)</h2>
              {data.registrations.length === 0 ? (
                <p className="mt-3 text-body-md text-on-surface-variant">Belum ada registrasi pada periode ini.</p>
              ) : (
                <div className="mt-6 flex h-40 items-end gap-2">
                  {data.registrations.map((row) => (
                    <div key={row.week} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-label-sm font-semibold text-on-surface">{row.total}</span>
                      <div
                        className="w-full rounded-t-lg bg-primary/80 transition-all duration-700"
                        style={{ height: `${Math.max(Math.round((row.total / maxWeek) * 120), 4)}px` }}
                      />
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(row.week).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
        </div>
      ) : null}
    </div>
  );
}
