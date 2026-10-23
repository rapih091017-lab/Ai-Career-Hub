"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import MagneticButton from "@/components/MagneticButton";
import {
  useCatalogPackages,
  formatRupiah,
  packageBenefits,
  benefitLabel,
} from "@/lib/pricing-catalog";
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
  // Nilainya sengaja membaca cv_analyzer: LinkedIn Optimizer memakai kelayakan
  // fitur yang sama dengan penghitung terpisah, jadi angkanya identik.
  { key: "cv_analyzer", labelKey: "pricing.compare.linkedin" },
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
  const [showComparison, setShowComparison] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSatuan, setActiveSatuan] = useState<PlanId>("bikin_cv");

  const { packages, loading: catalogLoading } = useCatalogPackages();

  /**
   * Isi pintu dibangun dari katalog, bukan dari daftar yang ditulis manual.
   * Harga, masa berlaku, dan daftar hak diambil apa adanya dari database,
   * sehingga yang tertulis di landing tidak mungkin berbeda dari yang
   * ditagih di checkout.
   */
  const satuanPlans = useMemo(
    () =>
      SATUAN_PLAN_DATA.map((plan) => {
        const pkg = packages.find((p) => p.key === plan.key);
        return {
          id: plan.key as PlanId,
          nameKey: plan.nameKey,
          descKey: plan.descKey,
          price: pkg?.price ?? 0,
          periodDays: pkg?.periodDays ?? 30,
          benefits: pkg ? packageBenefits(pkg) : [],
        };
      }),
    [packages],
  );

  const monthlyPlans = useMemo(
    () =>
      LANGGANAN_PLAN_DATA.map((plan) => {
        const pkg = plan.isFree ? null : packages.find((p) => p.key === plan.key);
        return {
          id: plan.key as PlanId,
          nameKey: plan.nameKey,
          descKey: plan.descKey,
          price: plan.isFree ? 0 : (pkg?.price ?? 0),
          isFree: Boolean(plan.isFree),
        };
      }),
    [packages],
  );

  const activePlan = satuanPlans.find((plan) => plan.id === activeSatuan) ?? satuanPlans[0];
  const monthlyFrom = monthlyPlans.find((plan) => !plan.isFree)?.price ?? 0;
  const monthlyOrder = defaultMode === "langganan" ? "order-first lg:order-last" : "";

  return (
    <section id="pricing" className="relative bg-desk py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1240px] px-5 md:px-10">
        {/* ─── PRICE STAGE: dua pintu masuk ─── */}
        <div className="relative isolate overflow-hidden rounded-[28px] border-[2.5px] border-edge bg-stage p-6 text-on-dark shadow-[8px_8px_0_rgb(var(--c-print))] sm:p-9 lg:p-12">
          <span aria-hidden="true" className="absolute -top-[13px] left-1/2 h-6 w-[92px] -translate-x-1/2 rotate-3 bg-lime/85 shadow-[0_1px_0_rgba(0,0,0,0.18)]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(rgba(214,238,48,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(214,238,48,0.07)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(at_70%_40%,black_18%,transparent_74%)]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[55%] w-[55%] rounded-full bg-lime/25 blur-[60px]" />

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-x-16">
            <div data-reveal className="min-w-0 lg:col-span-2">
              <p className="mb-3 w-fit -rotate-2 font-script text-[26px] font-bold leading-none text-lime">
                {t("pricing.stage-kicker")}
              </p>
              <h2 className="max-w-[20ch] font-display text-[34px] leading-[1.04] tracking-[-0.03em] text-on-dark md:text-[52px]">
                {t("pricing.section-title")}
              </h2>
              <p className="mt-4 max-w-[46ch] text-[16.5px] leading-relaxed text-[#b8cfc3]">
                {t("pricing.value-satuan")}
              </p>
            </div>

            {/* ─── PINTU 1: paket satuan ─── */}
            <div data-reveal style={{ ["--reveal-delay" as string]: "0.1s" }} className="min-w-0 lg:pt-10">
              <div className="-rotate-1 rounded-[6px_6px_18px] border-[2.5px] border-edge bg-sheet p-5 text-on-sheet shadow-[5px_5px_0_#0a0f0d] sm:p-6">
                <p className="w-fit rounded-[6px] bg-brand-dark px-2.5 py-1 font-mono text-[11px] font-extrabold uppercase tracking-[0.06em] text-lime">
                  {t("pricing.door1.step")}
                </p>
                <p className="mb-3.5 mt-3 text-[15px] font-extrabold tracking-[-0.01em] text-primary">
                  {t("pricing.door1.title")}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {satuanPlans.map((plan) => {
                    const selected = plan.id === activePlan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setActiveSatuan(plan.id)}
                        aria-pressed={selected}
                        className={`min-h-[52px] rounded-full border-2 border-edge px-2.5 py-1.5 transition-all ${
                          selected
                            ? "-translate-x-px -translate-y-px bg-brand-dark text-on-dark shadow-[3px_3px_0_#0a0f0d]"
                            : "bg-sheet text-on-sheet hover:bg-lime hover:text-on-light"
                        }`}
                      >
                        <span className="block text-[13.5px] font-bold leading-tight">
                          {t(plan.nameKey)}
                        </span>
                        <span
                          className={`block font-mono text-[11px] font-bold ${
                            selected ? "text-lime" : "text-on-sheet/70"
                          }`}
                        >
                          {formatRupiah(plan.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 border-t-2 border-dashed border-edge/45 pt-4">
                  <p className="font-display text-[24px] font-bold leading-[1.08] tracking-[-0.03em] text-on-sheet">
                    {t(activePlan.descKey)}
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {activePlan.benefits.map((benefit) => (
                      <li
                        key={benefit.key}
                        className="flex items-start gap-2.5 text-sm font-bold leading-snug"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-[1.5px] border-on-light bg-lime"
                        />
                        {benefitLabel(benefit, t)}
                      </li>
                    ))}
                    {activePlan.benefits.length === 0 && !catalogLoading ? (
                      <li className="text-sm font-bold text-on-sheet/70">
                        {t("pricing.benefit-note")}
                      </li>
                    ) : null}
                  </ul>
                  <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <b className="font-display text-[38px] font-bold leading-none tracking-[-0.04em]">
                      {formatRupiah(activePlan.price)}
                    </b>
                    <span className="text-[12.5px] font-extrabold text-on-sheet/70">
                      {activePlan.periodDays} {t("billing.period.days")}
                    </span>
                  </div>

                  {onSelectPlan ? (
                    <button
                      type="button"
                      onClick={() => onSelectPlan(activePlan.id, "satuan")}
                      className="mt-3 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[18px] border-[3px] border-on-light bg-lime text-[16px] font-bold text-on-light shadow-[0_5px_0_#0a0f0d] transition-all hover:-translate-y-0.5 active:translate-y-1"
                    >
                      {t("pricing.cta-buy")}
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </button>
                  ) : (
                    <Link
                      href={`/checkout?packages=${activePlan.id}`}
                      className="mt-3 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[18px] border-[3px] border-on-light bg-lime text-[16px] font-bold text-on-light shadow-[0_5px_0_#0a0f0d] transition-all hover:-translate-y-0.5 active:translate-y-1"
                    >
                      {t("pricing.cta-buy")}
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </Link>
                  )}
                </div>
              </div>

              <p className="mt-4 w-fit -rotate-2 font-script text-[23px] font-bold leading-tight text-lime">
                {t("pricing.bridge")}
              </p>
              <Link
                href="/checkout"
                className="inline-flex min-h-[44px] w-fit items-center gap-2 text-[14.5px] font-extrabold text-on-dark underline decoration-lime decoration-[3px] underline-offset-4 hover:text-lime"
              >
                {t("pricing.see-all")}
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  arrow_outward
                </span>
              </Link>
            </div>

            {/* ─── PINTU 2: pass bulanan ─── */}
            <div
              data-reveal
              style={{ ["--reveal-delay" as string]: "0.18s" }}
              className={`min-w-0 ${monthlyOrder}`}
            >
              <div className="relative mx-auto max-w-[420px]">
                <span
                  aria-hidden="true"
                  className="absolute -top-10 left-1/2 h-12 w-7 -translate-x-1/2 rounded-t-[6px] bg-[repeating-linear-gradient(#0a0f0d_0_10px,#2d5a48_10px_20px)]"
                />
                <div
                  className="animate-ach-pass-sway relative overflow-hidden rounded-[24px] border-[3px] border-on-light px-5 pb-5 pt-11 text-on-light shadow-[0_0_0_4px_rgba(214,238,48,0.24),0_24px_48px_rgba(0,0,0,0.45)] sm:px-7"
                  style={{
                    // Gradien tetap terang di kedua mode, jadi teks di atasnya
                    // memakai `text-on-light`, bukan token yang berbalik.
                    background:
                      "conic-gradient(from 210deg at 35% 25%, rgb(var(--c-lime-bright)), rgb(var(--c-lime)) 32%, rgb(var(--c-lime-bright)) 58%, rgb(var(--c-lime)) 82%, rgb(var(--c-lime-bright)))",
                    // Ayunan pass berhenti di sudut ini; angkanya satu dengan
                    // rotasi statis sebelumnya supaya tidak ada lompatan.
                    ["--tilt" as string]: "1.6deg",
                  }}
                >
                  {/* Kilau foil: satu sapuan 4,5s, meniru foil di kartu akses. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay animate-ach-pass-foil"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.75) 45%, transparent 60%) 0 0 / 250% 100%",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-3.5 h-3.5 w-14 -translate-x-1/2 rounded-full border-2 border-on-light bg-evergreen-deep"
                  />
                  <span className="absolute -right-12 top-[30px] w-[190px] rotate-45 bg-brand-dark py-1.5 text-center font-mono text-[11px] font-extrabold uppercase tracking-[0.12em] text-lime">
                    {t("pricing.door2.ribbon")}
                  </span>

                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.04em]">
                    {t("pricing.door2.meta")}
                  </p>
                  <h3 className="mt-1 font-display text-[34px] leading-none tracking-[-0.04em]">
                    {t("pricing.door2.title")}
                  </h3>
                  <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
                    <b className="font-display text-[42px] font-bold leading-none tracking-[-0.05em]">
                      {formatRupiah(monthlyFrom)}
                    </b>
                    <span className="text-[13px] font-extrabold text-brand-green">
                      /bulan, {t("pricing.door2.from")}
                    </span>
                  </div>
                  <p className="mt-2 w-fit rounded-full border-2 border-on-light bg-brand-dark px-2.5 py-0.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.08em] text-lime">
                    {t("pricing.door2.stop")}
                  </p>

                  <span
                    aria-hidden="true"
                    className="relative my-5 block border-t-[2.5px] border-dashed border-on-light/45"
                  >
                    <span className="absolute -top-[13px] left-4 h-5 w-5 rounded-full border-[3px] border-on-light bg-evergreen-deep" />
                    <span className="absolute -top-[13px] right-4 h-5 w-5 rounded-full border-[3px] border-on-light bg-evergreen-deep" />
                  </span>

                  <ul className="grid gap-2">
                    {monthlyPlans.map((plan) => (
                      <li
                        key={plan.id}
                        className="flex items-start justify-between gap-3 rounded-[10px] border-2 border-on-light bg-cream px-3 py-2"
                      >
                        <div>
                          <b className="block font-display text-[15px] leading-tight">
                            {t(plan.nameKey)}
                          </b>
                          <span className="block text-[11.5px] font-bold leading-snug">
                            {t(plan.descKey)}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-[12px] font-extrabold">
                          {plan.isFree ? t("pricing.plan.free.name") : formatRupiah(plan.price)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/checkout"
                    className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border-[3px] border-on-light bg-lime text-[15px] font-bold text-on-light transition-all hover:-translate-y-0.5 active:translate-y-0.5"
                  >
                    {t("pricing.door2.cta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FOOTNOTE ─── */}
        <motion.div
          className="mt-7 space-y-2 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-ink-soft">{t("pricing.footnote-payment")}</p>
          <p className="text-sm text-ink-soft">{t("pricing.footnote-cancel")}</p>
          <p className="mx-auto max-w-2xl text-sm text-ink-soft">{t("pricing.fair-use-note")}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <div className="inline-flex items-center gap-2 rounded-xl border-2 border-edge bg-paper px-4 py-2 shadow-hard-ink-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-deep"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div className="text-left">
                <p className="text-xs font-bold text-ink">{t("pricing.garansi")}</p>
                <p className="text-xs text-ink-soft">{t("pricing.garansi-desc")}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border-2 border-edge bg-paper px-4 py-2 shadow-hard-ink-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-deep"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <div className="text-left">
                <p className="text-xs font-bold text-ink">{t("pricing.no-contract")}</p>
                <p className="text-xs text-ink-soft">{t("pricing.no-contract-desc")}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── COMPARISON TABLE ─── */}
        <motion.div
          className="mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-label-bold text-green-deep transition-colors hover:bg-lime/20"
          >
            <span>{t("pricing.comparison-toggle")}</span>
            <motion.span
              animate={{ rotate: showComparison ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="material-symbols-outlined text-lg"
            >
              expand_more
            </motion.span>
          </button>
          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-2 overflow-hidden rounded-[14px] border-[2.5px] border-edge bg-paper shadow-hard-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-hairline bg-surface-container-low">
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">{t("pricing.comparison-header")}</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Free</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Lite</th>
                          <th className="bg-lime/25 p-4 text-label-sm font-bold text-ink">Pro</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARISON_ROWS.map((row, i) => (
                          <tr key={row.labelKey} className={`border-b border-hairline ${i % 2 === 0 ? "bg-paper" : "bg-surface-container-low/50"}`}>
                            <td className="p-4 text-sm font-medium text-on-surface">{t(row.labelKey)}</td>
                            <td className="p-4 text-sm text-on-surface-variant">{freeCell(row.key, t)}</td>
                            <td className="p-4 text-sm text-on-surface-variant">{limitCell(packages, "lite_bulanan", row.key, t)}</td>
                            <td className="bg-lime/25 p-4 text-sm font-semibold text-ink">{limitCell(packages, "pro_bulanan", row.key, t)}</td>
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

        {/* ─── FAQ ─── */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="mb-8 text-center font-display text-ink">{t("pricing.faq-title")}</h3>
          <div className="mx-auto max-w-2xl divide-y divide-hairline overflow-hidden rounded-[14px] border-[2.5px] border-edge bg-paper shadow-hard-sm">
            {FAQ_KEYS.map((idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-lime/15"
                >
                  <span className="flex-1 font-label-bold text-sm text-on-surface">{t("pricing.faq." + idx + ".q")}</span>
                  <motion.span
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="material-symbols-outlined shrink-0 text-on-surface-variant"
                  >
                    expand_more
                  </motion.span>
                </button>
                <div
                  className="accordion-content"
                  style={{
                    maxHeight: openFaq === idx ? "900px" : "0px",
                    paddingBottom: openFaq === idx ? "1.25rem" : "0px",
                  }}
                >
                  <p className="px-6 text-sm leading-relaxed text-on-surface-variant">
                    {t("pricing.faq." + idx + ".a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
