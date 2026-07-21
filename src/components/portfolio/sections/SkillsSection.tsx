"use client";

import { motion } from "motion/react";
import type { PortfolioFormData } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { data: PortfolioFormData; }

/* ═══════════════════════════════════════════════
 * GLASS — Horizontal scrollable chip carousel
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
                      className="flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
                      style={{
                        background: `${theme.colors.surface}`,
                        border: `1px solid ${theme.colors.border}`,
                        color: theme.colors.textSecondary,
                        backdropFilter: "blur(20px)",
                        boxShadow: `0 2px 8px ${theme.colors.primaryGlow}`,
                      }}>
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
              {/* Fade hints */}
              <div className="flex gap-1 mt-3 justify-center">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.colors.primary, opacity: 0.5 }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.colors.border }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.colors.border }} />
              </div>
            </>
          )}
          {(f.skillsTools || f.skillsLanguages) && (
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              {f.skillsTools && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Tools</span>
                  <span className="w-3 h-[1px]" style={{ background: theme.colors.primary }} />
                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{f.skillsTools}</span>
                </div>
              )}
              {f.skillsLanguages && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Bahasa</span>
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
 * BRUTAL — Bold block grid (keep unique layout)
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
                  style={{ background: theme.colors.surface, border: `3px solid ${theme.colors.border}`, boxShadow: `5px 5px 0px ${theme.colors.border}`, color: theme.colors.text }}>
                  {skill}
                </motion.div>
              ))}
            </div>
          )}
          {(f.skillsTools || f.skillsLanguages) && (
            <div className="mt-6 p-4" style={{ background: theme.colors.surface, border: `3px solid ${theme.colors.border}`, boxShadow: `6px 6px 0px ${theme.colors.border}` }}>
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
 * LUXE — Categorized skill groupings with gold
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
          <span className="font-medium" style={{ color: theme.colors.primary, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>SKILLS</span>

          {/* Decorative header bar */}
          <div className="flex items-center gap-4 my-4">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
              Expertise
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>
              {skillTags.length} Areas
            </span>
          </div>

          {/* Categorized skill groupings */}
          <div className="space-y-4">
            {/* Primary Skills */}
            {skillTags.length > 0 && (
              <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: "1.5rem", border: `1px solid ${theme.colors.border}` }}>
                <div className="p-5" style={{ background: theme.colors.surface, borderRadius: "calc(1.5rem - 0.25rem)" }}>
                  <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: theme.colors.primary }}>Core Competencies</span>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skillTags.map((skill, i) => (
                      <motion.span key={skill}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className="px-4 py-1.5 text-sm font-medium"
                        style={{ background: `${theme.colors.primary}06`, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: "100px" }}>
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
                <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: "1.5rem", border: `1px solid ${theme.colors.border}` }}>
                  <div className="p-4" style={{ background: theme.colors.surface, borderRadius: "calc(1.5rem - 0.25rem)" }}>
                    <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>Tools</span>
                    <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>{f.skillsTools}</p>
                  </div>
                </div>
              )}
              {f.skillsLanguages && (
                <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: "1.5rem", border: `1px solid ${theme.colors.border}` }}>
                  <div className="p-4" style={{ background: theme.colors.surface, borderRadius: "calc(1.5rem - 0.25rem)" }}>
                    <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>Languages</span>
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

/* ─── MAIN ─── */
export default function SkillsSection({ data: f }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassSkills f={f} />;
    case "brutal": return <BrutalSkills f={f} />;
    case "luxe": return <LuxeSkills f={f} />;
    default: return <GlassSkills f={f} />;
  }
}
