"use client";

import { motion } from "motion/react";
import type { PortfolioFormData } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { Chip, Reveal, SectionHead, wbHeading, wbMono, wbPaper, wbSection, wbWrap } from "../workbench/kit";

interface Props { data: PortfolioFormData; }

/* ═══════════════════════════════════════════════
 * GLASS, Horizontal scrollable chip carousel
 *          with frosted glass pills + smooth scroll
 * ═══════════════════════════════════════════════ */
function GlassSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const skillTags = f.skillsMain.split(",").map(s => s.trim()).filter(Boolean);
  if (!skillTags.length && !f.skillsTools && !f.skillsLanguages) return null;

  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {skillTags.length > 0 && (
            <>
              {/* Scrollable chip carousel */}
              <div className="overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar" style={{ scrollbarWidth: "none" }}>
                <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                  {skillTags.map((skill, i) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      whileInView={{ opacity: 1, scale: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                      className="flex-shrink-0 px-5 py-2.5 text-sm font-medium transition-all hover:scale-105"
                      style={{
                        background: `${theme.colors.surface}`,
                        border: `1px solid ${theme.colors.border}`,
                        color: theme.colors.textSecondary,
                        borderRadius: theme.radii.pill,
                        backdropFilter: theme.blur.card,
                        boxShadow: theme.shadow.card,
                      }}>
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
              {/* Fade hints */}
              <div className="flex gap-1 mt-3 justify-center">
                <div className="w-1.5 h-1.5" style={{ background: theme.colors.primary, opacity: 0.5, borderRadius: theme.radii.pill }} />
                <div className="w-1.5 h-1.5" style={{ background: theme.colors.border, borderRadius: theme.radii.pill }} />
                <div className="w-1.5 h-1.5" style={{ background: theme.colors.border, borderRadius: theme.radii.pill }} />
              </div>
            </>
          )}
          {(f.skillsTools || f.skillsLanguages) && (
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              {f.skillsTools && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Tools</span>
                  <span className="w-3 h-[1px]" style={{ background: theme.colors.primary }} />
                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{f.skillsTools}</span>
                </div>
              )}
              {f.skillsLanguages && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Bahasa</span>
                  <span className="w-3 h-[1px]" style={{ background: theme.colors.accent }} />
                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{f.skillsLanguages}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * BRUTAL, Bold block grid (keep unique layout)
 *          with shadow box offsets
 * ═══════════════════════════════════════════════ */
function BrutalSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const skillTags = f.skillsMain.split(",").map(s => s.trim()).filter(Boolean);
  if (!skillTags.length && !f.skillsTools && !f.skillsLanguages) return null;

  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="font-black mb-6" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: theme.colors.text, letterSpacing: "-0.04em" }}>KEAHLIAN</h2>
          {skillTags.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {skillTags.map((skill, i) => (
                <motion.div key={skill}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="p-3 text-center font-bold text-sm transition-all hover:-translate-y-0.5 hover:translate-x-0.5"
                  style={{ background: theme.colors.surface, border: `3px solid ${theme.colors.border}`, boxShadow: theme.shadow.card, color: theme.colors.text }}>
                  {skill}
                </motion.div>
              ))}
            </div>
          )}
          {(f.skillsTools || f.skillsLanguages) && (
            <div className="mt-6 p-4" style={{ background: theme.colors.surface, border: `3px solid ${theme.colors.border}`, boxShadow: theme.shadow.card }}>
              {f.skillsTools && <p className="text-sm" style={{ color: theme.colors.textMuted }}><span className="font-bold" style={{ color: theme.colors.text }}>Tools:</span> {f.skillsTools}</p>}
              {f.skillsLanguages && <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}><span className="font-bold" style={{ color: theme.colors.text }}>Bahasa:</span> {f.skillsLanguages}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * LUXE, Categorized skill groupings with gold
 *        ornamental dividers and decorative icons
 * ═══════════════════════════════════════════════ */
function LuxeSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const skillTags = f.skillsMain.split(",").map(s => s.trim()).filter(Boolean);
  if (!skillTags.length && !f.skillsTools && !f.skillsLanguages) return null;

  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <span className="font-medium" style={{ color: theme.colors.primary, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>KEAHLIAN</span>

          {/* Decorative header bar */}
          <div className="flex items-center gap-4 my-4">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", color: theme.colors.text, fontFamily: theme.typography.display }}>
              Keahlian
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>
              {skillTags.length} Bidang
            </span>
          </div>

          {/* Categorized skill groupings */}
          <div className="space-y-4">
            {/* Primary Skills */}
            {skillTags.length > 0 && (
              <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: theme.radii.card, border: `1px solid ${theme.colors.border}` }}>
                <div className="p-5" style={{ background: theme.colors.surface, borderRadius: theme.radii.card }}>
                  <span className="text-xs font-medium uppercase tracking-widest" style={{ color: theme.colors.primary }}>Kompetensi Utama</span>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skillTags.map((skill, i) => (
                      <motion.span key={skill}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className="px-4 py-1.5 text-sm font-medium"
                        style={{ background: `${theme.colors.primary}06`, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radii.pill }}>
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tools & Languages rows */}
            <div className="grid md:grid-cols-2 gap-3">
              {f.skillsTools && (
                <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: theme.radii.card, border: `1px solid ${theme.colors.border}` }}>
                  <div className="p-4" style={{ background: theme.colors.surface, borderRadius: theme.radii.card }}>
                    <span className="text-xs font-medium uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>Tools</span>
                    <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>{f.skillsTools}</p>
                  </div>
                </div>
              )}
              {f.skillsLanguages && (
                <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: theme.radii.card, border: `1px solid ${theme.colors.border}` }}>
                  <div className="p-4" style={{ background: theme.colors.surface, borderRadius: theme.radii.card }}>
                    <span className="text-xs font-medium uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>Bahasa</span>
                    <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>{f.skillsLanguages}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * MINIMALIST — tag hairline siku, tanpa isian warna.
 * Teks tetap satu baris per kelompok skill.
 * ═══════════════════════════════════════════════ */
function MinimalistSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const groups = [
    { label: "Utama", value: f.skillsMain },
    { label: "Alat", value: f.skillsTools },
    { label: "Bahasa", value: f.skillsLanguages },
  ].filter((g) => g.value);

  if (!groups.length) return null;

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.colors.textSecondary }}>
          08 / Keahlian
        </span>
        <h2 style={{
          fontFamily: theme.typography.display,
          fontSize: "clamp(24px, 3vw, 34px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: theme.colors.text,
          margin: "16px 0 32px",
        }}>
          Keahlian
        </h2>

        <div style={{ display: "grid", gap: 24 }}>
          {groups.map((g) => (
            <div key={g.label} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <span style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.colors.textSecondary, paddingTop: 6 }}>
                {g.label}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {g.value.split(",").map((skill, i) => (
                  <span
                    key={`${g.label}-${i}`}
                    style={{
                      fontSize: 13,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radii.pill,
                      padding: "5px 12px",
                    }}
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — rak perkakas: tiga baris (utama, alat,
 * bahasa) di satu papan kertas. Label mono di kiri,
 * chip bergaris tinta di kanan; tidak ada isian warna
 * supaya lime tetap jadi satu-satunya penanda.
 * ═══════════════════════════════════════════════ */
function WorkbenchSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const groups = [
    { label: "utama", value: f.skillsMain },
    { label: "alat", value: f.skillsTools },
    { label: "bahasa", value: f.skillsLanguages },
  ].filter((g) => g.value && g.value.trim());

  if (!groups.length) return null;

  return (
    <section style={wbSection(theme)}>
      <div style={wbWrap()}>
        <SectionHead label="keahlian" title="Keahlian" />

        <Reveal>
          <div
            style={{
              ...wbPaper(theme),
              overflow: "hidden",
            }}
          >
            {groups.map((group, i) => (
              <div
                key={group.label}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "clamp(8px, 2vw, 24px)",
                  alignItems: "flex-start",
                  padding: "clamp(14px, 2vw, 20px)",
                  borderTop: i === 0 ? "none" : `1.5px solid ${theme.colors.border}`,
                }}
              >
                <span style={{ ...wbMono(theme), flex: "0 0 120px", fontSize: 12, color: theme.colors.textSecondary, paddingTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, background: theme.colors.accent, border: `1.5px solid ${theme.colors.border}` }} />
                  {group.label}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: "1 1 240px" }}>
                  {group.value.split(",").map((skill, idx) => (
                    <Chip key={`${group.label}-${idx}`}>{skill.trim()}</Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
/* DECAL — tiap kelompok keahlian jadi stiker berwarna. */
function DecalSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const groups = [
    { label: "Keahlian", value: f.skillsMain, tone: theme.colors.primary },
    { label: "Tools", value: f.skillsTools, tone: theme.colors.secondary },
    { label: "Bahasa", value: f.skillsLanguages, tone: theme.colors.accent },
  ].filter((g) => g.value);
  if (!groups.length) return null;

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3.2rem)"), fontWeight: 800 }}>Keahlian</h2>
        </Reveal>
        <div style={{ display: "grid", gap: 20, marginTop: 28 }}>
          {groups.map((g, i) => (
            <Reveal key={g.label} delay={i * 0.08} y={14}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, padding: "5px 14px", background: g.tone, color: theme.colors.onPrimary, borderRadius: theme.radii.pill, transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>{g.label}</span>
                {g.value.split(",").map((s, idx) => (
                  <span key={`${g.label}-${idx}`} style={{ fontSize: 14, fontWeight: 600, padding: "5px 12px", border: `2px solid ${theme.colors.border}`, color: theme.colors.text, borderRadius: theme.radii.pill }}>{s.trim()}</span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* CRAYON: keahlian sebagai kartu putih dengan label berwarna. */
function CrayonSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const groups = [
    { label: "utama", value: f.skillsMain, fill: theme.colors.primary, text: theme.colors.onPrimary },
    { label: "alat", value: f.skillsTools, fill: theme.colors.accent, text: theme.colors.text },
    { label: "bahasa", value: f.skillsLanguages, fill: theme.colors.secondary, text: theme.colors.text },
  ].filter((g) => g.value);
  if (!groups.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ fontFamily: theme.typography.display, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, margin: 0, color: theme.colors.primary }}>Keahlian</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 28 }}>
          {groups.map((g, i) => (
            <Reveal key={g.label} delay={i * 0.06} y={10}>
              <div style={{ padding: "16px 20px", background: theme.colors.surface, border: `3px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card, maxWidth: 360 }}>
                <span style={{ display: "inline-block", padding: "2px 12px", borderRadius: theme.radii.pill, background: g.fill, color: g.text, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{g.label}</span>
                <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.6, color: theme.colors.text }}>{g.value}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* SCRAPBOOK: keahlian sebagai potongan label tulisan tangan di kertas. */
function ScrapbookSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const groups = [
    { label: "utama", value: f.skillsMain },
    { label: "alat", value: f.skillsTools },
    { label: "bahasa", value: f.skillsLanguages },
  ].filter((g) => g.value);
  if (!groups.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3rem)"), fontWeight: 700, color: theme.colors.primary }}>Keahlian</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
          {groups.map((g, i) => (
            <Reveal key={g.label} delay={i * 0.06} y={10}>
              <div style={{ padding: "14px 18px", background: theme.colors.surface, border: `2px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card, transform: `rotate(${i % 2 ? 1 : -1}deg)`, maxWidth: 360 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: theme.colors.secondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>{g.label}</span>
                <p style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.6, color: theme.colors.text }}>{g.value}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function InterstellaSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const groups = [{ label: "Keahlian utama", value: f.skillsMain }, { label: "Perangkat kerja", value: f.skillsTools }, { label: "Bahasa", value: f.skillsLanguages }].filter((g) => g.value);
  if (!groups.length) return null;
  return (
    <section style={{ padding: "clamp(64px, 10vw, 120px) 0", background: theme.colors.bg }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <h2 style={{ margin: "0 0 40px", fontFamily: theme.typography.display, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 800, lineHeight: 1.1, color: theme.colors.text }}>Keahlian.</h2>
        {groups.map((g) => <div key={g.label} style={{ display: "flex", flexWrap: "wrap", gap: "16px 48px", padding: "28px 0", borderTop: `1px solid ${theme.colors.border}` }}>
          <h3 style={{ flex: "1 1 220px", margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.textMuted }}>{g.label}</h3>
          <p style={{ flex: "2 1 280px", margin: 0, fontFamily: theme.typography.display, fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.6, fontWeight: 600, color: theme.colors.text }}>{g.value}</p>
        </div>)}
      </div>
    </section>
  );
}

function SherbetSkills({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const groups = [{ label: "Keahlian utama", value: f.skillsMain }, { label: "Perangkat kerja", value: f.skillsTools }, { label: "Bahasa", value: f.skillsLanguages }].filter((g) => g.value);
  if (!groups.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <h2 style={{ margin: "0 0 32px", fontFamily: theme.typography.display, fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, color: theme.colors.text }}>Bekal berkarya</h2>
        <dl style={{ margin: 0, display: "flex", flexWrap: "wrap", gap: "32px 48px" }}>{groups.map((g) => <div key={g.label} style={{ flex: "1 1 240px", minWidth: 0 }}>
          <dt style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text }}>{g.label}</dt>
          <dd style={{ margin: "16px 0 0", display: "flex", flexWrap: "wrap", gap: 10 }}>{g.value.split(",").map((v) => v.trim()).filter(Boolean).map((v, i) => <span key={`${v}-${i}`} style={{ padding: "8px 16px", background: theme.colors.secondary, borderRadius: theme.radii.pill, color: theme.colors.textSecondary }}>{v}</span>)}</dd>
        </div>)}</dl>
      </div>
    </section>
  );
}

export default function SkillsSection({ data: f }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassSkills f={f} />;
    case "brutal": return <BrutalSkills f={f} />;
    case "luxe": return <LuxeSkills f={f} />;
    case "minimalist": return <MinimalistSkills f={f} />;
    case "workbench": return <WorkbenchSkills f={f} />;
    case "decal": return <DecalSkills f={f} />;
    case "scrapbook": return <ScrapbookSkills f={f} />;
    case "crayon": return <CrayonSkills f={f} />;
    case "interstella": return <InterstellaSkills f={f} />;
    case "sherbet": return <SherbetSkills f={f} />;
    default: return <GlassSkills f={f} />;
  }
}
