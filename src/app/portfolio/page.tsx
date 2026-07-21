"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

import { THEMES, TEMPLATE_PREVIEWS, DEFAULT_THEME_ID } from "@/components/portfolio/themes";

const THEME_LIST = Object.values(THEMES);

export default function PortfolioPage() {
  const { t, lang, toggleLang } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState<string>(DEFAULT_THEME_ID);
  const [urlSlug, setUrlSlug] = useState("teguhsurya");
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setProfileData(data))
      .catch(() => {});
  }, []);

  const stats = {
    name: profileData?.personalInfo?.fullName || "—",
    workCount: Array.isArray(profileData?.workHistory) ? profileData.workHistory.length : "—",
    eduCount: Array.isArray(profileData?.education) ? profileData.education.length : "—",
    skillCount: Array.isArray(profileData?.skills) ? profileData.skills.length : "—",
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />
        <main className="pt-24 pb-20 px-margin-mobile md:px-gutter">
          <div className="max-w-[900px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-headline-lg text-on-background mb-1">Portfolio Website</h1>
                <p className="font-body-md text-on-surface-variant">Bangun dan kelola website portofolio pribadimu</p>
              </div>
              {/* Language toggle */}
              <button
                onClick={toggleLang}
                className="w-9 h-9 rounded-lg border border-outline-variant/40 text-[11px] font-bold uppercase tracking-wider hover:bg-surface-container transition-colors shrink-0"
                title={lang === "id" ? "Switch to English" : "Ganti ke Indonesia"}
              >
                {lang === "id" ? "EN" : "ID"}
              </button>
            </div>

            {/* Live URL + Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-outline-variant/30">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1">
                  <label className="text-label-bold text-on-surface-variant block mb-1.5">{t("portfolio.url-label")}</label>
                  <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-4 py-2 border border-outline-variant">
                    <span className="text-label-sm text-outline">aicareerhub.com/</span>
                    <input
                      value={urlSlug}
                      onChange={(e) => setUrlSlug(e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 font-label-bold text-on-surface min-w-0"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href="/portfolio/live" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 transition-opacity shadow-md">
                    <span className="material-symbols-outlined text-lg">live_tv</span>
                    <span className="hidden sm:inline">Live Builder</span>
                  </Link>
                  <Link href={`/portfolio/preview?template=${selectedTheme}`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface font-label-bold hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-lg">preview</span>
                    <span className="hidden sm:inline">Preview</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Templates / Theme Picker — real previews */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-headline-md text-on-surface mb-4">{t("portfolio.choose-theme")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {THEME_LIST.map((theme, i) => {
                  const preview = TEMPLATE_PREVIEWS[theme.id as keyof typeof TEMPLATE_PREVIEWS];
                  return (
                    <motion.div
                      key={theme.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.08 * i }}
                    >
                      <button
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`w-full rounded-2xl border-2 overflow-hidden text-left transition-[transform,border-color] theme-card-hover active:scale-[0.98] ${
                          selectedTheme === theme.id
                            ? "border-primary bg-primary-fixed/10"
                            : "border-outline-variant/30 bg-white hover:border-primary/50"
                        }`}
                      >
                        {/* Live preview with dummy data */}
                        <div className="w-full" style={{ background: theme.colors.bg, minHeight: 160 }}>
                          <div className="px-4 py-3" style={{ fontFamily: theme.font.includes(" ") ? `'${theme.font}', sans-serif` : `${theme.font}, sans-serif` }}>
                            {/* Mini nav mockup */}
                            <div className="flex justify-between items-center mb-2" style={{ fontSize: 10, color: theme.colors.textMuted }}>
                              <span style={{ fontWeight: 700, fontSize: 12, color: theme.colors.text }}>
                                {preview?.hero.name.split(" ")[0] || "Nama"}<span style={{ color: theme.colors.primary }}>.</span>
                              </span>
                              <div className="flex gap-2">
                                <span style={{ color: theme.colors.textMuted }}>Tentang</span>
                                <span style={{ color: theme.colors.textMuted }}>Proyek</span>
                              </div>
                            </div>
                            {/* Mini hero mockup */}
                            <div className="mb-2">
                              <h3 className="font-bold leading-tight" style={{
                                fontSize: 14,
                                color: theme.colors.text,
                                letterSpacing: "-0.03em",
                              }}>
                                Halo, Saya{" "}
                                <span style={{ color: theme.colors.primary }}>{preview?.hero.name.split(" ")[0] || "User"}</span>
                              </h3>
                              <p className="text-[10px] mt-0.5" style={{ color: theme.colors.primary, fontWeight: 600 }}>
                                {preview?.hero.title || "Developer"}
                              </p>
                            </div>
                            {/* Mini stats mockup */}
                            <div className="flex gap-1.5 mt-2">
                              {preview?.stats.map((s, si) => (
                                <div key={si} className="flex-1 py-1 rounded text-center" style={{ background: `${theme.colors.primary}12`, fontSize: 9, color: theme.colors.textMuted }}>
                                  <div style={{ fontWeight: 700, color: theme.colors.primary, fontSize: 11 }}>{s}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                            <h3 className="font-label-bold text-on-surface text-sm">{theme.name}</h3>
                          </div>
                          <p className="text-label-sm text-on-surface-variant">{theme.description}</p>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Stats — staggered card entry */}
            <motion.section
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              {[
                { icon: "badge", label: stats.name, sub: t("portfolio.stats-fullname"), color: "bg-primary-fixed", iconColor: "text-primary" },
                { icon: "work", label: stats.workCount, sub: t("portfolio.stats-experience"), color: "bg-tertiary-container/30", iconColor: "text-tertiary" },
                { icon: "school", label: stats.eduCount, sub: t("portfolio.stats-education"), color: "bg-secondary-container/50", iconColor: "text-secondary" },
                { icon: "stars", label: stats.skillCount, sub: t("portfolio.stats-skill"), color: "bg-primary-fixed", iconColor: "text-primary" },
              ].map((s, i) => (
                <motion.div
                  key={s.icon}
                  className="bg-white rounded-2xl p-6 shadow-soft border border-outline-variant/30 hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.06 * i }}
                >
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center ${s.iconColor} mb-4`}>
                    <span className="material-symbols-outlined" aria-hidden="true">{s.icon}</span>
                  </div>
                  <p className="text-headline-md text-on-surface">{s.label}</p>
                  <p className="text-label-sm text-on-surface-variant">{s.sub}</p>
                </motion.div>
              ))}
            </motion.section>

            {/* CTA — konek ke profile */}
            <section className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-2xl ${profileData ? "text-green-600" : "text-primary"}`} aria-hidden="true">{profileData ? "check_circle" : "info"}</span>
                <p className="text-body-md text-on-surface-variant">{profileData ? t("portfolio.profile-filled") + " " + (stats.name !== "—" ? stats.name.toLowerCase() : t("portfolio.existing-data")) + "." : t("portfolio.profile-empty")}</p>
              </div>
              <Link
                href={profileData ? "/portfolio/build" : "/profile"}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 transition-opacity shadow-md whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">{profileData ? "edit" : "person"}</span>
                {profileData ? t("portfolio.create") : t("portfolio.complete-profile")}
              </Link>
            </section>

            {/* CTA — Generate & Deploy */}
            <section className="bg-gradient-to-br from-primary via-primary to-secondary rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>
              <div className="relative z-10">
                <span className="material-symbols-outlined text-5xl mb-4 opacity-80" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
                <h2 className="font-headline-md text-2xl mb-4">{t("portfolio.deploy-title")}</h2>
                <p className="font-body-md mb-8 opacity-90 max-w-lg mx-auto">{t("portfolio.deploy-desc")}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/portfolio/build"
                    className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-primary font-bold text-lg hover:shadow-xl hover:scale-105 transition-[transform,box-shadow]"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                    {t("portfolio.create-portfolio")}
                  </Link>
                  <Link
                    href={`/portfolio/preview?template=${selectedTheme}`}
                    className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white/20 text-white font-bold text-lg border-2 border-white/30 hover:bg-white/30 hover:scale-105 transition-[transform,background-color]"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">preview</span>
                    {t("portfolio.view-preview")}
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </main>
        <AppFooter bordered />
      </div>
    </AuthGuard>
  );
}
