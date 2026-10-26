"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import type { ThemeDefinition } from "../types";

/**
 * Perangkat visual tema `workbench` (Kertas Kerja).
 *
 * Tema ini meniru tema aplikasi: kertas desk-green, garis tinta 2,5px,
 * bayangan padat tanpa blur, label mono, dan satu penanda lime. Semua section
 * memakai perangkat yang sama supaya halaman terbaca sebagai satu lembar kerja,
 * bukan kumpulan kartu. Semua warna, radius, bayangan, dan font datang dari
 * token tema — tidak ada nilai visual literal di sini.
 */

export const WB_EASE = [0.16, 1, 0.3, 1] as const;
export const WB_MAX = 1040;
export const WB_PAD = "0 clamp(20px, 5vw, 40px)";

export function wbSection(theme: ThemeDefinition, extra?: CSSProperties): CSSProperties {
  return { background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0", ...extra };
}

export function wbWrap(extra?: CSSProperties): CSSProperties {
  return { maxWidth: WB_MAX, margin: "0 auto", padding: WB_PAD, ...extra };
}

/** Permukaan kertas: garis tinta, sudut token, bayangan offset padat. */
export function wbPaper(theme: ThemeDefinition, extra?: CSSProperties): CSSProperties {
  return {
    background: theme.colors.surface,
    border: `2.5px solid ${theme.colors.border}`,
    borderRadius: theme.radii.card,
    boxShadow: theme.shadow.card,
    ...extra,
  };
}

export function wbMono(theme: ThemeDefinition): CSSProperties {
  return { fontFamily: theme.typography.eyebrow, letterSpacing: "0.04em" };
}

export function wbHeading(theme: ThemeDefinition, size = "clamp(26px, 3.6vw, 38px)"): CSSProperties {
  return {
    fontFamily: theme.typography.display,
    fontSize: size,
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: "-0.025em",
    color: theme.colors.text,
    margin: 0,
  };
}

/** Section masuk saat digulir. Satu-satunya animasi masuk yang dipakai tema ini. */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  style,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      // Ambang "some" (bukan rasio tinggi): panel panjang seperti daftar
      // sertifikasi bisa lebih tinggi dari layar, dan ambang rasio membuat
      // isinya tidak pernah muncul.
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay, ease: WB_EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Label mikro: kotak lime bergaris tinta + teks mono. Dipakai sebagai penanda
 * bagian (seperti tab kertas kerja), bukan eyebrow kapital di setiap section.
 */
export function SheetLabel({ children }: { children: ReactNode }) {
  const theme = usePortfolioTheme();
  return (
    <p
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: 0,
        ...wbMono(theme),
        fontSize: 12,
        color: theme.colors.textSecondary,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          flexShrink: 0,
          background: theme.colors.accent,
          border: `1.5px solid ${theme.colors.border}`,
        }}
      />
      {children}
    </p>
  );
}

/** Judul section: label mono, judul display, dan garis tinta yang menutup kepala. */
export function SectionHead({
  label,
  title,
  lede,
  aside,
}: {
  label: string;
  title: string;
  lede?: string;
  aside?: ReactNode;
}) {
  const theme = usePortfolioTheme();
  return (
    <Reveal style={{ marginBottom: "clamp(24px, 3vw, 36px)" }}>
      <SheetLabel>{label}</SheetLabel>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
        <h2 style={wbHeading(theme)}>{title}</h2>
        <div style={{ flex: 1, minWidth: 40, height: 2.5, background: theme.colors.border, marginBottom: 8 }} />
        {aside}
      </div>
      {lede ? (
        <p style={{ margin: "10px 0 0", maxWidth: 560, fontSize: 15, lineHeight: 1.65, color: theme.colors.textSecondary }}>
          {lede}
        </p>
      ) : null}
    </Reveal>
  );
}

/** Kertas dengan hover angkat. `tone="dark"` untuk bidang evergreen di dalam kertas. */
export function Paper({
  children,
  style,
  hover = true,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  hover?: boolean;
  className?: string;
}) {
  const theme = usePortfolioTheme();
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ ...wbPaper(theme), ...style }}
      whileHover={hover && !reduced ? { y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Selotip kertas di sudut foto — alasan visual: foto "ditempel" di lembar
 * kerja. Warnanya kertas, bukan lime: lime tetap milik penanda nama dan satu
 * ajakan utama di layar yang sama.
 */
export function Tape({ rotate = -6, style }: { rotate?: number; style?: CSSProperties }) {
  const theme = usePortfolioTheme();
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 96,
        height: 24,
        background: theme.colors.surface,
        border: `1.5px solid ${theme.colors.border}`,
        boxShadow: theme.shadow.card,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    />
  );
}

export function Chip({ children, filled = false }: { children: ReactNode; filled?: boolean }) {
  const theme = usePortfolioTheme();
  return (
    <span
      style={{
        ...wbMono(theme),
        display: "inline-block",
        fontSize: 12,
        padding: "4px 10px",
        color: theme.colors.text,
        background: filled ? theme.colors.accent : theme.colors.bg,
        border: `1.5px solid ${theme.colors.border}`,
        borderRadius: theme.radii.pill,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Tautan berbentuk pil. `primary` memakai lime dengan teks tinta; sisanya
 * transparan bergaris tinta. Tinggi minimum 44px demi target sentuh.
 */
export function PillLink({
  href,
  children,
  primary = false,
  external = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  const theme = usePortfolioTheme();
  const reduced = useReducedMotion();
  return (
    <motion.a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.18, ease: WB_EASE }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 44,
        padding: "10px 20px",
        fontFamily: theme.typography.body,
        fontSize: 14,
        fontWeight: 700,
        textDecoration: "none",
        color: theme.colors.text,
        background: primary ? theme.colors.accent : "transparent",
        border: `2.5px solid ${theme.colors.border}`,
        borderRadius: theme.radii.button,
        boxShadow: primary ? theme.shadow.card : "none",
      }}
    >
      {children}
    </motion.a>
  );
}

export function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function ArrowUpRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}
