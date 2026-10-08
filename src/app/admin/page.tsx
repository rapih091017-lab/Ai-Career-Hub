"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminBtnSecondary, adminCardClass, adminSectionTitleClass } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";

/* ── Types ── */

interface TodayStats {
  activeUsers: number;
  newRegistrations: number;
  cvsCreated: number;
  revenue: number;
  checkerUsage: number;
}

interface TrendDay {
  date: string;
  registrations: number;
  cvsCreated: number;
  revenue: number;
  checkerUsage: number;
}

interface PackageSale {
  packageType: string;
  sales: number;
  revenue: number;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  status: string;
  createdAt: string;
}

interface TransactionItem {
  id: string;
  orderId: string;
  packageType: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Totals {
  users: number;
  cvs: number;
  revenue: number;
  checkerChecks: number;
}

interface StatsResponse {
  today: TodayStats;
  trends: TrendDay[];
  packageSales: PackageSale[];
  recentUsers: UserItem[];
  recentTransactions: TransactionItem[];
  totals: Totals;
}

/* ── Helpers ── */

const formatPrice = (price: number) => "Rp " + price.toLocaleString("id-ID");

const formatDate = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PAYMENT_LABELS: Record<string, string> = {
  settlement: "Lunas",
  success: "Sukses",
  pending: "Pending",
  failure: "Gagal",
  expired: "Kadaluarsa",
  deny: "Ditolak",
};

const STATUS_COLORS: Record<string, string> = {
  settlement: "bg-emerald-500/10 text-emerald-700",
  success: "bg-emerald-500/10 text-emerald-700",
  pending: "bg-amber-500/10 text-amber-700",
  failure: "bg-error-container/60 text-on-error-container",
  expired: "bg-surface-container text-on-surface-variant",
  deny: "bg-error-container/60 text-on-error-container",
};

const PACKAGE_LABELS: Record<string, string> = {
  premium_pass_30d: "Premium Pass",
  single_cv: "Single CV",
  bundle_hemat: "Bundle Hemat",
  cv_starter: "CV Starter",
  cv_ai_generate: "CV AI Generate",
  cv_analyzer: "CV Analyzer",
  portfolio_web: "Portfolio Web",
};

const EXPORTS = [
  { type: "revenue", label: "Revenue CSV", icon: "payments" },
  { type: "users", label: "Users CSV", icon: "group" },
  { type: "trends", label: "Trends CSV (30 hari)", icon: "trending_up" },
];

/* ── Component ── */

/**
 * Ringkasan panel admin.
 *
 * Dulu halaman ini menampung dua tab (Dashboard + Package) sekaligus menjadi
 * pusat navigasi lewat deretan tombol di header. Sekarang fokus hanya pada
 * ringkasan; navigasi ditangani sidebar dan pengelolaan paket punya rute sendiri.
 */
export default function AdminDashboardPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        setError(response.status === 403 ? "Akses ditolak. Hanya admin." : "Gagal memuat statistik.");
        return;
      }
      setStats(await response.json());
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /** Tutup dropdown export dengan klik di luar atau tombol Escape. */
  useEffect(() => {
    if (!exportOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) setExportOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [exportOpen]);

  const handleExport = async (type: string) => {
    setExporting(type);
    setExportOpen(false);
    try {
      const response = await fetch(`/api/admin/export?type=${type}`);
      if (!response.ok) {
        addToast({ type: "error", message: "Gagal export data." });
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      anchor.download = match ? match[1] : `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      addToast({ type: "success", message: `Export ${type} berhasil diunduh.` });
    } catch {
      addToast({ type: "error", message: "Gagal mengunduh data." });
    } finally {
      setExporting(null);
    }
  };

  const approveUser = async (user: UserItem) => {
    try {
      const response = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        addToast({ type: "success", message: data?.message || "User diaktifkan." });
        fetchStats();
      } else {
        addToast({ type: "error", message: data?.message || "Gagal approve." });
      }
    } catch {
      addToast({ type: "error", message: "Gagal menghubungi server." });
    }
  };

  return (
    <div>
      <AdminPageHeader
        icon="dashboard"
        title="Ringkasan"
        description={
          stats
            ? `${stats.totals.users.toLocaleString("id-ID")} user · ${formatPrice(stats.totals.revenue)} total pendapatan`
            : "Pantau aktivitas platform hari ini dan tren terbaru."
        }
        actions={
          <>
            <div className="relative" ref={exportRef}>
              <button
                type="button"
                onClick={() => setExportOpen((open) => !open)}
                disabled={!!exporting}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                className={adminBtnSecondary}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${exporting ? "animate-spin" : ""}`}
                  aria-hidden="true"
                >
                  {exporting ? "sync" : "download"}
                </span>
                {exporting ? `Export ${exporting}...` : "Export"}
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  expand_more
                </span>
              </button>

              {exportOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-[70] mt-2 min-w-[210px] overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-premium-md"
                >
                  {EXPORTS.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      role="menuitem"
                      onClick={() => handleExport(item.type)}
                      disabled={exporting === item.type}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-body-md text-on-surface transition-colors duration-200 hover:bg-surface-container-low disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden="true">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={fetchStats}
              disabled={loading}
              aria-label="Muat ulang statistik"
              className={`${adminBtnSecondary} px-3`}
            >
              <span
                className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                refresh
              </span>
            </button>
          </>
        }
      />

      {loading && !stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className={`${adminCardClass} animate-pulse`}>
                <div className="mb-3 h-3 w-16 rounded bg-surface-container-high" />
                <div className="mb-2 h-7 w-20 rounded bg-surface-container-high" />
                <div className="h-2.5 w-12 rounded bg-surface-container-high" />
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
        </div>
      ) : error && !stats ? (
        <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error-container/40 p-4">
          <span className="material-symbols-outlined text-error" aria-hidden="true">
            error
          </span>
          <p className="text-body-md text-on-error-container">{error}</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {error ? (
            <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error-container/40 p-4">
              <span className="material-symbols-outlined text-error" aria-hidden="true">
                error
              </span>
              <p className="text-body-md text-on-error-container">{error}</p>
            </div>
          ) : null}

          {/* Kartu hari ini */}
          <section aria-label="Statistik hari ini" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard
              icon="group"
              iconBg="bg-primary-fixed"
              iconColor="text-primary"
              label="User Aktif"
              value={stats.today.activeUsers}
              sub="Pengguna unik hari ini"
            />
            <StatCard
              icon="person_add"
              iconBg="bg-emerald-500/10"
              iconColor="text-emerald-700"
              label="Registrasi Baru"
              value={stats.today.newRegistrations}
              sub="Hari ini"
            />
            <StatCard
              icon="description"
              iconBg="bg-sky-500/10"
              iconColor="text-sky-700"
              label="CV Dibuat"
              value={stats.today.cvsCreated}
              sub="Hari ini"
            />
            <StatCard
              icon="payments"
              iconBg="bg-amber-500/10"
              iconColor="text-amber-700"
              label="Pendapatan"
              value={formatPrice(stats.today.revenue)}
              sub="Hari ini"
            />
            <StatCard
              icon="fact_check"
              iconBg="bg-purple-500/10"
              iconColor="text-purple-700"
              label="Cek ATS"
              value={stats.today.checkerUsage}
              sub="Hari ini"
            />
          </section>

          {/* Tren 7 hari */}
          <section className={adminCardClass}>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                  trending_up
                </span>
                <h2 className={adminSectionTitleClass}>Aktivitas 7 Hari Terakhir</h2>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-label-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" /> Registrasi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" aria-hidden="true" /> CV
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true" /> Pendapatan
                </span>
              </div>
            </div>

            <div className="flex h-44 items-end gap-2" aria-hidden="true">
              {stats.trends.map((day, index) => {
                const maxValue = Math.max(
                  ...stats.trends.map((item) => Math.max(item.registrations, item.cvsCreated, item.revenue || 0)),
                  1,
                );
                const label = new Date(day.date).toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                });
                return (
                  <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.revenue / maxValue) * 100}%` }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="w-full max-w-[32px] rounded-t-sm bg-amber-400/70"
                      title={`Pendapatan: ${formatPrice(day.revenue)}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.cvsCreated / maxValue) * 100}%` }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                      className="w-full max-w-[32px] rounded-t-sm bg-sky-500/70"
                      title={`CV: ${day.cvsCreated}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.registrations / maxValue) * 100}%` }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="w-full max-w-[32px] rounded-t-sm bg-primary/80"
                      title={`Registrasi: ${day.registrations}`}
                    />
                    <span className="mt-1 w-full truncate text-center text-[10px] text-on-surface-variant">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Alternatif tabel untuk pembaca layar */}
            <table className="sr-only">
              <caption>Aktivitas 7 hari terakhir</caption>
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Registrasi</th>
                  <th scope="col">CV dibuat</th>
                  <th scope="col">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {stats.trends.map((day) => (
                  <tr key={day.date}>
                    <th scope="row">{formatDate(day.date)}</th>
                    <td>{day.registrations}</td>
                    <td>{day.cvsCreated}</td>
                    <td>{formatPrice(day.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Penjualan paket */}
            <section className={adminCardClass}>
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                  shopping_bag
                </span>
                <h2 className={adminSectionTitleClass}>Penjualan Paket</h2>
              </div>

              {stats.packageSales.length === 0 ? (
                <p className="py-8 text-center text-body-md text-on-surface-variant">Belum ada penjualan.</p>
              ) : (
                <div className="space-y-3">
                  {stats.packageSales.map((sale) => {
                    const total = stats.packageSales.reduce((sum, item) => sum + item.sales, 0);
                    const percent = total > 0 ? (sale.sales / total) * 100 : 0;
                    return (
                      <div key={sale.packageType}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-body-md">
                          <span className="font-semibold text-on-surface">
                            {PACKAGE_LABELS[sale.packageType] || sale.packageType}
                          </span>
                          <span className="text-on-surface-variant">
                            {sale.sales}× · <span className="font-semibold text-on-surface">{formatPrice(sale.revenue)}</span>
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Transaksi terbaru */}
            <section className={adminCardClass}>
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                  receipt_long
                </span>
                <h2 className={adminSectionTitleClass}>Transaksi Terbaru</h2>
              </div>

              {stats.recentTransactions.length === 0 ? (
                <p className="py-8 text-center text-body-md text-on-surface-variant">Belum ada transaksi.</p>
              ) : (
                <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                  {stats.recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3 transition-colors duration-200 hover:bg-surface-container"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-md font-semibold text-on-surface">
                          {PACKAGE_LABELS[transaction.packageType] || transaction.packageType}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {formatDateTime(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-body-md font-semibold text-on-surface">
                          {formatPrice(transaction.amount)}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-label-sm ${
                            STATUS_COLORS[transaction.paymentStatus] || "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {PAYMENT_LABELS[transaction.paymentStatus] || transaction.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* User terbaru */}
          <section className={adminCardClass}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                group
              </span>
              <h2 className={adminSectionTitleClass}>User Terbaru</h2>
            </div>

            {stats.recentUsers.length === 0 ? (
              <p className="py-8 text-center text-body-md text-on-surface-variant">Belum ada user.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/50">
                      {["Nama", "Email", "Status", "Bergabung", "Aksi"].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-2 pb-3 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-outline-variant/30 transition-colors duration-200 last:border-b-0 hover:bg-surface-container-low/60"
                      >
                        <td className="px-2 py-3 text-body-md font-semibold text-on-surface">{user.name || "-"}</td>
                        <td className="px-2 py-3 text-body-md text-on-surface-variant">{user.email}</td>
                        <td className="px-2 py-3">
                          {user.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-label-sm font-semibold text-amber-700">
                              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                                hourglass_top
                              </span>
                              Menunggu
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-label-sm font-semibold text-emerald-700">
                              {user.status === "active" ? "Aktif" : user.status}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-body-md text-on-surface-variant">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-2 py-3">
                          {user.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => approveUser(user)}
                              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-label-bold text-on-primary transition-colors duration-200 hover:brightness-110"
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                                check
                              </span>
                              Approve
                            </button>
                          ) : (
                            <span className="text-body-md text-on-surface-variant/60">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

/* ── StatCard ── */

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className={`${adminCardClass} transition-shadow duration-200 hover:shadow-premium-md`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
        <span
          className={`material-symbols-outlined text-[20px] ${iconColor}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mb-0.5 font-headline-md text-[22px] text-on-surface">{value}</p>
      <p className="text-label-sm text-on-surface-variant/80">{sub}</p>
    </div>
  );
}
