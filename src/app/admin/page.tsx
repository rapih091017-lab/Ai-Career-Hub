"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";

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

interface PackageItem {
  id: string;
  key: string;
  name: string;
  price: number;
  periodDays: number;
  monthly: boolean;
  badge: string | null;
  description: string | null;
  active: boolean;
  sortOrder: number;
  limits: Record<string, number | "unlimited" | false>;
  createdAt: string;
  updatedAt: string;
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

const formatPrice = (price: number) =>
  "Rp " + price.toLocaleString("id-ID");

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
  expired: "Kadaluwarsa",
  deny: "Ditolak",
};

const STATUS_COLORS: Record<string, string> = {
  settlement: "bg-green-100 text-green-700",
  success: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failure: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  deny: "bg-red-100 text-red-700",
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

/* ── Component ── */

export default function AdminDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { addToast } = useToast();

  // Dashboard data
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "packages">("dashboard");

  // Export
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Export ── */
  const handleExport = async (type: string) => {
    setExporting(type);
    setExportOpen(false);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (!res.ok) {
        addToast({ type: "error", message: "Gagal export data." });
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      a.download = match ? match[1] : `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast({ type: "success", message: `Export ${type} berhasil diunduh!` });
    } catch {
      addToast({ type: "error", message: "Gagal mengunduh data." });
    } finally {
      setExporting(null);
    }
  };

  // Package management
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { price: number; name: string; active: boolean }>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (sessionStatus === "loading") return;

    fetchStats();
    fetchPackages();
  }, [sessionStatus, session]);

  /* ── Fetch Stats ── */
  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        if (res.status === 403) setStatsError("Akses ditolak. Hanya admin.");
        else setStatsError("Gagal memuat statistik.");
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch {
      setStatsError("Gagal terhubung ke server.");
    } finally {
      setStatsLoading(false);
    }
  };

  /* ── Fetch Packages ── */
  const fetchPackages = async () => {
    setPkgLoading(true);
    setPkgError(null);
    try {
      const res = await fetch("/api/admin/packages");
      if (!res.ok) {
        if (res.status === 403) setPkgError("Akses ditolak. Hanya admin.");
        else setPkgError("Gagal memuat data packages.");
        return;
      }
      const data = await res.json();
      setPackages(data);
      const ev: Record<string, { price: number; name: string; active: boolean }> = {};
      data.forEach((p: PackageItem) => {
        ev[p.key] = { price: p.price, name: p.name, active: p.active };
      });
      setEditValues(ev);
    } catch {
      setPkgError("Gagal terhubung ke server.");
    } finally {
      setPkgLoading(false);
    }
  };

  /* ── Package Save ── */
  const handleSavePkg = async (pkg: PackageItem) => {
    const ev = editValues[pkg.key];
    if (!ev) return;

    setSavingId(pkg.key);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: pkg.key,
          updates: { price: ev.price, name: ev.name, active: ev.active },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        addToast({ type: "error", message: data.message || "Gagal menyimpan." });
        return;
      }
      setSuccessMessage(`Package "${ev.name}" berhasil disimpan!`);
      fetchPackages();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      addToast({ type: "error", message: "Gagal menyimpan." });
    } finally {
      setSavingId(null);
    }
  };

  /* ── Seed ── */
  const handleSeed = async () => {
    setConfirmAction({
      title: "Seed Data Packages",
      message: "Seed data packages dari konfigurasi awal? Package yang sudah ada tidak akan ditimpa.",
      variant: "default",
      confirmLabel: "Seed",
      onConfirm: async () => {
        setSeedLoading(true);
        setSeedMessage(null);
        try {
          const res = await fetch("/api/admin/packages?action=seed", { method: "POST" });
          const data = await res.json();
          setSeedMessage(data.message || "Seed berhasil.");
          fetchPackages();
          setTimeout(() => setSeedMessage(null), 5000);
        } catch {
          setSeedMessage("Gagal seed data.");
        } finally {
          setSeedLoading(false);
        }
      },
    });
  };

  /* ── Render ── */

  if (sessionStatus === "loading") {
    return (
      <>
        <AppHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* ══════════ HEADER ══════════ */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
              </div>
              <h1 className="font-headline-md text-on-surface text-xl">Admin Panel</h1>
              {stats && (
                <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                  {stats.totals.users} user · {formatPrice(stats.totals.revenue)} total
                </span>
              )}
            </div>
            <p className="text-body-md text-on-surface-variant">Pantau aktivitas platform & kelola pengaturan</p>
          </div>
          <div className="flex items-center gap-2">
            {/* ── Export Dropdown ── */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportOpen(!exportOpen)}
                disabled={!!exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface hover:bg-surface-container transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${exporting ? "animate-spin" : ""}`}>
                  {exporting ? "sync" : "download"}
                </span>
                {exporting ? `Export ${exporting}...` : "Export"}
              </button>

              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] bg-white rounded-xl shadow-premium-md border border-outline-variant/30 overflow-hidden">
                  {[
                    { type: "revenue", label: "Revenue CSV", icon: "payments" },
                    { type: "users", label: "Users CSV", icon: "group" },
                    { type: "trends", label: "Trends CSV (30 hari)", icon: "trending_up" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleExport(item.type)}
                      disabled={exporting === item.type}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 text-left"
                    >
                      <span className="material-symbols-outlined text-base text-on-surface-variant">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fetchStats}
              disabled={statsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface hover:bg-surface-container transition-all disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${statsLoading ? "animate-spin" : ""}`}>
                {statsLoading ? "sync" : "refresh"}
              </span>
              Refresh
            </button>
          </div>
        </div>

        {/* ══════════ TABS ══════════ */}
        <div className="flex gap-1 bg-surface-container-high rounded-xl p-1 w-fit">
          {(["dashboard", "packages"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-base align-text-bottom mr-1" style={{ fontVariationSettings: activeTab === tab ? "'FILL' 1" : "" }}>
                {tab === "dashboard" ? "dashboard" : "inventory_2"}
              </span>
              {tab === "dashboard" ? "Dashboard" : "Package"}
            </button>
          ))}
        </div>

        {/* ══════════ DASHBOARD TAB ══════════ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* ── Stats Cards ── */}
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-soft border border-outline-variant/30 animate-pulse">
                    <div className="h-3 bg-surface-container-high rounded w-16 mb-3" />
                    <div className="h-7 bg-surface-container-high rounded w-20 mb-2" />
                    <div className="h-2.5 bg-surface-container-high rounded w-12" />
                  </div>
                ))}
              </div>
            ) : statsError ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600">error</span>
                <p className="text-sm text-red-700">{statsError}</p>
              </div>
            ) : stats ? (
              <>
                {/* ── Today's Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatCard
                    icon="group"
                    iconBg="bg-primary-fixed"
                    iconColor="text-primary"
                    label="User Aktif Hari Ini"
                    value={stats.today.activeUsers}
                    sub="Pengguna unik"
                  />
                  <StatCard
                    icon="person_add"
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    label="Registrasi Baru"
                    value={stats.today.newRegistrations}
                    sub="Hari ini"
                  />
                  <StatCard
                    icon="description"
                    iconBg="bg-sky-50"
                    iconColor="text-sky-600"
                    label="CV Dibuat"
                    value={stats.today.cvsCreated}
                    sub="Hari ini"
                  />
                  <StatCard
                    icon="payments"
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                    label="Revenue"
                    value={formatPrice(stats.today.revenue)}
                    sub="Hari ini"
                  />
                  <StatCard
                    icon="fact_check"
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                    label="Cek ATS"
                    value={stats.today.checkerUsage}
                    sub="Hari ini"
                  />
                </div>

                {/* ── Trends Chart ── */}
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-outline-variant/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
                      <h2 className="font-label-bold text-on-surface">Aktivitas 7 Hari Terakhir</h2>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Registrasi</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> CV</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Revenue</span>
                    </div>
                  </div>

                  {/* Simple Bar Chart */}
                  <div className="flex items-end gap-2 h-44">
                    {stats.trends.map((day, i) => {
                      const maxVal = Math.max(
                        ...stats.trends.map((d) => Math.max(d.registrations, d.cvsCreated, d.revenue || 0)),
                        1
                      );
                      const dayLabel = new Date(day.date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                      });

                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          {/* Revenue bar (amber) */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(day.revenue / maxVal) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="w-full max-w-[32px] bg-amber-400/70 rounded-t-sm"
                            title={`Revenue: ${formatPrice(day.revenue)}`}
                          />
                          {/* CV bar (sky) */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(day.cvsCreated / maxVal) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="w-full max-w-[32px] bg-sky-500/70 rounded-t-sm"
                            title={`CV: ${day.cvsCreated}`}
                          />
                          {/* Registration bar (primary) */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(day.registrations / maxVal) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="w-full max-w-[32px] bg-primary/80 rounded-t-sm"
                            title={`Registrasi: ${day.registrations}`}
                          />
                          <span className="text-[9px] text-on-surface-variant mt-1 truncate w-full text-center">
                            {dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Bottom Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Package Sales */}
                  <div className="bg-white rounded-2xl p-6 shadow-soft border border-outline-variant/30">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary text-lg">shopping_bag</span>
                      <h2 className="font-label-bold text-on-surface">Penjualan Package</h2>
                    </div>

                    {stats.packageSales.length === 0 ? (
                      <p className="text-sm text-on-surface-variant text-center py-8">Belum ada penjualan.</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.packageSales.map((sale) => {
                          const total = stats.packageSales.reduce((a, b) => a + b.sales, 0);
                          const pct = total > 0 ? (sale.sales / total) * 100 : 0;
                          return (
                            <div key={sale.packageType}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-medium text-on-surface">
                                  {PACKAGE_LABELS[sale.packageType] || sale.packageType}
                                </span>
                                <span className="text-on-surface-variant">
                                  {sale.sales}x · <span className="font-semibold text-on-surface">{formatPrice(sale.revenue)}</span>
                                </span>
                              </div>
                              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="h-full bg-primary rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-white rounded-2xl p-6 shadow-soft border border-outline-variant/30">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
                      <h2 className="font-label-bold text-on-surface">Transaksi Terbaru</h2>
                    </div>

                    {stats.recentTransactions.length === 0 ? (
                      <p className="text-sm text-on-surface-variant text-center py-8">Belum ada transaksi.</p>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto">
                        {stats.recentTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-on-surface truncate">
                                {PACKAGE_LABELS[tx.packageType] || tx.packageType}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                {formatDateTime(tx.createdAt)}
                              </p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-semibold text-on-surface">
                                {formatPrice(tx.amount)}
                              </p>
                              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[tx.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                                {PAYMENT_LABELS[tx.paymentStatus] || tx.paymentStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Recent Users ── */}
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-outline-variant/30">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-lg">group</span>
                    <h2 className="font-label-bold text-on-surface">User Terbaru</h2>
                  </div>

                  {stats.recentUsers.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-8">Belum ada user.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/30">
                            <th className="pb-3 px-2">Nama</th>
                            <th className="pb-3 px-2">Email</th>
                            <th className="pb-3 px-2">Status</th>
                            <th className="pb-3 px-2">Bergabung</th>
                            <th className="pb-3 px-2">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentUsers.map((user) => (
                            <tr key={user.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors">
                              <td className="py-3 px-2 text-sm font-medium text-on-surface">{user.name || "-"}</td>
                              <td className="py-3 px-2 text-sm text-on-surface-variant">{user.email}</td>
                              <td className="py-3 px-2">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : user.status === "pending"
                                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                                    : "bg-gray-100 text-gray-500"
                                }`}>
                                  {user.status === "pending" ? "⏳ Pending" : user.status}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-sm text-on-surface-variant">{formatDate(user.createdAt)}</td>
                              <td className="py-3 px-2">
                                {user.status === "pending" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch("/api/admin/users/approve", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ userId: user.id }),
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                          addToast({ type: "success", message: data.message || "User diaktifkan!" });
                                          fetchStats();
                                        } else {
                                          addToast({ type: "error", message: data.message || "Gagal approve." });
                                        }
                                      } catch {
                                        addToast({ type: "error", message: "Gagal menghubungi server." });
                                      }
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold hover:brightness-110 active:scale-95 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                    Approve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ══════════ PACKAGES TAB ══════════ */}
        {activeTab === "packages" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-on-surface text-lg">Package Management</h2>
                <p className="text-body-md text-on-surface-variant">Kelola harga, status, dan nama package</p>
              </div>
              <button
                onClick={handleSeed}
                disabled={seedLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-all disabled:opacity-50"
              >
                {seedLoading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">database</span>
                )}
                Seed Data
              </button>
            </div>

            {/* Messages */}
            {pkgError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600">error</span>
                <p className="text-sm text-red-700">{pkgError}</p>
              </div>
            )}
            {seedMessage && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <p className="text-sm text-blue-700">{seedMessage}</p>
              </div>
            )}
            {successMessage && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Packages Table */}
            {pkgLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : !pkgError && (
              <div className="bg-white rounded-2xl shadow-soft border border-outline-variant/30 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Key</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Nama Paket</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Harga</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Durasi</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Badge</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((pkg) => {
                        const ev = editValues[pkg.key];
                        const isSaving = savingId === pkg.key;
                        const hasChanges = ev && (ev.price !== pkg.price || ev.name !== pkg.name || ev.active !== pkg.active);

                        return (
                          <tr key={pkg.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  setEditValues((prev) => ({
                                    ...prev,
                                    [pkg.key]: { ...prev[pkg.key], active: !prev[pkg.key].active },
                                  }));
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                  ev?.active ? "bg-green-100 text-green-700" : "bg-surface-container-high text-outline"
                                }`}
                                title={ev?.active ? "Aktif (klik nonaktifkan)" : "Nonaktif (klik aktifkan)"}
                              >
                                {ev?.active ? (
                                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                ) : (
                                  <span className="material-symbols-outlined text-sm">close</span>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-xs bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant font-mono">{pkg.key}</code>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={ev?.name ?? pkg.name}
                                onChange={(e) => {
                                  setEditValues((prev) => ({
                                    ...prev,
                                    [pkg.key]: { ...prev[pkg.key], name: e.target.value },
                                  }));
                                }}
                                className="w-full bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary focus:outline-none px-1 py-0.5 text-sm text-on-surface font-medium transition-colors"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-on-surface-variant">Rp</span>
                                <input
                                  type="number"
                                  value={ev?.price ?? pkg.price}
                                  onChange={(e) => {
                                    setEditValues((prev) => ({
                                      ...prev,
                                      [pkg.key]: { ...prev[pkg.key], price: parseInt(e.target.value) || 0 },
                                    }));
                                  }}
                                  step="1"
                                  min="0"
                                  className="w-28 bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary focus:outline-none px-1 py-0.5 text-sm text-on-surface font-bold text-right transition-colors"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-on-surface-variant">
                              {pkg.monthly ? `${pkg.periodDays} hari (bulanan)` : `${pkg.periodDays} hari`}
                            </td>
                            <td className="px-4 py-3">
                              {pkg.badge ? (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                  {pkg.badge}
                                </span>
                              ) : (
                                <span className="text-xs text-outline">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleSavePkg(pkg)}
                                disabled={!hasChanges || isSaving}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                  hasChanges
                                    ? "bg-primary text-on-primary hover:brightness-110 active:scale-95"
                                    : "bg-surface-container-high text-outline cursor-not-allowed"
                                } disabled:opacity-50`}
                              >
                                {isSaving ? (
                                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                ) : (
                                  <span className="material-symbols-outlined text-sm">save</span>
                                )}
                                {isSaving ? "Menyimpan..." : "Simpan"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {packages.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <span className="material-symbols-outlined text-3xl text-outline">inventory_2</span>
                              <p className="text-sm text-on-surface-variant font-medium">Belum ada data package.</p>
                              <p className="text-xs text-outline">Klik tombol &quot;Seed Data&quot; untuk mengisi dari konfigurasi awal.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {packages.length > 0 && (
                  <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>Total {packages.length} package · {packages.filter(p => p.active).length} aktif</span>
                    <span>Rentang harga: {formatPrice(Math.min(...packages.map(p => p.price)))} - {formatPrice(Math.max(...packages.map(p => p.price)))}</span>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 shrink-0">lightbulb</span>
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">Cara Kerja</p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Edit nama atau harga langsung di tabel, lalu klik <strong>Simpan</strong> per baris.</li>
                    <li>Toggle status <strong>aktif/nonaktif</strong> dengan klik icon check/close.</li>
                    <li>Perubahan <strong>real-time</strong> · semua user langsung melihat harga terbaru.</li>
                    <li><strong>Seed Data</strong> untuk mengisi data awal (hanya jika tabel kosong).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal confirm={confirmAction} onClose={() => setConfirmAction(null)} />
    </>
  );
}

/* ── StatCard Component ── */

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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-5 shadow-soft border border-outline-variant/30 hover:shadow-premium-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <span className={`material-symbols-outlined text-lg ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      <p className="font-headline-lg text-on-surface text-2xl mb-0.5">{value}</p>
      <p className="text-[11px] text-outline">{sub}</p>
    </motion.div>
  );
}
