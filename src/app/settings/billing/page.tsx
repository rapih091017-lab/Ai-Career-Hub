"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PackageCard } from "@/components/checkout/PackageCard";
import { TestimonialRequest } from "@/components/billing/TestimonialRequest";

import {
  useCatalogPrices,
  useCatalogPackages,
  MARKETED_PACKAGE_KEYS,
  describePackageKeys,
} from "@/lib/pricing-catalog";
import { currentEquivalentPackage } from "@/lib/package-catalog-static";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";

/**
 * Parameter `?plan=` dari landing atau tautan lama.
 *
 * Semua diarahkan ke paket yang masih dijual. Plan lama dipetakan lewat
 * `currentEquivalentPackage`, jadi `?plan=cv-starter` tidak lagi membuka paket
 * yang sudah dihapus, tapi paket termurah yang setara.
 */
const PLAN_QUERY_ALIASES: Record<string, string> = {
  single_cv: "single_cv",
  pro: "pro_monthly",
  starter: "starter_monthly",
  premium_pass_30d: "premium_pass_30d",
};

function packageKeyFromQuery(plan: string): string | undefined {
  const key = PLAN_QUERY_ALIASES[plan] ?? plan;
  const resolved = currentEquivalentPackage(key);
  return MARKETED_PACKAGE_KEYS.includes(resolved) ? resolved : undefined;
}

interface FeatureLimits {
  ai_cv_generate: number | "unlimited" | false;
  cv_analyzer: number | "unlimited" | false;
  ai_revision: number | "unlimited" | false;
  ai_suggestion: number | "unlimited" | false;
  portfolio_web: number | "unlimited" | false;
  pdf_export: number | "unlimited" | false;
  bulk_analyzer: number | "unlimited" | false;
  white_label: number | "unlimited" | false;
}

/** Pembayaran sukses dalam jendela ini dianggap "baru saja masuk". */
const TOPUP_SUCCESS_WINDOW_MS = 10 * 60 * 1000;
const TOPUP_SEEN_PREFIX = "ach:topup-seen:";
interface UsageData {
  cvBuilds: number;
  checkerChecks: number;
  aiRevisions: number;
  aiSuggestions: number;
}

interface PremiumInfo {
  isPremium: boolean;
  tierName: string;
  activePackages: string[];
  expiresAt: string | null;
  daysRemaining: number;
}

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

interface UsageResponse {
  usage: UsageData;
  premium: PremiumInfo;
  limits: FeatureLimits;
  payments: {
    totalSpent: number;
    history: PaymentRecord[];
  };
}

// Map dari feature key (API) ke display label
// Dead FEATURE_LABELS removed, unused

