"use client";

import { motion, type Variants } from "motion/react";
import { useMemo } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import type { PortfolioFormData } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { data: PortfolioFormData; }

/* ─── Button-in-Button Component ─── */
function FancyButton({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  const theme = usePortfolioTheme();
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-3 font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
      style={{
        background: primary ? theme.colors.primary : "transparent",
        color: primary ? theme.colors.onPrimary : theme.colors.textSecondary,
        border: primary ? "none" : `2px solid ${theme.colors.border}`,
        padding: "12px 24px 12px 28px",
        fontSize: 14,
        borderRadius: theme.radii.button,
      }}
    >
      <span>{label}</span>
      <span
        className="w-8 h-8 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105"
        style={{
          background: primary ? "rgba(255,255,255,0.15)" : `${theme.colors.primary}15`,
          color: primary ? theme.colors.onPrimary : theme.colors.primary,
          borderRadius: theme.radii.pill,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </span>
    </a>
  );
}

/* ─── EYEBROW BADGE ─── */
function Eyebrow({ text }: { text: string }) {
  const theme = usePortfolioTheme();
  return (
    <span
      className="inline-block px-3 py-1 text-xs uppercase tracking-[0.2em] font-medium mb-6"
      style={{
        background: `${theme.colors.primary}12`,
        color: theme.colors.primary,
        border: `1px solid ${theme.colors.primary}20`,
        borderRadius: theme.radii.pill,
      }}
    >
      {text}
    </span>
  );
}

/* ─── Floating particles helper ─── */
function FloatingParticles({ count = 6, colors }: { count?: number; colors: { primary: string; accent: string } }) {
  const theme = usePortfolioTheme();
  const reduced = useReducedMotion();
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      size: Math.random() * 6 + 3,
      left: 10 + Math.random() * 80,
      top: 5 + Math.random() * 90,
      yOffset: -20 - Math.random() * 30,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 5,
      isPrimary: i % 2 === 0,
    })),
  [count]);

  if (reduced) return null;

  return (
    <div className="pf-atmosphere absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            background: p.isPrimary ? colors.primary : colors.accent,
            opacity: 0.08 + (i % 3) * 0.04,
            left: `${p.left}%`,
            top: `${p.top}%`,
            borderRadius: theme.radii.pill,
          }}
          animate={{
            y: [0, p.yOffset, 0],
            opacity: [0.08, 0.25, 0.08],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Section stagger variants ─── */
const EASE = [0.32, 0.72, 0, 1] as const;

const STAGGER_PARENT: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const STAGGER_CHILD: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: EASE,
    },
  },
};

const STAGGER_CHILD_SLOW: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: EASE,
    },
  },
};

/* ═══════════════════════════════════════════════
 * GLASS, Centered, floating glass card,
 *         animated orbs, staggered entrance,
 *         floating particles
 * ═══════════════════════════════════════════════ */
