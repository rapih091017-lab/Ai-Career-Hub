"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { useCatalogPackages, describePackageKeys } from "@/lib/pricing-catalog";
import { currentEquivalentPackage } from "@/lib/package-catalog-static";

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
  const { t, lang } = useTranslation();
  const { packages: catalogPackages } = useCatalogPackages();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "single" | "monthly">("all");

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then((json) => {
        const allPayments: PaymentRecord[] = json.payments?.history ?? [];
        setPayments(allPayments);
      })
      .catch(() => setError(t("checkout.load-failed")))
      .finally(() => setIsLoading(false));
  }, []);

  const nameByKey = useMemo(
    () => Object.fromEntries(catalogPackages.map((p) => [p.key, p.name])),
    [catalogPackages],
  );
  // Transaksi bisa memuat beberapa paket ("cek_cv+bikin_cv"), jadi dicek per
  // paket, bukan dengan membandingkan string utuh.
  const isMonthlyType = (type: string) =>
    type.split("+").some((key) => {
      const resolved = currentEquivalentPackage(key.trim());
      return catalogPackages.find((p) => p.key === resolved)?.monthly;
    });
  const filtered = payments.filter((p) => {
    if (filter === "all") return true;
    return filter === "monthly" ? isMonthlyType(p.packageType) : !isMonthlyType(p.packageType);
  });
  const successfulPayments = payments.filter((p) => p.paymentStatus === "success");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
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
        return { label: t("billing.active"), class: "bg-green-100 text-green-700" };
      case "pending":
        return { label: "Pending", class: "bg-amber-100 text-amber-700" };
      case "failed":
        return { label: t("billing.failed"), class: "bg-red-100 text-red-700" };
      default:
        return { label: status, class: "bg-surface-container-high text-outline" };
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">shopping_cart_checkout</span>
          </div>
          <div>
            <h2 className="font-headline-md text-lg text-on-surface">{t("settings.checkout-history")}</h2>
            <p className="text-label-sm text-on-surface-variant">{t("billing.checkout-subtitle")}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-ink/20 border-t-green-deep rounded-full" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-error font-label-bold">{error}</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/50">
                <p className="text-label-sm text-on-surface-variant">{t("billing.checkout-history")}</p>
                <p className="text-headline-md text-secondary mt-1">{payments.length}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">{t("billing.all-time")}</p>
              </div>
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/50">
                <p className="text-label-sm text-on-surface-variant">{t("billing.paid-label")}</p>
                <p className="text-headline-md text-green-600 mt-1">{successfulPayments.length}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">{t("billing.valid-period")}</p>
              </div>
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/50">
                <p className="text-label-sm text-on-surface-variant">{t("billing.total-spent")}</p>
                <p className="text-headline-md text-on-surface mt-1">
                  Rp {successfulPayments
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString(lang === "en" ? "en-US" : "id-ID")}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  {t("billing.active-cvs").replace("{n}", String(successfulPayments.length))}
                </p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              {(["all", "single", "monthly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 min-h-[44px] rounded-full text-xs font-bold transition-all border-2 ${
                    filter === f
                      ? "border-ink bg-lime text-on-light shadow-[2px_2px_0_rgb(var(--c-ink))]"
                      : "border-ink/25 bg-paper text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {f === "all"
                    ? t("dashboard.all")
                    : f === "single"
                      ? t("billing.group.single")
                      : t("billing.group.monthly")}
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
                  {t("billing.no-transactions")}
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-label-sm text-on-surface-variant border-b border-outline-variant/50">
                      <th className="pb-3 font-bold px-2">{t("billing.date")}</th>
                      <th className="pb-3 font-bold px-2">{t("billing.package")}</th>
                      <th className="pb-3 font-bold px-2">{t("billing.order-id")}</th>
                      <th className="pb-3 font-bold px-2">{t("billing.amount-short")}</th>
                      <th className="pb-3 font-bold px-2">{t("billing.status")}</th>
                      <th className="pb-3 font-bold px-2">{t("billing.payment-method")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => {
                      const statusInfo = getStatus(tx.paymentStatus);
                      const isMonthly = isMonthlyType(tx.packageType);
                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-outline-variant/40 hover:bg-surface-container-low transition-colors"
                        >
                          <td className="py-3 px-2 text-label-sm text-on-surface-variant">
                            {formatDate(tx.paidAt || tx.createdAt)}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`material-symbols-outlined text-lg ${
                                  isMonthly ? "text-primary" : "text-secondary"
                                }`}
                              >
                                {isMonthly ? "workspace_premium" : "description"}
                              </span>
                              <span className="font-label-bold text-sm text-on-surface">
                                {describePackageKeys(tx.packageType, nameByKey, currentEquivalentPackage)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <code className="text-xs bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-mono">
                              {tx.orderId}
                            </code>
                          </td>
                          <td className="py-3 px-2 font-label-bold text-on-surface">
                            Rp {tx.amount.toLocaleString(lang === "en" ? "en-US" : "id-ID")}
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
                  {t("billing.buy-ai-rev")}{" "}
                  <Link href="/dashboard" className="text-secondary font-bold underline">
                    {t("billing.open-dashboard")}
                  </Link>{" "}
                  {t("billing.click-ai-rev")} <strong>AI Rev</strong> {t("billing.on-desired-cv")}.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
