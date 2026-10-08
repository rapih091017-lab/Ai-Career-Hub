"use client";

import { useCallback, useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";
import { AFFILIATE_REWARD_PERCENT } from "@/lib/affiliate";

interface ConversionRow {
  id: string;
  rewardAmount: number;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
}

interface AffiliateData {
  status: "none" | "pending" | "rejected" | "approved";
  appliedAt?: string | null;
  reviewedAt?: string | null;
  code?: string;
  clicks?: number;
  totalConversions?: number;
  pendingAmount?: number;
  paidAmount?: number;
  conversions?: ConversionRow[];
}

const formatIDR = (value: number) => "Rp " + value.toLocaleString("id-ID");

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

/** Tiga field rekening untuk pencairan komisi. Dipakai form daftar dan form
 * ajukan ulang supaya markup hanya ditulis sekali. */
function BankFields({
  value,
  onChange,
}: {
  value: { bankName: string; bankAccountNumber: string; bankAccountHolder: string };
  onChange: (value: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }) => void;
}) {
  const { t } = useTranslation();
  const inputClass =
    "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <div className="mt-4 space-y-2">
      <p className="text-label-bold text-on-surface">{t("affiliate.bank-title")}</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          className={inputClass}
          placeholder={t("affiliate.bank-name-placeholder")}
          value={value.bankName}
          onChange={(event) => onChange({ ...value, bankName: event.target.value })}
          maxLength={100}
        />
        <input
          className={inputClass}
          placeholder={t("affiliate.bank-account-placeholder")}
          value={value.bankAccountNumber}
          onChange={(event) => onChange({ ...value, bankAccountNumber: event.target.value })}
          maxLength={50}
          inputMode="numeric"
        />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder={t("affiliate.bank-holder-placeholder")}
          value={value.bankAccountHolder}
          onChange={(event) => onChange({ ...value, bankAccountHolder: event.target.value })}
          maxLength={150}
        />
      </div>
    </div>
  );
}

