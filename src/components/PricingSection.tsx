"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import TiltCard from "@/components/TiltCard";
import MagneticButton from "@/components/MagneticButton";
import { useCatalogPackages, formatRupiah, packageBenefits } from "@/lib/pricing-catalog";
import { FREE_LIMITS } from "@/lib/package-catalog-static";

/* ─── Types ─── */

export type BillingMode = "satuan" | "langganan";
/**
 * Plan id = kunci paket di katalog, supaya kartu di landing dan yang dibayar
 * di checkout tidak pernah berbeda. `free` adalah satu-satunya id tanpa
 * paket (tidak dibeli).
 */
export type PlanId =
  | "cek_cv" | "bikin_cv" | "surat_lamaran" | "paket_lamaran"
  | "free" | "lite_bulanan" | "pro_bulanan" | "max_bulanan";

interface Feature {
  key: string;
  included: boolean;
}

/**
 * Data paket untuk landing.
 *
 * Harga dan daftar isi kartu BUKAN ditulis di sini. Keduanya dibaca dari
 * katalog database lewat `useCatalogPackages()`, supaya yang tertulis di kartu
 * selalu sama dengan yang benar-benar dibayar saat checkout. Kalau kuota paket
 * berubah, teksnya ikut berubah tanpa perlu disunting.
 */

interface LandingPlan {
  /** Kunci paket di katalog. */
  key: string;
  /** Kunci i18n untuk nama dan deskripsi singkat. */
  nameKey: string;
  descKey: string;
  unitKey: string;
  icon: string;
  ctaStyle: "filled" | "outline" | "ghost" | "muted";
  featured?: boolean;
  badgeKey?: string;
  microcopyKey?: string;
  /** Paket gratis: tanpa kunci katalog. */
  isFree?: boolean;
}

/** Paket satuan: satu hasil yang dibeli sekali, berlaku 30 hari. */
const SATUAN_PLAN_DATA: LandingPlan[] = [
  {
    key: "cek_cv",
    nameKey: "pricing.plan.cek-cv.name",
    descKey: "pricing.plan.cek-cv.desc",
    unitKey: "pricing.unit.one-check",
    icon: "fact_check",
    ctaStyle: "outline",
  },
  {
    key: "bikin_cv",
    nameKey: "pricing.plan.bikin-cv.name",
    descKey: "pricing.plan.bikin-cv.desc",
    unitKey: "pricing.unit.per-cv",
    icon: "auto_awesome",
    ctaStyle: "outline",
  },
  {
    key: "surat_lamaran",
    nameKey: "pricing.plan.surat.name",
    descKey: "pricing.plan.surat.desc",
    unitKey: "pricing.unit.one-letter",
    icon: "mail",
    ctaStyle: "outline",
  },
{
    key: "paket_lamaran",
    nameKey: "pricing.plan.paket-lamaran.name",
    descKey: "pricing.plan.paket-lamaran.desc",
    unitKey: "pricing.unit.one-application",
    icon: "workspace_premium",
    ctaStyle: "filled",
    featured: true,
    badgeKey: "pricing.badge-lamaran",
    microcopyKey: "pricing.plan.paket-lamaran.microcopy",
  },
];

/** Paket bulanan: 30 hari, dibayar sekali, tidak diperpanjang otomatis. */
const LANGGANAN_PLAN_DATA: LandingPlan[] = [
  {
    key: "free",
    nameKey: "pricing.plan.free.name",
    descKey: "pricing.plan.free.desc",
    unitKey: "pricing.unit.forever",
    icon: "card_giftcard",
    ctaStyle: "filled",
    isFree: true,
    badgeKey: "pricing.badge-free",
  },
  {
    key: "lite_bulanan",
    nameKey: "pricing.plan.lite.name",
    descKey: "pricing.plan.lite.desc",
    unitKey: "pricing.unit.per-month",
    icon: "rocket_launch",
    ctaStyle: "outline",
  },
  {
    key: "pro_bulanan",
    nameKey: "pricing.plan.pro.name",
    descKey: "pricing.plan.pro.desc",
    unitKey: "pricing.unit.per-month",
    icon: "workspace_premium",
    ctaStyle: "filled",
    featured: true,
    badgeKey: "pricing.badge-populer",
    microcopyKey: "pricing.plan.pro.microcopy",
  },
  {
    key: "max_bulanan",
    nameKey: "pricing.plan.max.name",
    descKey: "pricing.plan.max.desc",
    unitKey: "pricing.unit.per-month",
    icon: "business_center",
    ctaStyle: "outline",
    microcopyKey: "pricing.plan.max.microcopy",
  },
];

