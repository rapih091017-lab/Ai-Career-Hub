"use client";

import { motion } from "motion/react";
import type { ExperienceItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { items: ExperienceItem[]; }

/* ─── GLASS: Timeline with frosted cards ─── */
function GlassExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
            style={{ background: `${theme.colors.primary}12`, color: theme.colors.primary, border: `1px solid ${theme.colors.primary}20` }}>
            EXPERIENCE
          </span>
          <h2 className="font-bold mb-10" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text }}>
            Pengalaman Kerja
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-[1px]" style={{ background: `linear-gradient(to bottom, ${theme.colors.primary}40, ${theme.colors.primary}08)` }} />

          <div className="space-y-8">
            {items.filter(e => e.company || e.position).map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="relative pl-14"
              >
                {/* Timeline dot with company logo */}
                <div className="absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
                  style={{ background: theme.colors.primary, color: "#fff", boxShadow: `0 0 0 4px ${theme.colors.primary}20` }}>
                  {exp.companyLogo ? (
                    <img src={exp.companyLogo} alt={exp.company} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(exp.company || "?")[0]?.toUpperCase()}</span>
                  )}
                </div>

                {/* Double-Bezel with optional image */}
                <div className="p-1" style={{ background: `${theme.colors.primary}06`, borderRadius: "2rem", border: `1px solid ${theme.colors.border}`, marginLeft: 4 }}>
                  <div style={{
                    background: `${theme.colors.surface}B3`,
                    borderRadius: "calc(2rem - 0.25rem)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
                    backdropFilter: "blur(20px)",
                    overflow: "hidden",
                  }}>
                    {exp.imageUrl && (
                      <div className="w-full h-48 overflow-hidden" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                        <img src={exp.imageUrl} alt={`${exp.position} at ${exp.company}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex justify-between items-baseline flex-wrap gap-2 mb-1">
                        <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                          {exp.position || "Posisi"}
                        </h3>
                        <span className="text-xs font-medium" style={{ color: theme.colors.primary }}>
                          {exp.startDate}{exp.startDate ? " — " : ""}{exp.isPresent ? "Sekarang" : exp.endDate || ""}
                        </span>
                      </div>
                      <div className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                        {exp.company}
                      </div>
                      {exp.description && (
                        <p className="text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
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

/* ─── BRUTAL: Bold numbered cards with shadow overlaps ─── */
function BrutalExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(e => e.company || e.position);
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
          <h2 className="font-black mb-10" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: theme.colors.text, letterSpacing: "-0.04em" }}>
            PENGALAMAN
          </h2>
        </motion.div>

        <div className="space-y-6">
          {filtered.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 30, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="relative"
            >
              <div className="p-2" style={{ background: theme.colors.border, borderRadius: "1.25rem" }}>
                <div style={{
                  background: theme.colors.bg,
                  borderRadius: "calc(1.25rem - 0.5rem)",
                  border: `3px solid ${theme.colors.border}`,
                  overflow: "hidden",
                }}>
                  {exp.imageUrl && (
                    <div className="w-full h-48" style={{ borderBottom: `3px solid ${theme.colors.border}` }}>
                      <img src={exp.imageUrl} alt={`${exp.position} at ${exp.company}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-lg font-black overflow-hidden"
                        style={{ background: theme.colors.primary, color: "#fff" }}>
                        {exp.companyLogo ? (
                          <img src={exp.companyLogo} alt={exp.company} className="w-full h-full object-cover" />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline flex-wrap gap-2 mb-0.5">
                          <h3 className="font-bold" style={{ color: theme.colors.text }}>
                            {exp.position || "Posisi"}
                          </h3>
                          <span className="text-xs font-bold" style={{ color: theme.colors.primary }}>
                            {exp.startDate}{exp.startDate ? " — " : ""}{exp.isPresent ? "Sekarang" : exp.endDate || ""}
                          </span>
                        </div>
                        <div className="text-sm font-semibold mb-2" style={{ color: theme.colors.textMuted }}>
                          {exp.company}
                        </div>
                        {exp.description && (
                          <p className="text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Shadow */}
              <div className="absolute -bottom-2 -right-2 -z-10 w-full h-full rounded-[1.25rem] opacity-12"
                style={{ background: theme.colors.accent, border: `2px solid ${theme.colors.border}` }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── LUXE: Elegant serif timeline cards ─── */
function LuxeExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(e => e.company || e.position);
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
            EXPERIENCE
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
              Work History
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        <div className="space-y-6">
          {filtered.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: "2rem", border: `1px solid ${theme.colors.border}` }}>
                <div style={{
                  background: theme.colors.surface,
                  borderRadius: "calc(2rem - 0.25rem)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                  overflow: "hidden",
                }}>
                  {exp.imageUrl && (
                    <div className="w-full h-48" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                      <img src={exp.imageUrl} alt={`${exp.position} at ${exp.company}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="grid md:grid-cols-[1fr_auto] gap-3 items-start">
                      <div>
                        <h3 className="font-semibold" style={{ color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
                          {exp.position || "Posisi"}
                        </h3>
                        <div className="text-sm font-medium mt-1" style={{ color: theme.colors.primary }}>
                          {exp.company}
                        </div>
                        {exp.description && (
                          <p className="text-sm leading-relaxed mt-2" style={{ color: theme.colors.textMuted }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                      <div className="text-xs font-medium py-1 px-3 rounded-full text-center md:text-right"
                        style={{ background: `${theme.colors.primary}0A`, color: theme.colors.primary }}>
                        {exp.startDate}{exp.startDate ? " — " : ""}{exp.isPresent ? "Present" : exp.endDate || ""}
                      </div>
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

/* ─── MAIN ─── */
export default function ExperienceSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassExperience items={items} />;
    case "brutal": return <BrutalExperience items={items} />;
    case "luxe": return <LuxeExperience items={items} />;
    default: return <GlassExperience items={items} />;
  }
}
