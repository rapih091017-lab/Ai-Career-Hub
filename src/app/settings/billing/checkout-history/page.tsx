"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PaymentRecord {
  id: string;
  orderId: string;
  packageType: string;
  amount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
}

export default function CheckoutHistoryPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "single_cv" | "premium_pass_30d">("single_cv");

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then((json) => {
        const allPayments: PaymentRecord[] = json.payments?.history ?? [];
        setPayments(allPayments);
      })
      .catch(() => setError("Gagal memuat riwayat checkout"))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = payments.filter(
    (p) => filter === "all" || p.packageType === filter,
  );
  const singleCvPayments = payments.filter((p) => p.packageType === "single_cv");
  const activeSingleCv = singleCvPayments.filter((p) => p.paymentStatus === "success");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatus = (status: string) => {
    switch (status) {
      case "success":
        return { label: "Aktif", class: "bg-green-100 text-green-700" };
      case "pending":
        return { label: "Pending", class: "bg-amber-100 text-amber-700" };
      case "failed":
        return { label: "Gagal", class: "bg-red-100 text-red-700" };
      default:
        return { label: status, class: "bg-surface-container-high text-outline" };
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-white rounded-2xl shadow-soft border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">shopping_cart_checkout</span>
          </div>
          <div>
            <h2 className="font-headline-md text-lg text-on-surface">Riwayat Checkout</h2>
            <p className="text-label-sm text-on-surface-variant">Daftar pembelian Single CV AI Revision</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-error font-label-bold">{error}</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-label-sm text-on-surface-variant">Total Single CV Dibeli</p>
                <p className="text-headline-md text-secondary mt-1">{singleCvPayments.length}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">Semua waktu</p>
              </div>
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-label-sm text-on-surface-variant">Aktif</p>
                <p className="text-headline-md text-green-600 mt-1">{activeSingleCv.length}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">Masa berlaku belum habis</p>
              </div>
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-label-sm text-on-surface-variant">Total Pengeluaran</p>
                <p className="text-headline-md text-on-surface mt-1">
                  Rp {singleCvPayments
                    .filter((p) => p.paymentStatus === "success")
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString("id-ID")}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  {activeSingleCv.length} CV aktif
                </p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              {(["all", "single_cv", "premium_pass_30d"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === f
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {f === "all"
                    ? "Semua"
                    : f === "single_cv"
                      ? "Single CV"
                      : "Premium Pass"}
                </button>
              ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="bg-surface-container-low rounded-xl p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-outline mb-2">
                  shopping_cart
                </span>
                <p className="font-label-bold text-on-surface-variant">
                  {filter === "single_cv"
                    ? "Belum ada pembelian Single CV"
                    : "Belum ada transaksi"}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  {filter === "single_cv" &&
                    "Pilih CV dari dashboard untuk membeli AI Revision."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-label-sm text-on-surface-variant border-b border-outline-variant/30">
                      <th className="pb-3 font-bold px-2">Tanggal</th>
                      <th className="pb-3 font-bold px-2">Paket</th>
                      <th className="pb-3 font-bold px-2">Order ID</th>
                      <th className="pb-3 font-bold px-2">Jumlah</th>
                      <th className="pb-3 font-bold px-2">Status</th>
                      <th className="pb-3 font-bold px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => {
                      const statusInfo = getStatus(tx.paymentStatus);
                      const isSingleCv = tx.packageType === "single_cv";
                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors"
                        >
                          <td className="py-3 px-2 text-label-sm text-on-surface-variant">
                            {formatDate(tx.paidAt || tx.createdAt)}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`material-symbols-outlined text-lg ${
                                  isSingleCv ? "text-secondary" : "text-primary"
                                }`}
                              >
                                {isSingleCv ? "description" : "workspace_premium"}
                              </span>
                              <span className="font-label-bold text-sm text-on-surface">
                                {isSingleCv ? "Single CV AI Revision" : "Premium Pass 30 Hari"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <code className="text-xs bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-mono">
                              {tx.orderId}
                            </code>
                          </td>
                          <td className="py-3 px-2 font-label-bold text-on-surface">
                            Rp {tx.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`px-3 py-1 rounded-full text-label-sm font-bold ${statusInfo.class}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {tx.paymentMethod && (
                              <span className="text-xs text-on-surface-variant">
                                {tx.paymentMethod}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quick Link */}
            <div className="p-4 rounded-xl bg-surface-container border border-dashed border-secondary/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">info</span>
                <p className="text-sm text-on-surface-variant">
                  Ingin beli AI Revision untuk CV lain?{" "}
                  <Link href="/dashboard" className="text-secondary font-bold underline">
                    Buka Dashboard
                  </Link>{" "}
                  dan klik tombol <strong>AI Rev</strong> di CV yang diinginkan.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