export default function AffiliatePage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [origin, setOrigin] = useState("");
  const [note, setNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [bank, setBank] = useState({ bankName: "", bankAccountNumber: "", bankAccountHolder: "" });

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/affiliate");
      if (!response.ok) throw new Error("load failed");
      setData(await response.json());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const response = await fetch("/api/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, ...bank }),
      });
      if (!response.ok) throw new Error("apply failed");
      addToast({ type: "success", message: t("affiliate.apply-success") });
      await load();
    } catch {
      addToast({ type: "error", message: t("affiliate.error") });
    } finally {
      setApplying(false);
    }
  };

  const referralLink = data?.code && origin ? `${origin}/r/${data.code}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      addToast({ type: "success", message: t("affiliate.copied") });
    } catch {
      addToast({ type: "error", message: t("affiliate.copy-failed") });
    }
  };

  const rewardText = t("affiliate.reward-note").replace("{n}", String(AFFILIATE_REWARD_PERCENT));
  const bankComplete =
    bank.bankName.trim().length > 0 &&
    bank.bankAccountNumber.trim().length > 0 &&
    bank.bankAccountHolder.trim().length > 0;

  const stats =
    data?.status === "approved"
      ? [
          { label: t("affiliate.stat-clicks"), value: String(data.clicks ?? 0) },
          { label: t("affiliate.stat-conversions"), value: String(data.totalConversions ?? 0) },
          { label: t("affiliate.stat-pending"), value: formatIDR(data.pendingAmount ?? 0) },
          { label: t("affiliate.stat-paid"), value: formatIDR(data.paidAmount ?? 0) },
        ]
      : [];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />

        <main className="mx-auto max-w-3xl px-margin-mobile pb-24 pt-24 md:px-gutter">
          <h1 className="font-headline-lg text-headline-lg text-on-background">{t("affiliate.title")}</h1>
          <p className="mt-1 max-w-[560px] text-body-md text-on-surface-variant">{rewardText}</p>

          {loading ? (
            <div className="mt-8 h-40 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center">
              <p className="text-body-md text-on-surface-variant">{t("affiliate.error")}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  load();
                }}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-label-bold text-on-primary hover:opacity-90"
              >
                {t("tracker.retry")}
              </button>
            </div>
          ) : data?.status === "none" ? (
            <section className="mt-8 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6">
              <h2 className="text-title-lg font-semibold text-on-surface">{t("affiliate.apply-title")}</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">{t("affiliate.apply-desc")}</p>
              <label className="mt-4 block">
                <span className="mb-1 block text-label-bold text-on-surface">{t("affiliate.apply-note-label")}</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t("affiliate.apply-note-placeholder")}
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <BankFields value={bank} onChange={setBank} />
              <button
                type="button"
                onClick={handleApply}
                disabled={applying || !bankComplete}
                className="mt-4 h-11 rounded-xl bg-primary px-5 text-label-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {applying ? t("tracker.form.saving") : t("affiliate.apply-btn")}
              </button>
            </section>
          ) : data?.status === "pending" ? (
            <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600" aria-hidden>
                  hourglass_top
                </span>
                <div>
                  <h2 className="text-title-lg font-semibold text-on-surface">{t("affiliate.pending-title")}</h2>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {t("affiliate.pending-desc").replace("{date}", formatDate(data.appliedAt))}
                  </p>
                </div>
              </div>
            </section>
          ) : data?.status === "rejected" ? (
            <section className="mt-8 rounded-2xl border border-error/30 bg-error-container/30 p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error" aria-hidden>
                  block
                </span>
                <div>
                  <h2 className="text-title-lg font-semibold text-on-surface">{t("affiliate.rejected-title")}</h2>
                  <p className="mt-1 text-body-md text-on-surface-variant">{t("affiliate.rejected-desc")}</p>
                </div>
              </div>
              <label className="mt-4 block">
                <span className="mb-1 block text-label-bold text-on-surface">{t("affiliate.apply-note-label")}</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <BankFields value={bank} onChange={setBank} />
              <button
                type="button"
                onClick={handleApply}
                disabled={applying || !bankComplete}
                className="mt-4 h-11 rounded-xl bg-primary px-5 text-label-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {applying ? t("tracker.form.saving") : t("affiliate.reapply-btn")}
              </button>
            </section>
          ) : data?.status === "approved" ? (
            <div className="mt-8 space-y-6">
              <section className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-label-bold text-on-surface-variant">{t("affiliate.link-label")}</p>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-label-sm text-emerald-700">
                    {t("affiliate.status-active")}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={referralLink}
                    onFocus={(event) => event.target.select()}
                    className="h-11 flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-md text-on-surface focus:outline-none"
                    aria-label={t("affiliate.link-label")}
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="h-11 rounded-xl bg-primary px-5 text-label-bold text-on-primary transition-opacity hover:opacity-90"
                  >
                    {t("affiliate.copy")}
                  </button>
                </div>
                <p className="mt-2 text-label-sm text-on-surface-variant">
                  {t("affiliate.cookie-hint")} {rewardText}
                </p>
              </section>

              <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4">
                    <p className="text-label-sm text-on-surface-variant">{stat.label}</p>
                    <p className="mt-1 text-title-lg font-semibold text-on-surface">{stat.value}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5">
                <h2 className="text-label-bold text-on-surface">{t("affiliate.conversions-title")}</h2>
                {(data.conversions ?? []).length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center text-body-md text-on-surface-variant">
                    {t("affiliate.empty")}
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-outline-variant/50">
                    {(data.conversions ?? []).map((conversion) => (
                      <li key={conversion.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="text-body-md text-on-surface">{formatIDR(conversion.rewardAmount)}</p>
                          <p className="text-label-sm text-on-surface-variant">{formatDate(conversion.createdAt)}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-label-sm ${
                            conversion.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-amber-500/10 text-amber-700"
                          }`}
                        >
                          {conversion.status === "paid"
                            ? t("affiliate.status-paid")
                            : t("affiliate.status-pending")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <p className="text-label-sm text-on-surface-variant">{t("affiliate.payout-note")}</p>
            </div>
          ) : null}
        </main>
      </div>
    </AuthGuard>
  );
}
