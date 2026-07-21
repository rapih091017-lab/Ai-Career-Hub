"use client";

import { motion } from "motion/react";
import type { PortfolioFormData, ExtraLink } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { data: PortfolioFormData; extraLinks: ExtraLink[]; }

/* ─── Shared: ContactButton ─── */
function ContactButton({ href, label }: { href: string; label: string }) {
  const theme = usePortfolioTheme();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 rounded-full font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
      style={{ background: theme.colors.primary, color: "#fff", padding: "12px 24px", fontSize: 13 }}>
      <span>{label}</span>
      <span className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        style={{ background: "rgba(255,255,255,0.15)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </a>
  );
}

/* ═══════════════════════════════════════════════
 * GLASS — CTA button array with glass cards,
 *          contact info pills, social grid
 * ═══════════════════════════════════════════════ */
function GlassContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="overflow-hidden rounded-2xl" style={{
            background: `${theme.colors.surface}`,
            backdropFilter: "blur(30px)",
            border: `1px solid ${theme.colors.border}`,
          }}>
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})` }} />

            <div className="p-8 md:p-10 text-center">
              <h2 className="font-bold mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text }}>
                Mari Bekerja Sama
              </h2>
              <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: theme.colors.textMuted }}>
                Punya ide menarik atau butuh bantuan? Jangan ragu untuk menghubungi saya.
              </p>

              {/* Contact method pills — inline, not wrapped */}
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {f.contactEmail && <ContactButton href={`mailto:${f.contactEmail}`} label="Email" />}
                {f.contactLinkedin && <ContactButton href={`https://${f.contactLinkedin.replace(/^https?:\/\//, "")}`} label="LinkedIn" />}
                {f.contactGithub && <ContactButton href={`https://${f.contactGithub.replace(/^https?:\/\//, "")}`} label="GitHub" />}
                {f.contactPhone && <ContactButton href={`tel:${f.contactPhone}`} label="Telepon" />}
              </div>

              {extraLinks.filter(l => l.url).length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 pt-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  {extraLinks.filter(l => l.url).map(link => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full text-xs transition-all duration-500 hover:scale-105"
                      style={{ background: `${theme.colors.primary}08`, color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>
                      {link.label || "Link"}
                    </a>
                  ))}
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
 * BRUTAL — Full-width bold background block,
 *          inline CTAs with shadow box
 * ═══════════════════════════════════════════════ */
function BrutalContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="relative"
        >
          {/* Full-width bold block */}
          <div className="p-2" style={{ background: theme.colors.border, borderRadius: "2rem" }}>
            <div className="p-10 md:p-14 text-center" style={{
              background: theme.colors.bg,
              borderRadius: "calc(2rem - 4px)",
              border: `4px solid ${theme.colors.border}`,
              boxShadow: `8px 8px 0px ${theme.colors.border}`,
            }}>
              <h2 className="font-black mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: theme.colors.text, letterSpacing: "-0.04em" }}>
                HUBUNGI SAYA
              </h2>
              <p className="text-sm mb-8 max-w-md mx-auto font-medium" style={{ color: theme.colors.textMuted }}>
                Ada project menarik? Yuk diskusi!
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {f.contactEmail && <ContactButton href={`mailto:${f.contactEmail}`} label="Email" />}
                {f.contactLinkedin && <ContactButton href={`https://${f.contactLinkedin.replace(/^https?:\/\//, "")}`} label="LinkedIn" />}
                {f.contactGithub && <ContactButton href={`https://${f.contactGithub.replace(/^https?:\/\//, "")}`} label="GitHub" />}
              </div>
            </div>
          </div>

          {/* Bold shadow offset */}
          <div className="absolute -bottom-3 -right-3 -z-10 w-full h-full rounded-[2rem] opacity-12"
            style={{ background: theme.colors.accent, border: `3px solid ${theme.colors.border}` }} />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * LUXE — Elegant centered call-to-action with
 *        subtle decorative elements and serif
 * ═══════════════════════════════════════════════ */
function LuxeContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Elegant card with small decorative elements */}
          <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: "2.5rem", border: `1px solid ${theme.colors.border}` }}>
            <div className="p-10 md:p-14 text-center" style={{
              background: theme.colors.surface,
              borderRadius: "calc(2.5rem - 0.25rem)",
              position: "relative",
            }}>
              {/* Decorative corner accents */}
              <div className="absolute top-4 left-4 w-6 h-6" style={{ borderTop: `1px solid ${theme.colors.border}`, borderLeft: `1px solid ${theme.colors.border}`, opacity: 0.5 }} />
              <div className="absolute top-4 right-4 w-6 h-6" style={{ borderTop: `1px solid ${theme.colors.border}`, borderRight: `1px solid ${theme.colors.border}`, opacity: 0.5 }} />
              <div className="absolute bottom-4 left-4 w-6 h-6" style={{ borderBottom: `1px solid ${theme.colors.border}`, borderLeft: `1px solid ${theme.colors.border}`, opacity: 0.5 }} />
              <div className="absolute bottom-4 right-4 w-6 h-6" style={{ borderBottom: `1px solid ${theme.colors.border}`, borderRight: `1px solid ${theme.colors.border}`, opacity: 0.5 }} />

              <span className="font-medium" style={{ color: theme.colors.primary, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                GET IN TOUCH
              </span>

              <div className="flex items-center gap-4 justify-center mt-2 mb-4">
                <div style={{ width: 24, height: 1, background: theme.colors.border }} />
                <h2 className="font-bold" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
                  Let&apos;s Work Together
                </h2>
                <div style={{ width: 24, height: 1, background: theme.colors.border }} />
              </div>

              <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: theme.colors.textMuted }}>
                I&apos;m always open to discussing new projects, creative ideas, or opportunities.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {f.contactEmail && <ContactButton href={`mailto:${f.contactEmail}`} label="Send Email" />}
                {f.contactLinkedin && <ContactButton href={`https://${f.contactLinkedin.replace(/^https?:\/\//, "")}`} label="LinkedIn" />}
                {f.contactGithub && <ContactButton href={`https://${f.contactGithub.replace(/^https?:\/\//, "")}`} label="GitHub" />}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function ContactSection({ data: f, extraLinks }: Props) {
  const theme = usePortfolioTheme();
  const hasContact = f.contactEmail || f.contactPhone || f.contactLinkedin || f.contactGithub || extraLinks.some(l => l.url);
  if (!hasContact) return null;
  switch (theme.id) {
    case "glass": return <GlassContact f={f} extraLinks={extraLinks} />;
    case "brutal": return <BrutalContact f={f} extraLinks={extraLinks} />;
    case "luxe": return <LuxeContact f={f} extraLinks={extraLinks} />;
    default: return <GlassContact f={f} extraLinks={extraLinks} />;
  }
}
