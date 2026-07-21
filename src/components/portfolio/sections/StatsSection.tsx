"use client";

import { motion } from "motion/react";
import type { PortfolioFormData } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { data: PortfolioFormData; }

/* ═══════════════════════════════════════════════
 * GLASS — Staggered floating bubbles with
 *          connecting gradient lines (NOT grid)
 * ═══════════════════════════════════════════════ */
function GlassStats({ stats }: { stats: { value: string; label: string; icon: string }[] }) {
  const theme = usePortfolioTheme();
  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-4 md:gap-6 relative">
          {/* Connecting lines between bubbles */}
          <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
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
                borderRadius: "100%",
                aspectRatio: "1 / 1",
                maxWidth: 200,
                margin: "0 auto",
              }}>
                <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-center p-6" style={{
                  background: `${theme.colors.surface}B3`,
                  backdropFilter: "blur(30px)",
                  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.06), 0 8px 32px ${theme.colors.primaryGlow}`,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke={theme.colors.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className="mb-2">
                    <path d={s.icon} />
                  </svg>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: theme.colors.primary }}>
                    {s.value}
                  </div>
                  <div className="text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>
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
 * BRUTAL — Horizontal bar with inline numbers,
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
          {/* Horizontal bar — full width with sections */}
          <div className="p-2" style={{ background: theme.colors.border, borderRadius: "100px" }}>
            <div className="flex items-stretch rounded-[calc(100px-4px)] overflow-hidden" style={{ background: theme.colors.bg }}>
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
 * LUXE — Inline prose stats integrated into
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
                  fontFamily: "Playfair Display, serif",
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

/* ─── MAIN ─── */
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
    default: return <GlassStats stats={stats} />;
  }
}
