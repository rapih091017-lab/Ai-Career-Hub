"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import Logos3 from "@/components/blocks/logos3";
import PricingSection from "@/components/PricingSection";
import ScrollProgress from "@/components/ScrollProgress";
import CountUp from "@/components/CountUp";
import MouseGlow from "@/components/MouseGlow";
import TiltCard from "@/components/TiltCard";
import ScrollSectionIndicator from "@/components/ScrollSectionIndicator";
import SiteHeader from "@/components/nav/SiteHeader";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import MagneticButton from "@/components/MagneticButton";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import FeatureTabs from "@/components/FeatureTabs";
import {
  staggerContainer,
  staggerItemUp,
  staggerItemScale,
  slideUp,
  sectionReveal,
} from "@/lib/animationVariants";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { INTERVIEW_POSITION_COUNT, INTERVIEW_QUESTION_COUNT } from "@/lib/interview-stats";
import HeroCvDemo from "@/components/HeroCvDemo";
import TestimonialMarquee from "@/components/TestimonialMarquee";
import PortfolioSpotlight from "@/components/PortfolioSpotlight";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const { lang, toggleLang, t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  // Multi-layer parallax
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const templateY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  // Mobile hamburger menu

  // Real platform stats (from /api/public/stats), no fabricated numbers
  const [stats, setStats] = useState<{ totalCvs: number; totalUsers: number; totalAnalyses: number; avgAtsScore: number } | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/public/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d) setStats(d); })
      .catch(() => { /* keep null, stats row hides */ });
    return () => { active = false; };
  }, []);

  return (
    <>
      <ScrollProgress />
      <ScrollSectionIndicator />

      {/* Navbar: komponen yang sama dengan halaman dashboard, hanya bentuknya
          yang melayang. Tidak ada lagi nav khusus landing yang bisa melenceng
          dari navbar aplikasi. */}
      <SiteHeader variant="pill" showAnnouncement />

      {/* ── Hero ── */}

      {/* ── Hero ── */}
      <header id="hero" ref={heroRef} className="relative min-h-[90vh] md:min-h-[95vh] flex items-center overflow-hidden bg-gradient-to-b from-white via-primary/[0.02] to-white pt-24 md:pt-32 pb-16 md:pb-24">
        {/* One soft ambient orb, subtle depth, static (R-01: purpose = soften the plain white canvas) */}
        {/* Latar hero berlapis. Alasan tiap lapis (antislop purpose test):
            kanvas putih polos terasa mati, sedangkan gerakan sangat lambat
            memberi kedalaman tanpa menarik perhatian dari judul. */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          animate={{ backgroundPosition: ["0px 0px", "0px 60px"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            y: contentY,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d7377' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "60px 60px",
          }}
        />
        <motion.div
          className="absolute left-0 top-1/4 h-[600px] w-[600px] -translate-x-1/3 rounded-full bg-primary/[0.04] blur-[150px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-0 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-secondary/[0.04] blur-[120px] pointer-events-none"
          animate={{ scale: [1, 1.15, 1], rotate: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute left-[15%] top-[20%] h-3 w-3 rounded-full bg-primary/30 blur-sm pointer-events-none"
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[20%] top-[40%] h-2 w-2 rounded-full bg-secondary/40 blur-sm pointer-events-none"
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[30%] left-[30%] h-4 w-4 rounded-full bg-amber-400/20 blur-md pointer-events-none"
          animate={{ y: [0, -12, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Enlarged Mockup, desktop only */}
        <motion.div className="absolute right-[3%] top-1/4 hidden lg:block pointer-events-none" style={{ y: mockupY }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
          <div className="w-[380px] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 overflow-hidden rotate-[3deg]">
            <div className="h-3 bg-primary/10 flex items-center px-4 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d3bd7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                </div>
                <div>
                  <div className="h-3 w-24 bg-primary/30 rounded mb-1" />
                  <div className="h-2 w-16 bg-outline/10 rounded" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-2.5 w-full bg-outline/10 rounded" />
                <div className="h-2.5 w-5/6 bg-outline/10 rounded" />
                <div className="h-2.5 w-4/6 bg-outline/10 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 flex-1 rounded-lg bg-primary/10" />
                <div className="h-8 w-20 rounded-lg bg-outline/10" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Template Preview Card, desktop only */}
        <motion.div className="absolute right-[5%] top-[12%] hidden lg:block pointer-events-none z-[5]" style={{ y: templateY }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}>
          <div className="w-[200px] bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/40 overflow-hidden rotate-[6deg]">
            <div className="p-3">
              {/* Template header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d7377" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div className="h-2 w-16 bg-primary/20 rounded" />
              </div>
              {/* Template content skeleton */}
              <div className="space-y-1.5 mb-2">
                <div className="h-2 w-full bg-outline/10 rounded" />
                <div className="h-2 w-4/5 bg-outline/10 rounded" />
                <div className="h-2 w-3/5 bg-outline/10 rounded" />
              </div>
              {/* Template footer */}
              <div className="flex gap-1">
                <div className="h-1.5 flex-1 rounded bg-primary/5" />
                <div className="h-1.5 w-8 rounded bg-outline/5" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enlarged ATS Score Card */}
        <motion.div className="absolute right-[8%] top-[58%] hidden lg:block z-10" style={{ y: cardY }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }}>
          <Link href="/checker" className="block w-[260px] bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/40 overflow-hidden -rotate-[2deg] hover:-rotate-1 hover:shadow-xl hover:scale-105 transition-[transform,box-shadow] duration-300 cursor-pointer">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-2.5 w-20 bg-secondary/30 rounded" />
                <div className="flex items-center gap-1 text-xs text-green-700 font-bold">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"/></svg>
                  <span>{t("hero.ats-badge")}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="h-5 px-2.5 bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center">{t("hero.keyword-match")}</span>
                <span className="h-5 px-2.5 bg-purple-100 text-purple-700 text-xs font-bold rounded flex items-center">93%</span>
              </div>
              <div className="h-2 w-full bg-outline/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "92%" }}
                  transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* AI-assisted cue dipindah inline ke card ATS agar tidak menutupi teks */}

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter w-full">
          <motion.div className="max-w-3xl mx-auto lg:mx-0 lg:ml-[5%] relative z-10" style={{ y: contentY, opacity }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-label-bold text-[13px]">{t("hero.badge")}</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-[clamp(2.2rem,7vw,4.5rem)] text-on-background mb-6 leading-[1.05] tracking-[-0.02em] text-balance">
              {t("hero.title-line1")}<br className="hidden md:block"/>
              <span className="text-primary"> {t("hero.title-line2")}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="font-body-lg text-on-surface-variant max-w-xl mb-6 md:mb-8 text-[17px] leading-relaxed">
              {t("hero.subtitle")}
            </motion.p>

            {/* CTA BUTTONS, moved UP before interactive demo for better mobile visibility */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
              <MagneticButton>
                  <Link href="/builder/new"
                  className="w-full sm:w-auto bg-primary text-on-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-headline-md text-[15px] sm:text-[17px] shadow-xl hover:shadow-2xl active:scale-95 cursor-pointer text-center block">
                  {t("hero.cta-start")}
                </Link>
              </MagneticButton>
              <MagneticButton>
                <a href="#how-it-works" className="w-full sm:w-auto flex items-center justify-center gap-2 text-on-surface font-label-bold px-6 sm:px-8 py-3.5 sm:py-4 hover:bg-surface-container rounded-xl sm:rounded-2xl transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">
                    play_circle
                  </span>
                  {t("hero.cta-how")}
                </a>
              </MagneticButton>
            </motion.div>

            {/* Social proof, only with real numbers from DB (R-17) */}
            {stats && stats.totalUsers > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
                className="flex items-center gap-2 mb-8 md:mb-10">
                <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
                <span className="text-xs md:text-sm text-on-surface-variant font-medium">
                  <strong className="text-on-surface">{stats.totalUsers.toLocaleString("id-ID")}+</strong> {t("hero.social-proof-count")}
                </span>
              </motion.div>
            )}

            {/* Interactive Hero Demo, real quick-check without login (hook pembeli pelit) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <HeroCvDemo />
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ── Social Proof Stats, replaces old duplicate template showcase ── */}
      <section id="stats" className="relative py-16 md:py-20 bg-surface-container-lowest overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter text-center">
          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <h2 className="font-headline-lg text-on-background mb-2">{t("template.title")}</h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto mb-12">{t("template.subtitle")}</p>
          </motion.div>

          {/* Stat band: 4 angka nyata dari DB, tanpa kartu bertumpuk (mengurangi beban visual) */}
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 max-w-4xl mx-auto mb-16"
          >
            <motion.div variants={staggerItemScale} className="text-center">
              {stats ? (
                <CountUp end={stats.totalCvs} suffix="+" className="text-4xl font-extrabold text-primary tabular-nums" />
              ) : (
                <div className="h-10 w-24 bg-surface-container-high rounded-lg animate-pulse mx-auto" />
              )}
              <p className="text-sm text-on-surface-variant mt-2">{t("cta.stats-cv")}</p>
            </motion.div>
            <motion.div variants={staggerItemScale} className="text-center">
              {stats ? (
                <CountUp end={stats.totalAnalyses} suffix="+" className="text-4xl font-extrabold text-primary tabular-nums" />
              ) : (
                <div className="h-10 w-24 bg-surface-container-high rounded-lg animate-pulse mx-auto" />
              )}
              <p className="text-sm text-on-surface-variant mt-2">{t("cta.stats-analyzed")}</p>
            </motion.div>
            <motion.div variants={staggerItemScale} className="text-center">
              {stats ? (
                <CountUp end={stats.avgAtsScore} suffix="%" className="text-4xl font-extrabold text-primary tabular-nums" />
              ) : (
                <div className="h-10 w-24 bg-surface-container-high rounded-lg animate-pulse mx-auto" />
              )}
              <p className="text-sm text-on-surface-variant mt-2">{t("cta.stats-avg-ats")}</p>
            </motion.div>
            <motion.div variants={staggerItemScale} className="text-center">
              {stats ? (
                <CountUp end={stats.totalUsers} suffix="+" className="text-4xl font-extrabold text-primary tabular-nums" />
              ) : (
                <div className="h-10 w-24 bg-surface-container-high rounded-lg animate-pulse mx-auto" />
              )}
              <p className="text-sm text-on-surface-variant mt-2">{t("cta.stats-users")}</p>
            </motion.div>
          </motion.div>

          {/* Quick Tool Access, 4 cards, satu aksen (teal) + emerald semantik untuk GRATIS */}
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-8"
          >
            {/* Kartu utama, treatment berbeda (R-14): border primary + badge arah */}
            <motion.div variants={staggerItemUp} className="sm:col-span-2 lg:col-span-1">
              <Link href="/builder/new" className="block relative h-full bg-surface-container-lowest rounded-2xl p-5 border-2 border-primary/40 shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group text-left">
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{t("tool.start-here")}</span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface group-hover:text-primary transition-colors">{t("tool.build-cv")}</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{t("tool.build-cv-desc")}</p>
              </Link>
            </motion.div>
            <motion.div variants={staggerItemUp}>
              <Link href="/checker" className="block bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/50 shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface group-hover:text-primary transition-colors">{t("tool.analyze-cv")}</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{t("tool.analyze-cv-desc")}</p>
              </Link>
            </motion.div>
            <motion.div variants={staggerItemUp}>
              <Link href="/portfolio" className="block bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/50 shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface group-hover:text-primary transition-colors">{t("tool.portfolio")}</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{t("tool.portfolio-desc")}</p>
              </Link>
            </motion.div>
            <motion.div variants={staggerItemUp}>
              <Link href="/interview" className="block bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/50 shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group text-left relative">
                {/* Gratis badge, fungsional (fitur memang gratis) */}
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-premium-sm">
                  {t("tool.free-badge")}
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface group-hover:text-primary transition-colors">{t("tool.interview")}</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{t("tool.interview-desc")}</p>
                <p className="mt-1.5 text-xs font-bold text-primary tabular-nums">
                  {t("tool.interview-count-questions").replace("{n}", INTERVIEW_QUESTION_COUNT.toLocaleString("id-ID"))}
                  {" · "}
                  {t("tool.interview-count-positions").replace("{n}", INTERVIEW_POSITION_COUNT.toLocaleString("id-ID"))}
                </p>
                {/* CTA ke practice mode */}
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <span className="material-symbols-outlined text-xs">play_circle</span>
                  {t("tool.practice-cta")}
                </span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <AnimatedButton
              href="/builder/new"
              variant="primary"
              icon={<span className="material-symbols-outlined text-lg">add</span>}
            >
              {t("hero.cta-start")}
            </AnimatedButton>
            <AnimatedButton
              href="/interview/practice"
              variant="emerald"
              icon={<span className="material-symbols-outlined text-lg">play_circle</span>}
            >
              {t("tool.practice-btn")}
            </AnimatedButton>
          </motion.div>
        </div>
      </section>

      <Logos3 />

      {/* ── Portfolio spotlight: fitur dengan nilai visual tertinggi ── */}
      <PortfolioSpotlight />

      {/* ── Real user testimonials, hanya tampil bila ada data terbit (R-18) ── */}
      <TestimonialMarquee />

      {/* ── Fitur terbaru (antislop purpose: membuktikan produk aktif berkembang
          dan memberi jalur masuk ke fitur yang belum tampil di tab fitur utama) ── */}
      <section className="relative py-16 md:py-24 px-margin-mobile md:px-gutter bg-surface-container-low/50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-10 md:mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-4">
              <span className="material-symbols-outlined text-[14px]">new_releases</span>
              {t("new.badge")}
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-3">{t("new.title")}</h2>
            <p className="max-w-[620px] mx-auto text-body-md text-on-surface-variant">{t("new.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "view_kanban", titleKey: "new.tracker-title", descKey: "new.tracker-desc", href: "/tracker", stat: null as string | null },
              { icon: "record_voice_over", titleKey: "new.interview-title", descKey: "new.interview-desc", href: "/interview/practice", stat: `${INTERVIEW_QUESTION_COUNT.toLocaleString("id-ID")} ${t("new.stat-questions")}` },
              { icon: "description", titleKey: "new.examples-title", descKey: "new.examples-desc", href: lang === "en" ? "/cv-examples" : "/contoh-cv", stat: null },
              { icon: "swap_horiz", titleKey: "new.synonym-title", descKey: "new.synonym-desc", href: "/sinonim", stat: null },
              { icon: "upload_file", titleKey: "new.import-title", descKey: "new.import-desc", href: "/settings/profile", stat: null },
              { icon: "work", titleKey: "new.jobs-title", descKey: "new.jobs-desc", href: "/karir", stat: null },
            ].map((item, index) => (
              <motion.div key={item.titleKey} variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.05 }}>
                <Link href={item.href} className="group flex h-full flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface transition-colors group-hover:text-primary">{t(item.titleKey)}</h3>
                  <p className="mt-1.5 flex-1 text-body-md text-on-surface-variant">{t(item.descKey)}</p>
                  {item.stat ? (
                    <span className="mt-3 inline-flex w-fit items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700">{item.stat}</span>
                  ) : null}
                  <span className="mt-3 inline-flex items-center gap-1 text-label-bold text-primary">
                    {t("new.cta-open")}
                    <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative py-20 md:py-28 px-margin-mobile md:px-gutter bg-surface-container-lowest overflow-hidden" id="features">
        <MouseGlow color="#6d3bd7" size={400} opacity={0.02} blur={120} className="absolute inset-0" align="center" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div className="text-center mb-16" variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary text-xs font-bold tracking-wider rounded-full mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              {t("features.title-highlight")}
            </span>
            <h2 className="font-headline-lg text-on-background mb-4">{t("features.title")} <span className="text-primary">{t("features.title-highlight")}</span></h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto">{t("features.subtitle")}</p>
          </motion.div>

          {/* Feature Tabs, Interactive Tab System */}
          <FeatureTabs />


        </div>
      </section>

      {/* ── AI Insight ── */}
      <motion.section className="py-20 md:py-28 px-margin-mobile md:px-gutter overflow-hidden bg-surface-container-low" id="how-it-works"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
        <div className="max-w-7xl mx-auto bg-surface-container-lowest rounded-2xl p-8 md:p-20 relative ambient-card-shadow border border-outline-variant/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-surface-container-low p-8 rounded-2xl ai-border ambient-card-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-2 bg-primary rounded-full text-white">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_graph</span>
                  </div>
                  <span className="font-headline-md text-[20px]">{t("features.analysis-title")}</span>
                </div>
                <div className="space-y-6">
                  <p className="text-body-md text-on-surface-variant">{t("features.analysis-desc")}</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-label-sm rounded-full font-bold">{t("insight.tag-keyword")}</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-label-sm rounded-full font-bold">{t("insight.tag-ats")}</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-label-sm rounded-full font-bold">{t("insight.tag-relevance")}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            </div>
            <div>
              <h2 className="font-headline-lg text-on-background mb-6 leading-tight">{t("insight.title")} <br/>{t("insight.title-line2")}</h2>
              <p className="font-body-lg text-on-surface-variant mb-10">{t("insight.desc")}</p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="font-body-md">{t("insight.item1")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="font-body-md">{t("insight.item2")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="font-body-md">{t("insight.item3")}</span>
                </li>
              </ul>
              <MagneticButton>
                <Link href="/checker" className="bg-primary text-white px-8 py-4 rounded-2xl font-label-bold hover:shadow-lg transition-all inline-block cursor-pointer">
                  {t("insight.cta")}
                </Link>
              </MagneticButton>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Before-After ── */}
      <section className="relative py-20 md:py-28 px-margin-mobile md:px-gutter bg-surface-container-lowest overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary text-xs font-bold tracking-wider rounded-full mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {t("before-after.badge")}
            </span>
             <h2 className="font-headline-lg text-on-background mb-4">{t("before-after.title")}</h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto">{t("before-after.subtitle")}</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
             {/* BEFORE: illustrative simulation, not a customer result */}
            <motion.div variants={staggerItemUp} className="[perspective:800px]">
              <TiltCard tiltOptions={{ maxAngle: 3, scale: 1.005, glare: false }}>
                <div className="group relative rounded-2xl border-2 border-red-200 bg-surface-container-lowest overflow-hidden shadow-premium-sm hover:shadow-premium-md transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 to-red-300" />
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-red-500">{t("before-after.before-label")}</span>
                          <p className="text-xs text-red-600 font-medium">{t("before-after.example")}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-bold">{t("before-after.fail-label")}</span>
                    </div>
                    {/* Mock CV Content, messy */}
                    <div className="space-y-3 opacity-60">
                      <div className="h-5 w-3/4 bg-gray-200 rounded" />
                      <div className="h-3 w-full bg-gray-100 rounded" />
                      <div className="h-3 w-5/6 bg-gray-100 rounded" />
                      <div className="h-3 w-4/6 bg-gray-100 rounded" />
                      <div className="pt-3 border-t border-gray-100">
                        <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-full bg-gray-100 rounded" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded" />
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <div className="h-4 w-1/4 bg-gray-200 rounded mb-2" />
                        <div className="flex flex-wrap gap-1.5">
                          {["HTML", "CSS", "JS"].map((s) => (
                            <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-red-400 font-medium">{t("before-after.ats-label")}</span>
                        <span className="text-red-500 font-bold">45%</span>
                      </div>
                      <div className="h-2.5 w-full bg-red-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-red-400 to-red-300 rounded-full"
                          initial={{ width: "0%" }} whileInView={{ width: "45%" }} viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>

             {/* AFTER: illustrative simulation, not a customer result */}
            <motion.div variants={staggerItemUp} className="[perspective:800px]">
              <TiltCard tiltOptions={{ maxAngle: 3, scale: 1.005, glare: false }}>
                <div className="group relative rounded-2xl border-2 border-green-200 bg-surface-container-lowest overflow-hidden shadow-premium-sm hover:shadow-premium-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-primary">{t("before-after.after-label")}</span>
                           <p className="text-xs text-primary/70 font-medium">{t("before-after.example")}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">{t("before-after.pass-label")}</span>
                    </div>
                    {/* Mock CV Content, clean */}
                    <div className="space-y-3">
                      <div className="h-5 w-3/4 bg-primary/10 rounded" />
                      <div className="h-3 w-full bg-primary/5 rounded" />
                      <div className="h-3 w-5/6 bg-primary/5 rounded" />
                      <div className="h-3 w-4/6 bg-primary/5 rounded" />
                      <div className="pt-3 border-t border-primary/10">
                        <div className="h-4 w-1/3 bg-primary/10 rounded mb-2" />
                        <div className="h-3 w-full bg-primary/5 rounded" />
                        <div className="h-3 w-3/4 bg-primary/5 rounded" />
                        <div className="h-3 w-5/6 bg-primary/5 rounded" />
                      </div>
                      <div className="pt-3 border-t border-primary/10">
                        <div className="h-4 w-1/4 bg-primary/10 rounded mb-2" />
                        <div className="flex flex-wrap gap-1.5">
                          {["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker"].map((s) => (
                            <span key={s} className="px-2.5 py-1 bg-primary/5 text-primary rounded text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-primary/60 font-medium">{t("before-after.ats-label")}</span>
                        <span className="text-primary font-bold">92%</span>
                      </div>
                      <div className="h-2.5 w-full bg-primary/10 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-green-400 to-primary rounded-full"
                          initial={{ width: "0%" }} whileInView={{ width: "92%" }} viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </motion.div>

          {/* Difference Highlight */}
          <motion.div className="mt-12 text-center" variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-surface-container-low rounded-2xl px-8 py-5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                <span className="font-label-bold text-on-surface">{t("before-after.difference")}</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-outline-variant" />
              <div className="flex flex-wrap justify-center gap-3 text-left">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-green-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-xs text-on-surface-variant">{t("before-after.bullet1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-green-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-xs text-on-surface-variant">{t("before-after.bullet2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-green-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-xs text-on-surface-variant">{t("before-after.bullet3")}</span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <MagneticButton>
                <Link href="/checker" className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-3.5 rounded-xl font-label-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg">
                  {t("before-after.cta")}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Job-seeker journey ── */}
      <section id="journey" className="relative overflow-hidden bg-surface-container-low px-margin-mobile py-20 md:px-gutter md:py-28">
        <div className="mx-auto max-w-7xl">
          <motion.div className="mb-12 max-w-2xl" variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-wider text-primary"><span className="material-symbols-outlined text-[14px]">route</span>{t("journey.badge")}</span>
            <h2 className="font-headline-lg text-on-background">{t("journey.title")}</h2>
            <p className="mt-3 text-body-lg text-on-surface-variant">{t("journey.subtitle")}</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "edit_note", title: t("journey.step1.title"), text: t("journey.step1.desc"), href: "/builder/new" },
              { icon: "fact_check", title: t("journey.step2.title"), text: t("journey.step2.desc"), href: "/checker" },
              { icon: "mail", title: t("journey.step3.title"), text: t("journey.step3.desc"), href: "/surat-lamaran" },
              { icon: "event_available", title: t("journey.step4.title"), text: t("journey.step4.desc"), href: "/tracker" },
            ].map((step, index) => <motion.div key={step.title} variants={staggerItemUp}><Link href={step.href} className="group block h-full rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-premium-md transition-all hover:-translate-y-1 hover:shadow-premium-lg"><div className="mb-5 flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><span className="material-symbols-outlined">{step.icon}</span></span><span className="text-label-sm text-on-surface-variant">0{index + 1}</span></div><h3 className="font-label-bold text-on-surface group-hover:text-primary">{step.title}</h3><p className="mt-2 text-body-md leading-relaxed text-on-surface-variant">{step.text}</p></Link></motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* ── Objection answers ── */}
      <section className="relative bg-surface-container-lowest px-margin-mobile py-20 md:px-gutter md:py-28">
        <div className="mx-auto max-w-5xl"><motion.div className="mb-12 max-w-2xl" variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}><h2 className="font-headline-lg text-on-background">{t("objections.title")}</h2><p className="mt-3 text-body-lg text-on-surface-variant">{t("objections.subtitle")}</p></motion.div><div className="grid gap-4 md:grid-cols-2">{[
          ["objections.q1", "objections.a1"], ["objections.q2", "objections.a2"], ["objections.q3", "objections.a3"], ["objections.q4", "objections.a4"],
        ].map(([question, answer], index) => <motion.div key={question} variants={staggerItemUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.04 }} className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-6"><h3 className="font-label-bold text-on-surface">{t(question)}</h3><p className="mt-2 text-body-md leading-relaxed text-on-surface-variant">{t(answer)}</p></motion.div>)}</div></div>
      </section>

      {/* ── Momen keputusan sebelum pricing ── */}
      <section className="relative bg-surface-container-lowest px-margin-mobile pb-4 pt-20 md:px-gutter md:pt-28">
        <motion.div className="mx-auto max-w-2xl text-center" variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
          <h2 className="font-headline-lg text-on-background">{t("moment.title")}</h2>
          <p className="mt-4 text-body-lg text-on-surface-variant">{t("moment.subtitle")}</p>
          <div className="mt-8">
            <MagneticButton>
              <Link href={session ? "/builder/new" : "/login"} className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-label-bold text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-[0.98]">
                {t("moment.cta")}
                <span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_forward</span>
              </Link>
            </MagneticButton>
          </div>
        </motion.div>
      </section>

      {/* ── Pricing ── */}
      <PricingSection
        onSelectPlan={(planId, mode) => {
          // Satu langkah ke checkout, paket langsung masuk keranjang. Dulu
          // plan ini harus lewat halaman tagihan dulu.
          if (planId === "free") {
            router.push("/login");
            return;
          }
          router.push(`/checkout?packages=${encodeURIComponent(planId)}`);
        }}
      />

      {/* ── CTA ── */}
      <motion.section id="cta-footer" className="relative py-20 md:py-28 bg-surface-container-lowest overflow-hidden"
        variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter">
          <div className="bg-gradient-to-br from-primary via-primary-container to-primary rounded-2xl p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-surface-container-lowest/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-surface-container-lowest/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-headline-lg text-[28px] md:text-[40px] mb-6 leading-tight">{t("cta.title")}</h2>
              <p className="font-body-lg mb-8 opacity-90 max-w-2xl mx-auto">{t("cta.subtitle")}</p>
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                <span className="px-3 py-1.5 rounded-full bg-surface-container-lowest/20 text-xs font-medium inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"/></svg>
                  {t("cta.pill-ats")}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-surface-container-lowest/20 text-xs font-medium inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                  {t("cta.pill-analysis")}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-surface-container-lowest/20 text-xs font-medium inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  {t("cta.pill-portfolio")}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-surface-container-lowest/20 text-xs font-medium inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="16" r="2"/><path d="M16 11V7a4 4 0 00-8 0v4"/></svg>
                  {t("cta.pill-ai")}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 perspective-[600px]">
                <MagneticButton>
                <Link href="/builder/new"
                    className="group/cta px-10 py-4 rounded-2xl bg-surface-container-lowest text-primary font-bold text-base transition-all duration-300 inline-flex items-center gap-2 cursor-pointer relative overflow-hidden"
                    style={{ transformStyle: "preserve-3d" }}>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700" />
                    {t("cta.button")}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link href="#features"
                    className="px-10 py-4 rounded-2xl border border-white/30 text-white font-semibold text-base hover:bg-surface-container-lowest/10 transition-all inline-flex items-center gap-2 cursor-pointer">
                    {t("cta.button-features")}
                  </Link>
                </MagneticButton>
              </div>
              <p className="text-xs text-white/80 mt-6">{t("cta.footer")}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <StickyMobileCTA />

      <AppFooter variant="full" />
      {/* Spacer kompensasi sticky mobile CTA agar tidak menimpa footer */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </>
  );
}
