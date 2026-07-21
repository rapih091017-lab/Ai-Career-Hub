"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import TiltCard from "@/components/TiltCard";
import MagneticButton from "@/components/MagneticButton";

/* ─── Types ─── */

export type BillingMode = "satuan" | "langganan";
export type PlanId =
  | "cv-starter" | "cv-ai-generate" | "cv-analyzer" | "portfolio-web"
  | "free" | "starter" | "pro" | "business";

interface Feature {
  key: string;
  included: boolean;
}

interface PlanData {
  id: PlanId;
  nameKey: string;
  price: number;
  unit: string;
  unitKey: string;
  descKey: string;
  features: Feature[];
  ctaKey: string;
  ctaStyle: "filled" | "outline" | "ghost" | "muted";
  badgeKey?: string;
  featured?: boolean;
  icon: string;
  href?: string;
  microcopyKey?: string;
  originalPrice?: number;
}

const SATUAN_PLAN_DATA: Omit<PlanData, "nameKey" | "descKey" | "ctaKey" | "unitKey">[] = [
  {
    id: "cv-starter", price: 7000, unit: "per CV", icon: "description",
    ctaStyle: "outline", href: "/builder/new", featured: false,
    features: [
      { key: "pricing.feat.form-editor", included: true },
      { key: "pricing.feat.1-template", included: true },
      { key: "pricing.feat.pdf-export", included: true },
      { key: "pricing.feat.7-days", included: true },
    ],
  },
  {
    id: "cv-ai-generate", price: 12000, unit: "per CV", icon: "auto_awesome",
    ctaStyle: "filled", href: "/builder/new", featured: true, badgeKey: "pricing.badge-terlaris",
    microcopyKey: "pricing.plan.cv-ai.microcopy",
    features: [
      { key: "pricing.feat.ai-generate", included: true },
      { key: "pricing.feat.ai-revision", included: true },
      { key: "pricing.feat.3-templates", included: true },
      { key: "pricing.feat.realtime-preview", included: true },
      { key: "pricing.feat.pdf-ats", included: true },
      { key: "pricing.feat.30-days", included: true },
    ],
  },
  {
    id: "cv-analyzer", price: 9000, unit: "per analisis", icon: "fact_check",
    ctaStyle: "outline", href: "/checker",
    features: [
      { key: "pricing.feat.ats-score", included: true },
      { key: "pricing.feat.keyword-detect", included: true },
      { key: "pricing.feat.suggestions", included: true },
      { key: "pricing.feat.fast-analysis", included: true },
      { key: "pricing.feat.1-analysis", included: true },
    ],
  },
  {
    id: "portfolio-web", price: 35000, unit: "per portfolio", icon: "language",
    ctaStyle: "outline", href: "/portfolio", badgeKey: "pricing.badge-premium",
    features: [
      { key: "pricing.feat.ai-portfolio", included: true },
      { key: "pricing.feat.3-themes", included: true },
      { key: "pricing.feat.public-link", included: true },
      { key: "pricing.feat.mobile-responsive", included: true },
    ],
  },
];

