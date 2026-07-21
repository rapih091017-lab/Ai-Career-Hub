"use client";

import { motion } from "motion/react";
import type { TestimonialItem } from "../../portfolio-templates/types";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { items: TestimonialItem[]; }

/* ═══════════════════════════════════════════════
 * GLASS — Carousel-style single card with
 *          dot indicators and auto-scroll feel
 * ═══════════════════════════════════════════════ */
function GlassTestimonials({ items }: { items: TestimonialItem[] }) {
  const theme = usePortfolioTheme();
  const reduced = useReducedMotion();
  const filtered = items.filter(t => t.name || t.testimonial);
  if (!filtered.length) return null;

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: theme.colors.accent, top: "20%", left: "50%", transform: "translateX(-50%)", opacity: 0.04 }}
          {...(!reduced ? { animate: { scale: [1, 1.1, 1], opacity: [0.04, 0.07, 0.04] }, transition: { duration: 10, repeat: Infinity, ease: "easeInOut" } } : {})}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="font-bold mb-10" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text }}>
            Kata Mereka
          </h2>
        </motion.div>

        {/* Carousel-style: show first 3 as focal cards */}
        <div className="space-y-4">
          {filtered.slice(0, 3).map((tm, i) => (
            <motion.div
              key={tm.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="p-[1px]" style={{
                background: i === 0 ? `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.accent}20, transparent)` : `transparent`,
                borderRadius: "1.5rem",
              }}>
                <div className="p-5" style={{
                  background: `${theme.colors.surface}B3`,
                  borderRadius: "calc(1.5rem - 1px)",
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}10)`, color: theme.colors.primary }}>
                      {(tm.name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed italic mb-3" style={{ color: theme.colors.textMuted }}>
                        &ldquo;{tm.testimonial}&rdquo;
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>{tm.name}</span>
                        {tm.position && (
                          <>
                            <span className="w-1 h-1 rounded-full" style={{ background: theme.colors.textMuted }} />
                            <span className="text-xs" style={{ color: theme.colors.textMuted }}>{tm.position}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Carousel dots */}
        {filtered.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {filtered.slice(0, 3).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-500"
                style={{ background: i === 0 ? theme.colors.primary : theme.colors.border, opacity: i === 0 ? 1 : 0.5 }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
 * BRUTAL — Single-column staggered layout,
 *          alternating bold quote marks, minimal
 * ═══════════════════════════════════════════════ */
function BrutalTestimonials({ items }: { items: TestimonialItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(t => t.name || t.testimonial);
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
            TESTIMONI
          </h2>
        </motion.div>

        {/* Single column — alternating left/right aligned */}
        <div className="space-y-6">
          {filtered.map((tm, i) => (
            <motion.div
              key={tm.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="flex"
              style={{ justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}
            >
              <div className="relative max-w-lg" style={{ width: "85%" }}>
                <div className="p-5" style={{
                  background: theme.colors.surface,
                  border: `3px solid ${theme.colors.border}`,
                  borderRadius: "0.75rem",
                  boxShadow: i % 2 === 0 ? `6px 6px 0px ${theme.colors.border}` : `-6px 6px 0px ${theme.colors.border}`,
                }}>
                  {/* Bold quote mark */}
                  <div className="text-3xl leading-none font-black mb-1" style={{ color: theme.colors.primary }}>
                    &ldquo;
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: theme.colors.textSecondary }}>
                    {tm.testimonial}
                  </p>
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: `2px solid ${theme.colors.border}` }}>
                    <div className="w-8 h-8 flex items-center justify-center text-xs font-black"
                      style={{ background: theme.colors.primary, color: "#fff" }}>
                      {(tm.name?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: theme.colors.text }}>{tm.name}</div>
                      {tm.position && <div className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>{tm.position}</div>}
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
 * LUXE — Full-width centered quote cards
 *        with large serif quotation marks
 * ═══════════════════════════════════════════════ */
function LuxeTestimonials({ items }: { items: TestimonialItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(t => t.name || t.testimonial);
  if (!filtered.length) return null;

  return (
    <section className="relative overflow-hidden" style={{ padding: "96px 0" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 50, opacity: 0.02, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <span className="font-medium" style={{ color: theme.colors.primary, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            TESTIMONIALS
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
              Kind Words
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        <div className="space-y-6">
          {filtered.map((tm, i) => (
            <motion.div
              key={tm.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="p-1" style={{ background: theme.colors.bgSecondary, borderRadius: "2rem", border: `1px solid ${theme.colors.border}` }}>
                <div className="p-6 md:p-8 text-center" style={{
                  background: theme.colors.surface,
                  borderRadius: "calc(2rem - 0.25rem)",
                }}>
                  {/* Large serif quote mark */}
                  <span className="font-bold leading-none" style={{
                    fontSize: "clamp(3rem, 6vw, 5rem)",
                    color: theme.colors.primary,
                    fontFamily: "Playfair Display, serif",
                    opacity: 0.2,
                    lineHeight: 0.8,
                    display: "block",
                  }}>
                    &ldquo;
                  </span>

                  <p className="text-sm leading-relaxed italic max-w-2xl mx-auto mb-6" style={{ color: theme.colors.textMuted }}>
                    {tm.testimonial}
                  </p>

                  {/* Divider */}
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div style={{ width: 24, height: 1, background: theme.colors.border }} />
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.5" strokeLinecap="round">
                      <line x1="12" y1="2" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                    </svg>
                    <div style={{ width: 24, height: 1, background: theme.colors.border }} />
                  </div>

                  <div className="font-semibold" style={{ color: theme.colors.text, fontFamily: "Playfair Display, serif" }}>
                    {tm.name}
                  </div>
                  {tm.position && (
                    <div className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                      {tm.position}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function TestimonialsSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassTestimonials items={items} />;
    case "brutal": return <BrutalTestimonials items={items} />;
    case "luxe": return <LuxeTestimonials items={items} />;
    default: return <GlassTestimonials items={items} />;
  }
}
