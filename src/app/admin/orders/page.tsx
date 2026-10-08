"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminBtnPrimary, adminInputWithIconClass } from "@/components/admin/ui";

interface OrderRow {
  id: string;
  orderId: string;
  packageName: string | null;
  packageType: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string | null;
  referralCode: string | null;
  userEmail: string;
  userName: string | null;
}

interface SummaryRow {
  status: string;
  total: number;
  amount: number;
}

const formatIDR = (value: number) => "Rp " + value.toLocaleString("id-ID");

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "success", label: "Sukses" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Gagal" },
];

const statusBadge = (status: string) => {
  if (status === "success") return "bg-emerald-500/10 text-emerald-700";
  if (status === "pending") return "bg-amber-500/10 text-amber-700";
  return "bg-error-container/60 text-on-error-container";
};

/** Admin: semua checkout dengan filter status dan pencarian. */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (appliedQuery) params.set("q", appliedQuery);
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (response.status === 401 || response.status === 403) {
        setError("Akses ditolak. Halaman ini hanya untuk admin.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("load failed");
      const data = await response.json();
      setOrders(data.orders ?? []);
      setSummary(data.summary ?? []);
      setError(null);
    } catch {
      setError("Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, appliedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const successSummary = summary.find((row) => row.status === "success");
  const pendingSummary = summary.find((row) => row.status === "pending");
  const failedSummary = summary.find((row) => row.status === "failed");

  return (
    <div>
      <AdminPageHeader
        icon="receipt_long"
        title="Pesanan"
        description="Semua checkout Midtrans: siapa yang membayar, status pembayaran, dan asal referral."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <p className="text-label-sm text-on-surface-variant">Sukses</p>
            <p className="mt-1 text-title-lg font-semibold text-emerald-700">{formatIDR(successSummary?.amount ?? 0)}</p>
            <p className="text-label-sm text-on-surface-variant">{successSummary?.total ?? 0} pesanan</p>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
            <p className="text-label-sm text-on-surface-variant">Pending</p>
            <p className="mt-1 text-title-lg font-semibold text-amber-700">{formatIDR(pendingSummary?.amount ?? 0)}</p>
            <p className="text-label-sm text-on-surface-variant">{pendingSummary?.total ?? 0} pesanan</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4">
            <p className="text-label-sm text-on-surface-variant">Gagal/Expire</p>
            <p className="mt-1 text-title-lg font-semibold text-on-surface-variant">{failedSummary?.total ?? 0} pesanan</p>
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex gap-1 rounded-xl bg-surface-container-high p-1 w-fit">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-lg px-4 py-2 text-label-bold transition-all ${
                  statusFilter === filter.value
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setAppliedQuery(query.trim());
            }}
          >
            <div className="relative flex-1">
              <span
                className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
                aria-hidden="true"
              >
                search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari Order ID atau email..."
                aria-label="Cari pesanan"
                className={adminInputWithIconClass}
              />
            </div>
            <button type="submit" className={adminBtnPrimary}>
              Cari
            </button>
          </form>
        </section>

        {loading ? (
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
        ) : error ? (
          <p className="mt-6 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
            {error}
          </p>
        ) : orders.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-outline-variant p-8 text-center text-body-md text-on-surface-variant">
            Tidak ada pesanan yang cocok.
          </p>
        ) : (
          <div className="mt-6 space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 md:max-w-[38%]">
                  <p className="truncate text-body-md font-semibold text-on-surface">{order.userEmail}</p>
                  <p className="truncate text-label-sm text-on-surface-variant">
                    {order.orderId}
                    {order.referralCode ? (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-primary">ref: {order.referralCode}</span>
                    ) : null}
                  </p>
                </div>

                <div className="min-w-0 md:max-w-[24%]">
                  <p className="truncate text-label-bold text-on-surface">{order.packageName || order.packageType}</p>
                  <p className="text-label-sm text-on-surface-variant">{formatDateTime(order.createdAt)}</p>
                </div>

                <p className="text-body-md font-semibold text-on-surface">{formatIDR(order.amount)}</p>

                <div className="flex items-center gap-3">
                  {order.paymentMethod ? (
                    <span className="text-label-sm text-on-surface-variant">{order.paymentMethod}</span>
                  ) : null}
                  <span className={`rounded-full px-2.5 py-0.5 text-label-sm ${statusBadge(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
