"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import TiltCard from "@/components/TiltCard";
import MagneticButton from "@/components/MagneticButton";
import CvTemplateCard from "@/components/CvTemplateCard";
import { CV_TEMPLATES } from "@/lib/templates";

interface TabData {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  bullets: string[];
  ctaKey: string;
  href: string;
  color: string;
  bgColor: string;
}

const TABS: TabData[] = [
  {
    id: "builder",
    icon: "edit_note",
    titleKey: "features.cv-builder-title",
    descKey: "features.cv-builder-desc",
    bullets: ["features.cv-builder-b1", "features.cv-builder-b2", "features.cv-builder-b3"],
    ctaKey: "features.cv-builder-cta",
    href: "/builder/new",
    color: "text-primary",
    bgColor: "bg-primary",
  },
  {
    id: "portfolio",
    icon: "grid_view",
    titleKey: "features.portfolio-title",
    descKey: "features.portfolio-desc",
    bullets: ["features.portfolio-b1", "features.portfolio-b2", "features.portfolio-b3"],
    ctaKey: "features.portfolio-cta",
    href: "/portfolio",
    color: "text-secondary",
    bgColor: "bg-secondary",
  },
  {
    id: "checker",
    icon: "fact_check",
    titleKey: "features.checker-title",
    descKey: "features.checker-desc",
    bullets: ["features.checker-b1", "features.checker-b2", "features.checker-b3"],
    ctaKey: "features.checker-cta",
    href: "/checker",
    color: "text-primary",
    bgColor: "bg-primary",
  },
  {
    id: "analysis",
    icon: "analytics",
    titleKey: "features.analysis-title",
    descKey: "features.analysis-desc",
    bullets: ["features.analysis-b1", "features.analysis-b2", "features.analysis-b3"],
    ctaKey: "features.analysis-cta",
    href: "/checker",
    color: "text-primary",
    bgColor: "bg-primary",
  },
  {
    id: "letters",
    icon: "mail",
    titleKey: "features.letters-title",
    descKey: "features.letters-desc",
    bullets: ["features.letters-b1", "features.letters-b2", "features.letters-b3"],
    ctaKey: "features.letters-cta",
    href: "/dashboard",
    color: "text-secondary",
    bgColor: "bg-secondary",
  },
];

/* ─── Portfolio Theme Previews ─── */
const PORTFOLIO_THEMES = [
  {
    id: "modern-slate",
    name: "Modern Slate",
    primary: "#1e293b",
    secondary: "#64748b",
    accent: "#0ea5e9",
    bg: "#f8fafc",
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    primary: "#0f172a",
    secondary: "#334155",
    accent: "#2563eb",
    bg: "#0f172a",
  },
  {
    id: "modern-blue",
    name: "Modern Blue",
    primary: "#0891b2",
    secondary: "#06b6d4",
    accent: "#0284c7",
    bg: "#ecfeff",
  },
];

/* ─── Stagger Variants ─── */
const containerStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardReveal = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 18, mass: 0.8 },
  },
};

/* ─── Dynamic Section: Analysis ─── */
function AnalysisInteractive({ t }: { t: (key: string) => string }) {
  return (
    <motion.div
      variants={containerStagger}
      initial="hidden"
      animate="visible"
      className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-5 md:p-6 overflow-hidden"
    >

      <motion.div variants={cardReveal} className="relative z-10 flex flex-col md:flex-row gap-4">
        {/* Upload CV Zone — clickable */}
        <div className="flex-1">
          <Link
            href="/checker"
            className="block border-2 border-dashed border-primary/30 rounded-xl p-5 text-center hover:border-primary/60 hover:bg-primary/[0.03] transition-all duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
            </div>
            <p className="text-sm font-medium text-on-surface mb-1 group-hover:text-primary transition-colors">{t("checker.upload-label")}</p>
            <p className="text-[11px] text-on-surface-variant/70">{t("checker.upload-hint")}</p>
          </Link>
        </div>

        {/* Paste JD */}
        <div className="flex-1">
          <div className="relative">
            <textarea
              readOnly
              placeholder={t("checker.jd-placeholder")}
              className="w-full h-[120px] px-4 py-3 bg-white border border-outline-variant/30 rounded-xl text-sm text-on-surface placeholder:text-outline-variant resize-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Analyze Button — clickable */}
        <div className="flex flex-col items-center justify-center gap-3 min-w-[140px]">
          <Link
            href="/checker"
            className="w-full px-5 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-sm flex items-center justify-center gap-2 group/btn"
          >
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            {t("checker.analyze-btn")}
          </Link>
          <p className="text-[10px] text-on-surface-variant/70 text-center">{t("checker.free-badge")}</p>
        </div>
      </motion.div>


    </motion.div>
  );
}

