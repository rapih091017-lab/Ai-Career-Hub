"use client";

import { motion } from "motion/react";
import type { ProjectItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";
import {
  ArrowUpRight,
  Chip,
  Paper,
  Reveal,
  SectionHead,
  wbHeading,
  wbMono,
  wbSection,
  wbWrap,
} from "../workbench/kit";

interface Props { items: ProjectItem[]; }

/* ─── GLASS: Asymmetrical Bento Grid ─── */
function GlassProjects({ items }: { items: ProjectItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(p => p.name);
  if (!filtered.length) return null;

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <span className="inline-block px-3 py-1 text-xs uppercase tracking-[0.2em] font-medium mb-4"
            style={{ background: `${theme.colors.primary}12`, color: theme.colors.primary, border: `1px solid ${theme.colors.primary}20`, borderRadius: theme.radii.pill }}>
            KARYA
          </span>
          <h2 className="font-bold mb-10" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: theme.colors.text, letterSpacing: "-0.03em" }}>
            Karya Pilihan
          </h2>
        </motion.div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {filtered.map((p, i) => {
            const isWide = i % 3 === 0;
            const isTall = i % 4 === 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className={`${isWide ? "md:col-span-8" : "md:col-span-4"} ${isTall ? "md:row-span-2" : ""}`}
              >
                {/* Double-Bezel */}
                <div className="p-1.5 h-full group/card cursor-pointer" style={{ background: `${theme.colors.primary}06`, borderRadius: theme.radii.card, border: `1px solid ${theme.colors.border}`, transition: "border-color 0.3s" }}>
                  <div className="h-full flex flex-col overflow-hidden" style={{
                    background: theme.colors.surface,
                    borderRadius: theme.radii.card,
                    boxShadow: theme.shadow.card,
                    backdropFilter: theme.blur.card,
                  }}>
                    {/* Project Image */}
                    {p.imageUrl ? (
                      <div className="w-full overflow-hidden" style={{ height: isWide ? 240 : 180 }}>
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" loading="lazy" />
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-center" style={{ height: isWide ? 240 : 180, background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.accent}10)` }}>
                        <span className="text-4xl font-bold" style={{ color: theme.colors.primary, opacity: 0.15 }}>{p.name?.[0]?.toUpperCase() || "P"}</span>
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <span className="text-xs font-medium mb-2" style={{ color: theme.colors.primary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Project {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-bold mb-2" style={{ fontSize: isWide ? "1.3rem" : "1.1rem", color: theme.colors.text }}>
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-sm leading-relaxed flex-1" style={{ color: theme.colors.textMuted }}>
                          {p.description}
                        </p>
                      )}
                      {p.techStack && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {p.techStack.split(",").map((tech, idx) => (
                            <span key={idx} className="text-xs px-2.5 py-1 font-medium"
                              style={{ background: `${theme.colors.primary}10`, color: theme.colors.secondary, borderRadius: theme.radii.pill }}>
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold transition-all duration-500"
                          style={{ color: theme.colors.primary }}>
                          Detail
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── BRUTAL: Bold cards with image showcase ─── */
function BrutalProjects({ items }: { items: ProjectItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(p => p.name);
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
          <h2 className="font-black mb-12" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: theme.colors.text, letterSpacing: "-0.04em" }}>
            Proyek
          </h2>
        </motion.div>

        <div className="space-y-8">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="relative group/card"
            >
              <div className="p-2" style={{ background: theme.colors.border, borderRadius: theme.radii.card }}>
                <div style={{ background: theme.colors.bg, borderRadius: theme.radii.card, border: `3px solid ${theme.colors.border}`, overflow: "hidden" }}>
                  {p.imageUrl ? (
                    <div className="w-full h-56 overflow-hidden" style={{ borderBottom: `3px solid ${theme.colors.border}` }}>
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" loading="lazy" />
                    </div>
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.accent}10)` }}>
                      <span className="text-4xl font-black" style={{ color: theme.colors.primary, opacity: 0.15 }}>{p.name?.[0]?.toUpperCase() || "P"}</span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2" style={{ color: theme.colors.text }}>{p.name}</h3>
                        {p.description && <p className="text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>{p.description}</p>}
                      </div>
                      <span className="text-xs font-bold px-3 py-1" style={{ background: theme.colors.primary, color: theme.colors.onPrimary }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    {p.techStack && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {p.techStack.split(",").map((tech, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 font-bold"
                            style={{ background: theme.colors.bg, border: `2px solid ${theme.colors.border}`, color: theme.colors.text }}>
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-xs font-bold transition-all"
                        style={{ color: theme.colors.primary }}>
                        VIEW PROJECT ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 -z-10 w-full h-full"
                style={{ background: theme.colors.accent, border: `2px solid ${theme.colors.border}`, borderRadius: theme.radii.card, opacity: 0.12 }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── LUXE: Editorial Split with Double-Bezel ─── */
function LuxeProjects({ items }: { items: ProjectItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(p => p.name);
  if (!filtered.length) return null;

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="pf-atmosphere fixed inset-0 pointer-events-none" style={{ zIndex: 50, opacity: 0.02, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}></div>
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="mb-12"
        >
          <span className="font-medium" style={{ color: theme.colors.primary, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            KARYA
          </span>
          <div className="flex items-center gap-4 mt-2 mb-4">
            <h2 className="font-bold leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: theme.colors.text, fontFamily: theme.typography.display, letterSpacing: "-0.02em" }}>
              Karya
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        <div className="space-y-6">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="group/card"
            >
              <div className="p-1.5" style={{ background: theme.colors.bgSecondary, borderRadius: theme.radii.card, border: `1px solid ${theme.colors.border}` }}>
                <div style={{
                  background: theme.colors.surface,
                  borderRadius: theme.radii.card,
                  boxShadow: theme.shadow.card,
                  overflow: "hidden",
                }}>
                  {p.imageUrl && (
                    <div className="w-full h-56 overflow-hidden" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" loading="lazy" />
                    </div>
                  )}
                  <div className="p-6 md:p-8">
                    <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-6 items-start">
                      <div>
                        <span className="text-xs font-medium" style={{ color: theme.colors.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-bold mt-1" style={{ fontSize: "1.2rem", color: theme.colors.text, fontFamily: theme.typography.display }}>
                          {p.name}
                        </h3>
                      </div>
                      <div>
                        {p.description && (
                          <p className="text-sm leading-relaxed mb-4" style={{ color: theme.colors.textMuted }}>
                            {p.description}
                          </p>
                        )}
                        {p.techStack && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {p.techStack.split(",").map((tech, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-1 font-medium"
                                style={{ background: `${theme.colors.primary}08`, color: theme.colors.secondary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radii.pill }}>
                                {tech.trim()}
                            </span>
                            ))}
                          </div>
                        )}
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-semibold transition-all"
                            style={{ color: theme.colors.primary }}>
                            Lihat Proyek
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M7 17L17 7M7 7h10v10"/>
                            </svg>
                          </a>
                        )}
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

/* ═══════════════════════════════════════════════
 * MINIMALIST — daftar satu kolom bernomor; gambar
 * full-bleed bila ada (satu-satunya sumber "warna"
 * di tema putih ini). Tanpa kartu, tanpa bayangan.
 * ═══════════════════════════════════════════════ */
function MinimalistProjects({ items }: { items: ProjectItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((p) => p.name);
  if (!filtered.length) return null;

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.colors.textSecondary }}>
          04 / Karya
        </span>
        <h2 style={{
          fontFamily: theme.typography.display,
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: theme.colors.text,
          margin: "16px 0 40px",
        }}>
          Karya
        </h2>

        <div>
          {filtered.map((p, i) => (
            <article key={p.id} style={{ padding: "32px 0", borderTop: `1px solid ${theme.colors.border}` }}>
              <span style={{ fontSize: 12, letterSpacing: "0.1em", color: theme.colors.textSecondary }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {p.imageUrl ? (
                <div style={{ margin: "16px 0 20px", overflow: "hidden" }}>
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    loading="lazy"
                    style={{ width: "100%", height: "clamp(200px, 32vw, 340px)", objectFit: "cover", display: "block" }}
                  />
                </div>
              ) : null}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "clamp(16px, 3vw, 40px)" }}>
                <h3 style={{ fontFamily: theme.typography.display, fontSize: 18, fontWeight: 500, color: theme.colors.text, margin: 0 }}>
                  {p.name}
                </h3>
                <div>
                  {p.description ? (
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: theme.colors.textSecondary, margin: 0, maxWidth: 620 }}>
                      {p.description}
                    </p>
                  ) : null}
                  {p.techStack ? (
                    <p style={{ fontSize: 13, color: theme.colors.textSecondary, margin: "12px 0 0" }}>
                      {p.techStack}
                    </p>
                  ) : null}
                  {p.link ? (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 14,
                        fontSize: 13,
                        color: theme.colors.text,
                        textDecoration: "underline",
                        textUnderlineOffset: 4,
                      }}
                    >
                      Lihat proyek
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          <div style={{ height: 1, background: theme.colors.border }} />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — lembar folio: nomor kotak lime, gambar
 * berbingkai tinta di kepala kartu, lalu nama, uraian,
 * dan tumpukan teknologi. Hover mengangkat kartu
 * seperti kertas yang diambil dari meja.
 * ═══════════════════════════════════════════════ */
function WorkbenchProjects({ items }: { items: ProjectItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((p) => p.name);
  if (!filtered.length) return null;

  return (
    <section style={wbSection(theme)}>
      <div style={wbWrap()}>
        <SectionHead label="karya" title="Karya pilihan" aside={<span style={{ ...wbMono(theme), fontSize: 11.5, color: theme.colors.textSecondary }}>{filtered.length} proyek</span>} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.07} y={20} style={{ display: "flex" }}>
              <Paper style={{ display: "flex", flexDirection: "column", overflow: "hidden", width: "100%" }}>
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    loading="lazy"
                    style={{ width: "100%", height: 168, objectFit: "cover", display: "block", borderBottom: `2.5px solid ${theme.colors.border}` }}
                  />
                ) : null}

                <div style={{ padding: "clamp(16px, 2.2vw, 22px)", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span
                      style={{
                        ...wbMono(theme),
                        fontSize: 12,
                        padding: "2px 8px",
                        background: theme.colors.accent,
                        border: `1.5px solid ${theme.colors.border}`,
                        borderRadius: theme.radii.pill,
                        color: theme.colors.text,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {p.link ? (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, ...wbMono(theme), fontSize: 12, color: theme.colors.primary, textDecoration: "none", minHeight: 32 }}
                      >
                        buka <ArrowUpRight size={12} />
                      </a>
                    ) : null}
                  </div>

                  <h3 style={{ ...wbHeading(theme, "clamp(18px, 2.2vw, 21px)"), margin: 0 }}>{p.name}</h3>
                  {p.description ? (
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: theme.colors.textSecondary, flex: 1 }}>{p.description}</p>
                  ) : null}

                  {p.techStack ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                      {p.techStack.split(",").map((tech, idx) => (
                        <Chip key={`${p.id}-${idx}`}>{tech.trim()}</Chip>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Paper>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function ProjectsSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassProjects items={items} />;
    case "brutal": return <BrutalProjects items={items} />;
    case "luxe": return <LuxeProjects items={items} />;
    case "minimalist": return <MinimalistProjects items={items} />;
    case "workbench": return <WorkbenchProjects items={items} />;
    default: return <GlassProjects items={items} />;
  }
}
