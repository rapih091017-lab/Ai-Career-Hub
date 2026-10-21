"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import { useTranslation } from "@/lib/i18n";

import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
import type { ThemeDefinition, PortfolioFormData, ProjectItem, ExperienceItem, EducationItem, CertificationItem, OrganizationItem, HobbyItem, TestimonialItem, ExtraLink, SectionId, SectionVisibility, FontSize, ThemeId } from "@/components/portfolio/types";
import PortfolioDocument from "@/components/portfolio/render/PortfolioDocument";
import { alignmentToSectionStyle } from "@/components/portfolio/alignment-style";

import "../print.css";

import PublishDialog from "@/components/portfolio/PublishDialog";
import { STATIC_REVEAL_FALLBACK_CSS } from "@/components/portfolio/render/PortfolioDocument";
import { readCache } from "@/lib/portfolio/usePortfolioDraft";
import ThemeFonts from "@/components/portfolio/render/ThemeFonts";

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
  alignment?: Record<string, "left" | "center" | "right">;
}

export default function PortfolioPreviewPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
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

  // Draft dibaca dari server (draftId di URL, atau draft terbaru). Cache lokal
  // hanya dipakai sebagai cadangan offline bila server tidak terjangkau.
  useEffect(() => {
    let alive = true;
    const query = new URLSearchParams(window.location.search);
    const requested = query.get("draftId");

    const applyFallback = (): boolean => {
      if (!requested) return false;
      const cached = readCache(requested);
      if (cached?.data) {
        setData(cached.data as unknown as PortfolioData);
        setDraftId(requested);
        setNotFound(false);
        return true;
      }
      return false;
    };

    (async () => {
      try {
        const url = requested
          ? `/api/portfolio/draft?draftId=${encodeURIComponent(requested)}`
          : "/api/portfolio/draft";
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.draftId && json?.data) {
            if (!alive) return;
            setData(json.data as unknown as PortfolioData);
            setDraftId(json.draftId);
            setNotFound(false);
            return;
          }
        }
        if (!alive) return;
        if (!applyFallback()) setNotFound(true);
      } catch {
        if (!alive) return;
        if (!applyFallback()) setNotFound(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /**
   * Unduh PDF portfolio.
   *
   * Dulu tombol ini memanggil `window.print()`, jadi yang muncul adalah dialog
   * cetak Windows, bukan file PDF. Sekarang HTML portfolio yang sama dikirim
   * ke server PDF dan hasilnya diunduh langsung.
   */
  const downloadPdf = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const resLatest = await fetch("/api/portfolio/draft").catch(() => null);
      const latest = resLatest && resLatest.ok ? await resLatest.json() : null;
      const sync = await fetch("/api/portfolio/draft", {
        method: latest?.draftId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(latest?.draftId ? { draftId: latest.draftId } : {}),
          name: name || "Portfolio saya",
          data,
        }),
      }).catch(() => null);
      if (!sync || !sync.ok) {
        setExportError(
          sync?.status === 400 ? t("preview.export-error-save") : t("preview.export-error"),
        );
        return;
      }
      const syncDraftId: string = latest?.draftId ?? (await sync.json()).draftId;
      const htmlRes = await fetch(
        `/api/portfolio/export?draftId=${encodeURIComponent(syncDraftId)}&theme=${encodeURIComponent(themeId)}`,
      );
      if (!htmlRes.ok) throw new Error();
      const html = await htmlRes.text();

      const pdfRes = await fetch("/api/export-pdf-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, margin: "12mm", fileName: "portfolio.pdf" }),
      });
      if (!pdfRes.ok) {
        const err = await pdfRes.json().catch(() => null);
        throw new Error(err?.message || t("preview.pdf-error"));
      }
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "portfolio"}`.toLowerCase().replace(/[^a-z0-9.-]+/g, "-") + ".pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(t("preview.pdf-error"));
    } finally {
      setExporting(false);
    }
  };

  if (notFound) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background text-on-background">
          <AppHeader />
          <main className="pt-32 px-6 flex flex-col items-center justify-center text-center gap-6">
            <span className="material-symbols-outlined text-6xl text-outline">description</span>
            <h1 className="font-headline-md text-on-surface">{t("preview.no-draft-title")}</h1>
            <p className="text-body-md text-on-surface-variant max-w-md">{t("preview.no-draft-desc")}</p>
            <Link href="/portfolio/build" className="bg-primary text-on-primary font-label-bold rounded-xl px-8 py-3 hover:-translate-y-0.5 transition-all shadow-md">
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
  const sectionStyle = alignmentToSectionStyle(data.alignment);

  if (printMode) {
    // Tampilan cetak: dokumen polos tanpa chrome builder. Pengguna menyelesaikan
    // lewat dialog cetak browser (Ctrl+P → Simpan sebagai PDF).
    return (
      <div data-pf-print="true" className="min-h-screen" style={{ backgroundColor: theme.colors.bg }}>
        <ThemeFonts themeId={themeId} />
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
          sectionStyle={sectionStyle}
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
      <ThemeFonts themeId={themeId} />
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
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: themeId === tid ? theme.colors.primary : "transparent",
                          color: themeId === tid ? "#fff" : theme.colors.textMuted,
                        }}
                      >
                        {THEMES[tid].name}
                      </button>
                    ))}
                  </div>
                  <Link href={draftId ? `/portfolio/build/${draftId}` : "/portfolio/build"} className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}>
                    {t("preview.edit")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => downloadPdf()}
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
                        // Ekspor dibaca dari draft server, jadi data preview
                        // disinkronkan dulu supaya hasil file == yang dilihat.
                        const resLatest = await fetch("/api/portfolio/draft").catch(() => null);
                        const latest =
                          resLatest && resLatest.ok ? await resLatest.json() : null;
                        const sync = await fetch("/api/portfolio/draft", {
                          method: latest?.draftId ? "PATCH" : "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            ...(latest?.draftId ? { draftId: latest.draftId } : {}),
                            name: name || "Portfolio saya",
                            data,
                          }),
                        }).catch(() => null);
                        if (!sync || !sync.ok) {
                          setExportError(
                            sync?.status === 400
                              ? t("preview.export-error-save")
                              : t("preview.export-error"),
                          );
                          return;
                        }
                        const draftId: string = latest?.draftId ?? (await sync.json()).draftId;
                        const res = await fetch(
                          `/api/portfolio/export?draftId=${encodeURIComponent(draftId)}&theme=${encodeURIComponent(themeId)}`,
                        );
                        if (!res.ok) throw new Error();
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${name || "portfolio"}.html`.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        setExportError(t("preview.export-error"));
                      } finally {
                        setExporting(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}
                  >
                    {exporting ? t("preview.exporting") : t("preview.export-html")}
                  </button>
                </div>
                {exportError ? (
                  <p
                    role="alert"
                    className="mt-3 w-full text-xs font-medium"
                    style={{ color: "#D32F2F" }}
                  >
                    {exportError}
                  </p>
                ) : null}
              </div>

              {/* Document */}
              <PortfolioDocument
                data={data}
                themeId={themeId as ThemeId}
                mode="editor"
                sectionOrder={data.sectionOrder}
                sectionVisibility={data.sectionVisibility}
                fontSize={data.fontSize}
                sectionStyle={sectionStyle}
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
