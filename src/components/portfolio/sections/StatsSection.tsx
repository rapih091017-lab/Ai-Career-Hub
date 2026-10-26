"use client";

import { motion } from "motion/react";
import type { PortfolioFormData } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { Paper, Reveal, wbHeading, wbMono, wbSection, wbWrap } from "../workbench/kit";

interface Props { data: PortfolioFormData; }

/* ═══════════════════════════════════════════════
 * GLASS, Staggered floating bubbles with
 *          connecting gradient lines (NOT grid)
 * ═══════════════════════════════════════════════ */
function GlassStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-4 md:gap-6 relative">
          {/* Connecting lines between bubbles */}
          <svg className="pf-atmosphere hidden md:block absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="stats-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0" />
                <stop offset="50%" stopColor={theme.colors.primary} stopOpacity="0.15" />
                <stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0" />
              </linearGradient>
            </defs>
            {stats.length > 1 && (
              <line x1={`${100 / (stats.length * 2)}%`} y1="50%" x2={`${100 - 100 / (stats.length * 2)}%`} y2="50%" stroke="url(#stats-line)" strokeWidth="1" />
            )}
          </svg>

          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="relative z-10 flex-1"
              style={{ marginTop: i % 2 === 1 ? "24px" : "0" }}
            >
              <div className="p-[1px]" style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.accent}20, ${theme.colors.border})`,
                borderRadius: theme.radii.pill,
                aspectRatio: "1 / 1",
                maxWidth: 200,
                margin: "0 auto",
              }}>
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6" style={{
                  background: `${theme.colors.surface}B3`,
                  borderRadius: theme.radii.pill,
                  backdropFilter: theme.blur.card,
                  boxShadow: theme.shadow.card,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke={theme.colors.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className="mb-2">
                    <path d={s.icon} />
                  </svg>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: theme.colors.primary }}>
                    {s.value}
                  </div>
                  <div className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * BRUTAL, Horizontal bar with inline numbers,
 *          bold accent bar, no cards at all
 * ═══════════════════════════════════════════════ */
function BrutalStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="relative"
        >
          {/* Horizontal bar, full width with sections */}
          <div className="p-2" style={{ background: theme.colors.border, borderRadius: theme.radii.card }}>
            <div className="flex items-stretch overflow-hidden" style={{ background: theme.colors.bg, borderRadius: theme.radii.card }}>
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="flex-1 flex items-center gap-3 px-5 py-4"
                  style={{
                    borderRight: i < stats.length - 1 ? `3px solid ${theme.colors.border}` : "none",
                  }}
                >
                  <div className="text-3xl font-black leading-none" style={{ color: theme.colors.primary }}>
                    {s.value}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: theme.colors.textMuted }}>
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * LUXE, Inline prose stats integrated into
 *        the text flow with serif numbers
 * ═══════════════════════════════════════════════ */
function LuxeStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="text-center">
            {stats.map((s, i) => (
              <motion.span
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              >
                <span className="font-bold leading-none" style={{
                  fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                  color: theme.colors.primary,
                  fontFamily: theme.typography.display,
                }}>
                  {s.value}
                </span>
                <span className="text-sm font-medium mx-2" style={{ color: theme.colors.textMuted }}>
                  {s.label}
                </span>
                {i < stats.length - 1 && (
                  <span className="mx-3" style={{ color: theme.colors.border, fontSize: 18 }}>·</span>
                )}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * MINIMALIST — angka dan label sebaris, dipisah garis
 * rambut vertikal. Tanpa lingkaran, tanpa kartu.
 * ═══════════════════════════════════════════════ */
function MinimalistStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(48px, 7vh, 80px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(20px, 4vw, 56px)",
          paddingTop: 24,
          borderTop: `1px solid ${theme.colors.border}`,
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{
                fontFamily: theme.typography.display,
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: theme.colors.text,
              }}>
                {s.value}
              </span>
              <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — satu lembar meteran: tiga sel
 * dipisah garis tinta, angka display, label mono,
 * dan takik lime di kepala tiap sel.
 * ═══════════════════════════════════════════════ */
function WorkbenchStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={wbSection(theme, { paddingTop: 0, paddingBottom: "clamp(40px, 6vw, 64px)" })}>
      <div style={wbWrap()}>
        <Reveal>
          <Paper hover={false} style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    padding: "clamp(16px, 2.4vw, 24px)",
                    borderLeft: i === 0 ? "none" : `1.5px solid ${theme.colors.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span aria-hidden="true" style={{ width: 22, height: 6, background: theme.colors.accent, border: `1.5px solid ${theme.colors.border}` }} />
                  <span style={{ ...wbHeading(theme, "clamp(30px, 4.2vw, 42px)"), color: theme.colors.primary }}>{s.value}</span>
                  <span style={{ ...wbMono(theme), fontSize: 11.5, color: theme.colors.textSecondary }}>{s.label}</span>
                </div>
              ))}
            </div>
          </Paper>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