/** Baris tabel perbandingan: nilai diambil dari katalog, bukan ditulis manual. */
const COMPARISON_ROWS: { key: string; labelKey: string }[] = [
  { key: "ai_cv_generate", labelKey: "pricing.compare.ai-gen" },
  { key: "cv_analyzer", labelKey: "pricing.compare.analyzer" },
  { key: "ai_revision", labelKey: "pricing.compare.ai-revision" },
  { key: "ai_suggestion", labelKey: "pricing.compare.ai-suggestion" },
  { key: "cover_letter", labelKey: "pricing.compare.cover-letter" },
  { key: "portfolio_web", labelKey: "pricing.compare.portfolio" },
  { key: "pdf_export", labelKey: "pricing.compare.pdf-export" },
];

const FAQ_KEYS = [0, 1, 2, 3, 4, 5, 6];




/* ─── Component ─── */

/** Satu sel tabel perbandingan, nilainya dari kuota paket di katalog. */
function limitCell(
  packages: { key: string; limits?: Record<string, number | "unlimited" | false> }[],
  packageKey: string,
  featureKey: string,
  t: (key: string) => string,
): string {
  const value = packages.find((p) => p.key === packageKey)?.limits?.[featureKey];
  if (value === false || value === undefined) return "—";
  if (value === "unlimited") return t("pricing.table.unlimited");
  return `${value}x`;
}

/** Sel untuk paket gratis. */
function freeCell(featureKey: string, t: (key: string) => string): string {
  const value = FREE_LIMITS[featureKey];
  if (value === false) return "—";
  // Portfolio bukan kuota bulanan: ia percobaan berbatas waktu, jadi ditulis
  // apa adanya supaya tidak terbaca seperti jatah yang datang tiap bulan.
  if (featureKey === "portfolio_web") return t("pricing.table.portfolio-trial");
  if (value === "unlimited") return t("pricing.table.unlimited");
  return `${value}x`;
}
interface PricingSectionProps {
  defaultMode?: BillingMode;
  onSelectPlan?: (planId: PlanId, mode: BillingMode) => void;
}

