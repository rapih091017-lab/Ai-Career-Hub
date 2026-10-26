"use client";

import { motion } from "motion/react";
import type { HobbyItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";
import { Paper, Reveal, SectionHead, wbHeading, wbSection, wbWrap } from "../workbench/kit";

interface Props { items: HobbyItem[]; }

const HOBBY_ICONS = [
  <path key="a" d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z" />,
  <path key="b" d="M3 17l5-5 4 4 6-6 3 3" />,
  <path key="c" d="M4 20h16M6 20V10l4-4 4 4 4-2v12" />,
  <path key="d" d="M12 20a8 8 0 100-16 8 8 0 000 16zM12 8v6M9 12h6" />,
  <path key="e" d="M4 15s4-8 8-8 8 8 8 8" />,
  <path key="f" d="M12 3v18M3 12h18" />,
];

/* ═══ GLASS, chip cloud ═══ */
function GlassHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(h => h.name);
  if (!filtered.length) return null;

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="font-bold mb-8" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text }}>
            Hobi &amp; Minat
          </h2>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          {filtered.map((hobby, i) => (
            <motion.div
              key={hobby.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="px-4 py-2.5 flex items-center gap-2" style={{
                background: `${theme.colors.surface}B3`,
                border: `1px solid ${theme.colors.border}`,
                backdropFilter: theme.blur.card,
                borderRadius: theme.radii.pill,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {HOBBY_ICONS[i % HOBBY_ICONS.length]}
                </svg>
                <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{hobby.name}</span>
                {hobby.description && (
                  <span className="text-xs hidden sm:inline" style={{ color: theme.colors.textMuted }}>, {hobby.description}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ BRUTAL, boxed tags ═══ */
function BrutalHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(h => h.name);
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
            HOBI &amp; MINAT
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((hobby, i) => (
            <motion.div
              key={hobby.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="p-4 text-center" style={{
                background: theme.colors.surface,
                border: `3px solid ${theme.colors.border}`,
                borderRadius: theme.radii.card,
                boxShadow: theme.shadow.card,
              }}>
                <div className="w-9 h-9 mx-auto mb-2 flex items-center justify-center" style={{ background: theme.colors.primary }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.onPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {HOBBY_ICONS[i % HOBBY_ICONS.length]}
                  </svg>
                </div>
                <div className="font-bold text-sm" style={{ color: theme.colors.text }}>{hobby.name}</div>
                {hobby.description && (
                  <div className="text-xs mt-1 leading-snug" style={{ color: theme.colors.textMuted }}>{hobby.description}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ LUXE, ledger hairline — nomor serif + nama serif, tanpa kartu ═══ */
function LuxeHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(h => h.name);
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
          <span className="font-medium" style={{ color: theme.colors.primary, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            MINAT
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: theme.typography.display }}>
              Hobi &amp; Minat
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          {filtered.map((hobby, i) => (
            <motion.div
              key={hobby.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 items-baseline py-4"
              style={{ borderBottom: `1px solid ${theme.colors.border}` }}
            >
              <span style={{ fontFamily: theme.typography.display, fontSize: "1.05rem", color: theme.colors.primary }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span style={{ fontFamily: theme.typography.display, fontSize: "1.05rem", color: theme.colors.text }}>
                  {hobby.name}
                </span>
                {hobby.description && (
                  <span className="text-sm" style={{ color: theme.colors.textMuted }}>— {hobby.description}</span>
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
 * MINIMALIST — label + teks interest. Tanpa ikon:
 * di tema putih ini, hemat ruang lebih penting.
 * ═══════════════════════════════════════════════ */
function MinimalistHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((h) => h.name);
  if (!filtered.length) return null;

  return (
    <section style={{ background: theme.colors.bgSecondary, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.colors.textSecondary }}>
          07 / Minat
        </span>
        <h2 style={{
          fontFamily: theme.typography.display,
          fontSize: "clamp(24px, 3vw, 34px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: theme.colors.text,
          margin: "16px 0 24px",
        }}>
          Hobi & Minat
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 32px" }}>
          {filtered.map((h) => (
            <span key={h.id} style={{ fontSize: 15, color: theme.colors.text }}>
              {h.name}
              {h.description ? (
                <span style={{ color: theme.colors.textSecondary }}> — {h.description}</span>
              ) : null}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * WORKBENCH — catatan tempel: tiap hobi satu potongan
 * kertas kecil yang ditempel miring bergantian. Tanpa
 * ikon generik; nama dan alasannya sudah cukup.
 * ═══════════════════════════════════════════════ */
function WorkbenchHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((h) => h.name);
  if (!filtered.length) return null;

  return (
    <section style={wbSection(theme, { paddingTop: "clamp(40px, 6vw, 64px)" })}>
      <div style={wbWrap()}>
        <SectionHead label="di luar kerja" title="Hobi & minat" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
          {filtered.map((h, i) => (
            <Reveal key={h.id} delay={i * 0.05} y={14} style={{ display: "flex" }}>
              <Paper style={{ padding: "16px 18px", flex: 1, transform: `rotate(${i % 2 === 0 ? -1.2 : 1.2}deg)` }}>
                <p style={{ ...wbHeading(theme, "clamp(15px, 1.9vw, 17px)"), margin: 0 }}>{h.name}</p>
                {h.description ? (
                  <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.6, color: theme.colors.textSecondary }}>{h.description}</p>
                ) : null}
              </Paper>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* DECAL: hobi sebagai stiker pill berwarna. */
function DecalHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((h) => h.name);
  if (!filtered.length) return null;
  const colors = [theme.colors.primary, theme.colors.secondary, theme.colors.accent];

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3.2rem)"), fontWeight: 800 }}>Hobi</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          {filtered.map((h, i) => (
            <Reveal key={h.id} delay={i * 0.05} y={10}>
              <span title={h.description || undefined} style={{ display: "inline-block", padding: "10px 18px", background: colors[i % colors.length], color: theme.colors.onPrimary, borderRadius: theme.radii.pill, fontWeight: 800, fontSize: 15, border: `2px solid ${theme.colors.border}` }}>
                {h.name}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
/* CRAYON: hobi sebagai pil warna-warni. */
function CrayonHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((h) => h.name);
  if (!filtered.length) return null;
  const fills = [theme.colors.primary, theme.colors.secondary, theme.colors.accent];
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ fontFamily: theme.typography.display, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, margin: 0, color: theme.colors.primary }}>Hobi</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
          {filtered.map((h, i) => (
            <Reveal key={h.id} delay={i * 0.05} y={10}>
              <span title={h.description || undefined} style={{ display: "inline-block", padding: "10px 20px", background: fills[i % fills.length], color: i % 3 === 2 ? theme.colors.text : theme.colors.onPrimary, borderRadius: theme.radii.pill, fontWeight: 800, fontSize: 15 }}>
                {h.name}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* SCRAPBOOK: hobi sebagai label selotip kecil yang miring. */
function ScrapbookHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((h) => h.name);
  if (!filtered.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(56px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <Reveal>
          <h2 style={{ ...wbHeading(theme, "clamp(2rem, 5vw, 3rem)"), fontWeight: 700, color: theme.colors.primary }}>Hobi</h2>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
          {filtered.map((h, i) => (
            <Reveal key={h.id} delay={i * 0.05} y={10}>
              <span title={h.description || undefined} style={{ display: "inline-block", padding: "8px 16px", background: i % 2 ? theme.colors.accent : theme.colors.surface, color: theme.colors.text, border: `2px solid ${theme.colors.border}`, fontWeight: 700, fontSize: 15, transform: `rotate(${i % 2 ? 2 : -2}deg)` }}>
                {h.name}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function InterstellaHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((h) => h.name);
  if (!filtered.length) return null;
  return (
    <section style={{ padding: "clamp(48px, 7vw, 80px) 0", background: theme.colors.bgSecondary }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", overflowWrap: "anywhere" }}>
        <h2 style={{ margin: "0 0 32px", fontFamily: theme.typography.display, fontSize: "clamp(2rem, 4vw, 3rem)", color: theme.colors.text }}>Di luar pekerjaan</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px 48px" }}>{filtered.map((h) => <article key={h.id} style={{ flex: "1 1 240px", minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: theme.colors.text }}>{h.name}</h3>{h.description && <p style={{ margin: "12px 0 0", lineHeight: 1.75, color: theme.colors.textSecondary }}>{h.description}</p>}
        </article>)}</div>
      </div>
    </section>
  );
}

function SherbetHobbies({ items }: { items: HobbyItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((h) => h.name);
  if (!filtered.length) return null;
  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(48px, 7vw, 80px) 0" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)", display: "flex", flexWrap: "wrap", gap: "24px 56px", overflowWrap: "anywhere" }}>
        <h2 style={{ flex: "1 1 220px", margin: 0, fontFamily: theme.typography.display, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: theme.colors.text }}>Sumber inspirasi</h2>
        <ul style={{ flex: "2 1 260px", listStyle: "none", margin: 0, padding: 0 }}>{filtered.map((h) => <li key={h.id} style={{ padding: "0 0 24px" }}>
          <h3 style={{ margin: 0, fontSize: 24, color: theme.colors.text }}>{h.name}</h3>{h.description && <p style={{ margin: "10px 0 0", lineHeight: 1.75, color: theme.colors.textSecondary }}>{h.description}</p>}
        </li>)}</ul>
      </div>
    </section>
  );
}

export default function HobbiesSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassHobbies items={items} />;
    case "brutal": return <BrutalHobbies items={items} />;
    case "luxe": return <LuxeHobbies items={items} />;
    case "minimalist": return <MinimalistHobbies items={items} />;
    case "workbench": return <WorkbenchHobbies items={items} />;
    case "decal": return <DecalHobbies items={items} />;
    case "scrapbook": return <ScrapbookHobbies items={items} />;
    case "crayon": return <CrayonHobbies items={items} />;
    case "interstella": return <InterstellaHobbies items={items} />;
    case "sherbet": return <SherbetHobbies items={items} />;
    default: return <GlassHobbies items={items} />;
  }
}
