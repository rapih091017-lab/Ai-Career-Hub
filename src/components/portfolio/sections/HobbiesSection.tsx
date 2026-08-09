"use client";

import { motion } from "motion/react";
import type { HobbyItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { items: HobbyItem[]; }

const HOBBY_ICONS = [
  <path key="a" d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z" />,
  <path key="b" d="M3 17l5-5 4 4 6-6 3 3" />,
  <path key="c" d="M4 20h16M6 20V10l4-4 4 4 4-2v12" />,
  <path key="d" d="M12 20a8 8 0 100-16 8 8 0 000 16zM12 8v6M9 12h6" />,
  <path key="e" d="M4 15s4-8 8-8 8 8 8 8" />,
  <path key="f" d="M12 3v18M3 12h18" />,
];

/* ═══ GLASS — chip cloud ═══ */
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
              <div className="px-4 py-2.5 rounded-full flex items-center gap-2" style={{
                background: `${theme.colors.surface}B3`,
                border: `1px solid ${theme.colors.border}`,
                backdropFilter: "blur(20px)",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {HOBBY_ICONS[i % HOBBY_ICONS.length]}
                </svg>
                <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{hobby.name}</span>
                {hobby.description && (
                  <span className="text-xs hidden sm:inline" style={{ color: theme.colors.textMuted }}>— {hobby.description}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ BRUTAL — boxed tags ═══ */
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
                borderRadius: "0.75rem",
                boxShadow: `4px 4px 0px ${theme.colors.border}`,
              }}>
                <div className="w-9 h-9 mx-auto mb-2 flex items-center justify-center" style={{ background: theme.colors.primary }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {HOBBY_ICONS[i % HOBBY_ICONS.length]}
                  </svg>
                </div>
                <div className="font-bold text-sm" style={{ color: theme.colors.text }}>{hobby.name}</div>
                {hobby.description && (
                  <div className="text-[11px] mt-1 leading-snug" style={{ color: theme.colors.textMuted }}>{hobby.description}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ LUXE — editorial list ═══ */
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
            INTERESTS
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
              Hobi &amp; Minat
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          {filtered.map((hobby, i) => (
            <motion.div
              key={hobby.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="px-4 py-2.5 flex items-center gap-2" style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "999px",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {HOBBY_ICONS[i % HOBBY_ICONS.length]}
                </svg>
                <span className="text-sm" style={{ color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>{hobby.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function HobbiesSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassHobbies items={items} />;
    case "brutal": return <BrutalHobbies items={items} />;
    case "luxe": return <LuxeHobbies items={items} />;
    default: return <GlassHobbies items={items} />;
  }
}
