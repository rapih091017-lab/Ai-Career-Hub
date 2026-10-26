"use client";

import { motion } from "motion/react";
import { safeUrlUnescaped } from "@/lib/portfolio-safety";
import type { PortfolioFormData, ExtraLink } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { PillLink, Reveal, SheetLabel, wbHeading, wbMono, wbPaper, wbSection, wbWrap } from "../workbench/kit";

interface Props { data: PortfolioFormData; extraLinks: ExtraLink[]; }

/* ─── Shared: ContactButton ─── */
function ContactButton({ href, label }: { href: string; label: string }) {
  const theme = usePortfolioTheme();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
      style={{ background: theme.colors.primary, color: theme.colors.onPrimary, padding: "12px 24px", fontSize: 13, borderRadius: theme.radii.button }}>
      <span>{label}</span>
      <span className="w-7 h-7 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        style={{ background: "rgba(255,255,255,0.15)", borderRadius: theme.radii.pill }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </a>
  );
}

/* ═══════════════════════════════════════════════
 * GLASS, CTA button array with glass cards,
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
          <div className="overflow-hidden" style={{
            background: `${theme.colors.surface}`,
            borderRadius: theme.radii.card,
            backdropFilter: theme.blur.card,
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

              {/* Contact method pills, inline, not wrapped */}
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
                      className="px-3 py-1.5 text-xs transition-all duration-500 hover:scale-105"
                      style={{ background: `${theme.colors.primary}08`, color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radii.pill }}>
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
 * BRUTAL, Full-width bold background block,
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
          <div className="p-2" style={{ background: theme.colors.border, borderRadius: theme.radii.card }}>
            <div className="p-10 md:p-14 text-center" style={{
              background: theme.colors.bg,
              borderRadius: theme.radii.card,
              border: `4px solid ${theme.colors.border}`,
              boxShadow: theme.shadow.card,
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
          <div className="absolute -bottom-3 -right-3 -z-10 w-full h-full opacity-12"
            style={{ background: theme.colors.accent, border: `3px solid ${theme.colors.border}`, borderRadius: theme.radii.card }} />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * LUXE, Elegant centered call-to-action with
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
          <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: theme.radii.image, border: `1px solid ${theme.colors.border}` }}>
            <div className="p-10 md:p-14 text-center" style={{
              background: theme.colors.surface,
              borderRadius: theme.radii.image,
              position: "relative",
            }}>
              {/* Decorative corner accents */}
              <div className="absolute top-4 left-4 w-6 h-6" style={{ borderTop: `1px solid ${theme.colors.border}`, borderLeft: `1px solid ${theme.colors.border}`, opacity: 0.5 }} />
              <div className="absolute top-4 right-4 w-6 h-6" style={{ borderTop: `1px solid ${theme.colors.border}`, borderRight: `1px solid ${theme.colors.border}`, opacity: 0.5 }} />
              <div className="absolute bottom-4 left-4 w-6 h-6" style={{ borderBottom: `1px solid ${theme.colors.border}`, borderLeft: `1px solid ${theme.colors.border}`, opacity: 0.5 }} />
              <div className="absolute bottom-4 right-4 w-6 h-6" style={{ borderBottom: `1px solid ${theme.colors.border}`, borderRight: `1px solid ${theme.colors.border}`, opacity: 0.5 }} />

              <span className="font-medium" style={{ color: theme.colors.primary, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                HUBUNGI SAYA
              </span>

              <div className="flex items-center gap-4 justify-center mt-2 mb-4">
                <div style={{ width: 24, height: 1, background: theme.colors.border }} />
                <h2 className="font-bold" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: theme.colors.text, fontFamily: theme.typography.display }}>
                  Mari Berkolaborasi
                </h2>
                <div style={{ width: 24, height: 1, background: theme.colors.border }} />
              </div>

              <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: theme.colors.textMuted }}>
                Saya selalu terbuka untuk membahas proyek baru, ide kreatif, atau peluang kerja sama.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {f.contactEmail && <ContactButton href={`mailto:${f.contactEmail}`} label="Kirim Email" />}
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

/* ═══════════════════════════════════════════════
 * MINIMALIST — email besar sebagai tautan (underline
 * hairline, bukan blok), kolom kanan berisi tautan
 * lain. Tanpa form, tanpa kartu.
 * ═══════════════════════════════════════════════ */
function MinimalistContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  const links = extraLinks.filter((l) => l.url);

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.colors.textSecondary }}>
          10 / Kontak
        </span>
        <h2 style={{
          fontFamily: theme.typography.display,
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: theme.colors.text,
          margin: "16px 0 32px",
        }}>
          Mari Berbicara
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "clamp(24px, 5vw, 64px)" }}>
          <div>
            {f.contactEmail ? (
              <a
                href={`mailto:${f.contactEmail}`}
                style={{
                  fontFamily: theme.typography.display,
                  fontSize: "clamp(20px, 3vw, 30px)",
                  color: theme.colors.text,
                  textDecoration: "underline",
                  textUnderlineOffset: 6,
                  wordBreak: "break-word",
                }}
              >
                {f.contactEmail}
              </a>
            ) : (
              <span style={{ fontSize: 15, color: theme.colors.textSecondary }}>
                Email belum diisi.
              </span>
            )}

            <div style={{ height: 1, background: theme.colors.border, margin: "32px 0 24px", maxWidth: 480 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {f.contactPhone ? (
                <a href={`tel:${f.contactPhone}`} style={{ fontSize: 14, color: theme.colors.textSecondary, width: "fit-content" }}>
                  {f.contactPhone}
                </a>
              ) : null}
              {f.contactLinkedin ? (
                <a
                  href={f.contactLinkedin.startsWith("http") ? f.contactLinkedin : `https://${f.contactLinkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: theme.colors.textSecondary, width: "fit-content" }}
                >
                  LinkedIn
                </a>
              ) : null}
              {f.contactGithub ? (
                <a
                  href={f.contactGithub.startsWith("http") ? f.contactGithub : `https://${f.contactGithub}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: theme.colors.textSecondary, width: "fit-content" }}
                >
                  GitHub
                </a>
              ) : null}
              {links.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: theme.colors.textSecondary, width: "fit-content" }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — papan penutup: satu lembar kertas dengan
 * pita lime di kepala, email sebagai jalur tercepat,
 * lalu tautan lain di bawah garis perforasi.
 * ═══════════════════════════════════════════════ */
function WorkbenchContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  const links = extraLinks.filter((l) => l.url);
  const web = (value: string) => (value.startsWith("http") ? value : `https://${value.replace(/^https?:\/\//, "")}`);

  return (
    <section style={wbSection(theme, { paddingBottom: "clamp(64px, 8vw, 104px)" })}>
      <div style={wbWrap()}>
        <Reveal>
          <div style={{ ...wbPaper(theme), overflow: "hidden" }}>
            <div aria-hidden="true" style={{ height: 10, background: theme.colors.accent, borderBottom: `2.5px solid ${theme.colors.border}` }} />

            <div
              style={{
                padding: "clamp(20px, 4vw, 40px)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "clamp(20px, 3vw, 40px)",
                alignItems: "start",
              }}
            >
              <div>
                <SheetLabel>kontak</SheetLabel>
                <h2 style={{ ...wbHeading(theme, "clamp(28px, 4.6vw, 46px)"), margin: "14px 0 0", maxWidth: "14ch" }}>
                  Mari bekerja sama
                </h2>
                <p style={{ margin: "12px 0 0", maxWidth: 420, fontSize: 15.5, lineHeight: 1.65, color: theme.colors.textSecondary }}>
                  Ada peran, proyek, atau ide yang cocok? Email adalah jalur tercepat untuk menjangkau saya.
                </p>
              </div>

              <div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {f.contactEmail ? (
                    <PillLink href={`mailto:${f.contactEmail}`} primary>
                      Email
                    </PillLink>
                  ) : null}
                  {f.contactLinkedin ? <PillLink href={web(f.contactLinkedin)} external>LinkedIn</PillLink> : null}
                  {f.contactGithub ? <PillLink href={web(f.contactGithub)} external>GitHub</PillLink> : null}
                  {f.contactPhone ? <PillLink href={`tel:${f.contactPhone}`}>Telepon</PillLink> : null}
                </div>

                {f.contactEmail ? (
                  <p style={{ margin: "14px 0 0", ...wbMono(theme), fontSize: 12.5 }}>
                    <a href={`mailto:${f.contactEmail}`} style={{ color: theme.colors.primary, textDecoration: "underline", textUnderlineOffset: 4, wordBreak: "break-word" }}>
                      {f.contactEmail}
                    </a>
                  </p>
                ) : null}

                {links.length ? (
                  <>
                    <div aria-hidden="true" style={{ borderTop: `1.5px dashed ${theme.colors.border}`, margin: "24px 0 14px" }} />
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: "8px 22px" }}>
                      {links.map((link) => (
                        <li key={link.id}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...wbMono(theme), fontSize: 12.5, color: theme.colors.textSecondary, textDecoration: "underline", textUnderlineOffset: 4 }}
                          >
                            {link.label || "Tautan"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* DECAL: kontak sebagai stiker pill besar yang bisa diklik. */
function DecalContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  const links: { label: string; href: string }[] = [];
  if (f.contactEmail) links.push({ label: f.contactEmail, href: `mailto:${f.contactEmail}` });
  if (f.contactPhone) links.push({ label: f.contactPhone, href: `tel:${f.contactPhone}` });
  if (f.contactLinkedin) links.push({ label: "LinkedIn", href: f.contactLinkedin });
  if (f.contactGithub) links.push({ label: "GitHub", href: f.contactGithub });
  extraLinks.filter((l) => l.url).forEach((l) => links.push({ label: l.label || l.url, href: l.url }));

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2.2rem, 6vw, 4rem)"), fontWeight: 800 }}>Mari terhubung</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 32 }}>
          {links.map((l, i) => (
            <Reveal key={`${l.href}-${i}`} delay={i * 0.06} y={10}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "12px 22px", background: i % 2 === 0 ? theme.colors.primary : theme.colors.secondary, color: theme.colors.onPrimary, borderRadius: theme.radii.pill, fontWeight: 800, fontSize: 15, textDecoration: "none", border: `2px solid ${theme.colors.border}`, boxShadow: theme.shadow.card }}>
                {l.label}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
/* CRAYON: kontak sebagai pil berwarna yang bisa diklik. */
function CrayonContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  const links: { label: string; href: string }[] = [];
  if (f.contactEmail) links.push({ label: f.contactEmail, href: `mailto:${f.contactEmail}` });
  if (f.contactPhone) links.push({ label: f.contactPhone, href: `tel:${f.contactPhone}` });
  if (f.contactLinkedin) links.push({ label: "LinkedIn", href: f.contactLinkedin });
  if (f.contactGithub) links.push({ label: "GitHub", href: f.contactGithub });
  extraLinks.filter((l) => l.url).forEach((l) => links.push({ label: l.label || l.url, href: l.url }));
  if (!links.length) return null;
  const fills = [theme.colors.primary, theme.colors.secondary, theme.colors.accent];
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ fontFamily: theme.typography.display, fontSize: "clamp(2.4rem, 6vw, 4rem)", fontWeight: 800, margin: 0, color: theme.colors.primary }}>Ayo mengobrol</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 30 }}>
          {links.map((l, i) => (
            <Reveal key={`${l.href}-${i}`} delay={i * 0.06} y={10}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "12px 22px", background: fills[i % fills.length], color: i % 3 === 2 ? theme.colors.text : theme.colors.onPrimary, borderRadius: theme.radii.pill, border: `3px solid ${theme.colors.border}`, fontWeight: 800, textDecoration: "none" }}>
                {l.label}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* SCRAPBOOK: kontak sebagai label tempel di satu kertas. */
function ScrapbookContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  const links: { label: string; href: string }[] = [];
  if (f.contactEmail) links.push({ label: f.contactEmail, href: `mailto:${f.contactEmail}` });
  if (f.contactPhone) links.push({ label: f.contactPhone, href: `tel:${f.contactPhone}` });
  if (f.contactLinkedin) links.push({ label: "LinkedIn", href: f.contactLinkedin });
  if (f.contactGithub) links.push({ label: "GitHub", href: f.contactGithub });
  extraLinks.filter((l) => l.url).forEach((l) => links.push({ label: l.label || l.url, href: l.url }));
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2.2rem, 6vw, 3.6rem)"), fontWeight: 700, color: theme.colors.primary }}>Mari bertemu di kertas berikutnya</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 30 }}>
          {links.map((l, i) => (
            <Reveal key={`${l.href}-${i}`} delay={i * 0.06} y={10}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "10px 18px", background: i % 2 ? theme.colors.accent : theme.colors.surface, color: theme.colors.text, border: `2px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card, fontWeight: 700, textDecoration: "none", transform: `rotate(${i % 2 ? 1 : -1}deg)` }}>
                {l.label}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function InterstellaContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  const webUrl = (value: string) => value && !/^[a-z][a-z0-9+.-]*:/i.test(value) ? `https://${value}` : value;
  const links = [
    { label: f.contactEmail, url: f.contactEmail ? `mailto:${f.contactEmail}` : "" },
    { label: f.contactPhone, url: f.contactPhone ? `tel:${f.contactPhone}` : "" },
    { label: "LinkedIn", url: webUrl(f.contactLinkedin) },
    { label: "GitHub", url: webUrl(f.contactGithub) },
    ...extraLinks.map((l) => ({ label: l.label || l.url, url: webUrl(l.url) })),
  ].map((l) => ({ ...l, href: safeUrlUnescaped(l.url) })).filter((l) => l.href);
  if (!links.length) return null;
  return (
    <section style={{ padding: "clamp(64px, 10vw, 128px) 0", background: theme.colors.bgSecondary }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <h2 style={{ margin: "0 0 40px", maxWidth: "14ch", fontFamily: theme.typography.display, fontSize: "clamp(2.8rem, 7vw, 5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: theme.colors.text }}>Mari bekerja sama.</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>{links.map((l, i) => <li key={`${l.href}-${i}`} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          <a href={l.href} className="hover:underline" {...(/^https?:/i.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={{ display: "flex", alignItems: "center", minHeight: 56, padding: "16px 0", fontSize: "clamp(1rem, 2.5vw, 1.5rem)", color: theme.colors.primary, textUnderlineOffset: 6 }}>{l.label}</a>
        </li>)}</ul>
      </div>
    </section>
  );
}

function SherbetContact({ f, extraLinks }: { f: PortfolioFormData; extraLinks: ExtraLink[] }) {
  const theme = usePortfolioTheme();
  const links = [
    { label: f.contactEmail, url: f.contactEmail ? `mailto:${f.contactEmail}` : "" },
    { label: f.contactPhone, url: f.contactPhone ? `tel:${f.contactPhone}` : "" },
    { label: "LinkedIn", url: f.contactLinkedin },
    { label: "GitHub", url: f.contactGithub },
    ...extraLinks.map((l) => ({ label: l.label || l.url, url: l.url })),
  ].map((l) => ({ ...l, href: safeUrlUnescaped(l.url) })).filter((l) => l.href);
  if (!links.length) return null;
  return (
    <section style={{ background: theme.colors.secondary, padding: "clamp(64px, 9vw, 112px) 0" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", textAlign: "center", overflowWrap: "anywhere" }}>
        <h2 style={{ maxWidth: "18ch", margin: "0 auto 32px", fontFamily: theme.typography.display, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.1, fontWeight: 800, color: theme.colors.text }}>Mulai cerita berikutnya.</h2>
        <address style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, fontStyle: "normal" }}>{links.map((l, i) => <a key={`${l.href}-${i}`} href={l.href} className="hover:underline" {...(/^https?:/i.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 48, maxWidth: "100%", padding: "12px 24px", borderRadius: theme.radii.button, background: i === 0 ? theme.colors.primary : theme.colors.surface, color: i === 0 ? theme.colors.onPrimary : theme.colors.text, fontWeight: 700, textUnderlineOffset: 5 }}>{l.label}</a>)}</address>
      </div>
    </section>
  );
}

export default function ContactSection({ data: f, extraLinks }: Props) {
  const theme = usePortfolioTheme();
  const hasContact = f.contactEmail || f.contactPhone || f.contactLinkedin || f.contactGithub || extraLinks.some(l => l.url);
  if (!hasContact) return null;
  switch (theme.id) {
    case "glass": return <GlassContact f={f} extraLinks={extraLinks} />;
    case "brutal": return <BrutalContact f={f} extraLinks={extraLinks} />;
    case "luxe": return <LuxeContact f={f} extraLinks={extraLinks} />;
    case "minimalist": return <MinimalistContact f={f} extraLinks={extraLinks} />;
    case "workbench": return <WorkbenchContact f={f} extraLinks={extraLinks} />;
    case "decal": return <DecalContact f={f} extraLinks={extraLinks} />;
    case "scrapbook": return <ScrapbookContact f={f} extraLinks={extraLinks} />;
    case "crayon": return <CrayonContact f={f} extraLinks={extraLinks} />;
    case "interstella": return <InterstellaContact f={f} extraLinks={extraLinks} />;
    case "sherbet": return <SherbetContact f={f} extraLinks={extraLinks} />;
    default: return <GlassContact f={f} extraLinks={extraLinks} />;
  }
}
