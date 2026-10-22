"use client";

import { motion } from "motion/react";
import type { EducationItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { Paper, Reveal, SectionHead, wbHeading, wbMono, wbSection, wbWrap } from "../workbench/kit";

interface Props { items: EducationItem[]; }

/* ═══════════════════════════════════════════════
 * GLASS, Asymmetrical bento masonry with
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

        {/* Bento masonry, first item wide, rest in 2-col sub-grid */}
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
                  borderRadius: theme.radii.image,
                }}>
                  <div className="p-5" style={{
                    background: `${theme.colors.surface}B3`,
                    borderRadius: theme.radii.card,
                    backdropFilter: theme.blur.card,
                    boxShadow: theme.shadow.card,
                  }}>
                    <div className="flex items-start gap-4">
                      {/* Decorative icon */}
                      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{
                        background: i === 0 ? `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}10)` : `${theme.colors.primary}10`,
                        borderRadius: theme.radii.card,
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
                          <span className="text-xs font-medium flex-shrink-0" style={{ color: theme.colors.accent }}>
                            {edu.startDate}{edu.startDate ? ", " : ""}{edu.isPresent ? "Sekarang" : edu.endDate || ""}
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
 * BRUTAL, Vertical stepper with bold date
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
                {/* Nomor langkah, bukan ikon — penanda urut khas Brutal */}
                <div className="absolute left-0 top-0 w-[41px] h-[41px] flex items-center justify-center"
                  style={{ background: theme.colors.primary, color: theme.colors.onPrimary, border: `3px solid ${theme.colors.border}` }}>
                  <span className="font-black text-sm">{String(i + 1).padStart(2, "0")}</span>
                </div>

                {/* Card with shadow */}
                <div className="relative">
                  <div className="p-5" style={{
                    background: theme.colors.surface,
                    border: `3px solid ${theme.colors.border}`,
                    borderRadius: theme.radii.card,
                    boxShadow: theme.shadow.card,
                  }}>
                    <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                      <h3 className="font-bold" style={{ color: theme.colors.text }}>
                        {edu.degree || "Gelar"}
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5" style={{ background: theme.colors.accent, color: theme.colors.text }}>
                        {edu.startDate}{edu.startDate ? ", " : ""}{edu.isPresent ? "Sekarang" : edu.endDate || ""}
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
 * LUXE, Ledger baris hairline — tahun serif besar
 *        di kolom kiri, tanpa kartu & tanpa bayangan
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
            PENDIDIKAN
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: theme.typography.display }}>
              Pendidikan
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        {/* Ledger: rentang tahun serif di kiri, rincian di kanan */}
        <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          {filtered.map((edu, i) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="grid md:grid-cols-[13rem_1fr] gap-x-8 gap-y-1 py-6"
              style={{ borderBottom: `1px solid ${theme.colors.border}` }}
            >
              <div style={{ fontFamily: theme.typography.display, fontSize: "1.05rem", color: theme.colors.primary }}>
                {edu.startDate || "-"} {edu.endDate ? `– ${edu.endDate}` : edu.isPresent ? "– Sekarang" : ""}
              </div>
              <div>
                <h3 style={{ fontFamily: theme.typography.display, fontSize: "1.2rem", color: theme.colors.text }}>
                  {edu.degree || "Gelar"}
                </h3>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                  {edu.institution}
                </p>
                {edu.field && (
                  <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                    {edu.field}
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

/* ═══════════════════════════════════════════════
 * MINIMALIST — label di kiri, daftar pendidikan di
 * kanan; tiap baris dipisah garis rambut.
 * ═══════════════════════════════════════════════ */
function MinimalistEducation({ items }: { items: EducationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.institution || e.degree);
  if (!filtered.length) return null;

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "clamp(24px, 5vw, 64px)" }}>
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.colors.textSecondary }}>
              03 / Pendidikan
            </span>
            <div style={{ height: 1, background: theme.colors.border, marginTop: 16 }} />
          </div>

          <div>
            <h2 style={{
              fontFamily: theme.typography.display,
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: theme.colors.text,
              margin: "0 0 32px",
            }}>
              Pendidikan
            </h2>
            {filtered.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 16,
                  flexWrap: "wrap",
                  padding: "20px 0",
                  borderTop: `1px solid ${theme.colors.border}`,
                }}
              >
                <div>
                  <h3 style={{ fontFamily: theme.typography.display, fontSize: 17, fontWeight: 500, color: theme.colors.text, margin: 0 }}>
                    {e.institution}
                  </h3>
                  <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: "6px 0 0" }}>
                    {[e.degree, e.field].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                  {e.startDate} — {e.endDate}
                </span>
              </div>
            ))}
            <div style={{ height: 1, background: theme.colors.border }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — kartu ijazah: tahun mono di kepala,
 * gelar display, institusi berwarna aksi. Kartu
 * ditempel dengan sudut bergantian sangat kecil
 * supaya deretan tidak terasa seperti tabel.
 * ═══════════════════════════════════════════════ */
function WorkbenchEducation({ items }: { items: EducationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.institution || e.degree);
  if (!filtered.length) return null;

  const span = (e: EducationItem) =>
    [e.startDate, e.isPresent ? "sekarang" : e.endDate].filter(Boolean).join(" → ") || "—";

  return (
    <section style={wbSection(theme)}>
      <div style={wbWrap()}>
        <SectionHead label="pendidikan" title="Pendidikan" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {filtered.map((edu, i) => (
            <Reveal key={edu.id} delay={i * 0.07} y={18} style={{ display: "flex" }}>
              <Paper style={{ padding: "clamp(18px, 2.4vw, 24px)", flex: 1, transform: `rotate(${i % 2 === 0 ? -0.4 : 0.4}deg)` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span style={{ ...wbMono(theme), fontSize: 11.5, color: theme.colors.textSecondary }}>{span(edu)}</span>
                  <span aria-hidden="true" style={{ width: 20, height: 6, background: theme.colors.accent, border: `1.5px solid ${theme.colors.border}` }} />
                </div>
                <h3 style={{ ...wbHeading(theme, "clamp(18px, 2.2vw, 21px)"), margin: "14px 0 0" }}>{edu.degree || "Gelar"}</h3>
                {edu.institution ? (
                  <p style={{ margin: "6px 0 0", fontSize: 14.5, fontWeight: 600, color: theme.colors.primary }}>{edu.institution}</p>
                ) : null}
                {edu.field ? (
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: theme.colors.textMuted }}>{edu.field}</p>
                ) : null}
              </Paper>
            </Reveal>
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
    case "minimalist": return <MinimalistEducation items={items} />;
    case "workbench": return <WorkbenchEducation items={items} />;
    default: return <GlassEducation items={items} />;
  }
}
