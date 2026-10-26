"use client";

import { motion } from "motion/react";
import { safeUrlUnescaped } from "@/lib/portfolio-safety";
import type { CertificationItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { ArrowUpRight, Reveal, SectionHead, wbHeading, wbMono, wbPaper, wbSection, wbWrap } from "../workbench/kit";

interface Props { items: CertificationItem[]; }

/* ═══ GLASS, badge grid with glow icons ═══ */
function GlassCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(c => c.name);
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
            Sertifikat &amp; Penghargaan
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <a
                href={cert.url || undefined}
                target={cert.url ? "_blank" : undefined}
                rel={cert.url ? "noopener noreferrer" : undefined}
                className="block p-[1px] h-full"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.accent}15, transparent)`,
                  borderRadius: theme.radii.card,
                }}
              >
                <div className="p-5 h-full flex items-start gap-4" style={{
                  background: `${theme.colors.surface}B3`,
                  borderRadius: theme.radii.card,
                  backdropFilter: theme.blur.card,
                  boxShadow: theme.shadow.card,
                }}>
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}10)`, borderRadius: theme.radii.card }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="9" r="6" />
                      <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold" style={{ fontSize: "0.95rem", color: theme.colors.text }}>
                      {cert.name}
                    </h3>
                    <p className="text-sm font-medium mt-0.5" style={{ color: theme.colors.primary }}>
                      {cert.issuer}
                    </p>
                    {cert.year && (
                      <span className="inline-block text-xs font-medium mt-2 px-2 py-0.5"
                        style={{ background: `${theme.colors.primary}10`, color: theme.colors.accent, borderRadius: theme.radii.pill }}>
                        {cert.year}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ BRUTAL, bold bordered cards with stamp ═══ */
function BrutalCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(c => c.name);
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
            SERTIFIKAT
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filtered.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <a
                href={cert.url || undefined}
                target={cert.url ? "_blank" : undefined}
                rel={cert.url ? "noopener noreferrer" : undefined}
                className="block p-5"
                style={{
                  background: theme.colors.surface,
                  border: `3px solid ${theme.colors.border}`,
                  borderRadius: theme.radii.card,
                  boxShadow: theme.shadow.card,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: theme.colors.accent }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="9" r="6" />
                      <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
                    </svg>
                  </div>
                  {cert.year && (
                    <span className="text-xs font-black px-2 py-1" style={{ background: theme.colors.primary, color: theme.colors.onPrimary }}>
                      {cert.year}
                    </span>
                  )}
                </div>
                <h3 className="font-bold leading-snug" style={{ color: theme.colors.text }}>{cert.name}</h3>
                {cert.issuer && (
                  <p className="text-sm font-semibold mt-1" style={{ color: theme.colors.primary }}>{cert.issuer}</p>
                )}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ LUXE, ledger hairline — nama serif + angka tahun, tanpa kartu ═══ */
function LuxeCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(c => c.name);
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
            SERTIFIKAT
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: theme.typography.display }}>
              Sertifikat
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          {filtered.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              style={{ borderBottom: `1px solid ${theme.colors.border}` }}
            >
              <a
                href={cert.url || undefined}
                target={cert.url ? "_blank" : undefined}
                rel={cert.url ? "noopener noreferrer" : undefined}
                className="flex items-baseline justify-between gap-4 py-5"
              >
                <div className="min-w-0">
                  <h3 style={{ fontFamily: theme.typography.display, fontSize: "1.1rem", color: theme.colors.text }}>
                    {cert.name}
                  </h3>
                  {cert.issuer && (
                    <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>{cert.issuer}</p>
                  )}
                </div>
                {cert.year && (
                  <span style={{ fontFamily: theme.typography.display, fontSize: "1.3rem", color: theme.colors.primary, flexShrink: 0 }}>
                    {cert.year}
                  </span>
                )}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * MINIMALIST — baris satu baris: Nama — Penerbit ·
 * Tahun, dipisah hairline. Tanpa ikon, tanpa chip.
 * ═══════════════════════════════════════════════ */
function MinimalistCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((c) => c.name);
  if (!filtered.length) return null;

  return (
    <section style={{ background: theme.colors.bgSecondary, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.colors.textSecondary }}>
          05 / Sertifikasi
        </span>
        <h2 style={{
          fontFamily: theme.typography.display,
          fontSize: "clamp(24px, 3vw, 34px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: theme.colors.text,
          margin: "16px 0 32px",
        }}>
          Sertifikasi
        </h2>

        <div>
          {filtered.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 16,
                flexWrap: "wrap",
                padding: "18px 0",
                borderTop: `1px solid ${theme.colors.border}`,
              }}
            >
              <span style={{ fontFamily: theme.typography.display, fontSize: 16, color: theme.colors.text }}>
                {c.name}
              </span>
              <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                {[c.issuer, c.year].filter(Boolean).join(" · ")}
              </span>
            </div>
          ))}
          <div style={{ height: 1, background: theme.colors.border }} />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — daftar sertifikat di satu papan kertas:
 * nama, penerbit, lalu tahun di kotak mono. Takik lime
 * menandai tiap baris supaya urutannya terbaca tanpa
 * nomor urut.
 * ═══════════════════════════════════════════════ */
function WorkbenchCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((c) => c.name);
  if (!filtered.length) return null;

  return (
    <section style={wbSection(theme)}>
      <div style={wbWrap()}>
        <SectionHead label="sertifikasi" title="Sertifikasi" />

        <Reveal>
          <div style={{ ...wbPaper(theme), overflow: "hidden" }}>
            {filtered.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(10px, 2vw, 18px)",
                  flexWrap: "wrap",
                  padding: "clamp(14px, 2vw, 18px)",
                  borderTop: i === 0 ? "none" : `1.5px solid ${theme.colors.border}`,
                }}
              >
                <span aria-hidden="true" style={{ width: 9, height: 9, background: theme.colors.accent, border: `1.5px solid ${theme.colors.border}`, flexShrink: 0 }} />
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <p style={{ ...wbHeading(theme, "clamp(16px, 2vw, 19px)"), margin: 0 }}>{c.name}</p>
                  {c.issuer ? (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: theme.colors.textSecondary }}>{c.issuer}</p>
                  ) : null}
                </div>
                {c.year ? (
                  <span
                    style={{
                      ...wbMono(theme),
                      fontSize: 12,
                      padding: "3px 9px",
                      background: theme.colors.bg,
                      border: `1.5px solid ${theme.colors.border}`,
                      borderRadius: theme.radii.pill,
                      color: theme.colors.text,
                    }}
                  >
                    {c.year}
                  </span>
                ) : null}
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, ...wbMono(theme), fontSize: 12, color: theme.colors.primary, textDecoration: "none", minHeight: 32 }}
                  >
                    lihat <ArrowUpRight size={12} />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
/* DECAL: sertifikat sebagai stiker pill bertanggal. */
function DecalCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((c) => c.name);
  if (!filtered.length) return null;

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3.2rem)"), fontWeight: 800 }}>Sertifikasi</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          {filtered.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.06} y={12}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", background: theme.colors.surface, border: `2px solid ${theme.colors.border}`, borderRadius: theme.radii.pill, boxShadow: theme.shadow.card }}>
                <strong style={{ fontFamily: theme.typography.display, fontSize: 15, fontWeight: 700, color: theme.colors.text }}>{c.name}</strong>
                {c.year ? <span style={{ fontSize: 12, fontWeight: 800, padding: "2px 10px", background: theme.colors.accent, color: theme.colors.onPrimary, borderRadius: theme.radii.pill }}>{c.year}</span> : null}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* CRAYON: sertifikat sebagai kartu putih dengan label tahun. */
function CrayonCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((c) => c.name);
  if (!filtered.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ fontFamily: theme.typography.display, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, margin: 0, color: theme.colors.primary }}>Sertifikasi</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 28 }}>
          {filtered.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.06} y={12}>
              <div style={{ padding: "14px 20px", background: theme.colors.surface, border: `3px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card }}>
                <strong style={{ display: "block", fontSize: 16, color: theme.colors.text }}>{c.name}</strong>
                {c.year ? <span style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 800, padding: "2px 12px", background: theme.colors.accent, borderRadius: theme.radii.pill }}>{c.year}</span> : null}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* SCRAPBOOK: sertifikat sebagai tiket tempel dengan tahun di selotip. */
function ScrapbookCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((c) => c.name);
  if (!filtered.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3rem)"), fontWeight: 700, color: theme.colors.primary }}>Sertifikasi</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 28 }}>
          {filtered.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.06} y={12}>
              <div style={{ padding: "14px 18px", background: theme.colors.surface, border: `2px dashed ${theme.colors.primary}`, borderRadius: theme.radii.card, transform: `rotate(${i % 2 ? 1 : -1}deg)` }}>
                <strong style={{ display: "block", fontSize: 16, color: theme.colors.text }}>{c.name}</strong>
                {c.year ? <span style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 800, padding: "2px 10px", background: theme.colors.accent, border: `1.5px solid ${theme.colors.border}` }}>{c.year}</span> : null}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function InterstellaCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((c) => c.name);
  if (!filtered.length) return null;
  return (
    <section style={{ padding: "clamp(48px, 7vw, 80px) 0", background: theme.colors.bgSecondary }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <h2 style={{ margin: "0 0 32px", fontFamily: theme.typography.display, fontSize: "clamp(2rem, 4vw, 3rem)", color: theme.colors.text }}>Sertifikasi</h2>
        {filtered.map((c) => {
          const href = safeUrlUnescaped(c.url || "");
          return <article key={c.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, padding: "24px 0", borderTop: `1px solid ${theme.colors.border}` }}>
            <div style={{ flex: "1 1 240px" }}><h3 style={{ margin: 0, fontSize: 20, color: theme.colors.text }}>{c.name}</h3>{c.issuer && <p style={{ margin: "8px 0 0", color: theme.colors.textSecondary }}>{c.issuer}</p>}</div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}><span style={{ color: theme.colors.textMuted }}>{c.year}</span>{href && <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, color: theme.colors.primary, textUnderlineOffset: 5 }}>Lihat sertifikat<span className="sr-only">: {c.name}</span></a>}</div>
          </article>;
        })}
      </div>
    </section>
  );
}

function SherbetCertifications({ items }: { items: CertificationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((c) => c.name);
  if (!filtered.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(48px, 7vw, 80px) 0" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <h2 style={{ margin: "0 0 32px", fontFamily: theme.typography.display, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: theme.colors.text }}>Sertifikasi</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 24 }}>{filtered.map((c) => {
          const href = safeUrlUnescaped(c.url || "");
          return <li key={c.id} style={{ minWidth: 0, padding: 24, background: theme.colors.surface, borderRadius: theme.radii.card }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: theme.colors.textMuted }}>{c.year}</p>
            <h3 style={{ margin: 0, fontSize: 22, color: theme.colors.text }}>{c.name}</h3>
            {c.issuer && <p style={{ margin: "10px 0 0", color: theme.colors.textSecondary }}>{c.issuer}</p>}
            {href && <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, marginTop: 12, fontWeight: 700, color: theme.colors.primary, textUnderlineOffset: 5 }}>Lihat sertifikat<span className="sr-only">: {c.name}</span></a>}
          </li>;
        })}</ul>
      </div>
    </section>
  );
}

export default function CertificationsSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassCertifications items={items} />;
    case "brutal": return <BrutalCertifications items={items} />;
    case "luxe": return <LuxeCertifications items={items} />;
    case "minimalist": return <MinimalistCertifications items={items} />;
    case "workbench": return <WorkbenchCertifications items={items} />;
    case "decal": return <DecalCertifications items={items} />;
    case "scrapbook": return <ScrapbookCertifications items={items} />;
    case "crayon": return <CrayonCertifications items={items} />;
    case "interstella": return <InterstellaCertifications items={items} />;
    case "sherbet": return <SherbetCertifications items={items} />;
    default: return <GlassCertifications items={items} />;
  }
}
