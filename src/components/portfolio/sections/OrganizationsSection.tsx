"use client";

import { motion } from "motion/react";
import type { OrganizationItem } from "../../portfolio-templates/types";
import { usePortfolioTheme } from "../PortfolioCanvas";

interface Props { items: OrganizationItem[]; }

/* ═══ GLASS, timeline cards ═══ */
function GlassOrganizations({ items }: { items: OrganizationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(o => o.name);
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
            Organisasi &amp; Kepanitiaan
          </h2>
        </motion.div>

        <div className="space-y-4">
          {filtered.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="p-[1px]" style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.accent}15, transparent)`,
                borderRadius: theme.radii.card,
              }}>
                <div className="p-5" style={{
                  background: `${theme.colors.surface}B3`,
                  borderRadius: theme.radii.card,
                  backdropFilter: theme.blur.card,
                  boxShadow: theme.shadow.card,
                }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}10)`, borderRadius: theme.radii.card }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="8" r="3.5" />
                        <circle cx="17" cy="10" r="2.5" />
                        <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
                        <path d="M14.5 20c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <h3 className="font-semibold" style={{ fontSize: "1rem", color: theme.colors.text }}>{org.name}</h3>
                        {org.period && (
                          <span className="text-xs font-medium flex-shrink-0" style={{ color: theme.colors.accent }}>{org.period}</span>
                        )}
                      </div>
                      {org.role && (
                        <p className="text-sm font-medium mt-0.5" style={{ color: theme.colors.primary }}>{org.role}</p>
                      )}
                      {org.description && (
                        <p className="text-xs mt-2 leading-relaxed" style={{ color: theme.colors.textMuted }}>{org.description}</p>
                      )}
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

/* ═══ BRUTAL, bold rows with tag markers ═══ */
function BrutalOrganizations({ items }: { items: OrganizationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(o => o.name);
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
            ORGANISASI
          </h2>
        </motion.div>

        <div className="space-y-6">
          {filtered.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="p-5" style={{
                background: theme.colors.surface,
                border: `3px solid ${theme.colors.border}`,
                borderRadius: theme.radii.card,
                boxShadow: theme.shadow.card,
              }}>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <h3 className="font-bold" style={{ color: theme.colors.text }}>{org.name}</h3>
                  {org.period && (
                    <span className="text-xs font-bold px-2 py-0.5" style={{ background: theme.colors.accent, color: theme.colors.text }}>{org.period}</span>
                  )}
                </div>
                {org.role && (
                  <p className="text-sm font-semibold mb-1" style={{ color: theme.colors.primary }}>{org.role}</p>
                )}
                {org.description && (
                  <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>{org.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ LUXE, elegant numbered list ═══ */
function LuxeOrganizations({ items }: { items: OrganizationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter(o => o.name);
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
            ORGANISASI
          </span>
          <div className="flex items-center gap-4 mt-2 mb-10">
            <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: theme.colors.text, fontFamily: theme.typography.display }}>
              Organisasi
            </h2>
            <div className="flex-1" style={{ height: 1, background: theme.colors.border }} />
          </div>
        </motion.div>

        <div className="space-y-6">
          {filtered.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="flex gap-5"
            >
              <div className="flex flex-col items-center">
                {/* Nomor serif murni — hierarki tipografi, bukan lencana berlatar */}
                <span style={{ fontFamily: theme.typography.display, fontSize: "1.15rem", lineHeight: 1.4, color: theme.colors.primary }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i < filtered.length - 1 && <div className="flex-1 w-[1px] my-1" style={{ background: theme.colors.border }} />}
              </div>
              <div className="pb-6 flex-1">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-semibold" style={{ color: theme.colors.text, fontFamily: theme.typography.display }}>{org.name}</h3>
                  {org.period && (
                    <span className="text-xs font-medium" style={{ color: theme.colors.primary }}>{org.period}</span>
                  )}
                </div>
                {org.role && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: theme.colors.textSecondary }}>{org.role}</p>
                )}
                {org.description && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.colors.textMuted }}>{org.description}</p>
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
 * MINIMALIST — nama di kiri, peran di kanan, hairline
 * di antara baris. Tanpa avatar, tanpa chip.
 * ═══════════════════════════════════════════════ */
function MinimalistOrganizations({ items }: { items: OrganizationItem[] }) {
  const theme = usePortfolioTheme();
  const filtered = items.filter((o) => o.name);
  if (!filtered.length) return null;

  return (
    <section style={{ background: theme.colors.bg, padding: "clamp(64px, 9vh, 112px) 0" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.colors.textSecondary }}>
          06 / Komunitas
        </span>
        <h2 style={{
          fontFamily: theme.typography.display,
          fontSize: "clamp(24px, 3vw, 34px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: theme.colors.text,
          margin: "16px 0 32px",
        }}>
          Organisasi & Komunitas
        </h2>

        <div>
          {filtered.map((o) => (
            <div
              key={o.id}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
                padding: "20px 0",
                borderTop: `1px solid ${theme.colors.border}`,
              }}
            >
              <div>
                <span style={{ fontFamily: theme.typography.display, fontSize: 16, color: theme.colors.text }}>
                  {o.name}
                </span>
                {o.description ? (
                  <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: "6px 0 0", maxWidth: 560 }}>
                    {o.description}
                  </p>
                ) : null}
              </div>
              <span style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: "right" }}>
                {o.role}
                {o.period ? ` · ${o.period}` : ""}
              </span>
            </div>
          ))}
          <div style={{ height: 1, background: theme.colors.border }} />
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function OrganizationsSection({ items }: Props) {
  const theme = usePortfolioTheme();
  switch (theme.id) {
    case "glass": return <GlassOrganizations items={items} />;
    case "brutal": return <BrutalOrganizations items={items} />;
    case "luxe": return <LuxeOrganizations items={items} />;
    case "minimalist": return <MinimalistOrganizations items={items} />;
    default: return <GlassOrganizations items={items} />;
  }
}
