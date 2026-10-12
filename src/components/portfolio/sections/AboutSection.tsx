"use client";

import { motion } from "motion/react";
import type { PortfolioFormData } from "../../portfolio-templates/types";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { data: PortfolioFormData; }

/* ═══════════════════════════════════════════════
 * GLASS, Floating bento card with mesh gradient,
 *          animated dot pattern, frosted backdrop
 * ═══════════════════════════════════════════════ */
function GlassAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const reduced = useReducedMotion();
  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      {/* Decorative mesh dots */}
      <div className="pf-atmosphere absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full opacity-[0.03]" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="glass-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill={theme.colors.primary} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#glass-dots)" />
        </svg>
        <motion.div
          className="absolute w-[300px] h-[300px] blur-[80px]"
          style={{ background: theme.colors.primary, top: "10%", left: "5%", opacity: 0.06, borderRadius: theme.radii.pill }}
          {...(!reduced ? { animate: { y: [0, -20, 0], opacity: [0.06, 0.1, 0.06] }, transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } } : {})}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Large floating glass card */}
          <div className="relative overflow-hidden" style={{
            background: `${theme.colors.surface}`,
            borderRadius: theme.radii.card,
            backdropFilter: theme.blur.card,
            border: `1px solid ${theme.colors.border}`,
          }}>
            {/* Internal gradient bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})` }} />

            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-[1fr_0.7fr] gap-8 items-start">
                {/* Left: Main text */}
                <div>
                  <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: theme.colors.text }}>
                    Tentang Saya
                  </h2>
                  {f.aboutText && (
                    <p className="leading-relaxed" style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 1.7 }}>
                      {f.aboutText}
                    </p>
                  )}
                </div>

                {/* Right: Decorative stat highlights with glass pills */}
                <div className="space-y-3">
                  {[
                    { value: f.aboutYearsExp, label: "Tahun Pengalaman", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" },
                    { value: f.aboutProjectsDone, label: "Project Selesai", icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
                  ].filter(s => s.value).map((s, i) => (
                    <div key={s.label} className="flex items-center gap-3 p-3" style={{
                      background: `${theme.colors.primary}08`,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radii.card,
                    }}>
                      <div className="w-9 h-9 flex items-center justify-center" style={{ background: `${theme.colors.primary}15`, borderRadius: theme.radii.card }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.accent} strokeWidth="1.5">
                          <path d={s.icon} />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg font-bold" style={{ color: theme.colors.primary }}>{s.value}</div>
                        <div className="text-xs" style={{ color: theme.colors.textMuted }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * BRUTAL, Pull-quote with massive drop cap,
 *          bold border frame, asymmetrical layout
 * ═══════════════════════════════════════════════ */
function BrutalAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const firstWord = f.aboutText?.split(" ")[0] || "T";
  const restText = f.aboutText?.split(" ").slice(1).join(" ") || "";

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Bold frame, no inner bezel, just raw border and shadow */}
          <div className="relative">
            <div className="p-8 md:p-10" style={{
              background: theme.colors.surface,
              border: `4px solid ${theme.colors.border}`,
              borderRadius: theme.radii.card,
              boxShadow: theme.shadow.card,
            }}>
              {/* Eyebrow as bold badge */}
              <div className="inline-block mb-6 px-4 py-1 text-xs font-black tracking-widest"
                style={{ background: theme.colors.primary, color: theme.colors.onPrimary }}>
                TENTANG
              </div>

              <div className="flex items-start gap-6">
                {/* Drop cap, massive first letter */}
                <div className="hidden md:block flex-shrink-0 text-center" style={{ minWidth: 100 }}>
                  <span className="font-black leading-none" style={{
                    fontSize: "clamp(5rem, 10vw, 7rem)",
                    color: theme.colors.primary,
                    display: "block",
                    lineHeight: 0.85,
                  }}>
                    {firstWord[0]}
                  </span>
                  <div className="w-12 h-1 mx-auto mt-2" style={{ background: theme.colors.accent }} />
                </div>

                <div className="flex-1">
                  <h2 className="font-black mb-4" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", color: theme.colors.text, letterSpacing: "-0.03em" }}>
                    TENTANG SAYA
                  </h2>
                  {f.aboutText && (
                    <p className="leading-relaxed" style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 1.8 }}>
                      <span className="md:hidden font-black text-3xl float-left mr-2" style={{ color: theme.colors.primary }}>{firstWord[0]}</span>
                      {restText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * LUXE, Magazine column split with drop cap,
 *        ornamental divider, elegant serif
 * ═══════════════════════════════════════════════ */
function LuxeAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const words = f.aboutText?.split(" ") || [];
  const firstWord = words[0] || "A";
  const restWords = words.slice(1).join(" ");

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Magazine column split */}
          <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12">
            {/* Left column, decorative label + thin accent */}
            <div className="relative">
              <div className="md:sticky md:top-24">
                <span className="font-medium tracking-[0.2em] text-xs" style={{ color: theme.colors.primary }}>
                  TENTANG
                </span>
                <div className="mt-3 w-12 h-[1px]" style={{ background: theme.colors.primary }} />
                <h2 className="font-bold mt-6 leading-tight" style={{
                  fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)",
                  color: theme.colors.text,
                  fontFamily: theme.typography.display,
                }}>
                  Tentang Saya
                </h2>
              </div>
            </div>

            {/* Right column, main text with drop cap */}
            <div className="relative pl-6" style={{ borderLeft: `1px solid ${theme.colors.border}` }}>
              {f.aboutText && (
                <div className="leading-relaxed" style={{ color: theme.colors.textMuted, fontSize: 15, lineHeight: 1.8 }}>
                  <span className="float-left mr-3 font-bold leading-none" style={{
                    fontSize: "clamp(3.5rem, 6vw, 5rem)",
                    color: theme.colors.primary,
                    fontFamily: theme.typography.display,
                    lineHeight: 0.8,
                  }}>
                    {firstWord[0]}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                    {firstWord.substring(1)}{" "}
                  </span>
                  {restWords}
                </div>
              )}

              {/* End mark */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * MINIMALIST — dua kolom asimetris: label + garis
 * rambut di kiri, paragraf lebar di kanan. Angka
 * statistik jadi teks polos yang dipisah garis
 * vertikal, bukan kartu.
 * ═══════════════════════════════════════════════ */
function MinimalistAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const stats = [
    { value: f.aboutYearsExp, label: "Tahun" },
    { value: f.aboutProjectsDone, label: "Proyek" },
    { value: f.aboutClientsHappy, label: "Klien" },
  ].filter((s) => s.value);

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 200px) 1fr", gap: "clamp(24px, 5vw, 64px)" }}>
          <div>
            <span style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              color: theme.colors.textSecondary,
            }}>
              01 / Tentang
            </span>
            <div style={{ height: 1, background: theme.colors.border, marginTop: 16 }} />
          </div>

          <div>
            {f.aboutText ? (
              <p style={{
                fontFamily: theme.typography.display,
                fontSize: "clamp(18px, 2.4vw, 22px)",
                lineHeight: 1.6,
                letterSpacing: "-0.01em",
                color: theme.colors.text,
                margin: 0,
                maxWidth: 680,
              }}>
                {f.aboutText}
              </p>
            ) : null}

            {stats.length ? (
              <div style={{ display: "flex", gap: "clamp(24px, 4vw, 48px)", marginTop: 40, flexWrap: "wrap" }}>
                {stats.map((s, i) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    {i > 0 ? (
                      <span aria-hidden="true" style={{ color: theme.colors.border, marginRight: 8 }}>|</span>
                    ) : null}
                    <span style={{
                      fontFamily: theme.typography.display,
                      fontSize: "clamp(24px, 3vw, 32px)",
                      fontWeight: 500,
                      color: theme.colors.text,
                    }}>
                      {s.value}
                    </span>
                    <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{s.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function AboutSection({ data: f }: Props) {
  const theme = usePortfolioTheme();
  if (!f.aboutText) return null;
  switch (theme.id) {
    case "glass": return <GlassAbout f={f} />;
    case "brutal": return <BrutalAbout f={f} />;
    case "luxe": return <LuxeAbout f={f} />;
    case "minimalist": return <MinimalistAbout f={f} />;
    default: return <GlassAbout f={f} />;
  }
}
