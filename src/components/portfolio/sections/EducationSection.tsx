"use client";

import { motion } from "motion/react";
import type { EducationItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { items: EducationItem[]; }

/* ═══════════════════════════════════════════════
 * GLASS — Asymmetrical bento masonry with
 *          varying card sizes (1/2 + 1/3 + 2/3)
 * ═══════════════════════════════════════════════ */
function GlassEducation({ items }: { items: EducationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(e => e.institution || e.degree);
  if (!filtered.length) return null;

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="font-bold mb-8" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text }}>
            Pendidikan
          </h2>
        </motion.div>

        {/* Bento masonry — first item wide, rest in 2-col sub-grid */}
        <div className="space-y-4">
          {filtered.map((edu, i) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              >
                <div className="p-[1px]" style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.accent}15, transparent)`,
                  borderRadius: "2rem",
                }}>
                  <div className="p-5" style={{
                    background: `${theme.colors.surface}B3`,
                    borderRadius: "calc(2rem - 1px)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
                  }}>
                    <div className="flex items-start gap-4">
                      {/* Decorative icon */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{
                        background: i === 0 ? `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}10)` : `${theme.colors.primary}10`,
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.5" strokeLinecap="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                          <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <h3 className="font-semibold" style={{ fontSize: i === 0 ? "1.1rem" : "0.95rem", color: theme.colors.text }}>
                            {edu.degree || "Gelar"}
                          </h3>
                          <span className="text-[11px] font-medium flex-shrink-0" style={{ color: theme.colors.accent }}>
                            {edu.startDate}{edu.startDate ? " — " : ""}{edu.isPresent ? "Sekarang" : edu.endDate || ""}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-0.5" style={{ color: theme.colors.primary }}>
                          {edu.institution}
                        </p>
                        {edu.field && (
                          <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                            {edu.field}
                          </p>
                        )}
                      </div>
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
 * BRUTAL — Vertical stepper with bold date
 *          badges, number markers, corner shadows
 * ═══════════════════════════════════════════════ */
function BrutalEducation({ items }: { items: EducationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(e => e.institution || e.degree);
  if (!filtered.length) return null;

  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="font-black mb-10" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: theme.colors.text, letterSpacing: "-0.04em" }}>
            PENDIDIKAN
          </h2>
        </motion.div>

        {/* Vertical stepper */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-[3px]" style={{ background: theme.colors.border }} />

          <div className="space-y-8">
            {filtered.map((edu, i) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="relative pl-14"
              >
                {/* Number badge */}
                <div className="absolute left-0 top-0 w-[41px] h-[41px] flex items-center justify-center"
                  style={{ background: theme.colors.primary, color: "#fff", border: `3px solid ${theme.colors.border}` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>

                {/* Card with shadow */}
                <div className="relative">
                  <div className="p-5" style={{
                    background: theme.colors.surface,
                    border: `3px solid ${theme.colors.border}`,
                    borderRadius: "0.75rem",
                    boxShadow: `6px 6px 0px ${theme.colors.border}`,
                  }}>
                    <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                      <h3 className="font-bold" style={{ color: theme.colors.text }}>
                        {edu.degree || "Gelar"}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5" style={{ background: theme.colors.accent, color: "#1A1A1A" }}>
                        {edu.startDate}{edu.startDate ? " — " : ""}{edu.isPresent ? "Sekarang" : edu.endDate || ""}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: theme.colors.primary }}>
                      {edu.institution}
                    </p>
                    {edu.field && (
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {edu.field}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * LUXE — Gallery-style with year markers,
 *        elegant serif, decorative timeline dots
 * ═══════════════════════════════════════════════ */
function LuxeEducation({ items }: { items: EducationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(e => e.institution || e.degree);
  if (!filtered.length) return null;

  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <span className="font-medium" style={{ color: theme.colors.primary, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            EDUCATION
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
              Education
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        {/* Gallery-style layout */}
        <div className="space-y-6">
          {filtered.map((edu, i) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="relative pl-8"
            >
              {/* Decorative year marker on left */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: theme.colors.primary, background: theme.colors.bg }} />
                {i < filtered.length - 1 && (
                  <div className="flex-1 w-[1px]" style={{ background: theme.colors.border }} />
                )}
              </div>

              <div className="pb-2">
                {/* Year as badge */}
                <span className="inline-block text-[11px] font-medium px-3 py-0.5 rounded-full mb-2"
                  style={{ background: `${theme.colors.primary}0A`, color: theme.colors.primary, border: `1px solid ${theme.colors.border}` }}>
                  {edu.startDate || "—"} {edu.endDate ? `– ${edu.endDate}` : edu.isPresent ? "– Present" : ""}
                </span>

                <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: "1.5rem", border: `1px solid ${theme.colors.border}` }}>
                  <div className="p-4" style={{ background: theme.colors.surface, borderRadius: "calc(1.5rem - 0.25rem)" }}>
                    <h3 className="font-semibold" style={{ color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
                      {edu.degree || "Gelar"}
                    </h3>
                    <p className="text-sm font-medium mt-0.5" style={{ color: theme.colors.textSecondary }}>
                      {edu.institution}
                    </p>
                    {edu.field && (
                      <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                        {edu.field}
                      </p>
                    )}
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

/* ─── MAIN ─── */
export default function EducationSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassEducation items={items} />;
    case "brutal": return <BrutalEducation items={items} />;
    case "luxe": return <LuxeEducation items={items} />;
    default: return <GlassEducation items={items} />;
  }
}
