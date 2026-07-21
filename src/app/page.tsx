"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "motion/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import TestimonialsColumn from "@/components/TestimonialsColumn";
import Logos3 from "@/components/blocks/logos3";
import PricingSection from "@/components/PricingSection";
import ScrollProgress from "@/components/ScrollProgress";
import CountUp from "@/components/CountUp";
import AnimatedNotification from "@/components/AnimatedNotification";
import MouseGlow from "@/components/MouseGlow";
import TiltCard from "@/components/TiltCard";
import ScrollSectionIndicator from "@/components/ScrollSectionIndicator";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import MagneticButton from "@/components/MagneticButton";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import FeatureTabs from "@/components/FeatureTabs";
import {
  staggerContainer,
  staggerItemUp,
  staggerItemScale,
  slideUp,
  slideLeft,
  slideRight,
  sectionReveal,
  floatSlow,
} from "@/lib/animationVariants";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const testimonialKeys = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
  textKey: "testimonial." + i + ".text",
  nameKey: "testimonial." + i + ".name",
  roleKey: "testimonial." + i + ".role",
}));

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

  // Build bilingual testimonials
  const testimonials = useMemo(() =>
    testimonialKeys.map((k) => ({
      text: t(k.textKey),
      name: t(k.nameKey),
      role: t(k.roleKey),
    })),
  [t]);

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  // Hydration-safe mount flag — prevents session-based SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Floating notification state
  const [showNotif, setShowNotif] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowNotif(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <ScrollProgress />
      <ScrollSectionIndicator />

      {/* ── Floating Social Proof Notification ── */}
      <AnimatedNotification show={showNotif} onClose={() => setShowNotif(false)} />

      {/* ── Navigation (Floating) ── */}
      <nav className="fixed top-0 md:top-4 left-0 md:left-1/2 right-0 md:-translate-x-1/2 z-50 bg-white/80 backdrop-blur-lg shadow-sm md:shadow-lg border-b md:border border-outline-variant/10 md:rounded-2xl md:max-w-7xl md:w-[calc(100%-32px)] transition-all">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="font-headline-md text-[18px] font-bold text-primary tracking-tight cursor-pointer">AI Career Hub</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-on-surface-variant hover:text-primary font-label-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" href="#features">{t("nav.features")}</a>
            <a className="text-on-surface-variant hover:text-primary font-label-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" href="#pricing">{t("nav.pricing")}</a>
            <a className="text-on-surface-variant hover:text-primary font-label-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" href="#how-it-works">{t("nav.how-it-works")}</a>
            <a className="text-on-surface-variant hover:text-primary font-label-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" href="/dashboard">{t("nav.dashboard")}</a>
            <a className="text-on-surface-variant hover:text-primary font-label-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" href="/karir">{t("nav.karir")}</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang}
              className="w-9 h-9 rounded-lg border border-outline-variant/40 text-[11px] font-bold uppercase tracking-wider hover:bg-surface-container transition-colors"
              title="Switch language">{lang === "id" ? "EN" : "ID"}</button>
            {!mounted ? (
              /* ── Skeleton same on server & client — prevents hydration mismatch ── */
              <div className="flex items-center gap-3">
                <div className="w-[88px] h-[38px] bg-surface-container-high rounded-lg animate-pulse" />
                <div className="w-11 h-11 rounded-full bg-surface-container-high animate-pulse" />
              </div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <MagneticButton>
                  <Link href="/dashboard" className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-bold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer block">{t("nav.dashboard")}</Link>
                </MagneticButton>
                <Link href="/profile" className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  title={t("nav.profile")} aria-label={t("nav.profile")}>
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-on-surface-variant hover:text-primary font-label-bold transition-colors cursor-pointer">{t("nav.login")}</Link>
                <MagneticButton>
                  <Link href="/login" className="bg-on-background text-white px-6 py-2.5 rounded-lg font-label-bold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer block">{t("nav.try-free")}</Link>
                </MagneticButton>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header id="hero" ref={heroRef} className="relative min-h-[95vh] flex items-center overflow-hidden bg-gradient-to-b from-white via-primary/[0.02] to-white pt-32 pb-16 md:pb-24">
        {/* Animated grid pattern */}
        <motion.div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          animate={{ backgroundPosition: ["0px 0px", "0px 60px"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            y: contentY,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "60px 60px",
          }}
        />
        <motion.div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[150px] pointer-events-none -translate-x-1/2"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-secondary/[0.04] rounded-full blur-[120px] pointer-events-none translate-x-1/3"
          animate={{ scale: [1, 1.15, 1], rotate: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Floating glow orbs */}
        <motion.div className="absolute top-[20%] left-[15%] w-3 h-3 bg-primary/30 rounded-full blur-sm pointer-events-none"
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute top-[40%] right-[20%] w-2 h-2 bg-secondary/40 rounded-full blur-sm pointer-events-none"
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div className="absolute bottom-[30%] left-[30%] w-4 h-4 bg-amber-400/20 rounded-full blur-md pointer-events-none"
          animate={{ y: [0, -25, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Enlarged Mockup — desktop only */}
        <motion.div className="absolute right-[3%] top-1/4 hidden lg:block pointer-events-none" style={{ y: mockupY }}>
          <motion.div className="w-[380px] bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden rotate-[3deg]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
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
          </motion.div>
        </motion.div>

        {/* Template Preview Card — desktop only */}
        <motion.div className="absolute right-[5%] top-[12%] hidden lg:block pointer-events-none z-[5]" style={{ y: templateY }}>
          <motion.div className="w-[200px] bg-white rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden rotate-[6deg]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
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
          </motion.div>
        </motion.div>

        {/* Enlarged ATS Score Card */}
        <motion.div className="absolute right-[8%] top-[58%] hidden lg:block z-10" style={{ y: cardY }}
          animate={{ y: [0, 12, 0] }} transition={{ duration: 5, delay: 1.5, repeat: Infinity, ease: "easeInOut" }}>
          <Link href="/checker" className="block w-[260px] bg-white rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden -rotate-[2deg] hover:-rotate-1 hover:shadow-xl hover:scale-105 transition-[transform,box-shadow] duration-300 cursor-pointer">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-2.5 w-20 bg-secondary/30 rounded" />
                <div className="flex items-center gap-1 text-[10px] text-green-700 font-bold">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"/></svg>
                  <span>{t("hero.ats-badge")}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="h-5 px-2.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded flex items-center">{t("hero.keyword-match")}</span>
                <span className="h-5 px-2.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded flex items-center">93%</span>
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

        {/* AI Suggestion Floating Chip */}
        <motion.div className="absolute right-[38%] top-[22%] hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-premium-sm border border-primary/15 z-20 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{ opacity: { delay: 1.2, duration: 0.5 }, scale: { delay: 1.2, duration: 0.5 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.8 } }}>
          <motion.span className="material-symbols-outlined text-[14px] text-primary"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
            auto_awesome
          </motion.span>
          <span className="text-[10px] font-bold text-primary">{t("hero.ai-chip")}</span>
        </motion.div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter w-full">
          <motion.div className="max-w-3xl mx-auto lg:mx-0 lg:ml-[5%] relative z-10" style={{ y: contentY, opacity }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full mb-8">
              <motion.span className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              ></motion.span>
              <span className="text-label-bold text-[13px]">{t("hero.badge")}</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-[clamp(2.2rem,7vw,4.5rem)] text-on-background mb-6 leading-[0.95] tracking-[-0.02em]">
              {t("hero.title-line1")}<br className="hidden md:block"/>
              <span className="text-primary"> {t("hero.title-line2")}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="font-body-lg text-on-surface-variant max-w-xl mb-6 md:mb-8 text-[17px] leading-relaxed">
              {t("hero.subtitle")}
            </motion.p>

            {/* CTA BUTTONS — moved UP before interactive demo for better mobile visibility */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
              <MagneticButton>
                <Link href={session ? "/dashboard" : "/login"}
                  className="w-full sm:w-auto bg-primary text-on-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-headline-md text-[15px] sm:text-[17px] shadow-xl hover:shadow-2xl active:scale-95 cursor-pointer text-center block">
                  {t("hero.cta-start")}
                </Link>
              </MagneticButton>
              <MagneticButton>
                <a href="#how-it-works" className="w-full sm:w-auto flex items-center justify-center gap-2 text-on-surface font-label-bold px-6 sm:px-8 py-3.5 sm:py-4 hover:bg-surface-container rounded-xl sm:rounded-2xl transition-colors cursor-pointer">
                  <motion.span className="material-symbols-outlined"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                    play_circle
                  </motion.span>
                  {t("hero.cta-how")}
                </a>
              </MagneticButton>
            </motion.div>

            {/* Social proof — subtle after CTA */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
              className="flex items-center gap-3 mb-8 md:mb-10">
              <motion.div className="flex -space-x-2"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white bg-primary/20 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-primary">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </motion.div>
              <span className="text-xs md:text-sm text-on-surface-variant font-medium">{t("hero.social-proof")}</span>
            </motion.div>

            {/* Interactive Hero Demo — Mini ATS Preview (after CTA, secondary) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
              className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-outline-variant/20 shadow-premium-sm max-w-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>search_insights</span>
                <span className="text-xs font-medium text-on-surface-variant">{t("hero.demo-title")}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={t("hero.demo-input")}
                    className="w-full px-3.5 py-2.5 bg-white/60 border border-outline-variant/30 rounded-xl text-sm text-on-surface/80 placeholder:text-outline-variant/60 cursor-not-allowed select-none"
                    readOnly disabled
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-outline-variant font-medium bg-white/80 px-1.5 rounded">Preview</span>
                </div>
                <Link href="/checker" className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:brightness-110 transition-all whitespace-nowrap shadow-sm cursor-pointer inline-flex items-center">
                  {t("hero.demo-analyze")}
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-primary/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-green-400 to-primary rounded-full"
                    initial={{ width: "0%" }} animate={{ width: "85%" }}
                    transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }} />
                </div>
                <span className="text-xs font-bold text-primary shrink-0">{t("hero.demo-score")}</span>
              </div>
              <p className="text-[10px] text-on-surface-variant/60 mt-1.5">{t("hero.demo-hint")}</p>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ── Social Proof Stats — replaces old duplicate template showcase ── */}
      <section id="stats" className="relative py-16 md:py-20 bg-white overflow-hidden">
        <motion.div className="absolute top-10 left-[10%] w-2 h-2 bg-primary/20 rounded-full pointer-events-none"
          animate={{ y: [0, -15, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div className="absolute top-20 right-[15%] w-3 h-3 bg-secondary/15 rounded-full pointer-events-none"
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <motion.div className="absolute bottom-20 left-[20%] w-1.5 h-1.5 bg-amber-400/20 rounded-full pointer-events-none"
          animate={{ y: [0, -12, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter text-center">
          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <h2 className="font-headline-lg text-on-background mb-2">{t("template.title")}</h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto mb-12">{t("template.subtitle")}</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mb-12"
          >
            {/* Stat 1: Total CV */}
            <motion.div variants={staggerItemScale} className="bg-white rounded-2xl p-6 shadow-premium-md border border-outline-variant/30 hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <CountUp end={500} suffix="+" className="text-3xl font-extrabold text-on-surface" />
              <p className="text-sm text-on-surface-variant mt-1">{t("cta.stats-cv")}</p>
            </motion.div>

            {/* Stat 2: ATS Score */}
            <motion.div variants={staggerItemScale} className="bg-white rounded-2xl p-6 shadow-premium-md border border-outline-variant/30 hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
              </div>
              <CountUp end={85} suffix="%" className="text-3xl font-extrabold text-on-surface" />
              <p className="text-sm text-on-surface-variant mt-1">{t("cta.stats-screening")}</p>
            </motion.div>

            {/* Stat 3: Interview Rate */}
            <motion.div variants={staggerItemScale} className="bg-white rounded-2xl p-6 shadow-premium-md border border-outline-variant/30 hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-secondary-container/50 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              </div>
              <CountUp end={3} suffix="x" className="text-3xl font-extrabold text-on-surface" />
              <p className="text-sm text-on-surface-variant mt-1">{t("cta.stats-interview")}</p>
            </motion.div>

            {/* Stat 4: Active Users */}
            <motion.div variants={staggerItemScale} className="bg-white rounded-2xl p-6 shadow-premium-md border border-outline-variant/30 hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-amber-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              </div>
              <CountUp end={1200} suffix="+" className="text-3xl font-extrabold text-on-surface" />
              <p className="text-sm text-on-surface-variant mt-1">Profesional Aktif</p>
            </motion.div>
          </motion.div>

          {/* Quick Tool Access — 4 cards */}
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-8"
          >
            <motion.div variants={staggerItemUp}>
              <Link href="/builder/new" className="block bg-gradient-to-br from-primary/5 to-primary/[0.02] rounded-2xl p-5 shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface group-hover:text-primary transition-colors">Buat CV Baru</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Gunakan template ATS-friendly dengan panduan AI step-by-step.</p>
              </Link>
            </motion.div>
            <motion.div variants={staggerItemUp}>
              <Link href="/checker" className="block bg-gradient-to-br from-secondary/5 to-secondary/[0.02] rounded-2xl p-5 shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface group-hover:text-secondary transition-colors">Analisis CV</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Cek skor ATS dan dapatkan rekomendasi perbaikan instan.</p>
              </Link>
            </motion.div>
            <motion.div variants={staggerItemUp}>
              <Link href="/portfolio" className="block bg-gradient-to-br from-amber-500/5 to-amber-500/[0.02] rounded-2xl p-5 shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface group-hover:text-amber-600 transition-colors">Portofolio Website</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Bangun website portofolio profesional dalam hitungan menit.</p>
              </Link>
            </motion.div>
            <motion.div variants={staggerItemUp}>
              <Link href="/interview" className="block bg-gradient-to-br from-violet-500/5 to-violet-500/[0.02] rounded-2xl p-5 shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group text-left relative">
                {/* Gratis badge */}
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wider shadow-premium-sm">
                  Gratis
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-violet-600" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface group-hover:text-violet-600 transition-colors">Persiapan Interview</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">300+ pertanyaan umum untuk 33+ posisi, lengkap dengan tips jawaban.</p>
                {/* CTA ke practice mode */}
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-violet-500">
                  <span className="material-symbols-outlined text-[11px]">play_circle</span>
                  Juga tersedia: Mode Latihan dengan timer
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
              shimmer
              pulseIcon
              bounceArrow
              icon={<span className="material-symbols-outlined text-lg">add</span>}
              iconRight={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              }
            >
              {t("hero.cta-start")}
            </AnimatedButton>
            <AnimatedButton
              href="/interview/practice"
              variant="emerald"
              shimmer
              pulseIcon
              bounceArrow
              icon={<span className="material-symbols-outlined text-lg">play_circle</span>}
              iconRight={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              }
            >
              Mode Latihan Interview
            </AnimatedButton>
          </motion.div>
        </div>
      </section>

      <Logos3 />

      {/* ── Features ── */}
      <section className="relative py-20 md:py-28 px-margin-mobile md:px-gutter bg-white overflow-hidden" id="features">
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

          {/* Feature Tabs — Interactive Tab System */}
          <FeatureTabs />


        </div>
      </section>

      {/* ── AI Insight ── */}
      <motion.section className="py-20 md:py-28 px-margin-mobile md:px-gutter overflow-hidden bg-surface-container-low" id="how-it-works"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
        <div className="max-w-7xl mx-auto bg-white rounded-2xl p-8 md:p-20 relative ambient-card-shadow border border-outline-variant/30">
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
      <section className="relative py-20 md:py-28 px-margin-mobile md:px-gutter bg-white overflow-hidden">
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
            {/* BEFORE */}
            <motion.div variants={staggerItemUp} className="[perspective:800px]">
              <TiltCard tiltOptions={{ maxAngle: 3, scale: 1.005, glare: false }}>
                <div className="group relative rounded-2xl border-2 border-red-200 bg-white overflow-hidden shadow-premium-sm hover:shadow-premium-md transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 to-red-300" />
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-red-500">{t("before-after.before-label")}</span>
                          <p className="text-[11px] text-red-300 font-medium">{t("before-after.score-before")}<span className="text-red-500 font-bold">45%</span></p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-bold">Tidak Lolos</span>
                    </div>
                    {/* Mock CV Content — messy */}
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
                            <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-400 rounded text-[10px] font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-red-400 font-medium">ATS Score</span>
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

            {/* AFTER */}
            <motion.div variants={staggerItemUp} className="[perspective:800px]">
              <TiltCard tiltOptions={{ maxAngle: 3, scale: 1.005, glare: false }}>
                <div className="group relative rounded-2xl border-2 border-green-200 bg-white overflow-hidden shadow-premium-sm hover:shadow-premium-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-primary">{t("before-after.after-label")}</span>
                          <p className="text-[11px] text-primary/50 font-medium">{t("before-after.score-after")}<span className="text-primary font-bold">92%</span></p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold">Lolos ATS</span>
                    </div>
                    {/* Mock CV Content — clean */}
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
                            <span key={s} className="px-2.5 py-1 bg-primary/5 text-primary rounded text-[10px] font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-primary/60 font-medium">ATS Score</span>
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
                <span className="text-2xl">📈</span>
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

      {/* ── Pricing ── */}
      <PricingSection
        onSelectPlan={(planId, mode) => {
          if (planId === "free") {
            router.push("/login");
          } else if (
            planId === "cv-starter" || planId === "cv-ai-generate" ||
            planId === "cv-analyzer" || planId === "portfolio-web" ||
            planId === "starter" || planId === "pro" || planId === "business"
          ) {
            router.push("/settings/billing?plan=" + planId + "&mode=" + mode);
          } else {
            router.push("/settings/billing");
          }
        }}
      />

      {/* ── Testimonials ── */}
      <motion.section id="testimonials" className="py-20 md:py-28 bg-surface-container-low overflow-hidden"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter mb-16 text-center">
          <h2 className="font-headline-lg text-on-background mb-4">{t("testimonials.title")}</h2>
          <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">{t("testimonials.subtitle")}</p>
        </div>
        <div className="max-w-7xl mx-auto flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[900px] overflow-hidden">
          <TestimonialsColumn key={"col1-" + lang} testimonials={firstColumn} duration={15} />
          <TestimonialsColumn key={"col2-" + lang} testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn key={"col3-" + lang} testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </motion.section>

      {/* ── CTA ── */}
      <motion.section id="cta-footer" className="relative py-20 md:py-28 bg-white overflow-hidden"
        variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter">
          <div className="bg-gradient-to-br from-primary via-primary-container to-primary rounded-2xl p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-headline-lg text-[28px] md:text-[40px] mb-6 leading-tight">{t("cta.title")}</h2>
              <p className="font-body-lg mb-8 opacity-90 max-w-2xl mx-auto">{t("cta.subtitle")}</p>
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                <span className="px-3 py-1.5 rounded-full bg-white/20 text-xs font-medium inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"/></svg>
                  {t("cta.pill-ats")}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/20 text-xs font-medium inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                  {t("cta.pill-analysis")}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/20 text-xs font-medium inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  {t("cta.pill-portfolio")}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/20 text-xs font-medium inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="16" r="2"/><path d="M16 11V7a4 4 0 00-8 0v4"/></svg>
                  {t("cta.pill-ai")}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 perspective-[600px]">
                <MagneticButton>
                  <Link href={session ? "/dashboard" : "/login"}
                    className="group/cta px-10 py-4 rounded-2xl bg-white text-primary font-bold text-base transition-all duration-300 inline-flex items-center gap-2 cursor-pointer relative overflow-hidden"
                    style={{ transformStyle: "preserve-3d" }}>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700" />
                    {t("cta.button")}
                    <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </motion.svg>
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link href="#features"
                    className="px-10 py-4 rounded-2xl border border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-all inline-flex items-center gap-2 cursor-pointer">
                    {t("cta.button-features")}
                  </Link>
                </MagneticButton>
              </div>
              <p className="text-xs text-white/50 mt-6">{t("cta.footer")}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <StickyMobileCTA />

      <AppFooter variant="full" />
    </>
  );
}
