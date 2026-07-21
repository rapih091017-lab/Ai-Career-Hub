"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

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

interface PaymentHistoryData {
  totalSpent: number;
  history: PaymentRecord[];
}

export default function PaymentHistoryPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PaymentHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then((json) => {
        setData(json.payments);
      })
      .catch(() => setError(t("admin.load-error")))
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPackageLabel = (type: string) => {
    switch (type) {
      case "premium_pass_30d":                        return t("billing.plan-label");
      case "single_cv":
        return t("billing.single-cv-label");
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return { label: t("payment.success"), class: "bg-green-100 text-green-700" };
      case "pending":
        return { label: t("payment.pending"), class: "bg-amber-100 text-amber-700" };
      case "failed":
        return { label: t("payment.failed"), class: "bg-error-container/50 text-error" };
      default:
        return { label: status, class: "bg-surface-container-high text-outline" };
    }
  };

  const allTransactions = data?.history ?? [];

  // Stats
  const totalSpent = data?.totalSpent ?? 0;
  const totalTransactions = allTransactions.length;
  const successTransactions = allTransactions.filter((t) => t.paymentStatus === "success");

  return (
    <div className="flex flex-col gap-8">
      {/* Section: Riwayat Transaksi */}
      <section className="bg-white rounded-2xl shadow-soft border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
          <div>
            <h2 className="font-headline-md text-lg text-on-surface">{t("payment.title")}</h2>
            <p className="text-label-sm text-on-surface-variant">{t("payment.subtitle")}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-error font-label-bold">{error}</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-label-sm text-on-surface-variant">{t("payment.total-spent")}</p>
                <p className="text-headline-md text-primary mt-1">
                  Rp {totalSpent.toLocaleString("id-ID")}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  {successTransactions.length > 0
                    ? `${successTransactions.length} ${t("payment.transactions-success")}`
                    : t("payment.no-transactions")}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-label-sm text-on-surface-variant">{t("payment.this-month")}</p>
                <p className="text-headline-md text-on-surface mt-1">
                  {allTransactions.filter((t) => {
                    const d = new Date(t.createdAt);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">{t("payment.all-transactions")}</p>
              </div>
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-label-sm text-on-surface-variant">{t("payment.total-transactions")}</p>
                <p className="text-headline-md text-on-surface mt-1">{totalTransactions}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  {successTransactions.length === totalTransactions
                    ? t("payment.all-paid")
                    : `${successTransactions.length} ${t("payment.sukses-dari")} ${totalTransactions}`}
                </p>
              </div>
            </div>

            {/* Transaction Table */}
            <div>
              <h3 className="font-label-bold text-on-surface mb-4">{t("payment.history-title")}</h3>
              {allTransactions.length === 0 ? (
                <div className="bg-surface-container-low rounded-xl p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-outline mb-2">
                    receipt_long
                  </span>
                  <p className="font-label-bold text-on-surface-variant">{t("payment.empty-title")}</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">{t("payment.empty-desc")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-label-sm text-on-surface-variant border-b border-outline-variant/30">
                        <th className="pb-3 font-bold px-2">{t("billing.date")}</th>
                        <th className="pb-3 font-bold px-2">{t("billing.description")}</th>
                        <th className="pb-3 font-bold px-2">{t("billing.amount")}</th>
                        <th className="pb-3 font-bold px-2">{t("billing.status")}</th>
                        <th className="pb-3 font-bold px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTransactions.map((tx) => {
                        const statusInfo = getStatusLabel(tx.paymentStatus);
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
                                    tx.packageType === "premium_pass_30d"
                                      ? "text-primary"
                                      : "text-secondary"
                                  }`}
                                >
                                  {tx.packageType === "premium_pass_30d"
                                    ? "workspace_premium"
                                    : "description"}
                                </span>
                                <span className="font-label-bold text-sm text-on-surface">
                                  {getPackageLabel(tx.packageType)}
                                </span>
                              </div>
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
                              <button className="text-primary text-label-sm hover:underline">{t("payment.detail")}</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI Expense Analysis */}
            {totalSpent > 0 && (
              <div className="p-5 rounded-xl bg-surface-container border border-dashed border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
                <div className="flex gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <span
                      className="material-symbols-outlined text-white"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                  </div>
                  <div>
                    <h4 className="font-label-bold text-on-surface mb-1">{t("payment.analysis-title")}</h4>
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      {successTransactions.length > 0
                        ? `${t("payment.analysis-desc")} ${successTransactions.length} ${t("payment.analysis-payments")} Rp ${totalSpent.toLocaleString("id-ID")}.`
                        : t("payment.analysis-cta")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
