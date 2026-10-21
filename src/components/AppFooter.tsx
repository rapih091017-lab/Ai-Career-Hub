"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface AppFooterProps {
  variant?: "simple" | "full";
  bordered?: boolean;
}

/** Cache modul: diambil sekali per sesi browser, dipakai semua instance footer. */
let publicSettingsCache: Record<string, string> | null = null;

/**
 * Saklar animasi. Selain prefers-reduced-motion di level sistem, pengguna
 * juga bisa mematikan animasi lewat tombol ini. Statusnya disimpan di
 * localStorage supaya pilihan bertahan setelah reload.
 */
function MotionToggle() {
  const { t } = useTranslation();
  const [motionOff, setMotionOff] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("motion") === "off";
    setMotionOff(saved);
    document.documentElement.dataset.motion = saved ? "off" : "on";
  }, []);

  const toggle = () => {
    const next = !motionOff;
    setMotionOff(next);
    localStorage.setItem("motion", next ? "off" : "on");
    document.documentElement.dataset.motion = next ? "off" : "on";
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={motionOff}
      className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-on-dark/25 px-3 text-[12px] font-bold text-on-dark/70 transition-colors hover:border-lime hover:text-lime"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
        {motionOff ? "motion_plays" : "motion_photos_off"}
      </span>
      {motionOff ? t("footer.motion-on") : t("footer.motion-off")}
    </button>
  );
}

export default function AppFooter({ variant = "simple", bordered = false }: AppFooterProps) {
  const { t, lang } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string> | null>(publicSettingsCache);

  useEffect(() => {
    if (publicSettingsCache) return;
    let cancelled = false;
    fetch("/api/site-settings")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data?.settings) return;
        publicSettingsCache = data.settings;
        setSettings(data.settings);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const contactEmail = settings?.contact_email || "support@aicareerhub.com";
  if (variant === "full") {
    return (
      <footer className="border-t-[2.5px] border-lime/30 bg-footer py-16 px-margin-mobile md:px-gutter md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-[7px] border-2 border-ink bg-lime flex items-center justify-center text-on-light">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <span className="font-display text-[20px] font-bold tracking-[-0.02em] text-on-dark">AI Career Hub</span>
              </div>
              <p className="text-body-md text-on-dark/80">{t("footer.desc")}</p>
            </div>
            <div>
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-on-dark/70 mb-5">{t("footer.produk")}</h4>
              <ul className="space-y-3">
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/builder/new">{t("footer.cv-builder")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/checker">{t("footer.resume-checker")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/portfolio">{t("footer.portfolio")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/interview">{t("footer.interview")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/sinonim">{t("footer.sinonim")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href={lang === "en" ? "/cv-examples" : "/contoh-cv"}>{t("footer.contoh-cv")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/career-hub">{t("footer.career-hub")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/career-path">{t("footer.career-paths")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-on-dark/70 mb-5">{t("footer.perusahaan")}</h4>
              <ul className="space-y-3">
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/about">{t("footer.tentang")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/karir">{t("footer.karir")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/affiliate">{t("footer.affiliate")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/contact">{t("footer.kontak")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-on-dark/70 mb-5">{t("footer.bantuan")}</h4>
              <ul className="space-y-3">
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/faq">{t("footer.faq")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/contact">{t("footer.pusat-bantuan")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/privacy">{t("footer.privasi")}</Link></li>
                <li><Link className="text-on-dark/85 hover:text-lime transition-colors" href="/terms">{t("footer.syarat")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-on-dark/15 flex flex-col md:flex-row justify-between items-center gap-5">
            <p className="text-label-sm text-on-dark/70">{t("footer.copyright")}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <MotionToggle />
              <div className="flex gap-5">
                <Link className="text-on-dark/70 hover:text-lime transition-colors" href="/contact" aria-label="Website"><span className="material-symbols-outlined">public</span></Link>
                <a className="text-on-dark/70 hover:text-lime transition-colors" href={`mailto:${contactEmail}`} aria-label="Email"><span className="material-symbols-outlined">alternate_email</span></a>
                {settings?.social_instagram ? (
                  <a className="text-on-dark/70 hover:text-lime transition-colors" href={settings.social_instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span className="material-symbols-outlined">photo_camera</span></a>
                ) : null}
                {settings?.social_linkedin ? (
                  <a className="text-on-dark/70 hover:text-lime transition-colors" href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><span className="material-symbols-outlined">work</span></a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`flex flex-col items-center gap-4 w-full max-w-[600px] mx-auto px-5 md:px-10 py-12 pb-24 md:pb-12 text-sm ${
        bordered ? "bg-background mt-12 border-t border-outline-variant/50" : ""
      }`}
    >
      <div className="text-green-deep font-bold font-display text-lg">AI Career Hub</div>
      <div className="flex flex-wrap justify-center gap-6 text-on-surface-variant">
        <Link className="hover:text-green-deep transition-colors" href="/about">{t("footer.tentang-simple")}</Link>
        <Link className="hover:text-green-deep transition-colors" href="/privacy">{t("footer.privasi-simple")}</Link>
        <Link className="hover:text-green-deep transition-colors" href="/terms">{t("footer.syarat-simple")}</Link>
      </div>
      <p className="text-on-surface-variant text-center" dangerouslySetInnerHTML={{ __html: t("footer.copyright-simple") }} />
    </footer>
  );
}