interface CvItem {
  id: string;
  jobTitle: string | null;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsBillingPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<UsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const catalogPrice = useCatalogPrices();
  const { packages: catalogPackages, loading: catalogLoading } = useCatalogPackages();
  // Nama paket untuk riwayat: diambil dari katalog, bukan dari kunci mentah.
  const packageNameByKey = useMemo(
    () => Object.fromEntries(catalogPackages.map((p) => [p.key, p.name])),
    [catalogPackages],
  );
  const buySectionRef = useRef<HTMLDivElement | null>(null);
  const [highlightBuy, setHighlightBuy] = useState(false);
  const [topupDone, setTopupDone] = useState<{ packageType: string; amount: number } | null>(null);
  // Single CV selector
  const [showCvPicker, setShowCvPicker] = useState(false);
  const [cvList, setCvList] = useState<CvItem[]>([]);
  const [cvListLoading, setCvListLoading] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);

  const fetchUsage = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        maybeCelebrateTopup(json);
      } else {
        setError(t("admin.load-error"));
      }
    } catch {
      setError(t("admin.connection-error"));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * QRIS tidak selalu membawa pengguna balik ke halaman ini dengan parameter
   * sukses, jadi keberhasilan dibaca dari pembayaran sukses terbaru. Popup-nya
   * muncul sekali per pembayaran supaya tidak mengganggu setiap muat ulang.
   */
  const maybeCelebrateTopup = (payload: UsageResponse) => {
    const latest = payload?.payments?.history?.[0];
    if (!latest?.paidAt) return;
    const paidAt = new Date(latest.paidAt).getTime();
    if (!Number.isFinite(paidAt)) return;
    if (Date.now() - paidAt > TOPUP_SUCCESS_WINDOW_MS) return;
    const seenKey = `${TOPUP_SEEN_PREFIX}${latest.id}`;
    try {
      if (window.sessionStorage.getItem(seenKey)) return;
      window.sessionStorage.setItem(seenKey, "1");
    } catch {
      // Penyimpanan diblokir: tetap tampilkan popup sekali saja di sesi ini.
    }
    setTopupDone({ packageType: latest.packageType, amount: latest.amount });
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  // Handle redirect from PricingSection plan selection and payment callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");

    // Plan dari landing: buka ringkasan dulu, jangan langsung buat QR.
    if (plan) {
      const key = packageKeyFromQuery(plan);
      if (key) {
        goToCheckout(key);
      }
      // Clean URL
      window.history.replaceState({}, "", "/settings/billing");
      return;
    }

    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      addToast({ type: "success", message: t("billing.success-alert") });
      fetchUsage();
      // Clean URL
      window.history.replaceState({}, "", "/settings/billing");
    } else if (paymentStatus === "error") {
      addToast({ type: "error", message: t("billing.error-alert") });
      window.history.replaceState({}, "", "/settings/billing");
    } else if (paymentStatus === "pending") {
      addToast({ type: "info", message: t("billing.pending-alert") });
      window.history.replaceState({}, "", "/settings/billing");
    }
  }, []);

  // Open CV picker for single_cv package
  const handleSingleCvClick = async () => {
    setCvListLoading(true);
    setShowCvPicker(true);
    setSelectedCvId(null);
    try {
      const res = await fetch("/api/cv-documents");
      if (res.ok) {
        const list = await res.json();
        setCvList(list);
      } else {
        setCvList([]);
      }
    } catch {
      setCvList([]);
    } finally {
      setCvListLoading(false);
    }
  };

  /** Buka halaman ringkasan; pembayaran hanya dibuat dari sana. */
  const goToCheckout = (packageType: string) => {
    setError(null);
    router.push(`/checkout?packages=${encodeURIComponent(packageType)}${selectedCvId ? `&cvId=${encodeURIComponent(selectedCvId)}` : ""}`);
  };

  /**
   * Pintasan dari bagian pemakaian ke daftar paket. Section-nya diberi sorotan
   * singkat supaya mata langsung tahu ke mana harus pilih, lalu sorotannya
   * hilang sendiri.
   */
  const jumpToPackages = () => {
    setHighlightBuy(true);
    buySectionRef.current?.scrollIntoView({ block: "start" });
    const timer = setTimeout(() => setHighlightBuy(false), 4000);
    return () => clearTimeout(timer);
  };

  // Build limits display: merge usage with limits from API
  const limits = {
    cvBuilds: data?.limits?.ai_cv_generate === "unlimited" ? Infinity : (data?.limits?.ai_cv_generate as number) ?? Infinity,
    checkerChecks: data?.limits?.cv_analyzer === "unlimited" ? Infinity : (data?.limits?.cv_analyzer as number) ?? 2,
    aiRevisions: data?.limits?.ai_revision === "unlimited" ? Infinity : (data?.limits?.ai_revision as number) ?? 3,
    aiSuggestions: data?.limits?.ai_suggestion === "unlimited" ? Infinity : (data?.limits?.ai_suggestion as number) ?? 3,
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Section: Langganan & Penagihan */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">credit_card</span>
          </div>
          <div>
            <h2 className="font-headline-md text-lg text-on-surface">{t("billing.title")}</h2>
            <p className="text-label-sm text-on-surface-variant">{t("billing.subtitle")}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-error font-label-bold">{error}</div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Current Plan */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-label-bold text-on-surface">{t("billing.current-plan")}</h3>
                <div className="flex items-center gap-3">
                  {data?.premium.tierName && data?.premium.tierName !== "Free" && (
                    <span className="text-label-sm text-on-surface-variant">{data.premium.tierName}</span>
                  )}
                  <span
                    className={`px-4 py-1.5 rounded-full text-label-sm font-bold ${
                      data?.premium.isPremium
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-outline"
                    }`}
                  >
                    {data?.premium.isPremium ? t("billing.premium") : t("billing.free")}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/50">
                  <p className="text-label-sm text-on-surface-variant">
                    {data?.premium.isPremium ? t("billing.days-remaining") : t("billing.status")}
                  </p>
                  <p className="text-headline-md text-primary mt-1">
                    {data?.premium.isPremium ? data?.premium.daysRemaining : "-"}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    {data?.premium.isPremium ? t("billing.from-30-days") : t("billing.activate")}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/50">
                  <p className="text-label-sm text-on-surface-variant">{t("billing.total-cvs")}</p>
                  <p className="font-label-bold text-on-surface mt-1">
                    {data?.usage.cvBuilds ?? 0}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">{t("billing.this-month")}</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/50">
                  <p className="text-label-sm text-on-surface-variant">{t("billing.total-spent")}</p>
                  <p className="font-label-bold text-on-surface mt-1">
                    Rp {(data?.payments.totalSpent ?? 0).toLocaleString("id-ID")}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">{t("billing.all-time")}</p>
                </div>
              </div>
            </div>

            {/* Usage */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-label-bold text-on-surface">{t("billing.usage-title")}</h3>
                <button
                  type="button"
                  onClick={jumpToPackages}
                  className="inline-flex min-h-11 items-center gap-2 px-4 rounded-xl border border-primary/40 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  <span className="material-symbols-outlined text-lg">shopping_bag</span>
                  {t("billing.jump-to-packages")}
                </button>
              </div>
              <div className="space-y-4">
                <UsageBar
                  label="CV Dibuat"
                  used={data?.usage.cvBuilds ?? 0}
                  total={limits.cvBuilds}
                />
                <UsageBar
                  label="Cek CV (Checker)"
                  used={data?.usage.checkerChecks ?? 0}
                  total={limits.checkerChecks}
                />
                <UsageBar
                  label="AI Smart Revision"
                  used={data?.usage.aiRevisions ?? 0}
                  total={limits.aiRevisions}
                />
                <UsageBar
                  label="AI Suggestions"
                  used={data?.usage.aiSuggestions ?? 0}
                  total={limits.aiSuggestions}
                />
              </div>
            </div>

{/* Buy Package */}
            <div id="beli-paket" ref={buySectionRef} className={`pt-6 border-t scroll-mt-24 ${highlightBuy ? "ring-2 ring-primary/50 rounded-2xl bg-primary/[0.03] px-4 py-4 -mx-4 transition-shadow" : "border-outline-variant/50"}`}>
              <h3 className="font-label-bold text-on-surface mb-1">{t("billing.buy-package")}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{t("billing.buy-package-hint")}</p>

              {!catalogLoading && catalogPackages.length === 0 ? (
                <p className="text-sm text-on-surface-variant">{t("billing.empty-catalog")}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catalogPackages.map((pkg) => (
                    <PackageCard
                      key={pkg.key}
                      t={t}
                      pkg={pkg}
                      highlighted={pkg.monthly}
                      busy={checkoutLoading === pkg.key}
                      onBuy={pkg.key === "single_cv" ? handleSingleCvClick : () => goToCheckout(pkg.key)}
                    />
                  ))}

                </div>
              )}
            </div>

{/* Billing History */}
            {data?.payments.history && data.payments.history.length > 0 && (
              <div className="pt-6 border-t border-outline-variant/50">
                <h3 className="font-label-bold text-on-surface mb-4">{t("billing.billing-history")}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-label-sm text-on-surface-variant border-b border-outline-variant/50">
                        <th className="pb-3 font-bold px-2">{t("billing.date")}</th>
                        <th className="pb-3 font-bold px-2">{t("billing.description")}</th>
                        <th className="pb-3 font-bold px-2">{t("billing.amount")}</th>
                        <th className="pb-3 font-bold px-2">{t("billing.status")}</th>
                      </tr>
                    </thead>
                    <tbody className="text-body-md">
                      {data.payments.history.map((tx) => (
                        <tr key={tx.id} className="border-b border-outline-variant/40">
                          <td className="py-3 px-2 text-on-surface-variant">
                            {tx.paidAt
                              ? new Date(tx.paidAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="py-3 px-2 font-label-bold text-on-surface">
                            {describePackageKeys(
                              tx.packageType,
                              packageNameByKey,
                              currentEquivalentPackage,
                            )}
                          </td>
                          <td className="py-3 px-2 text-on-surface">
                            Rp {tx.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-label-sm font-bold">
                              {t("billing.paid-label")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Single CV Picker Modal */}
      {showCvPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCvPicker(false); }}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-outline-variant/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <h3 className="font-label-bold text-on-surface">{t("billing.pick-cv")}</h3>
                <p className="text-label-sm text-on-surface-variant">{t("billing.pick-cv-subtitle")}</p>
              </div>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
              {cvListLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
                </div>
              ) : cvList.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-2">description</span>
                  <p className="text-sm font-medium">{t("billing.no-cv-title")}</p>
                  <p className="text-xs mt-1">{t("billing.no-cv-desc")}</p>
                </div>
              ) : (
                cvList.map((cv) => (
                  <button
                    key={cv.id}
                    onClick={() => setSelectedCvId(cv.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedCvId === cv.id
                        ? "border-secondary bg-secondary/5"
                        : "border-outline-variant/50 hover:border-secondary/30 hover:bg-surface-container-low"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedCvId === cv.id ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-outline"
                    }`}>
                      <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-bold text-sm text-on-surface truncate">{cv.jobTitle || "CV tanpa judul"}</p>
                      <p className="text-xs text-on-surface-variant">{new Date(cv.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    {selectedCvId === cv.id && (
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="px-4 py-3 border-t border-outline-variant/50 flex gap-3">
              <button
                onClick={() => setShowCvPicker(false)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-all"
              >
                {t("billing.cancel")}
              </button>
              <button
onClick={() => {
                  if (!selectedCvId) { addToast({ type: "warning", message: t("billing.pick-cv-first") }); return; }
                  setShowCvPicker(false);
                  goToCheckout("single_cv");
                }}
                disabled={!selectedCvId}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
              >
                {t("billing.continue")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi top-up sukses. Muncul sekali per pembayaran, lalu ditutup
          sendiri supaya tidak menghalangi pemakaian halaman. */}
      {topupDone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setTopupDone(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface-container-lowest border border-outline-variant/50 shadow-soft p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-green-600/10 text-green-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h3 className="font-headline-lg text-lg font-bold text-on-surface">{t("billing.topup-done-title")}</h3>
            <p className="text-sm text-on-surface-variant mt-1">{t("billing.topup-done-desc")}</p>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-container px-4 py-3">
              <span className="text-sm text-on-surface-variant">{topupDone.packageType}</span>
              <span className="font-bold text-on-surface">Rp{topupDone.amount.toLocaleString("id-ID")}</span>
            </div>
            <button
              type="button"
              onClick={() => setTopupDone(null)}
              className="mt-4 w-full py-3 rounded-xl bg-primary text-on-primary font-bold"
            >
              {t("billing.continue")}
            </button>
          </div>
        </div>
      )}

      {/* Minta testimoni setelah pembayaran masuk. Testimoni masuk antrean admin,
          jadi tidak ada yang bisa terbit sendiri tanpa ditinjau. */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant/50 p-6">
        <TestimonialRequest />
      </section>

      {/* How to Pay Info */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant/50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined">info</span>
          </div>
          <div>
            <h3 className="font-label-bold text-on-surface mb-1">{t("billing.payment-info-title")}</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">{t("billing.payment-info-desc")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function UsageBar({
  label,
  used,
  total,
}: {
  label: string;
  used: number;
  total: number;
}) {
  const isUnlimited = total === Infinity;
  const pct = isUnlimited ? 0 : Math.min((used / total) * 100, 100);
  const isNearLimit = !isUnlimited && pct >= 80;
  const isAtLimit = !isUnlimited && pct >= 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-label-bold text-on-surface">{label}</span>
        <span className="text-on-surface-variant">
          {isUnlimited ? `${used} / \u221E` : `${used}/${total}`}
        </span>
      </div>
      <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
        {!isUnlimited && (
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? "bg-error"
                : isNearLimit
                  ? "bg-amber-500"
                  : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}
