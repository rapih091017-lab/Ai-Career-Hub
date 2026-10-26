"use client";

import { motion } from "motion/react";
import type { ExperienceItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { Reveal, SectionHead, wbHeading, wbMono, wbSection, wbWrap } from "../workbench/kit";

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

/* ═══════════════════════════════════════════════
 * MINIMALIST — daftar satu kolom: periode di kiri,
 * perusahaan di kanan, dipisah garis rambut. Tanpa
 * kartu, tanpa aksen blok.
 * ═══════════════════════════════════════════════ */
function MinimalistExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.company || e.position);
  if (!filtered.length) return null;

  return (
    <section style={{ background: theme.colors.bgSecondary, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.colors.textSecondary }}>
          02 / Pengalaman
        </span>
        <h2 style={{
          fontFamily: theme.typography.display,
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: theme.colors.text,
          margin: "16px 0 40px",
        }}>
          Pengalaman Kerja
        </h2>

        <div>
          {filtered.map((e) => (
            <div
              key={e.id}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "clamp(16px, 3vw, 40px)",
                padding: "24px 0",
                borderTop: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, letterSpacing: "0.04em" }}>
                {e.startDate} — {e.isPresent ? "sekarang" : e.endDate}
              </div>
              <div>
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap",
                }}>
                  <h3 style={{
                    fontFamily: theme.typography.display,
                    fontSize: 18,
                    fontWeight: 500,
                    color: theme.colors.text,
                    margin: 0,
                  }}>
                    {e.company}
                  </h3>
                  {e.position ? (
                    <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>{e.position}</span>
                  ) : null}
                </div>
                {e.description ? (
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: theme.colors.textSecondary, margin: "8px 0 0", maxWidth: 620 }}>
                    {e.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: theme.colors.border }} />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — buku catatan kerja: periode di kolom
 * mono kiri, uraian di kanan, tiap entri dipisah garis
 * tinta. Tanpa kartu, supaya daftar panjang tetap
 * ringan dan mudah dipindai seperti log.
 * ═══════════════════════════════════════════════ */
function WorkbenchExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.company || e.position);
  if (!filtered.length) return null;

  return (
    <section style={wbSection(theme)}>
      <div style={wbWrap()}>
        <SectionHead label="pengalaman" title="Riwayat kerja" aside={<span style={{ ...wbMono(theme), fontSize: 11.5, color: theme.colors.textSecondary }}>{filtered.length} entri</span>} />

        <div style={{ borderTop: `2.5px solid ${theme.colors.border}` }}>
          {filtered.map((exp, i) => (
            <Reveal key={exp.id} delay={i * 0.06} y={16}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "clamp(12px, 2vw, 28px)",
                  alignItems: "flex-start",
                  padding: "20px 0",
                  borderBottom: `1.5px solid ${theme.colors.border}`,
                }}
              >
                <div style={{ flex: "0 0 120px", ...wbMono(theme), fontSize: 12, color: theme.colors.textSecondary, paddingTop: 4 }}>
                  {exp.startDate || "—"}
                  <span style={{ opacity: 0.6 }}> → </span>
                  {exp.isPresent ? "sekarang" : exp.endDate || "—"}
                </div>

                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span aria-hidden="true" style={{ width: 9, height: 9, background: theme.colors.accent, border: `1.5px solid ${theme.colors.border}`, flexShrink: 0 }} />
                    {exp.companyLogo ? (
                      <img src={exp.companyLogo} alt={exp.company} style={{ width: 24, height: 24, objectFit: "cover", border: `1.5px solid ${theme.colors.border}`, borderRadius: theme.radii.card }} loading="lazy" />
                    ) : null}
                    <h3 style={{ ...wbHeading(theme, "clamp(17px, 2.2vw, 21px)"), margin: 0 }}>{exp.position || "Posisi"}</h3>
                    {exp.company ? (
                      <span style={{ ...wbMono(theme), fontSize: 12, color: theme.colors.primary }}>{exp.company}</span>
                    ) : null}
                  </div>

                  {exp.description ? (
                    <p style={{ margin: "8px 0 0", maxWidth: 640, fontSize: 14.5, lineHeight: 1.7, color: theme.colors.textSecondary }}>
                      {exp.description}
                    </p>
                  ) : null}

                  {exp.imageUrl ? (
                    <img
                      src={exp.imageUrl}
                      alt={`${exp.position} di ${exp.company}`}
                      loading="lazy"
                      style={{ marginTop: 12, width: "100%", maxWidth: 420, height: 150, objectFit: "cover", border: `2.5px solid ${theme.colors.border}`, borderRadius: theme.radii.image, display: "block" }}
                    />
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * DECAL — stiker periode di kiri, kartu pill di kanan.
 * ═══════════════════════════════════════════════ */
function DecalExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.position || e.company);
  if (!filtered.length) return null;

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3.2rem)"), fontWeight: 800 }}>Pengalaman</h2>
        </Reveal>
        <div style={{ display: "grid", gap: 18, marginTop: 32 }}>
          {filtered.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.07} y={18}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 18, alignItems: "start" }}>
                <span style={{ justifySelf: "start", fontFamily: theme.typography.display, fontSize: 13, fontWeight: 800, padding: "6px 14px", background: i % 2 ? theme.colors.secondary : theme.colors.accent, color: theme.colors.onPrimary, borderRadius: theme.radii.pill, transform: `rotate(${i % 2 ? 2 : -2}deg)` }}>
                  {e.startDate} – {e.isPresent ? "kini" : e.endDate}
                </span>
                <div style={{ padding: "18px 22px", background: theme.colors.surface, border: `2.5px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card }}>
                  <h3 style={{ ...wbHeading(theme, "clamp(17px, 2vw, 20px)"), margin: 0 }}>{e.position}</h3>
                  {e.company ? <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: theme.colors.secondary }}>{e.company}</p> : null}
                  {e.description ? <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.65, color: theme.colors.textSecondary }}>{e.description}</p> : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* CRAYON: kartu putih berlabel periode dengan warna aksen. */
function CrayonExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.company || e.position);
  if (!filtered.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ fontFamily: theme.typography.display, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, margin: 0, color: theme.colors.primary }}>Pengalaman</h2>
        </Reveal>
        <div style={{ display: "grid", gap: 20, marginTop: 28 }}>
          {filtered.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.07} y={16}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, alignItems: "start" }}>
                <span style={{ justifySelf: "start", fontWeight: 800, fontSize: 13, padding: "6px 14px", background: i % 2 ? theme.colors.secondary : theme.colors.accent, color: theme.colors.text, borderRadius: theme.radii.pill }}>
                  {e.startDate} – {e.isPresent ? "kini" : e.endDate}
                </span>
                <div style={{ padding: "18px 22px", background: theme.colors.surface, border: `3px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card }}>
                  <h3 style={{ fontFamily: theme.typography.display, fontSize: "clamp(20px, 2.4vw, 24px)", fontWeight: 800, margin: 0, color: theme.colors.primary }}>{e.position}</h3>
                  <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 14, color: theme.colors.secondary }}>{e.company}</p>
                  {e.description ? <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.65, color: theme.colors.textSecondary }}>{e.description}</p> : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* SCRAPBOOK: catatan kerja di kertas tempel, periode di label selotip. */
function ScrapbookExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.company || e.position);
  if (!filtered.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3rem)"), fontWeight: 700, color: theme.colors.primary }}>Pengalaman</h2>
        </Reveal>
        <div style={{ display: "grid", gap: 22, marginTop: 28 }}>
          {filtered.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.07} y={16}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, alignItems: "start" }}>
                <span style={{ justifySelf: "start", fontFamily: theme.typography.body, fontWeight: 800, fontSize: 13, padding: "4px 12px", background: theme.colors.accent, color: theme.colors.text, border: `2px solid ${theme.colors.border}`, transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
                  {e.startDate} – {e.isPresent ? "kini" : e.endDate}
                </span>
                <div style={{ padding: "16px 20px", background: theme.colors.surface, border: `2px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card }}>
                  <h3 style={{ ...wbHeading(theme, "clamp(20px, 2.4vw, 24px)"), margin: 0, color: theme.colors.primary }}>{e.position}</h3>
                  <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 14, color: theme.colors.secondary }}>{e.company}</p>
                  {e.description ? <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.65, color: theme.colors.textSecondary }}>{e.description}</p> : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
function InterstellaExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.company || e.position);
  if (!filtered.length) return null;
  return (
    <section style={{ padding: "clamp(56px, 9vw, 112px) 0", background: theme.colors.bg }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <h2 style={{ margin: "0 0 40px", fontFamily: theme.typography.display, fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, color: theme.colors.text }}>Pengalaman</h2>
        {filtered.map((e) => <article key={e.id} style={{ display: "flex", flexWrap: "wrap", gap: "16px 48px", padding: "28px 0", borderTop: `1px solid ${theme.colors.border}` }}>
          <div style={{ flex: "1 1 220px" }}>
            <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: 14 }}>{[e.startDate, e.isPresent ? "Sekarang" : e.endDate].filter(Boolean).join(" – ")}</p>
            <p style={{ margin: "8px 0 0", color: theme.colors.textSecondary }}>{e.company}</p>
          </div>
          <div style={{ flex: "2 1 280px" }}>
            <h3 style={{ margin: 0, fontFamily: theme.typography.display, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: theme.colors.text }}>{e.position}</h3>
            {e.description && <p style={{ margin: "12px 0 0", maxWidth: "65ch", whiteSpace: "pre-line", lineHeight: 1.75, color: theme.colors.textSecondary }}>{e.description}</p>}
          </div>
        </article>)}
      </div>
    </section>
  );
}

function SherbetExperience({ items }: { items: ExperienceItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((e) => e.company || e.position);
  if (!filtered.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <h2 style={{ margin: "0 0 32px", fontFamily: theme.typography.display, fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, color: theme.colors.text }}>Perjalanan kerja</h2>
        <ol style={{ padding: 0, margin: 0, listStyle: "none", display: "grid", gap: 20 }}>{filtered.map((e) => <li key={e.id} style={{ background: theme.colors.surface, padding: "clamp(20px, 4vw, 32px)", borderRadius: theme.radii.card }}>
          <article style={{ display: "flex", flexWrap: "wrap", gap: "16px 40px" }}>
            <header style={{ flex: "1 1 220px", minWidth: 0 }}><h3 style={{ margin: 0, fontSize: 24, color: theme.colors.text }}>{e.position || e.company}</h3>{e.position && <p style={{ margin: "8px 0 0", fontWeight: 600, color: theme.colors.textSecondary }}>{e.company}</p>}<p style={{ margin: "12px 0 0", fontSize: 14, color: theme.colors.textMuted }}>{[e.startDate, e.isPresent ? "Sekarang" : e.endDate].filter(Boolean).join(" – ")}</p></header>
            {e.description && <p style={{ flex: "2 1 260px", margin: 0, maxWidth: "65ch", lineHeight: 1.75, whiteSpace: "pre-line", color: theme.colors.textSecondary }}>{e.description}</p>}
          </article>
        </li>)}</ol>
      </div>
    </section>
  );
}

export default function ExperienceSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassExperience items={items} />;
    case "brutal": return <BrutalExperience items={items} />;
    case "luxe": return <LuxeExperience items={items} />;
    case "minimalist": return <MinimalistExperience items={items} />;
    case "workbench": return <WorkbenchExperience items={items} />;
    case "decal": return <DecalExperience items={items} />;
    case "scrapbook": return <ScrapbookExperience items={items} />;
    case "crayon": return <CrayonExperience items={items} />;
    case "interstella": return <InterstellaExperience items={items} />;
    case "sherbet": return <SherbetExperience items={items} />;
    default: return <GlassExperience items={items} />;
  }
}
