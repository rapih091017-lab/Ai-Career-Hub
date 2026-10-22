"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
import { PortfolioDocument, EMPTY_FORM_DATA } from "@/components/portfolio/render/PortfolioDocument";
import type { PortfolioData, ThemeId } from "@/components/portfolio/types";

const THEME_LIST = Object.values(THEMES);

/** Data mini per kartu — hanya hero, cukup untuk thumbnail. */
function thumbnailData(first: string, last: string, headline: string, sub: string, bio: string): PortfolioData {
  return {
    formData: {
      ...EMPTY_FORM_DATA,
      heroFirstName: first,
      heroLastName: last,
      heroHeadline: headline,
      heroSubHeadline: sub,
      heroBio: bio,
      aboutText: "Sembilan tahun menyusun produk digital yang dipakai lintas tim.",
      aboutYearsExp: "9",
      aboutProjectsDone: "24",
      aboutClientsHappy: "18",
      skillsMain: "TypeScript, React, Node",
      skillsTools: "Figma, Playwright",
      contactEmail: "hello@example.com",
    },
    projects: [
      { id: "p1", name: "Portal Rekrutmen", description: "Pendaftaran untuk 40 kampus.", techStack: "Next.js, Postgres", link: "" },
      { id: "p2", name: "Dompet Bersama", description: "Rekonsiliasi pembayaran roommates.", techStack: "Node", link: "" },
      { id: "p3", name: "Peta Logistik", description: "Dashboard armada pengiriman.", techStack: "React", link: "" },
    ],
    experiences: [
      { id: "e1", company: "Studio Nusantara", position: "Lead Engineer", startDate: "2023", endDate: "2026", description: "Mengsatukan enam tim produk.", isPresent: true },
      { id: "e2", company: "Karya Digital", position: "Frontend Engineer", startDate: "2021", endDate: "2023", description: "Migrasi design system." },
      { id: "e3", company: "Freelance", position: "Developer", startDate: "2020", endDate: "2021", description: "Aplikasi internal." },
    ],
    educations: [
      { id: "ed1", institution: "Universitas Indonesia", degree: "S1", field: "Informatika", startDate: "2016", endDate: "2020" },
    ],
    certifications: [{ id: "c1", name: "AWS Solutions Architect", issuer: "Amazon", year: "2024" }],
    organizations: [{ id: "o1", name: "DevSquad", role: "Mentor komunitas", period: "2022-2025", description: "Kelas mingguan frontend." }],
    hobbies: [{ id: "h1", name: "Fotografi", description: "Jalan pagi perkotaan" }],
    testimonials: [{ id: "t1", name: "Rina", position: "Product Manager", testimonial: "Kerja paling rapi yang saya temui." }],
    extraLinks: [],
  };
}

const THEME_THUMBNAILS: Record<ThemeId, PortfolioData> = {
  glass: thumbnailData("Alex", "Morgan", "Full-Stack Developer", "Designing scalable digital ecosystems", "Antarmuka cepat dengan arsitektur modern."),
  brutal: thumbnailData("Riley", "K.", "Creative Developer & Motion Designer", "Breaking boundaries with code", "Eksperimen interaksi web dan gerak."),
  luxe: thumbnailData("Maya", "Chen", "UI/UX Designer & Brand Strategist", "Crafting human-centered experiences", "Masalah rumit jadi produk yang enak dipakai."),
  minimalist: thumbnailData("Nadia", "P.", "Product Engineer", "Small systems, clear thinking", "Perangkat lunak tenang untuk masalah yang ribut."),
  workbench: thumbnailData("Bagas", "Prakoso", "Product Designer", "Rapi di atas kertas, cepat di layar", "Menyusun alur produk dari sketsa sampai rilis."),
};

