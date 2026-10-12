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
          <span className="inline-block px-3 py-1 text-xs uppercase tracking-[0.2em] font-medium mb-4"
            style={{ background: `${theme.colors.primary}12`, color: theme.colors.primary, border: `1px solid ${theme.colors.primary}20`, borderRadius: theme.radii.pill }}>
            PENGALAMAN
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
                <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center text-xs font-bold overflow-hidden"
                  style={{ background: theme.colors.primary, color: theme.colors.onPrimary, borderRadius: theme.radii.pill, boxShadow: theme.shadow.card }}>
                  {exp.companyLogo ? (
                    <img src={exp.companyLogo} alt={exp.company} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(exp.company || "?")[0]?.toUpperCase()}</span>
                  )}
                </div>

                {/* Double-Bezel with optional image */}
                <div className="p-1" style={{ background: `${theme.colors.primary}06`, borderRadius: theme.radii.image, border: `1px solid ${theme.colors.border}`, marginLeft: 4 }}>
                  <div style={{
                    background: `${theme.colors.surface}B3`,
                    borderRadius: theme.radii.card,
                    boxShadow: theme.shadow.card,
                    backdropFilter: theme.blur.card,
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
                          {exp.startDate}{exp.startDate ? ", " : ""}{exp.isPresent ? "Sekarang" : exp.endDate || ""}
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
              <div className="p-2" style={{ background: theme.colors.border, borderRadius: theme.radii.card }}>
                <div style={{
                  background: theme.colors.bg,
                  borderRadius: theme.radii.card,
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
                        style={{ background: theme.colors.primary, color: theme.colors.onPrimary }}>
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
                            {exp.startDate}{exp.startDate ? ", " : ""}{exp.isPresent ? "Sekarang" : exp.endDate || ""}
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
              <div className="absolute -bottom-2 -right-2 -z-10 w-full h-full opacity-12"
                style={{ background: theme.colors.accent, border: `2px solid ${theme.colors.border}`, borderRadius: theme.radii.card }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── LUXE: ledger hairline — baris tanggal serif + isi, tanpa kartu ─── */
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
            PENGALAMAN
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: theme.typography.display }}>
              Riwayat Pekerjaan
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        {/* Ledger: satu garis rambut per baris, tanggal serif di kolom kiri */}
        <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          {filtered.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="grid md:grid-cols-[13rem_1fr] gap-x-8 gap-y-1 py-6"
              style={{ borderBottom: `1px solid ${theme.colors.border}` }}
            >
              <div style={{ fontFamily: theme.typography.display, fontSize: "1.05rem", color: theme.colors.primary }}>
                {exp.startDate}{exp.startDate ? " – " : ""}{exp.isPresent ? "Sekarang" : exp.endDate || ""}
              </div>
              <div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 style={{ fontFamily: theme.typography.display, fontSize: "1.2rem", color: theme.colors.text }}>
                    {exp.position || "Posisi"}
                  </h3>
                  <span className="text-sm" style={{ color: theme.colors.primary }}>{exp.company}</span>
                </div>
                {exp.imageUrl && (
                  <img src={exp.imageUrl} alt={`${exp.position} di ${exp.company}`} className="mt-3 w-full max-w-xs h-36 object-cover" style={{ borderRadius: theme.radii.image }} loading="lazy" />
                )}
                {exp.description && (
                  <p className="text-sm leading-relaxed mt-2" style={{ color: theme.colors.textMuted }}>
                    {exp.description}
                  </p>
                )}
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