export default function PricingSection({ defaultMode = "satuan", onSelectPlan }: PricingSectionProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<BillingMode>(defaultMode);
  const [showComparison, setShowComparison] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { packages, loading: catalogLoading } = useCatalogPackages();

  /**
   * Kartu dibangun dari katalog, bukan dari daftar yang ditulis manual.
   * Harga, masa berlaku, dan daftar hak diambil apa adanya dari database,
   * sehingga yang tertulis di landing tidak mungkin berbeda dari yang
   * ditagih di checkout.
   */
  const plans = useMemo(() => {
    const raw = mode === "satuan" ? SATUAN_PLAN_DATA : LANGGANAN_PLAN_DATA;
    return raw.map((plan) => {
      const pkg = plan.isFree ? null : packages.find((p) => p.key === plan.key);
      const benefits = pkg ? packageBenefits(pkg) : [];
      return {
        id: plan.key as PlanId,
        nameKey: plan.nameKey,
        descKey: plan.descKey,
        ctaKey: plan.isFree ? "pricing.plan.free.cta" : "pricing.cta-buy",
        unitKey: plan.unitKey,
        icon: plan.icon,
        ctaStyle: plan.ctaStyle,
        featured: plan.featured,
        badgeKey: plan.badgeKey,
        microcopyKey: plan.microcopyKey,
        price: plan.isFree ? 0 : (pkg?.price ?? 0),
        periodDays: pkg?.periodDays ?? 30,
        monthly: pkg?.monthly ?? false,
        // benefits: teks fitur apa adanya dari kuota paket.
        features: benefits.map((b) => ({ key: `benefit.${b.key}`, included: true, value: b.value })),
      };
    });
  }, [mode, packages]);

  // Harga paket lengkap dihitung dari paket satuan pembentuknya, supaya angka
  // penghematan yang ditampilkan benar, bukan angka yang diketik tangan.
  const bundleSeparateTotal = useMemo(() => {
    const price = (key: string) => packages.find((p) => p.key === key)?.price ?? 0;
    return price("bikin_cv") + price("cek_cv") + price("surat_lamaran");
  }, [packages]);

  return (
    <section id="pricing" className="relative overflow-hidden bg-paper py-24 md:py-32">
      {/* Sorot radial lime di belakang judul, satu-satunya efek lembut di sini */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-lime/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-margin-mobile md:px-gutter">
        {/* ─── HEADER ─── */}
        <motion.div className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="font-display text-[36px] md:text-display text-ink mb-4 leading-tight">
            {t("pricing.section-title")}
          </h2>
          <p className="text-body-md text-ink-soft max-w-xl mx-auto text-[17px]">
            {t("pricing.section-subtitle")}
          </p>
        </motion.div>

        {/* ─── TOGGLE ─── */}
        <div className="flex justify-center mb-10">
          <motion.div className="inline-flex bg-paper rounded-full p-1.5 shadow-hard-ink-sm border-[2.5px] border-ink"
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}>
            {(["satuan", "langganan"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`relative px-6 md:px-8 py-3 rounded-full text-sm font-bold transition-all duration-200 ${mode === m ? "text-lime" : "text-on-surface-variant hover:text-on-surface"}`}>
                {mode === m && (
                  <motion.div layoutId="pricing-toggle-bg" className="absolute inset-0 bg-ink rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                )}
                <span className="relative z-10">{m === "satuan" ? t("pricing.toggle-satuan") : t("pricing.toggle-langganan")}</span>
                {mode === "satuan" && m === "langganan" && (
                  <span className="relative z-10 ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    {t("pricing.badge-hemat")}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </div>

        {/* ─── VALUE FRAMING per mode ─── */}
        <div className="mx-auto mb-8 max-w-xl text-center">
          <p className="text-body-md text-on-surface-variant">
            {mode === "satuan" ? t("pricing.value-satuan") : t("pricing.value-langganan")}
          </p>
        </div>

        {/* ─── BUNDLE HERO (mode langganan) ─── */}
        {mode === "langganan" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden mb-6 rounded-xl border-[2.5px] border-ink bg-lime/15 shadow-hard p-6 md:p-8"
          >
            <span className="absolute top-0 right-6 inline-flex items-center gap-1.5 rounded-b-lg bg-ink px-3 py-1.5 text-xs font-bold text-lime">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">sell</span>
              {t("pricing.bundle.badge")}
            </span>
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex-1 pr-16 md:pr-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-green-deep" aria-hidden="true">workspace_premium</span>
                  <h3 className="font-display text-lg md:text-xl text-ink">
                    {t("pricing.bundle.title")}
                  </h3>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-display font-bold tabular-nums text-[32px] leading-none text-ink">
                    {formatRupiah(packages.find((p) => p.key === "paket_lamaran")?.price ?? 0)}
                  </span>
                  {/* Masa validity dibaca dari katalog, bukan diketik tangan:
                      dulu di sini tertulis 60 hari padahal paketnya 30. */}
                  <span className="text-xs text-ink-soft">
                    / {packages.find((p) => p.key === "paket_lamaran")?.periodDays ?? 30} hari, sekali bayar
                  </span>
                </div>
                <p className="text-sm text-ink-soft max-w-2xl">{t("pricing.bundle.desc")}</p>
              </div>
              <div className="shrink-0">
                <MagneticButton>
                  <Link
                    href="/checkout?packages=paket_lamaran"
                    className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-lime px-6 font-display text-sm font-bold text-ink shadow-[0_4px_0_rgb(var(--c-ink))] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">rocket_launch</span>
                    {t("pricing.bundle.cta")}
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── PRICING CARDS ─── */}
        <AnimatePresence mode="wait">
          <motion.div key={mode}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => (
              <div key={plan.id} className="[perspective:800px]">
                <TiltCard tiltOptions={{ maxAngle: 5, scale: 1.01, glare: false }}>
                  <PricingCard plan={plan} delay={idx * 0.06} mode={mode} onSelectPlan={onSelectPlan} tFn={t} catalogLoading={catalogLoading} />
                </TiltCard>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ─── FOOTNOTE (langganan mode) ─── */}
        {mode === "langganan" && (
  <motion.div className="mb-8 text-center space-y-2"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <p className="text-sm text-on-surface-variant">{t("pricing.footnote-payment")}</p>
            <p className="text-sm text-on-surface-variant">{t("pricing.footnote-cancel")}</p>
            <p className="text-sm text-on-surface-variant max-w-2xl mx-auto">{t("pricing.fair-use-note")}</p>
            {/* Risk Reversal Badges */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-paper border-2 border-ink rounded-xl shadow-hard-ink-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-deep shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div className="text-left">
                  <p className="text-xs font-bold text-ink">{t("pricing.garansi")}</p>
                  <p className="text-xs text-ink-soft">{t("pricing.garansi-desc")}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-paper border-2 border-ink rounded-xl shadow-hard-ink-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-deep shrink-0"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <div className="text-left">
                  <p className="text-xs font-bold text-ink">{t("pricing.no-contract")}</p>
                  <p className="text-xs text-ink-soft">{t("pricing.no-contract-desc")}</p>
                </div>
              </div>
            </div>
  </motion.div>
        )}

        {/* ─── COMPARISON TABLE ─── */}
        <motion.div className="mt-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <button onClick={() => setShowComparison(!showComparison)}
            className="flex items-center justify-center gap-2 w-full py-4 text-primary font-label-bold hover:bg-primary/5 rounded-xl transition-colors">
            <span>{t("pricing.comparison-toggle")}</span>
            <motion.span animate={{ rotate: showComparison ? 180 : 0 }} transition={{ duration: 0.2 }}
              className="material-symbols-outlined text-lg">expand_more</motion.span>
          </button>
          <AnimatePresence>
            {showComparison && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                <div className="bg-paper rounded-xl border-2 border-ink/20 overflow-hidden shadow-hard-sm mt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-hairline">
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">{t("pricing.comparison-header")}</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Free</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Lite</th>
                          <th className="p-4 text-label-sm font-bold text-ink bg-lime/25">Pro</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARISON_ROWS.map((row, i) => (
                          <tr key={row.labelKey} className={`border-b border-hairline ${i % 2 === 0 ? "bg-paper" : "bg-surface-container-low/50"}`}>
                            <td className="p-4 text-sm font-medium text-on-surface">{t(row.labelKey)}</td>
                            <td className="p-4 text-sm text-on-surface-variant">{freeCell(row.key, t)}</td>
                            <td className="p-4 text-sm text-on-surface-variant">{limitCell(packages, "lite_bulanan", row.key, t)}</td>
                            <td className="p-4 text-sm font-semibold text-ink bg-lime/25">{limitCell(packages, "pro_bulanan", row.key, t)}</td>
                            <td className="p-4 text-sm text-on-surface-variant">{limitCell(packages, "max_bulanan", row.key, t)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── BUNDLE BOX (satuan mode only) ─── */}
        {mode === "satuan" && (
          <motion.div className="mt-8"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 }}>
            <div className="relative overflow-hidden rounded-xl bg-lime/15 border-[2.5px] border-ink shadow-hard p-6 md:p-8">
              <div className="absolute top-0 right-0 w-40 h-40 bg-lime/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-2xl text-ink shrink-0"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                    <h4 className="font-display text-lg text-ink">{t("pricing.bundle-title")}</h4>
                  </div>
                  <p className="text-sm text-ink-soft">{t("pricing.bundle-desc")}</p>
                </div>
                <div className="md:ml-auto flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold text-ink">
                      {formatRupiah(packages.find((p) => p.key === "paket_lamaran")?.price ?? 0)}
                    </p>
                    <p className="text-xs text-ink-soft line-through">
                      {formatRupiah(bundleSeparateTotal)}
                    </p>
                  </div>
                  <MagneticButton>
                    <Link href="/checkout?packages=paket_lamaran"
                      className="inline-flex items-center gap-2 px-6 py-3 border-[2.5px] border-ink bg-lime text-ink rounded-full font-bold shadow-[0_4px_0_rgb(var(--c-ink))] hover:-translate-y-0.5 active:scale-[0.98] transition-all whitespace-nowrap">
                      {t("pricing.bundle-cta")}
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── SURAT LAMARAN BANNER (satuan mode only) ─── */}
        {mode === "satuan" && (
          <motion.div className="mt-6"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.15 }}>
            <div className="relative overflow-hidden rounded-xl bg-paper border-[2.5px] border-ink shadow-hard p-6 md:p-8">
              <div className="absolute top-0 right-0 w-40 h-40 bg-lime/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-deep text-2xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                    <h4 className="font-display text-lg text-ink">{t("pricing.surat-banner.title")}</h4>
                  </div>
                  <p className="text-sm text-ink-soft max-w-lg">{t("pricing.surat-banner.desc")}</p>
                </div>
                <div className="md:ml-auto flex flex-col sm:flex-row items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-lime/30 border border-ink/30 text-ink rounded-full text-xs font-bold whitespace-nowrap">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                    {t("pricing.surat-banner.free-note")}
                  </span>
                  <MagneticButton>
                    <Link href="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 border-[2.5px] border-ink bg-lime text-ink rounded-full font-bold shadow-[0_4px_0_rgb(var(--c-ink))] hover:-translate-y-0.5 active:scale-[0.98] transition-all whitespace-nowrap">
                      <span className="material-symbols-outlined text-lg">auto_awesome</span>
                      {t("pricing.surat-banner.cta")}
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── FAQ ─── */}
        <motion.div className="mt-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h3 className="font-display text-center text-ink mb-8">{t("pricing.faq-title")}</h3>
          <div className="max-w-2xl mx-auto divide-y divide-hairline bg-paper rounded-xl border-2 border-ink/15 shadow-hard-sm overflow-hidden">
            {FAQ_KEYS.map((idx) => (
              <div key={idx}>
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-lime/15 transition-colors">
                  <span className="font-label-bold text-sm text-on-surface flex-1">{t("pricing.faq." + idx + ".q")}</span>
                  <motion.span animate={{ rotate: openFaq === idx ? 180 : 0 }} transition={{ duration: 0.2 }}
                    className="material-symbols-outlined text-on-surface-variant shrink-0">expand_more</motion.span>
                </button>
                <div className="accordion-content" style={{ maxHeight: openFaq === idx ? "900px" : "0px", paddingBottom: openFaq === idx ? "1.25rem" : "0px" }}>
                  <p className="px-6 text-sm text-on-surface-variant leading-relaxed">{t("pricing.faq." + idx + ".a")}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Kartu paket. Isi dan harga berasal dari katalog, bukan dari teks statis. */

/**
 * Teks satu baris benefit, misalnya "3x AI CV Builder" atau
 * "Cover Letter tanpa batas". Diturunkan dari kuota paket supaya kartu dan
 * akun selalu sama.
 */
function benefitText(
  key: string,
  value: number | "unlimited" | undefined,
  t: (key: string) => string,
): string {
  const feature = key.replace("benefit.", "");
  const name = t(`billing.limit.${feature}`);
  if (value === undefined) return name;
  if (value === "unlimited") return `${name} ${t("billing.limit.unlimited")}`;
  return `${value}x ${name}`;
}

export interface PricingCardPlan {
  id: PlanId;
  nameKey: string;
  descKey: string;
  ctaKey: string;
  unitKey: string;
  icon: string;
  ctaStyle: "filled" | "outline" | "ghost" | "muted";
  featured?: boolean;
  badgeKey?: string;
  microcopyKey?: string;
  price: number;
  periodDays: number;
  monthly: boolean;
  features: { key: string; included: boolean; value: number | "unlimited" }[];
}

function PricingCard({ plan, delay, onSelectPlan, mode, tFn, catalogLoading }: {
  plan: PricingCardPlan;
  delay: number;
  onSelectPlan?: (planId: PlanId, mode: BillingMode) => void;
  mode: BillingMode;
  tFn: (key: string) => string;
  catalogLoading?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const t = tFn;

  const btnClass = {
    filled: "border-[2.5px] border-ink bg-lime text-ink font-bold shadow-[0_4px_0_rgb(var(--c-ink))] hover:-translate-y-0.5",
    outline: "border-[2.5px] border-ink/60 text-ink font-bold hover:border-ink hover:bg-lime/25",
    muted: "border-2 border-hairline text-on-surface-variant hover:bg-surface-container font-medium",
    ghost: "border-2 border-hairline text-on-surface-variant hover:bg-surface-container font-medium",
  };

  // Semua paket punya tujuannya sendiri: gratis ke /login,langsung ke checkout.
  const buttonClasses = "w-full py-3.5 rounded-full text-sm text-center transition-all active:scale-[0.97] " + btnClass[plan.ctaStyle];

  const handleClick = () => {
    if (onSelectPlan) onSelectPlan(plan.id, mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className={"relative flex flex-col rounded-[14px] transition-all duration-300 " + (
        plan.featured
          ? "lg:scale-105 z-10 border-[2.5px] border-ink bg-lime/15 shadow-hard"
          : "border-2 border-ink/20 bg-paper shadow-hard-sm hover:shadow-hard"
      ) + " " + (isHovered ? "translate-y-[-4px]" : "")}>
      {/* Badge */}
      {plan.badgeKey && (
        <div className={"absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-[2px_2px_0_rgb(var(--c-ink))] " + (
          plan.featured ? "bg-ink text-lime border-2 border-ink" : "bg-paper text-ink-soft border-2 border-ink/25"
        )}>
          {t(plan.badgeKey)}
        </div>
      )}
      {!plan.badgeKey && plan.id === "free" && mode === "langganan" && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-[2px_2px_0_rgb(var(--c-ink))] bg-ink text-lime border-2 border-ink">
          Gratis
        </div>
      )}
      <div className="p-6 md:p-8 flex flex-col flex-1">
        {/* Icon + Name */}
        <div className="mb-6">
          <div className={"w-12 h-12 rounded-[7px] border-2 border-ink flex items-center justify-center mb-4 " + (
            plan.featured ? "bg-ink text-lime" : "bg-lime/40 text-ink"
          )}>
            <span className="material-symbols-outlined text-[24px]">{plan.icon}</span>
          </div>                    <h3 className="font-display text-on-surface text-lg">{t(plan.nameKey)}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{t(plan.descKey)}</p>
                    {plan.id === "pro_bulanan" && (
                      <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-lime/30 border border-ink/40 rounded-full">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span className="text-xs font-bold text-ink">{t("pricing.best-value")}</span>
                      </div>
                    )}
                  </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold tracking-tight tabular-nums text-[36px] leading-none text-ink">
              {plan.price === 0 ? t("pricing.plan.free.name") : "Rp" + plan.price.toLocaleString("id-ID")}
            </span>
            <span className="text-sm text-ink-soft">{t(plan.unitKey)}</span>
          </div>
        </div>

        {/* Benefits: dibaca dari kuota paket, jadi kartu tidak pernah
            menjanjikan sesuatu yang tidak ada di akun. */}
        <div className="flex-1 space-y-3 mb-8">
          {plan.features.map((feat) => (
            <div key={feat.key} className="flex items-start gap-2.5">
              {feat.included ? (
                <span className="material-symbols-outlined text-[18px] text-green-deep shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              ) : (
                <span className="material-symbols-outlined text-[18px] text-ink/30 shrink-0 mt-0.5">cancel</span>
              )}
              <span className={"text-sm leading-relaxed " + (
                feat.included ? "text-on-surface" : "text-on-surface-variant line-through"
              )}>{benefitText(feat.key, feat.value, t)}</span>
            </div>
          ))}
          {plan.features.length === 0 && !catalogLoading ? (
            <p className="text-sm text-on-surface-variant">{t("pricing.benefit-note")}</p>
          ) : null}
        </div>

        {/* CTA */}
        {onSelectPlan ? (
          <MagneticButton className="w-full">
            <button onClick={handleClick} className={buttonClasses}>{t(plan.ctaKey)}</button>
          </MagneticButton>
        ) : (
          <MagneticButton className="w-full">
            <Link
              href={plan.id === "free" ? "/login" : `/checkout?packages=${plan.id}`}
              className={buttonClasses + " block w-full"}
            >
              {t(plan.ctaKey)}
            </Link>
          </MagneticButton>
        )}

        {plan.microcopyKey && (
          <p className="text-center text-xs text-on-surface-variant mt-3 italic">{t(plan.microcopyKey)}</p>
        )}
      </div>
    </motion.div>
  );
}