/* DECAL: angka besar sebagai stiker miring. */
function DecalStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(40px, 6vw, 64px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)", display: "flex", flexWrap: "wrap", gap: 14 }}>
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} y={14}>
            <div style={{ padding: "14px 20px", background: i % 2 ? theme.colors.secondary : theme.colors.accent, color: theme.colors.onPrimary, borderRadius: theme.radii.card, boxShadow: theme.shadow.card, transform: `rotate(${i % 2 ? 2 : -2}deg)` }}>
              <strong style={{ display: "block", fontFamily: theme.typography.display, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{s.value}</strong>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* CRAYON: tiga kartu warna dengan angka besar membulat. */
function CrayonStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  const fills = [theme.colors.primary, theme.colors.secondary, theme.colors.accent];
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(40px, 6vw, 64px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18 }}>
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} y={12}>
            <div style={{ padding: "20px 22px", background: fills[i % fills.length], color: i === 2 ? theme.colors.text : theme.colors.onPrimary, borderRadius: theme.radii.card, boxShadow: theme.shadow.card }}>
              <p style={{ margin: 0, fontFamily: theme.typography.display, fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 700 }}>{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* SCRAPBOOK: angka sebagai tiga label tempel di satu kertas. */
function ScrapbookStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(40px, 6vw, 64px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18 }}>
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} y={12}>
            <div style={{ padding: "18px 20px", background: i === 1 ? theme.colors.accent : theme.colors.surface, border: `2px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card, transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}>
              <p style={{ margin: 0, fontFamily: theme.typography.display, fontSize: 44, lineHeight: 1, color: theme.colors.primary }}>{s.value}</p>
              <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 700, color: theme.colors.textSecondary }}>{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function InterstellaStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ padding: "32px 0 64px", background: theme.colors.bg }}>
      <dl style={{ maxWidth: 1160, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", display: "flex", flexWrap: "wrap", gap: "24px 64px" }}>
        {stats.map((s) => <div key={s.label} style={{ flex: "1 1 160px", minWidth: 0, paddingTop: 24, borderTop: `1px solid ${theme.colors.border}`, overflowWrap: "anywhere" }}>
          <dt style={{ fontSize: 14, color: theme.colors.textMuted }}>{s.label}</dt>
          <dd style={{ margin: "12px 0 0", fontFamily: theme.typography.display, fontWeight: 700, fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.15, color: theme.colors.text }}>{s.value}</dd>
        </div>)}
      </dl>
    </section>
  );
}

function SherbetStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ background: theme.colors.secondary, padding: "clamp(40px, 6vw, 72px) 0" }}>
      <dl style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 32 }}>
        {stats.map((s) => <div key={s.label} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
          <dd style={{ margin: 0, fontFamily: theme.typography.display, fontWeight: 800, fontSize: "clamp(3.5rem, 8vw, 6rem)", lineHeight: 1.05, letterSpacing: "-0.03em", color: theme.colors.text }}>{s.value}</dd>
          <dt style={{ marginTop: 12, fontSize: 16, color: theme.colors.textSecondary }}>{s.label}</dt>
        </div>)}
      </dl>
    </section>
  );
}

export default function StatsSection({ data: f }: Props) {
  const theme = usePortfolioTheme();
  const stats = [
    { value: f.aboutYearsExp, label: "Tahun Pengalaman", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" },
    { value: f.aboutProjectsDone, label: "Project Selesai", icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
    { value: f.aboutClientsHappy, label: "Klien Puas", icon: "M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" },
  ].filter(s => s.value);
  if (!stats.length) return null;

  switch (theme.id) {
    case "glass": return <GlassStats stats={stats} />;
    case "brutal": return <BrutalStats stats={stats} />;
    case "luxe": return <LuxeStats stats={stats} />;
    case "minimalist": return <MinimalistStats stats={stats} />;
    case "workbench": return <WorkbenchStats stats={stats} />;
    case "decal": return <DecalStats stats={stats} />;
    case "scrapbook": return <ScrapbookStats stats={stats} />;
    case "crayon": return <CrayonStats stats={stats} />;
    case "interstella": return <InterstellaStats stats={stats} />;
    case "sherbet": return <SherbetStats stats={stats} />;
    default: return <GlassStats stats={stats} />;
  }
}
