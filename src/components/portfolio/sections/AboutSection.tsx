"use client";

import { motion } from "motion/react";
import type { PortfolioFormData } from "../../portfolio-templates/types";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { Paper, Reveal, SheetLabel, wbHeading, wbMono, wbSection, wbWrap } from "../workbench/kit";

interface Props { data: PortfolioFormData; }

/* ═══════════════════════════════════════════════
 * GLASS, Floating bento card with mesh gradient,
 *          animated dot pattern, frosted backdrop
 * ═══════════════════════════════════════════════ */
function GlassAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const reduced = useReducedMotion();
  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      {/* Decorative mesh dots */}
      <div className="pf-atmosphere absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full opacity-[0.03]" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="glass-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill={theme.colors.primary} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#glass-dots)" />
        </svg>
        <motion.div
          className="absolute w-[300px] h-[300px] blur-[80px]"
          style={{ background: theme.colors.primary, top: "10%", left: "5%", opacity: 0.06, borderRadius: theme.radii.pill }}
          {...(!reduced ? { animate: { y: [0, -20, 0], opacity: [0.06, 0.1, 0.06] }, transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } } : {})}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Large floating glass card */}
          <div className="relative overflow-hidden" style={{
            background: `${theme.colors.surface}`,
            borderRadius: theme.radii.card,
            backdropFilter: theme.blur.card,
            border: `1px solid ${theme.colors.border}`,
          }}>
            {/* Internal gradient bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})` }} />

            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-[1fr_0.7fr] gap-8 items-start">
                {/* Left: Main text */}
                <div>
                  <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: theme.colors.text }}>
                    Tentang Saya
                  </h2>
                  {f.aboutText && (
                    <p className="leading-relaxed" style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 1.7 }}>
                      {f.aboutText}
                    </p>
                  )}
                </div>

                {/* Right: Decorative stat highlights with glass pills */}
                <div className="space-y-3">
                  {[
                    { value: f.aboutYearsExp, label: "Tahun Pengalaman", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" },
                    { value: f.aboutProjectsDone, label: "Project Selesai", icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
                  ].filter(s => s.value).map((s, i) => (
                    <div key={s.label} className="flex items-center gap-3 p-3" style={{
                      background: `${theme.colors.primary}08`,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radii.card,
                    }}>
                      <div className="w-9 h-9 flex items-center justify-center" style={{ background: `${theme.colors.primary}15`, borderRadius: theme.radii.card }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.accent} strokeWidth="1.5">
                          <path d={s.icon} />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg font-bold" style={{ color: theme.colors.primary }}>{s.value}</div>
                        <div className="text-xs" style={{ color: theme.colors.textMuted }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * BRUTAL, Pull-quote with massive drop cap,
 *          bold border frame, asymmetrical layout
 * ═══════════════════════════════════════════════ */
function BrutalAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const firstWord = f.aboutText?.split(" ")[0] || "T";
  const restText = f.aboutText?.split(" ").slice(1).join(" ") || "";

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Bold frame, no inner bezel, just raw border and shadow */}
          <div className="relative">
            <div className="p-8 md:p-10" style={{
              background: theme.colors.surface,
              border: `4px solid ${theme.colors.border}`,
              borderRadius: theme.radii.card,
              boxShadow: theme.shadow.card,
            }}>
              {/* Eyebrow as bold badge */}
              <div className="inline-block mb-6 px-4 py-1 text-xs font-black tracking-widest"
                style={{ background: theme.colors.primary, color: theme.colors.onPrimary }}>
                TENTANG
              </div>

              <div className="flex items-start gap-6">
                {/* Drop cap, massive first letter */}
                <div className="hidden md:block flex-shrink-0 text-center" style={{ minWidth: 100 }}>
                  <span className="font-black leading-none" style={{
                    fontSize: "clamp(5rem, 10vw, 7rem)",
                    color: theme.colors.primary,
                    display: "block",
                    lineHeight: 0.85,
                  }}>
                    {firstWord[0]}
                  </span>
                  <div className="w-12 h-1 mx-auto mt-2" style={{ background: theme.colors.accent }} />
                </div>

                <div className="flex-1">
                  <h2 className="font-black mb-4" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", color: theme.colors.text, letterSpacing: "-0.03em" }}>
                    TENTANG SAYA
                  </h2>
                  {f.aboutText && (
                    <p className="leading-relaxed" style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 1.8 }}>
                      <span className="md:hidden font-black text-3xl float-left mr-2" style={{ color: theme.colors.primary }}>{firstWord[0]}</span>
                      {restText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * LUXE, Magazine column split with drop cap,
 *        ornamental divider, elegant serif
 * ═══════════════════════════════════════════════ */
function LuxeAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const words = f.aboutText?.split(" ") || [];
  const firstWord = words[0] || "A";
  const restWords = words.slice(1).join(" ");

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Magazine column split */}
          <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12">
            {/* Left column, decorative label + thin accent */}
            <div className="relative">
              <div className="md:sticky md:top-24">
                <span className="font-medium tracking-[0.2em] text-xs" style={{ color: theme.colors.primary }}>
                  TENTANG
                </span>
                <div className="mt-3 w-12 h-[1px]" style={{ background: theme.colors.primary }} />
                <h2 className="font-bold mt-6 leading-tight" style={{
                  fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)",
                  color: theme.colors.text,
                  fontFamily: theme.typography.display,
                }}>
                  Tentang Saya
                </h2>
              </div>
            </div>

            {/* Right column, main text with drop cap */}
            <div className="relative pl-6" style={{ borderLeft: `1px solid ${theme.colors.border}` }}>
              {f.aboutText && (
                <div className="leading-relaxed" style={{ color: theme.colors.textMuted, fontSize: 15, lineHeight: 1.8 }}>
                  <span className="float-left mr-3 font-bold leading-none" style={{
                    fontSize: "clamp(3.5rem, 6vw, 5rem)",
                    color: theme.colors.primary,
                    fontFamily: theme.typography.display,
                    lineHeight: 0.8,
                  }}>
                    {firstWord[0]}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                    {firstWord.substring(1)}{" "}
                  </span>
                  {restWords}
                </div>
              )}

              {/* End mark */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * MINIMALIST — dua kolom asimetris: label + garis
 * rambut di kiri, paragraf lebar di kanan. Angka
 * statistik jadi teks polos yang dipisah garis
 * vertikal, bukan kartu.
 * ═══════════════════════════════════════════════ */
function MinimalistAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const stats = [
    { value: f.aboutYearsExp, label: "Tahun" },
    { value: f.aboutProjectsDone, label: "Proyek" },
    { value: f.aboutClientsHappy, label: "Klien" },
  ].filter((s) => s.value);

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "clamp(24px, 5vw, 64px)" }}>
          <div>
            <span style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              color: theme.colors.textSecondary,
            }}>
              01 / Tentang
            </span>
            <div style={{ height: 1, background: theme.colors.border, marginTop: 16 }} />
          </div>

          <div>
            {f.aboutText ? (
              <p style={{
                fontFamily: theme.typography.display,
                fontSize: "clamp(18px, 2.4vw, 22px)",
                lineHeight: 1.6,
                letterSpacing: "-0.01em",
                color: theme.colors.text,
                margin: 0,
                maxWidth: 680,
              }}>
                {f.aboutText}
              </p>
            ) : null}

            {stats.length ? (
              <div style={{ display: "flex", gap: "clamp(24px, 4vw, 48px)", marginTop: 40, flexWrap: "wrap" }}>
                {stats.map((s, i) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    {i > 0 ? (
                      <span aria-hidden="true" style={{ color: theme.colors.border, marginRight: 8 }}>|</span>
                    ) : null}
                    <span style={{
                      fontFamily: theme.typography.display,
                      fontSize: "clamp(24px, 3vw, 32px)",
                      fontWeight: 500,
                      color: theme.colors.text,
                    }}>
                      {s.value}
                    </span>
                    <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{s.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — teks di kolom kiri, catatan kecil
 * (tahun, proyek, klien) ditempel miring di kanan.
 * Angka jadi bukti, bukan hiasan: tiap catatan
 * memakai label mono yang sama dengan label section.
 * ═══════════════════════════════════════════════ */
function WorkbenchAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const notes = [
    { value: f.aboutYearsExp, label: "tahun pengalaman" },
    { value: f.aboutProjectsDone, label: "proyek selesai" },
    { value: f.aboutClientsHappy, label: "klien terbantu" },
  ].filter((n) => n.value);

  return (
    <section style={wbSection(theme)}>
      <div style={wbWrap()}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "clamp(28px, 4vw, 48px)", alignItems: "start" }}>
          <Reveal>
            <SheetLabel>tentang</SheetLabel>
            <h2 style={{ ...wbHeading(theme), margin: "12px 0 0" }}>Tentang saya</h2>
            <div aria-hidden="true" style={{ width: 56, height: 2.5, background: theme.colors.border, margin: "16px 0 18px" }} />
            <p style={{ margin: 0, maxWidth: 560, fontSize: 16.5, lineHeight: 1.75, color: theme.colors.textSecondary }}>
              {f.aboutText}
            </p>
          </Reveal>

          {notes.length ? (
            <div style={{ display: "grid", gap: 14, maxWidth: 380, marginLeft: "auto", width: "100%" }}>
              {notes.map((note, i) => (
                <Reveal key={note.label} delay={0.08 * i} y={16}>
                  <Paper
                    style={{
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 12,
                      transform: `rotate(${i % 2 === 0 ? 1 : -1}deg)`,
                    }}
                  >
                    <span style={{ ...wbHeading(theme, "clamp(28px, 3.4vw, 36px)"), color: theme.colors.primary }}>
                      {note.value}
                    </span>
                    <span style={{ ...wbMono(theme), fontSize: 11.5, color: theme.colors.textSecondary }}>{note.label}</span>
                  </Paper>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * DECAL — kartu stiker: judul besar, teks bio di
 * dalam bidang pill terang, dan dua angka besar
 * ditempel miring. Animasi masuk per stiker.
 * ═══════════════════════════════════════════════ */
function DecalAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  const notes = [
    { value: f.aboutYearsExp, label: "tahun" },
    { value: f.aboutProjectsDone, label: "proyek" },
    { value: f.aboutClientsHappy, label: "klien" },
  ].filter((n) => n.value);

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3.2rem)"), fontWeight: 800 }}>Tentang saya</h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 28, alignItems: "start" }}>
          <Reveal>
            <div style={{ padding: "clamp(20px, 3vw, 28px)", background: theme.colors.surface, borderRadius: theme.radii.card, boxShadow: theme.shadow.card, border: `2.5px solid ${theme.colors.border}` }}>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: theme.colors.textSecondary }}>{f.aboutText}</p>
            </div>
          </Reveal>
          {notes.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {notes.map((note, i) => (
                <Reveal key={note.label} delay={0.08 * i} y={14}>
                  <span
                    style={{
                      display: "inline-flex",
                      flexDirection: "column",
                      padding: "14px 20px",
                      background: i % 2 ? theme.colors.secondary : theme.colors.accent,
                      color: theme.colors.onPrimary,
                      borderRadius: theme.radii.card,
                      boxShadow: theme.shadow.card,
                      transform: `rotate(${i % 2 ? 2 : -2}deg)`,
                    }}
                  >
                    <strong style={{ fontFamily: theme.typography.display, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{note.value}</strong>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{note.label}</span>
                  </span>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* CRAYON: bio di kartu putih dengan kotak warna di sampingnya. */
function CrayonAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  if (!f.aboutText) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, alignItems: "start" }}>
        <Reveal>
          <h2 style={{ fontFamily: theme.typography.display, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, margin: 0, color: theme.colors.primary }}>Tentang saya</h2>
          <p style={{ margin: "16px 0 0", fontSize: 17, lineHeight: 1.75, color: theme.colors.textSecondary }}>{f.aboutText}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ padding: 24, background: theme.colors.surface, border: `3px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, background: theme.colors.primary }} />
              <span style={{ width: 28, height: 28, borderRadius: 999, background: theme.colors.secondary }} />
              <span style={{ width: 28, height: 28, borderRadius: 999, background: theme.colors.accent }} />
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.6, color: theme.colors.textMuted }}>Angka di bawah ini adalah ringkasan kerja yang bisa Anda ubah di editor.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* SCRAPBOOK: teks bio di kertas tempel, dengan catatan kecil. */
function ScrapbookAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  if (!f.aboutText) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 36, alignItems: "start" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3rem)"), fontWeight: 700, color: theme.colors.primary }}>Tentang saya</h2>
          <p style={{ margin: "16px 0 0", fontSize: 17, lineHeight: 1.75, color: theme.colors.textSecondary }}>{f.aboutText}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ padding: 24, background: theme.colors.surface, border: `2px solid ${theme.colors.border}`, borderRadius: theme.radii.card, boxShadow: theme.shadow.card, transform: "rotate(-1deg)" }}>
            <p style={{ margin: 0, fontFamily: theme.typography.display, fontSize: 26, color: theme.colors.secondary }}>catatan kecil</p>
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: theme.colors.textMuted }}>Angka di bawah ini adalah ringkasan kerja yang bisa Anda ubah di editor.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
function InterstellaAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ padding: "clamp(56px, 9vw, 112px) 0", background: theme.colors.bg }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", display: "flex", flexWrap: "wrap", gap: "24px 80px", overflowWrap: "anywhere" }}>
        <h2 style={{ flex: "1 1 220px", margin: 0, fontFamily: theme.typography.display, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.15, fontWeight: 700, color: theme.colors.text }}>Tentang saya</h2>
        <p style={{ flex: "2 1 280px", maxWidth: "65ch", margin: 0, fontSize: "clamp(18px, 2.2vw, 24px)", lineHeight: 1.7, whiteSpace: "pre-line", color: theme.colors.textSecondary }}>{f.aboutText}</p>
      </div>
    </section>
  );
}

function SherbetAbout({ f }: { f: PortfolioFormData }) {
  const theme = usePortfolioTheme();
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <div style={{ background: theme.colors.secondary, borderRadius: theme.radii.card, padding: "clamp(24px, 5vw, 56px)" }}>
          <h2 style={{ margin: "0 0 24px", maxWidth: "18ch", fontFamily: theme.typography.display, fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1, color: theme.colors.text }}>Kenali saya lebih dekat.</h2>
          <p style={{ margin: 0, maxWidth: "65ch", fontSize: 18, lineHeight: 1.8, whiteSpace: "pre-line", color: theme.colors.textSecondary }}>{f.aboutText}</p>
        </div>
      </div>
    </section>
  );
}

export default function AboutSection({ data: f }: Props) {
  const theme = usePortfolioTheme();
  if (!f.aboutText) return null;
  switch (theme.id) {
    case "glass": return <GlassAbout f={f} />;
    case "brutal": return <BrutalAbout f={f} />;
    case "luxe": return <LuxeAbout f={f} />;
    case "minimalist": return <MinimalistAbout f={f} />;
    case "workbench": return <WorkbenchAbout f={f} />;
    case "decal": return <DecalAbout f={f} />;
    case "scrapbook": return <ScrapbookAbout f={f} />;
    case "crayon": return <CrayonAbout f={f} />;
    case "interstella": return <InterstellaAbout f={f} />;
    case "sherbet": return <SherbetAbout f={f} />;
    default: return <GlassAbout f={f} />;
  }
}
