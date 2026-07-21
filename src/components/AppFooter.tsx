"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface AppFooterProps {
  variant?: "simple" | "full";
  bordered?: boolean;
}

export default function AppFooter({ variant = "simple", bordered = false }: AppFooterProps) {
  const { t } = useTranslation();
  if (variant === "full") {
    return (
      <footer className="bg-inverse-surface py-20 px-margin-mobile md:px-gutter">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <span className="font-headline-md text-[20px] font-bold text-primary">AI Career Hub</span>
              </div>
              <p className="text-body-md text-surface-variant/80">{t("footer.desc")}</p>
            </div>
            <div>
              <h4 className="font-label-bold text-white mb-6">{t("footer.produk")}</h4>
              <ul className="space-y-4">
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/builder/new">{t("footer.cv-builder")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/checker">{t("footer.resume-checker")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/portfolio">{t("footer.portfolio")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/interview">{t("footer.career-path")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-label-bold text-white mb-6">{t("footer.perusahaan")}</h4>
              <ul className="space-y-4">
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/about">{t("footer.tentang")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/karir">{t("footer.karir")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/blog">{t("footer.blog")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/contact">{t("footer.kontak")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-label-bold text-white mb-6">{t("footer.bantuan")}</h4>
              <ul className="space-y-4">
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/faq">{t("footer.faq")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/contact">{t("footer.pusat-bantuan")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/privacy">{t("footer.privasi")}</Link></li>
                <li><Link className="text-surface-variant/70 hover:text-primary transition-colors" href="/terms">{t("footer.syarat")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-label-sm text-surface-variant/60">{t("footer.copyright")}</p>
            <div className="flex gap-6">
              <Link className="text-surface-variant/60 hover:text-primary transition-all" href="/contact"><span className="material-symbols-outlined">public</span></Link>
              <a className="text-surface-variant/60 hover:text-primary transition-all" href="mailto:support@aicareerhub.com"><span className="material-symbols-outlined">alternate_email</span></a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`flex flex-col items-center gap-4 w-full max-w-[600px] mx-auto px-5 md:px-10 py-12 text-sm ${
        bordered ? "bg-background mt-12 border-t border-outline-variant/30" : ""
      }`}
    >
      <div className="text-primary font-bold font-headline-md text-lg">AI Career Hub</div>
      <div className="flex flex-wrap justify-center gap-6 text-on-surface-variant">
        <Link className="hover:text-primary transition-colors" href="/about">{t("footer.tentang-simple")}</Link>
        <Link className="hover:text-primary transition-colors" href="/privacy">{t("footer.privasi-simple")}</Link>
        <Link className="hover:text-primary transition-colors" href="/terms">{t("footer.syarat-simple")}</Link>
      </div>
      <p className="text-on-surface-variant text-center" dangerouslySetInnerHTML={{ __html: t("footer.copyright-simple") }} />
    </footer>
  );
}