const LANGGANAN_PLAN_DATA: Omit<PlanData, "nameKey" | "descKey" | "ctaKey" | "unitKey">[] = [
  {
    id: "free", price: 0, unit: "selamanya", icon: "card_giftcard",
    ctaStyle: "muted", href: "/login",
    features: [
      { key: "pricing.feat.1-cv", included: true },
      { key: "pricing.feat.preview-all", included: true },
      { key: "pricing.feat.ai-gen", included: false },
      { key: "pricing.feat.cv-analyzer", included: false },
      { key: "pricing.feat.portfolio-web", included: false },
    ],
  },
  {
    id: "starter", price: 15000, unit: "/ bulan", icon: "rocket_launch",
    ctaStyle: "outline", href: "/settings/billing", originalPrice: 19000,
    features: [
      { key: "pricing.feat.5-ai-gen", included: true },
      { key: "pricing.feat.5-templates", included: true },
      { key: "pricing.feat.pdf-unlimited", included: true },
      { key: "pricing.feat.save-3", included: true },
      { key: "pricing.feat.cv-analyzer", included: false },
      { key: "pricing.feat.portfolio-web", included: false },
    ],
  },
  {
    id: "pro", price: 29000, unit: "/ bulan", icon: "workspace_premium",
    ctaStyle: "filled", href: "/settings/billing", featured: true, badgeKey: "pricing.badge-populer",
    microcopyKey: "pricing.plan.pro.microcopy",
    features: [
      { key: "pricing.feat.unlimited-ai", included: true },
      { key: "pricing.feat.all-templates", included: true },
      { key: "pricing.feat.unlimited-analyzer", included: true },
      { key: "pricing.feat.ai-smart", included: true },
      { key: "pricing.feat.1-portfolio", included: true },
      { key: "pricing.feat.save-20", included: true },
      { key: "pricing.feat.priority", included: true },
    ],
  },
  {
    id: "business", price: 79000, unit: "/ bulan", icon: "business_center",
    ctaStyle: "outline", href: "mailto:hello@aicareerhub.com",
    features: [
      { key: "pricing.feat.up-to-20", included: true },
      { key: "pricing.feat.bulk-analyzer", included: true },
      { key: "pricing.feat.3-portfolios", included: true },
      { key: "pricing.feat.white-label", included: true },
      { key: "pricing.feat.unlimited-save", included: true },
      { key: "pricing.feat.priority-support", included: true },
    ],
  },
];

const FAQ_KEYS = [0, 1, 2, 3, 4];

const COMPARISON_ROW_KEYS = [
  { labelKey: "pricing.compare.ai-gen", free: "—", starter: "5x/bln", pro: "Unlimited", business: "20x/bln" },
  { labelKey: "pricing.compare.templates", free: "Preview", starter: "5", pro: "10+", business: "10+" },
  { labelKey: "pricing.compare.pdf-export", free: "—", starter: "✓", pro: "✓", business: "White-label" },
  { labelKey: "pricing.compare.analyzer", free: "—", starter: "—", pro: "Unlimited", business: "Bulk" },
  { labelKey: "pricing.compare.portfolio", free: "—", starter: "—", pro: "1 aktif", business: "3 aktif" },
  { labelKey: "pricing.compare.saved-cvs", free: "—", starter: "3", pro: "20", business: "Unlimited" },
  { labelKey: "pricing.compare.ai-revision", free: "—", starter: "—", pro: "✓", business: "✓" },
  { labelKey: "pricing.compare.priority-support", free: "—", starter: "—", pro: "—", business: "✓" },
];

/* ─── Component ─── */

interface PricingSectionProps {
  defaultMode?: BillingMode;
  onSelectPlan?: (planId: PlanId, mode: BillingMode) => void;
}

function makePlan(base: Omit<PlanData, "nameKey" | "descKey" | "ctaKey" | "unitKey">, t: (k: string) => string): PlanData {
  const id = base.id;
  const idMap: Record<string, { name: string; desc: string; cta: string; unit: string }> = {
    "cv-starter": { name: "pricing.plan.cv-starter.name", desc: "pricing.plan.cv-starter.desc", cta: "pricing.plan.cv-starter.cta", unit: "pricing.unit.per-cv" },
    "cv-ai-generate": { name: "pricing.plan.cv-ai.name", desc: "pricing.plan.cv-ai.desc", cta: "pricing.plan.cv-ai.cta", unit: "pricing.unit.per-cv" },
    "cv-analyzer": { name: "pricing.plan.analyzer.name", desc: "pricing.plan.analyzer.desc", cta: "pricing.plan.analyzer.cta", unit: "pricing.unit.per-analysis" },
    "portfolio-web": { name: "pricing.plan.portfolio.name", desc: "pricing.plan.portfolio.desc", cta: "pricing.plan.portfolio.cta", unit: "pricing.unit.per-portfolio" },
    "free": { name: "pricing.plan.free.name", desc: "pricing.plan.free.desc", cta: "pricing.plan.free.cta", unit: "pricing.unit.forever" },
    "starter": { name: "pricing.plan.starter.name", desc: "pricing.plan.starter.desc", cta: "pricing.plan.starter.cta", unit: "pricing.unit.per-month" },
    "pro": { name: "pricing.plan.pro.name", desc: "pricing.plan.pro.desc", cta: "pricing.plan.pro.cta", unit: "pricing.unit.per-month" },
    "business": { name: "pricing.plan.business.name", desc: "pricing.plan.business.desc", cta: "pricing.plan.business.cta", unit: "pricing.unit.per-month" },
  };
  const keys = idMap[id];
  return {
    ...base,
    nameKey: keys.name,
    descKey: keys.desc,
    ctaKey: keys.cta,
    unitKey: keys.unit,
  };
}