function GlassHero({ data: f, name, initials }: { data: PortfolioFormData; name: string; initials: string }) {
  const theme = usePortfolioTheme();
  return (
    <section className="relative overflow-hidden" data-hero-variant="glass" style={{ padding: "140px 0 80px" }}>
      {/* Animated gradient orbs */}
      <div className="pf-atmosphere absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] blur-[120px]"
          style={{ background: theme.colors.primary, top: "-30%", right: "-10%", opacity: 0.08, borderRadius: theme.radii.pill }}
          animate={{
            scale: [1, 1.15, 1, 1.1, 1],
            rotate: [0, 10, -5, 5, 0],
            opacity: [0.08, 0.12, 0.08, 0.1, 0.08],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] blur-[100px]"
          style={{ background: theme.colors.accent, bottom: "-20%", left: "-10%", opacity: 0.06, borderRadius: theme.radii.pill }}
          animate={{
            scale: [1, 1.2, 0.95, 1.1, 1],
            rotate: [0, -10, 8, -5, 0],
            opacity: [0.06, 0.1, 0.06, 0.08, 0.06],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>

      {/* Floating particles */}
      <FloatingParticles colors={{ primary: theme.colors.primary, accent: theme.colors.accent }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          variants={STAGGER_PARENT}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={STAGGER_CHILD}>
            <Eyebrow text={f.heroSubHeadline || "Welcome to my portfolio"} />
          </motion.div>

          <motion.h1
            variants={STAGGER_CHILD}
            className="font-bold leading-[1.05] mb-6 mx-auto"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              color: theme.colors.text,
              maxWidth: "900px",
              letterSpacing: "-0.03em",
            }}
          >
            Halo, Saya{" "}
            <motion.span
              className="font-extrabold inline-block"
              style={{
                color: theme.colors.primary,
                textShadow: `0 0 60px ${theme.colors.primaryGlow}`,
              }}
              animate={{
                textShadow: [
                  `0 0 60px ${theme.colors.primaryGlow}`,
                  `0 0 80px ${theme.colors.primary}`,
                  `0 0 60px ${theme.colors.primaryGlow}`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {name}
            </motion.span>
          </motion.h1>

          {f.heroHeadline && (
            <motion.p variants={STAGGER_CHILD} className="text-lg max-w-2xl mx-auto mb-8" style={{ color: theme.colors.textSecondary, fontWeight: 400 }}>
              {f.heroHeadline}
            </motion.p>
          )}

          {f.heroBio && (
            <motion.p variants={STAGGER_CHILD} className="max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: theme.colors.textMuted, fontSize: 15 }}>
              {f.heroBio}
            </motion.p>
          )}

          <motion.div variants={STAGGER_CHILD} className="flex justify-center gap-4 flex-wrap">
            <FancyButton href="#projects" label="Lihat Karya" primary />
            <FancyButton href="#contact" label="Hubungi Saya" />
          </motion.div>
        </motion.div>

        {/* Photo with double-bezel + floating animation */}
        {f.heroPhotoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: [0, -8, 0],
              scale: 1,
            }}
            transition={{
              y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
              opacity: { duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.4 },
              scale: { duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.4 },
            }}
            className="mt-16 inline-block"
          >
            <div className="p-1.5" style={{ background: `${theme.colors.primary}08`, borderRadius: theme.radii.image, border: `1px solid ${theme.colors.border}` }}>
              <div className="overflow-hidden" style={{ borderRadius: theme.radii.card, boxShadow: theme.shadow.card, position: "relative" }}>
                <motion.img
                  src={f.heroPhotoUrl}
                  alt={name}
                  style={{ width: 200, height: 200, objectFit: "cover", display: "block" }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                />
                {/* Scrim:玻璃 di atas foto supaya nama di atasnya selalu terbaca */}
                <div
                  data-hero-scrim=""
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `linear-gradient(to top, ${theme.colors.bg}, transparent 62%)`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * BRUTAL, Asymmetrical split, bold borders,
 *          shadow boxes, anaglyph motion, particles
 * ═══════════════════════════════════════════════ */
function BrutalHero({ data: f, name, initials }: { data: PortfolioFormData; name: string; initials: string }) {
  const theme = usePortfolioTheme();
  return (
    <section className="relative overflow-hidden" data-hero-variant="brutal" style={{ padding: "120px 0 80px" }}>
      {/* Grain overlay with subtle animation */}
      <motion.div
        className="pf-atmosphere fixed inset-0 pointer-events-none"
        style={{ zIndex: 50, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
        animate={{ opacity: [0.025, 0.04, 0.025] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      <FloatingParticles count={8} colors={{ primary: theme.colors.primary, accent: theme.colors.accent }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            variants={STAGGER_PARENT}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={STAGGER_CHILD}>
              <Eyebrow text={f.heroSubHeadline || "HELLO THERE"} />
            </motion.div>

            <motion.h1
              variants={STAGGER_CHILD}
              className="font-black leading-[0.95] mb-6"
              style={{
                fontSize: "clamp(3rem, 7vw, 5rem)",
                color: theme.colors.text,
                letterSpacing: "-0.04em",
              }}
            >
              <motion.span
                className="inline-block"
                animate={{ x: [0, -3, 0, 2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                {name.split(" ")[0] || "Halo"}
              </motion.span>
              <br />
              <motion.span
                style={{
                  padding: "0 4px",
                  display: "inline-block",
                  boxShadow: theme.shadow.card,
                  background: theme.colors.primary,
                  // Warna teks di elemen INI sengaja tidak diset: currentColor
                  // adalah bayangan hard-nya, jadi ikut warna teks tema (gelap).
                  // Teks putihnya ada di span dalam.
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <span style={{ color: theme.colors.onPrimary }}>
                  {name.split(" ").slice(1).join(" ") || "Saya"}
                </span>
              </motion.span>
            </motion.h1>

            {f.heroHeadline && (
              <motion.p variants={STAGGER_CHILD} className="text-lg font-semibold mb-4" style={{ color: theme.colors.textSecondary }}>
                {f.heroHeadline}
              </motion.p>
            )}

            {f.heroBio && (
              <motion.p variants={STAGGER_CHILD} className="max-w-md mb-10 leading-relaxed" style={{ color: theme.colors.textMuted }}>
                {f.heroBio}
              </motion.p>
            )}

            <motion.div variants={STAGGER_CHILD} className="flex gap-4 flex-wrap">
              <FancyButton href="#projects" label="Lihat Karya" primary />
              <FancyButton href="#contact" label="Hubungi Saya" />
            </motion.div>
          </motion.div>

          {/* Right: Photo with brutal double-bezel + parallax */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 3 }}
            animate={{
              opacity: 1,
              x: 0,
              rotate: -2,
              y: [0, -6, 0],
            }}
            transition={{
              opacity: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
              x: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
              rotate: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
            }}
            className="relative"
          >
            <div className="p-2" style={{ background: theme.colors.border, borderRadius: theme.radii.image }}>
              <div className="overflow-hidden" style={{ borderRadius: theme.radii.card, border: `4px solid ${theme.colors.bg}` }}>
                {f.heroPhotoUrl ? (
                  <motion.img
                    src={f.heroPhotoUrl}
                    alt={name}
                    style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.4 }}
                  />
                ) : (
                  <motion.div
                    style={{ width: "100%", height: 380, background: theme.colors.surface, display: "flex", alignItems: "center", justifyContent: "center" }}
                    animate={{ background: [theme.colors.surface, `${theme.colors.primary}05`, theme.colors.surface] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span style={{ fontSize: 80, fontWeight: 900, color: theme.colors.primary, opacity: 0.2 }}>{initials}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Animated shadow box */}
            <motion.div
              className="absolute -bottom-4 -right-4 -z-10"
              style={{
                width: "100%",
                height: "100%",
                border: `4px solid ${theme.colors.border}`,
                borderRadius: theme.radii.card,
                background: theme.colors.accent,
                opacity: 0.15,
              }}
              animate={{
                x: [0, 4, 0, -2, 0],
                y: [0, -4, 0, 2, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * LUXE, Editorial split, massive serif typography,
 *        film grain, warm tones, parallax
 * ═══════════════════════════════════════════════ */
function LuxeHero({ data: f, name, initials }: { data: PortfolioFormData; name: string; initials: string }) {
  const theme = usePortfolioTheme();
  return (
    <section className="relative overflow-hidden" data-hero-variant="luxe" style={{ padding: "120px 0 80px" }}>
      {/* Animated grain overlay */}
      <motion.div
        className="pf-atmosphere fixed inset-0 pointer-events-none"
        style={{ zIndex: 50, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
        animate={{ opacity: [0.02, 0.035, 0.02] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Warm ambient glow */}
      <motion.div
        className="pf-atmosphere absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${theme.colors.primary}06, transparent 60%)`,
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <FloatingParticles count={5} colors={{ primary: theme.colors.primary, accent: theme.colors.accent }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[1.3fr_0.7fr] gap-16 items-center">
          {/* Left: Editorial typography */}
          <motion.div
            variants={STAGGER_PARENT}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              variants={STAGGER_CHILD}
              className="inline-block font-medium mb-4"
              style={{
                color: theme.colors.primary,
                fontSize: 13,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: theme.typography.eyebrow,
              }}
            >
              {f.heroSubHeadline || "PERKENALKAN"}
            </motion.span>

            <motion.h1
              variants={STAGGER_CHILD_SLOW}
              className="leading-[1.05] mb-6"
              style={{
                fontSize: "clamp(2.8rem, 7vw, 5rem)",
                color: theme.colors.text,
                fontWeight: 700,
                fontFamily: theme.typography.display,
                letterSpacing: "-0.02em",
              }}
            >
              <motion.span
                className="inline-block"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                {name}
              </motion.span>
            </motion.h1>

            {/* Animated ornamental divider */}
            <motion.div variants={STAGGER_CHILD} className="flex items-center gap-4 mb-6">
              <motion.div
                style={{ width: 40, height: 2, background: theme.colors.primary }}
                animate={{ width: [40, 60, 40] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span style={{ fontSize: 11, color: theme.colors.textMuted, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: theme.typography.eyebrow }}>
                {f.heroHeadline || "PORTFOLIO"}
              </span>
              <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
            </motion.div>

            {f.heroBio && (
              <motion.p variants={STAGGER_CHILD_SLOW} className="max-w-md mb-10 leading-relaxed" style={{ color: theme.colors.textMuted, fontSize: 15, fontFamily: theme.typography.body }}>
                {f.heroBio}
              </motion.p>
            )}

            <motion.div variants={STAGGER_CHILD} className="flex gap-4 flex-wrap">
              <FancyButton href="#projects" label="Lihat Karya" primary />
              <FancyButton href="#contact" label="Hubungi Saya" />
            </motion.div>
          </motion.div>

          {/* Right: Photo with double-bezel + floating */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -6, 0],
            }}
            transition={{
              opacity: { duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.3 },
              scale: { duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.3 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 },
            }}
          >
            {/* Luxe tidak memakai kartu: kolom foto polos, tanpa radius dan
                tanpa bayangan — hierarki datang dari ruang kosong dan garis. */}
            <div className="p-0" data-hero-frame="plain">
              <div className="overflow-hidden" style={{ borderRadius: theme.radii.circle }}>
                {f.heroPhotoUrl ? (
                  <motion.img
                    src={f.heroPhotoUrl}
                    alt={name}
                    style={{ width: "100%", height: 420, objectFit: "cover", display: "block", filter: "sepia(0.15)" }}
                    whileHover={{ scale: 1.03, filter: "sepia(0.08)" }}
                    transition={{ duration: 0.4 }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 420, background: theme.colors.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 100, fontWeight: 700, color: theme.colors.textMuted, opacity: 0.1, fontFamily: theme.typography.display }}>{initials}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * MINIMALIST, Ink on paper
 * Lingkaran (foto atau inisial) + nama grotesk raksasa,
 * bio di bawah garis rambut. Tanpa isian, tanpa bayangan.
 * Tinggi dari padding + clamp — sengaja tanpa h-screen
 * supaya tidak melompat di iOS.
 * ═══════════════════════════════════════════════ */
function MinimalistHero({ data: f, name, initials }: { data: PortfolioFormData; name: string; initials: string }) {
  const theme = usePortfolioTheme();
  return (
    <section
      data-section-id="hero"
      data-hero-variant="minimalist"
      className="relative w-full"
      style={{ background: theme.colors.bg, color: theme.colors.text, padding: "clamp(56px, 10vh, 120px) 0" }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <span
            data-hero-circle=""
            style={{
              width: 96,
              height: 96,
              borderRadius: theme.radii.circle,
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.bgSecondary,
              flexShrink: 0,
            }}
          >
            {f.heroPhotoUrl ? (
              <img
                src={f.heroPhotoUrl}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <span style={{ fontSize: 26, letterSpacing: "-0.02em", color: theme.colors.text }}>
                {initials}
              </span>
            )}
          </span>
          {f.heroHeadline ? (
            <span
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: theme.colors.textSecondary,
              }}
            >
              {f.heroHeadline}
            </span>
          ) : null}
        </div>

        <h1
          style={{
            fontFamily: theme.typography.display,
            fontSize: "clamp(44px, 8vw, 88px)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            fontWeight: 500,
            margin: 0,
          }}
        >
          {name}
        </h1>

        {f.heroSubHeadline ? (
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              lineHeight: 1.5,
              color: theme.colors.textSecondary,
              margin: "20px 0 0",
              maxWidth: 640,
            }}
          >
            {f.heroSubHeadline}
          </p>
        ) : null}

        {f.heroBio ? (
          <>
            <div
              style={{
                height: 1,
                background: theme.colors.border,
                margin: "32px 0 24px",
                maxWidth: 1040,
              }}
            />
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: theme.colors.textSecondary,
                margin: 0,
                maxWidth: 620,
              }}
            >
              {f.heroBio}
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function HeroSection({ data }: Props) {
  const f = data;
  const name = [f.heroFirstName, f.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap";
  const initials = ((f.heroFirstName?.[0] || "") + (f.heroLastName?.[0] || "")).toUpperCase() || "?";
  const theme = usePortfolioTheme();

  switch (theme.id) {
    case "glass":
      return <GlassHero data={f} name={name} initials={initials} />;
    case "brutal":
      return <BrutalHero data={f} name={name} initials={initials} />;
    case "luxe":
      return <LuxeHero data={f} name={name} initials={initials} />;
    case "minimalist":
      return <MinimalistHero data={f} name={name} initials={initials} />;
    default:
      return <GlassHero data={f} name={name} initials={initials} />;
  }
}