export default function PortfolioPage() {
  const { t, lang, toggleLang } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState<string>(DEFAULT_THEME_ID);
  const [publishInfo, setPublishInfo] = useState<{ published: boolean; slug?: string; url?: string; plan?: { entitled: boolean; trialUsed: boolean; trialAvailable: boolean; upgradeUrl: string } } | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setProfileData(data))
      .catch(() => {});
    fetch("/api/portfolio/publish")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setPublishInfo(data))
      .catch(() => {});
  }, []);

  const stats = {
    name: profileData?.personalInfo?.fullName || "-",
    workCount: Array.isArray(profileData?.workHistory) ? profileData.workHistory.length : "-",
    eduCount: Array.isArray(profileData?.education) ? profileData.education.length : "-",
    skillCount: Array.isArray(profileData?.skills) ? profileData.skills.length : "-",
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
                className="h-9 w-9 shrink-0 rounded-[10px] border-2 border-ink/30 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-lime/20"
                title={lang === "id" ? "Switch to English" : "Ganti ke Indonesia"}
              >
                {lang === "id" ? "EN" : "ID"}
              </button>
            </div>

            {/* Live URL + Quick Actions */}
            <div className="rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 min-w-0">
                  <label className="text-label-bold text-on-surface-variant block mb-1.5">{t("portfolio.url-label")}</label>
                  {publishInfo?.published ? (
                    <div className="flex min-w-0 items-center gap-2 rounded-xl border-2 border-green bg-lime/20 px-4 py-2.5">
                      <span className="material-symbols-outlined shrink-0 text-lg text-green-deep" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-green-deep">{t("portfolio.publish-status-live")}</p>
                        <button
                          onClick={() => window.open(publishInfo.url, "_blank")}
                          className="text-sm font-bold text-primary hover:underline truncate block max-w-full"
                          title={publishInfo.url}
                        >
                          {publishInfo.url?.replace(/^https?:\/\//, "")}
                        </button>
                        {publishInfo.plan && !publishInfo.plan.entitled && (
                          <a
                            href={publishInfo.plan.upgradeUrl || "/settings/billing?plan=portfolio-web"}
                            className="mt-0.5 block text-xs font-semibold text-brand-green underline-offset-2 hover:underline"
                          >
                            Trial 1x terpakai · perbarui konten butuh Portfolio Web &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border-2 border-ink/25 bg-desk px-4 py-2.5">
                      <span className="material-symbols-outlined text-outline text-lg shrink-0" aria-hidden="true">public</span>
                      <div>
                        <p className="text-sm text-on-surface-variant">{t("portfolio.publish-not-live")}</p>
                        {publishInfo?.plan?.trialAvailable && (
                          <p className="text-xs text-primary mt-0.5 font-medium">
                            Publish pertama GRATIS &middot; update berikutnya butuh paket Portfolio Web
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Link href="/portfolio/build" className="flex min-h-[44px] items-center gap-2 rounded-full border-[2.5px] border-ink bg-lime px-5 font-label-bold text-on-light shadow-[0_3px_0_rgb(var(--c-ink))] transition-all hover:-translate-y-0.5">
                    <span className="material-symbols-outlined text-lg">edit</span>
                    <span className="hidden sm:inline">Buat Portfolio</span>
                  </Link>
                  <Link href={`/portfolio/preview?template=${selectedTheme}`} className="flex min-h-[44px] items-center gap-2 rounded-full border-[2.5px] border-ink bg-paper px-5 font-label-bold text-ink transition-colors hover:bg-lime/15">
                    <span className="material-symbols-outlined text-lg">preview</span>
                    <span className="hidden sm:inline">Preview</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Templates / Theme Picker, real previews */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-headline-md text-on-surface mb-4">{t("portfolio.choose-theme")}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {THEME_LIST.map((theme, i) => {
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
                        className={`w-full overflow-hidden rounded-[18px] border-[2.5px] text-left transition-[transform,border-color,box-shadow] theme-card-hover active:scale-[0.98] ${
                          selectedTheme === theme.id
                            ? "border-brand-dark bg-lime/15 shadow-[4px_4px_0_rgb(var(--c-ink))]"
                            : "border-ink/25 bg-paper shadow-hard hover:border-ink"
                        }`}
                      >
                        {/* Thumbnail: render asli per tema — beda struktur, bukan beda warna.
                            Hero disembunyikan di sini: itu bagian paling seragam antar tema
                            (tinggi layar, fokus pada nama), sehingga crop 220px selalu
                            tampak sama. Yang代替-nya section About/Experience hasil re-compose. */}
                        <div
                          data-thumb-viewport=""
                          className="relative w-full overflow-hidden"
                          style={{ background: theme.colors.bg, height: 220 }}
                        >
                          <style>{`[data-thumb-viewport] [data-section-id="hero"] { display: none !important; }`}</style>
                          <div
                            data-thumb-scale=""
                            aria-hidden="true"
                            inert
                            className="absolute top-0 left-0 origin-top-left"
                            style={{ width: "calc(100% / 0.8)", transform: "scale(0.8)" }}
                          >
                            <PortfolioDocument
                              data={THEME_THUMBNAILS[theme.id as ThemeId]}
                              themeId={theme.id as ThemeId}
                              mode="static"
                            />
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                            <h3 className="font-label-bold text-on-surface text-sm">{theme.name}</h3>
                            {theme.id === DEFAULT_THEME_ID && (
                              <span className="ml-1 rounded-[6px] border border-ink bg-lime px-1.5 py-0.5 text-xs font-bold text-on-light">
                                {t("portfolio.theme.default-badge")}
                              </span>
                            )}
                          </div>
                          <p className="text-label-sm text-on-surface-variant">{t(`portfolio.theme.${theme.id}-desc`)}</p>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Stats, staggered card entry */}
            <motion.section
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              {[
                { icon: "badge", label: stats.name, sub: t("portfolio.stats-fullname"), color: "bg-lime", iconColor: "text-on-light" },
                { icon: "work", label: stats.workCount, sub: t("portfolio.stats-experience"), color: "bg-lime", iconColor: "text-on-light" },
                { icon: "school", label: stats.eduCount, sub: t("portfolio.stats-education"), color: "bg-lime", iconColor: "text-on-light" },
                { icon: "stars", label: stats.skillCount, sub: t("portfolio.stats-skill"), color: "bg-lime", iconColor: "text-on-light" },
              ].map((s, i) => (
                <motion.div
                  key={s.icon}
                  className="rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard transition-transform duration-200 hover:-translate-y-0.5"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.06 * i }}
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-ink ${s.color} ${s.iconColor}`}>
                    <span className="material-symbols-outlined" aria-hidden="true">{s.icon}</span>
                  </div>
                  <p className="text-headline-md text-on-surface">{s.label}</p>
                  <p className="text-label-sm text-on-surface-variant">{s.sub}</p>
                </motion.div>
              ))}
            </motion.section>

            {/* CTA, konek ke profile */}
            <section className="flex flex-col items-center justify-between gap-4 rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard md:flex-row">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-2xl ${profileData ? "text-green-deep" : "text-ink-soft"}`} aria-hidden="true">{profileData ? "check_circle" : "info"}</span>
                <p className="text-body-md text-on-surface-variant">{profileData ? t("portfolio.profile-filled") + " " + (stats.name !== "-" ? stats.name.toLowerCase() : t("portfolio.existing-data")) + "." : t("portfolio.profile-empty")}</p>
              </div>
              <Link
                href={profileData ? "/portfolio/build" : "/settings/profile"}
                className="flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-full border-[2.5px] border-ink bg-lime px-6 font-label-bold text-on-light shadow-[0_3px_0_rgb(var(--c-ink))] transition-all hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">{profileData ? "edit" : "person"}</span>
                {profileData ? t("portfolio.create") : t("portfolio.complete-profile")}
              </Link>
            </section>

            {/* CTA, Generate & Deploy */}
            <section className="relative overflow-hidden rounded-[18px] border-[2.5px] border-ink bg-evergreen p-8 md:p-12 text-on-dark text-center shadow-hard">
              <div className="absolute top-0 right-0 w-64 h-64 bg-lime/25 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-lime/15 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>
              <div className="relative z-10">
                <span className="material-symbols-outlined text-5xl mb-4 opacity-80" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
                <h2 className="font-display text-2xl mb-4 text-on-dark">{t("portfolio.deploy-title")}</h2>
                <p className="font-body-md mb-8 opacity-80 max-w-lg mx-auto text-on-dark">{t("portfolio.deploy-desc")}</p>
                {publishInfo?.published && (
                  <div className="mx-auto mb-8 flex max-w-md items-center gap-3 rounded-xl border border-on-dark/25 bg-on-dark/10 px-4 py-3">
                    <span className="material-symbols-outlined text-lime shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-dark/80">{t("portfolio.publish-link-share")}</p>
                      <a
                        href={publishInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-on-dark hover:underline truncate block"
                      >
                        {publishInfo.url?.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        if (publishInfo.url) {
                          navigator.clipboard?.writeText(publishInfo.url);
                          addToast({ type: "success", message: t("publish.copied") });
                        }
                      }}
                      className="ml-auto min-h-[40px] shrink-0 rounded-full border border-on-dark/30 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-on-dark/15"
                    >
                      {t("publish.copy")}
                    </button>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/portfolio/build"
                    className="inline-flex min-h-[54px] items-center justify-center gap-2 px-10 py-4 rounded-full border-[2.5px] border-ink bg-lime text-on-light font-bold text-lg shadow-[0_4px_0_rgb(var(--c-ink))] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                    {t("portfolio.create-portfolio")}
                  </Link>
                  <Link
                    href={`/portfolio/preview?template=${selectedTheme}`}
                    className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border-2 border-on-dark/30 px-10 py-4 text-lg font-bold text-on-dark transition-all hover:bg-on-dark/10 active:scale-[0.98]"
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
