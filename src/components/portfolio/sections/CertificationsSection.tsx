"use client";

import { motion } from "motion/react";
import type { CertificationItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { items: CertificationItem[]; }

/* ═══ GLASS — badge grid with glow icons ═══ */
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
                  borderRadius: "1.5rem",
                }}
              >
                <div className="p-5 h-full flex items-start gap-4" style={{
                  background: `${theme.colors.surface}B3`,
                  borderRadius: "calc(1.5rem - 1px)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
                }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}10)` }}>
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
                      <span className="inline-block text-[11px] font-medium mt-2 px-2 py-0.5 rounded-full"
                        style={{ background: `${theme.colors.primary}10`, color: theme.colors.accent }}>
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

/* ═══ BRUTAL — bold bordered cards with stamp ═══ */
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
                  borderRadius: "0.75rem",
                  boxShadow: `6px 6px 0px ${theme.colors.border}`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: theme.colors.accent }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="9" r="6" />
                      <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
                    </svg>
                  </div>
                  {cert.year && (
                    <span className="text-[11px] font-black px-2 py-1" style={{ background: theme.colors.primary, color: "#fff" }}>
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

/* ═══ LUXE — editorial list with serif titles ═══ */
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
            CERTIFICATIONS
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
              Sertifikat
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        <div className="space-y-4">
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
                className="flex items-center justify-between gap-4 p-5"
                style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: "1.25rem" }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: `1px solid ${theme.colors.primary}` }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="9" r="6" />
                      <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
                      {cert.name}
                    </h3>
                    {cert.issuer && (
                      <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>{cert.issuer}</p>
                    )}
                  </div>
                </div>
                {cert.year && (
                  <span className="text-[11px] font-medium px-3 py-1 rounded-full flex-shrink-0"
                    style={{ background: `${theme.colors.primary}0A`, color: theme.colors.primary }}>
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

/* ─── MAIN ─── */
export default function CertificationsSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassCertifications items={items} />;
    case "brutal": return <BrutalCertifications items={items} />;
    case "luxe": return <LuxeCertifications items={items} />;
    default: return <GlassCertifications items={items} />;
  }
}
