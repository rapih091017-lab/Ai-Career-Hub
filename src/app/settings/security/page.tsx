"use client";

import { useTranslation } from "@/lib/i18n";
import { signOut } from "next-auth/react";

export default function SettingsSecurityPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8">
      {/* Section: Keamanan Akun */}
      <section className="bg-white rounded-2xl shadow-soft border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <div>
            <h2 className="font-headline-md text-lg text-on-surface">{t("security.title")}</h2>
            <p className="text-label-sm text-on-surface-variant">{t("security.subtitle")}</p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Login via Google — tidak ada password */}
          <div className="p-4 rounded-xl border border-outline-variant bg-background flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-label-bold text-sm text-on-surface">Google</p>
              <p className="text-label-sm text-on-surface-variant mt-0.5">
                Akun Anda masuk melalui Google. Keamanan login (verifikasi 2 langkah, dsb.)
                dikelola langsung oleh Google, Anda tidak perlu mengatur kata sandi di sini.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-label-sm font-bold shrink-0">
              {t("security.active")}
            </span>
          </div>

          {/* Keluar dari semua perangkat */}
          <div className="pt-4 border-t border-outline-variant/30">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 rounded-lg border border-error/30 text-error text-label-bold hover:bg-error/5 transition-colors"
            >
              {t("header.logout")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