/* ─── Dynamic Section: Builder ─── */
function BuilderShowcase({ t, router }: { t: (key: string) => string; router: ReturnType<typeof useRouter> }) {
  return (
    <motion.div
      variants={containerStagger}
      initial="hidden"
      animate="visible"
      className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-5 md:p-6 overflow-hidden"
    >

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CV_TEMPLATES.map((template) => (
          <motion.div key={template.id} variants={cardReveal} className="[perspective:800px]">
            <TiltCard tiltOptions={{ maxAngle: 6, scale: 1.03, glare: true }}>
              <CvTemplateCard
                template={template}
                onClick={() => router.push("/builder/new?template=" + template.id)}
                compact
              />
            </TiltCard>
          </motion.div>
        ))}
        {/* Placeholder — clickable to /builder/new */}
        <motion.div variants={cardReveal} className="[perspective:800px]">
          <TiltCard tiltOptions={{ maxAngle: 6, scale: 1.03, glare: true }}>
            <Link
              href="/builder/new"
              className="block h-full min-h-[120px] rounded-2xl border-2 border-dashed border-outline-variant/30 bg-white/50 flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-md transition-all duration-300 group"
            >
              <span className="material-symbols-outlined text-outline-variant text-2xl group-hover:text-primary transition-colors">add_circle</span>
              <p className="text-[11px] text-on-surface-variant/70 leading-relaxed group-hover:text-on-surface transition-colors">
                {t("features.cv-builder-title")} <br />5 template ATS
              </p>
            </Link>
          </TiltCard>
        </motion.div>
      </div>

      {/* Feature comparison mini */}
      <motion.div variants={cardReveal} className="relative z-10 mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ATS-friendly
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            {t("features.cv-builder-b3")}
          </span>
        </div>
        <span className="text-[10px] text-primary font-bold bg-primary/5 px-2.5 py-1 rounded-full">
          {t("features.title-highlight")}
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Dynamic Section: Portfolio ─── */
function PortfolioShowcase({ t }: { t: (key: string) => string }) {
  return (
    <motion.div
      variants={containerStagger}
      initial="hidden"
      animate="visible"
      className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-5 md:p-6 overflow-hidden"
    >

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PORTFOLIO_THEMES.map((theme, idx) => (
          <motion.div key={theme.id} variants={cardReveal}>
            <TiltCard tiltOptions={{ maxAngle: 6, scale: 1.03, glare: true }}>
              <Link
                href="/portfolio"
                className="block rounded-2xl border border-outline-variant/30 bg-white overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {/* Color swatch strip with overlay glow on hover */}
                <div className="h-20 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 70%)`,
                    }}
                  />
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-2 left-2 w-8 h-8 rounded-lg backdrop-blur-sm" style={{ background: theme.bg + "80" }} />
                    <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full" style={{ background: theme.secondary }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.15)" }} />
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{theme.name}</h4>
                    <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                      {theme.id === "modern-slate" && t("features.portfolio-b1")}
                      {theme.id === "minimal-dark" && t("features.portfolio-b2")}
                      {theme.id === "modern-blue" && t("features.portfolio-b3")}
                    </p>
                  </div>
                  <motion.div
                    className="flex gap-1"
                    animate={{ x: [0, 0, 0] }}
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="w-3 h-3 rounded-full ring-1 ring-white/50" style={{ background: theme.primary }} />
                    <span className="w-3 h-3 rounded-full ring-1 ring-white/50" style={{ background: theme.accent }} />
                    <span className="w-3 h-3 rounded-full ring-1 ring-white/50" style={{ background: theme.secondary }} />
                  </motion.div>
                </div>
              </Link>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Dynamic Section: Surat Lamaran / Motivation Letter ─── */
function LetterShowcase({ t }: { t: (key: string) => string }) {
  return (
    <motion.div
      variants={containerStagger}
      initial="hidden"
      animate="visible"
      className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-5 md:p-6 overflow-hidden"
    >

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Surat Lamaran Formal — clickable */}
        <motion.div variants={cardReveal}>
          <Link
            href="/dashboard"
            className="block bg-white rounded-xl overflow-hidden border border-outline-variant/20 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-300/40 transition-all duration-300 cursor-pointer group"
          >
            <div className="px-4 pt-4 pb-3 border-b border-outline-variant/10 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-emerald-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>business_center</span>
              </span>
              <span className="text-xs font-bold text-on-surface group-hover:text-emerald-600 transition-colors">Surat Lamaran</span>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              <div className="h-2 w-2/3 bg-emerald-100 rounded" />
              <div className="h-2 w-full bg-outline/10 rounded" />
              <div className="h-2 w-5/6 bg-outline/10 rounded" />
              <div className="h-2 w-4/6 bg-outline/10 rounded" />
              <div className="h-2 w-3/6 bg-outline/10 rounded" />
            </div>
            <div className="px-4 pb-3 flex justify-end">
              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Resmi · BUMN/Korporasi</span>
            </div>
          </Link>
        </motion.div>

        {/* Cover Letter ATS — clickable */}
        <motion.div variants={cardReveal}>
          <Link
            href="/dashboard"
            className="block bg-white rounded-xl overflow-hidden border border-outline-variant/20 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300/40 transition-all duration-300 cursor-pointer group"
          >
            <div className="px-4 pt-4 pb-3 border-b border-outline-variant/10 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-blue-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </span>
              <span className="text-xs font-bold text-on-surface group-hover:text-blue-600 transition-colors">Cover Letter</span>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              <div className="h-2 w-1/2 bg-blue-100 rounded" />
              <div className="h-2 w-full bg-outline/10 rounded" />
              <div className="h-2 w-full bg-outline/10 rounded" />
              <div className="h-2 w-2/3 bg-outline/10 rounded" />
            </div>
            <div className="px-4 pb-3 flex justify-end">
              <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">EN · ATS Optimized</span>
            </div>
          </Link>
        </motion.div>

        {/* Motivation Letter — clickable */}
        <motion.div variants={cardReveal}>
          <Link
            href="/dashboard"
            className="block bg-white rounded-xl overflow-hidden border border-outline-variant/20 hover:-translate-y-1 hover:shadow-lg hover:border-amber-300/40 transition-all duration-300 cursor-pointer group"
          >
            <div className="px-4 pt-4 pb-3 border-b border-outline-variant/10 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-amber-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              </span>
              <span className="text-xs font-bold text-on-surface group-hover:text-amber-600 transition-colors">Motivation Letter</span>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              <div className="h-2 w-3/4 bg-amber-100 rounded" />
              <div className="h-2 w-full bg-outline/10 rounded" />
              <div className="h-2 w-5/6 bg-outline/10 rounded" />
              <div className="h-2 w-4/6 bg-outline/10 rounded" />
            </div>
            <div className="px-4 pb-3 flex justify-end">
              <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Beasiswa · Program · Passion</span>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Feature comparison mini */}
      <motion.div variants={cardReveal} className="relative z-10 mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {t("features.letters-b3")}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            {t("features.letters-pdf")}
          </span>
        </div>
        <span className="text-[10px] text-secondary font-bold bg-secondary/10 px-2.5 py-1 rounded-full">
          {t("features.letters-free")}
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Dynamic Section: Checker ─── */
function CheckerScoreMockup({ t }: { t: (key: string) => string }) {
  return (
    <motion.div
      variants={containerStagger}
      initial="hidden"
      animate="visible"
      className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-5 md:p-6 overflow-hidden"
    >

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ATS Score — clickable */}
        <motion.div variants={cardReveal}>
          <Link
            href="/checker"
            className="block bg-white rounded-xl p-4 border border-outline-variant/20 text-center hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group"
          >
            <div className="text-xs text-on-surface-variant font-medium mb-1 group-hover:text-primary transition-colors">{t("checker.score-label")}</div>
            <p className="text-xs font-semibold text-primary/70 mb-1">Hasil analisis kamu tampil di sini</p>
            <div className="mt-2 h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full w-3/5 bg-primary/30 rounded-full" />
            </div>
          </Link>
        </motion.div>

        {/* Keyword Match — clickable */}
        <motion.div variants={cardReveal}>
          <Link
            href="/checker"
            className="block bg-white rounded-xl p-4 border border-outline-variant/20 hover:-translate-y-1 hover:shadow-lg hover:border-amber-300/40 transition-all duration-300 cursor-pointer group"
          >
            <div className="text-xs text-on-surface-variant font-medium mb-2 group-hover:text-amber-700 transition-colors">{t("checker.keyword-gap")}</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "React", color: "green" },
                { label: "TypeScript", color: "green" },
                { label: "Node.js", color: "red" },
                { label: "SQL", color: "green" },
                { label: "Docker", color: "red" },
                { label: "AWS", color: "amber" },
              ].map((kw, i) => (
                <motion.span
                  key={kw.label}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-default ${
                    kw.color === "green" ? "bg-green-100 text-green-700" :
                    kw.color === "red" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 + i * 0.1 }}
                  whileHover={{ scale: 1.2, y: -2 }}
                >
                  {kw.label}
                </motion.span>
              ))}
            </div>
          </Link>
        </motion.div>

        {/* Fit Label — clickable */}
        <motion.div variants={cardReveal}>
          <Link
            href="/checker"
            className="block bg-white rounded-xl p-4 border border-outline-variant/20 flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-lg hover:border-green-300/40 transition-all duration-300 cursor-pointer group"
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-green-200/50 transition-all duration-300"
              animate={{ rotate: [0, 0, 0] }}
              whileHover={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <span className="material-symbols-outlined text-green-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </motion.div>
            <span className="text-sm font-bold text-green-700 group-hover:text-green-600 transition-colors">{t("checker.fit-excellent")}</span>
            <p className="text-[10px] text-on-surface-variant/70 mt-0.5">{t("checker.ats-format")} ✓</p>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function FeatureTabs() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("builder");
  const activeData = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Bar */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex flex-wrap justify-center bg-white rounded-2xl p-1.5 shadow-premium-sm border border-outline-variant/30 max-w-full">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 md:px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id ? "text-white" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="feature-tab-bg"
                  className={`absolute inset-0 ${tab.bgColor} rounded-xl`}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span className="relative z-10 hidden sm:inline">{t(tab.titleKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring" as const, stiffness: 250, damping: 22, mass: 0.9 }}
          className="[perspective:800px] space-y-6"
        >
          {/* ── Upper Panel: Title + Bullets + CTA ── */}
          <TiltCard tiltOptions={{ maxAngle: 4, scale: 1.005, glare: false }}>
            <div className="group relative flex flex-col md:flex-row rounded-2xl border border-outline-variant/40 bg-white shadow-premium-sm overflow-hidden hover:shadow-premium-md transition-shadow duration-300">
              {/* Accent strip */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${activeData.bgColor}/60`} />

              <div className="p-6 md:p-8 flex-1">
                {/* Icon + Title */}
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 ${activeData.bgColor}/10 ${activeData.color} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-500`}>
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{activeData.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-label-bold text-on-surface text-lg">{t(activeData.titleKey)}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{t(activeData.descKey)}</p>
                  </div>
                </div>

                {/* Feature Bullets */}
                <div className="space-y-2.5 mb-6">
                  {activeData.bullets.map((bulletKey, idx) => (
                    <motion.div
                      key={bulletKey}
                      className="flex items-start gap-2.5"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring" as const, stiffness: 180, damping: 16, delay: idx * 0.06 }}
                    >
                      <span className="material-symbols-outlined text-[18px] text-green-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="text-sm text-on-surface leading-relaxed">{t(bulletKey)}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <MagneticButton>
                  <Link
                    href={activeData.href}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-label-bold transition-all active:scale-[0.97] ${
                      activeTab === "checker"
                        ? `${activeData.bgColor} text-on-primary hover:brightness-110 shadow-md`
                        : "border-2 border-primary/40 text-primary hover:bg-primary/5"
                    }`}
                  >
                    {t(activeData.ctaKey)}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </MagneticButton>
              </div>

              {/* Right visual indicator */}
              <div className="hidden md:flex flex-col items-center justify-center px-10 bg-surface-container-low/50 border-l border-outline-variant/20">
                <div className={`w-16 h-16 ${activeData.bgColor}/10 rounded-3xl flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-[36px] ${activeData.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{activeData.icon}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant/70 mt-2 text-center max-w-[100px]">
                  {t("features.title-highlight")}
                </p>
              </div>
            </div>
          </TiltCard>

          {/* ── Dynamic Interactive Section ── */}
          {activeTab === "analysis" && <AnalysisInteractive t={t} />}
          {activeTab === "builder" && <BuilderShowcase t={t} router={router} />}
          {activeTab === "portfolio" && <PortfolioShowcase t={t} />}
          {activeTab === "checker" && <CheckerScoreMockup t={t} />}
          {activeTab === "letters" && <LetterShowcase t={t} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