export default function PricingSection({ defaultMode = "satuan", onSelectPlan }: PricingSectionProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<BillingMode>(defaultMode);
  const [showComparison, setShowComparison] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = useMemo(() => {
    const raw = mode === "satuan" ? SATUAN_PLAN_DATA : LANGGANAN_PLAN_DATA;
    return raw.map((p) => makePlan(p, t));
  }, [mode, t]);

  return (
    <section id="pricing" className="relative overflow-hidden bg-gradient-to-b from-white via-[#f0fafb] to-white dark:from-[#0F0F0F] dark:via-[#1A1A2E] dark:to-[#0F0F0F] py-24 md:py-32">
      {/* Background Orbs */}
      <motion.div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none dark:bg-primary/10"
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none dark:bg-secondary/10"
        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }} />

      <div className="relative z-10 max-w-7xl mx-auto px-margin-mobile md:px-gutter">
        {/* ─── HEADER ─── */}
        <motion.div className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-block text-xs font-bold tracking-[0.15em] uppercase text-primary/70 bg-primary/5 dark:bg-primary/20 px-4 py-1.5 rounded-full mb-6">
            {t("nav.pricing")}
          </span>
          <h2 className="font-display text-[36px] md:text-display text-on-background dark:text-white mb-4 leading-tight">
            {t("pricing.section-title")}
          </h2>
          <p className="font-body-md text-on-surface-variant dark:text-gray-400 max-w-xl mx-auto text-[17px]">
            {t("pricing.section-subtitle")}
          </p>
        </motion.div>

        {/* ─── TOGGLE ─── */}
        <div className="flex justify-center mb-10">
          <motion.div className="inline-flex bg-white dark:bg-[#1F1F2E] rounded-2xl p-1.5 shadow-premium-md border border-outline-variant/30 dark:border-gray-700"
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}>
            {(["satuan", "langganan"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`relative px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${mode === m ? "text-white" : "text-on-surface-variant hover:text-on-surface"}`}>
                {mode === m && (
                  <motion.div layoutId="pricing-toggle-bg" className="absolute inset-0 bg-primary rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                )}
                <span className="relative z-10">{m === "satuan" ? t("pricing.toggle-satuan") : t("pricing.toggle-langganan")}</span>
                {mode === "satuan" && m === "langganan" && (
                  <span className="relative z-10 ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    {t("pricing.badge-hemat")}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </div>

        {/* ─── PRICING CARDS ─── */}
        <AnimatePresence mode="wait">
          <motion.div key={mode}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => (
              <div key={plan.id} className="[perspective:800px]">
                <TiltCard tiltOptions={{ maxAngle: 5, scale: 1.01, glare: false }}>
                  <PricingCard plan={plan} delay={idx * 0.06} mode={mode} onSelectPlan={onSelectPlan} tFn={t} />
                </TiltCard>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ─── BUNDLE BOX (satuan mode only) ─── */}
        {mode === "satuan" && (
          <motion.div className="mt-8"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 }}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/20 p-6 md:p-8">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-2xl shrink-0 animate-pulse"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                    <h4 className="font-label-bold text-lg text-on-surface">{t("pricing.bundle-title")}</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant">{t("pricing.bundle-desc")}</p>
                </div>
                <div className="md:ml-auto flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">Rp49.000</p>
                    <p className="text-xs text-on-surface-variant dark:text-gray-400 line-through">Rp56.000</p>
                  </div>
                  <MagneticButton>
                    <Link href="/settings/billing"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md whitespace-nowrap">
                      {t("pricing.bundle-cta")}
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── FOOTNOTE (langganan mode) ─── */}
        {mode === "langganan" && (
          <motion.div className="mt-8 text-center space-y-3"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <p className="text-sm text-on-surface-variant inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              {t("pricing.footnote-payment")}
            </p>
            <p className="text-sm text-on-surface-variant inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {t("pricing.footnote-cancel")}
            </p>
            {/* Risk Reversal Badges */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div className="text-left">
                  <p className="text-xs font-bold text-green-700">{t("pricing.garansi")}</p>
                  <p className="text-[10px] text-green-600">{t("pricing.garansi-desc")}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <div className="text-left">
                  <p className="text-xs font-bold text-blue-700">{t("pricing.no-contract")}</p>
                  <p className="text-[10px] text-blue-600">{t("pricing.no-contract-desc")}</p>
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
                <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-premium-sm mt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/30">
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">{t("pricing.comparison-header")}</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Free</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Starter</th>
                          <th className="p-4 text-label-sm font-bold text-primary bg-primary/5">Pro</th>
                          <th className="p-4 text-label-sm font-bold text-on-surface-variant">Business</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARISON_ROW_KEYS.map((row, i) => (
                          <tr key={row.labelKey} className={`border-b border-outline-variant/10 ${i % 2 === 0 ? "bg-white" : "bg-surface-container-low/50"}`}>
                            <td className="p-4 text-sm font-medium text-on-surface">{t(row.labelKey)}</td>
                            <td className="p-4 text-sm text-on-surface-variant">{row.free}</td>
                            <td className="p-4 text-sm text-on-surface-variant">{row.starter}</td>
                            <td className="p-4 text-sm font-semibold text-primary bg-primary/5">{row.pro}</td>
                            <td className="p-4 text-sm text-on-surface-variant">{row.business}</td>
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
        <motion.div className="mt-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h3 className="font-headline-md text-center text-on-surface dark:text-white mb-8">{t("pricing.faq-title")}</h3>
          <div className="max-w-2xl mx-auto divide-y divide-outline-variant/20 dark:divide-gray-700 bg-white dark:bg-[#1A1A2E] rounded-2xl border border-outline-variant/30 dark:border-gray-700 shadow-premium-sm overflow-hidden">
            {FAQ_KEYS.map((idx) => (
              <div key={idx}>
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                  <span className="font-label-bold text-sm text-on-surface flex-1">{t("pricing.faq." + idx + ".q")}</span>
                  <motion.span animate={{ rotate: openFaq === idx ? 180 : 0 }} transition={{ duration: 0.2 }}
                    className="material-symbols-outlined text-on-surface-variant shrink-0">expand_more</motion.span>
                </button>
                <div className="accordion-content" style={{ maxHeight: openFaq === idx ? "500px" : "0px", paddingBottom: openFaq === idx ? "1.25rem" : "0px" }}>
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

/* ─── Pricing Card ─── */

function PricingCard({ plan, delay, onSelectPlan, mode, tFn }: {
  plan: PlanData;
  delay: number;
  onSelectPlan?: (planId: PlanId, mode: BillingMode) => void;
  mode: BillingMode;
  tFn: (key: string) => string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const t = tFn;

  const btnClass = {
    filled: "bg-primary text-on-primary hover:brightness-110 shadow-md font-bold",
    outline: "border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold",
    muted: "border border-outline-variant text-on-surface-variant hover:bg-surface-container font-medium",
    ghost: "border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container font-medium",
  };

  const isExternal = plan.href?.startsWith("mailto:") || plan.href?.startsWith("https:");
  const buttonClasses = "w-full py-3.5 rounded-xl text-sm text-center transition-all active:scale-[0.97] " + btnClass[plan.ctaStyle];

  const handleClick = () => {
    if (onSelectPlan) onSelectPlan(plan.id, mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className={"relative flex flex-col rounded-2xl transition-all duration-300 " + (
        plan.featured
          ? "lg:scale-105 z-10 border-2 border-primary shadow-[0_8px_32px_rgba(13,115,119,0.15)] dark:shadow-[0_8px_32px_rgba(124,58,237,0.3)]"
          : "border border-outline-variant/40 dark:border-gray-700 shadow-premium-sm hover:shadow-premium-md"
      ) + " " + (isHovered ? "translate-y-[-4px]" : "") + " bg-white dark:bg-[#1A1A2E] dark:text-white"}>
      {/* Badge */}
      {plan.badgeKey && (
        <div className={"absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-md " + (
          plan.featured ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant border border-outline-variant/30"
        )}>
          {t(plan.badgeKey)}
        </div>
      )}
      {!plan.badgeKey && plan.id === "free" && mode === "langganan" && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shadow-md bg-emerald-500 text-white">
          Gratis
        </div>
      )}
      <div className="p-6 md:p-8 flex flex-col flex-1">
        {/* Icon + Name */}
        <div className="mb-6">
          <div className={"w-12 h-12 rounded-xl flex items-center justify-center mb-4 " + (
            plan.featured ? "bg-primary text-on-primary" : "bg-primary/10 text-primary"
          )}>
            <span className="material-symbols-outlined text-[24px]">{plan.icon}</span>
          </div>                    <h3 className="font-label-bold text-on-surface text-lg dark:text-white">{t(plan.nameKey)}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed dark:text-gray-400">{t(plan.descKey)}</p>
                    {plan.id === "pro" && (
                      <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span className="text-[11px] font-bold text-amber-700">{t("pricing.best-value")}</span>
                      </div>
                    )}
                  </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className={"font-bold tracking-tight " + (plan.featured ? "text-[36px]" : "text-[30px]") + " text-on-surface dark:text-white"}>
              {plan.price === 0 ? t("pricing.plan.free.name") : "Rp" + plan.price.toLocaleString("id-ID")}
            </span>
            <span className="text-sm text-on-surface-variant dark:text-gray-400">{t(plan.unitKey)}</span>
          </div>
          {plan.originalPrice && (
            <span className="text-xs text-on-surface-variant line-through dark:text-gray-500">
              Rp{plan.originalPrice.toLocaleString("id-ID")}
            </span>
          )}
        </div>

        {/* Features */}
        <div className="flex-1 space-y-3 mb-8">
          {plan.features.map((feat) => (
            <div key={feat.key} className="flex items-start gap-2.5">
              {feat.included ? (
                <span className="material-symbols-outlined text-[18px] text-green-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              ) : (
                <span className="material-symbols-outlined text-[18px] text-outline-variant shrink-0 mt-0.5 dark:text-gray-600">cancel</span>
              )}
              <span className={"text-sm leading-relaxed " + (
                feat.included ? "text-on-surface dark:text-gray-200" : "text-on-surface-variant line-through dark:text-gray-500"
              )}>{t(feat.key)}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {onSelectPlan ? (
          <MagneticButton className="w-full">
            <button onClick={handleClick} className={buttonClasses}>{t(plan.ctaKey)}</button>
          </MagneticButton>
        ) : isExternal ? (
          <MagneticButton className="w-full">
            <a href={plan.href} target="_blank" rel="noopener noreferrer" className={buttonClasses + " block w-full"}>{t(plan.ctaKey)}</a>
          </MagneticButton>
        ) : (
          <MagneticButton className="w-full">
            <Link href={plan.href || "/login"} className={buttonClasses + " block w-full"}>{t(plan.ctaKey)}</Link>
          </MagneticButton>
        )}

        {plan.microcopyKey && (
          <p className="text-center text-xs text-on-surface-variant/70 mt-3 italic dark:text-gray-400">{t(plan.microcopyKey)}</p>
        )}
      </div>
    </motion.div>
  );
}
