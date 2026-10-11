"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import { useTranslation } from "@/lib/i18n";

import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
import type { ThemeDefinition, PortfolioFormData, ProjectItem, ExperienceItem, EducationItem, CertificationItem, OrganizationItem, HobbyItem, TestimonialItem, ExtraLink, SectionId, SectionVisibility, FontSize, ThemeId } from "@/components/portfolio/types";
import PortfolioDocument from "@/components/portfolio/render/PortfolioDocument";

import "../print.css";

import PublishDialog from "@/components/portfolio/PublishDialog";
import { STATIC_REVEAL_FALLBACK_CSS } from "@/components/portfolio/render/PortfolioDocument";

interface PortfolioData {
  formData: PortfolioFormData;
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
  organizations: OrganizationItem[];
  hobbies: HobbyItem[];
  testimonials: TestimonialItem[];
  extraLinks: ExtraLink[];
  sectionOrder?: SectionId[];
  sectionVisibility?: SectionVisibility;
  fontSize?: FontSize;
}

export default function PortfolioPreviewPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [showPublish, setShowPublish] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("template");
    if (t && THEMES[t]) {
      setThemeId(t);
    }
    if (params.get("print") === "1") {
      setPrintMode(true);
    }
  }, []);

  // Status publish dipakai tombol Simpan PDF: kalau sudah live, cetak dari
  // URL publik (?print=1), kalau belum, cetak dari preview ini.
  useEffect(() => {
    let alive = true;
    fetch("/api/portfolio/publish")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (alive && body?.published && typeof body.slug === "string") {
          setPublishedSlug(body.slug);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      // Draft lengkap builder (urutan, visibilitas, ukuran font) ada di
      // portfolio_live_data; portfolio_draft hanya data isi.
      const raw =
        localStorage.getItem("portfolio_live_data") ??
        localStorage.getItem("portfolio_draft");
      if (raw) {
        const parsed: PortfolioData = JSON.parse(raw);
        setData(parsed);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
  }, []);

  if (notFound) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background text-on-background">
          <AppHeader />
          <main className="pt-32 px-6 flex flex-col items-center justify-center text-center gap-6">
            <span className="material-symbols-outlined text-6xl text-outline">description</span>
            <h1 className="font-headline-md text-on-surface">{t("preview.no-draft-title")}</h1>
            <p className="text-body-md text-on-surface-variant max-w-md">{t("preview.no-draft-desc")}</p>
            <Link href="/portfolio/live" className="bg-primary text-on-primary font-label-bold rounded-xl px-8 py-3 hover:brightness-110 transition-all shadow-md">
              {t("preview.open-builder")}
            </Link>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!data) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
        </div>
      </AuthGuard>
    );
  }

  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const name = [data.formData.heroFirstName, data.formData.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap";

  if (printMode) {
    // Tampilan cetak: dokumen polos tanpa chrome builder. Pengguna menyelesaikan
    // lewat dialog cetak browser (Ctrl+P → Simpan sebagai PDF).
    return (
      <div data-pf-print="true" className="min-h-screen" style={{ backgroundColor: theme.colors.bg }}>
        {/* @page tidak bisa di-scope selector; dirender di sini (bukan
            print.css yang di-share lintas rute) agar tak bocor ke app lain. */}
        <style media="print">{`@page { size: A4; margin: 12mm; } ${STATIC_REVEAL_FALLBACK_CSS}`}</style>
        <PortfolioDocument
          data={data}
          themeId={themeId as ThemeId}
          mode="static"
          sectionOrder={data.sectionOrder}
          sectionVisibility={data.sectionVisibility}
          fontSize={data.fontSize}
          sectionColors={null}
        />
        <button
          type="button"
          onClick={() => window.print()}
          className="pf-chrome fixed bottom-6 right-6 z-50 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
          style={{ backgroundColor: theme.colors.primary, color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">print</span>
          {t("preview.print-save-pdf")}
        </button>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div
          className="min-h-screen"
          style={{
            backgroundColor: theme.colors.bg,
            color: theme.colors.text,
            fontFamily: theme.font.includes(" ") ? `'${theme.font}', sans-serif` : `${theme.font}, sans-serif`,
          }}
        >
          <AppHeader />
          <main className="pt-20 pb-16 px-4 md:px-6">
            <div className="mx-auto" style={{ maxWidth: 1140 }}>
              {/* Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h1 className="font-headline-md" style={{ color: theme.colors.text }}>{t("preview.title")}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Theme Switcher */}
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: theme.colors.bgSecondary, border: `1px solid ${theme.colors.border}` }}>
                    {Object.keys(THEMES).map((tid) => (
                      <button
                        key={tid}
                        onClick={() => setThemeId(tid)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          backgroundColor: themeId === tid ? theme.colors.primary : "transparent",
                          color: themeId === tid ? "#fff" : theme.colors.textMuted,
                        }}
                      >
                        {THEMES[tid].name}
                      </button>
                    ))}
                  </div>
                  <Link href="/portfolio/live" className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}>
                    {t("preview.edit")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const target = publishedSlug
                        ? `/p/${publishedSlug}?print=1`
                        : "/portfolio/preview?print=1";
                      window.open(target, "_blank", "noopener");
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all"
                    style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}
                    title={t("preview.save-pdf")}
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">picture_as_pdf</span>
                    {t("preview.save-pdf")}
                  </button>
                  <button
                    onClick={() => setShowPublish(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ backgroundColor: theme.colors.primary, color: "#fff" }}
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">rocket_launch</span>
                    {t("portfolio.publish-btn")}
                  </button>
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={async () => {
                      setExporting(true);
                      setExportError(null);
                      try {
                        const params = new URLSearchParams(window.location.search);
                        const draftId = params.get("draftId") || localStorage.getItem("portfolio_draft_id") || "";
                        const res = await fetch(`/api/portfolio/export?draftId=${draftId}&theme=${themeId}`);
                        if (!res.ok) throw new Error();
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${name || "portfolio"}.html`.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        setExportError("Export gagal. Coba lagi sebentar.");
                      } finally {
                        setExporting(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}
                  >
                    {exporting ? t("preview.exporting") || "Exporting..." : t("preview.export-html")}
                  </button>
                </div>
              </div>

              {/* Document */}
              <PortfolioDocument
                data={data}
                themeId={themeId as ThemeId}
                mode="editor"
                sectionOrder={data.sectionOrder}
                sectionVisibility={data.sectionVisibility}
                fontSize={data.fontSize}
              />

              {/* Info */}
              <div className="px-6 mt-4">
                <div style={{ padding: 14, borderRadius: 12, background: `${theme.colors.primary}0D`, border: `1px solid ${theme.colors.primary}1A`, fontSize: 13, color: theme.colors.textMuted, textAlign: "center" }}>
                  {t("preview.template")}: <strong style={{ color: theme.colors.primary }}>{theme.name}</strong> &middot; Font: {theme.font}
                </div>
              </div>
            </div>
          </main>
          <footer className="text-center py-8" style={{ color: theme.colors.textMuted, borderTop: `1px solid ${theme.colors.border}`, fontSize: 13 }}>
            &copy; {new Date().getFullYear()}. Dibuat dengan AI Career Hub
          </footer>
        </div>

      {/* Publish dialog */}
      <PublishDialog open={showPublish} onClose={() => setShowPublish(false)} data={data} themeId={themeId} />
    </AuthGuard>
  );
}
