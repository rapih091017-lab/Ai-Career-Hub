"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/** Isi halaman 404. Komponen klien supaya teks ikut bahasa UI; metadata tetap di not-found.tsx (server). */
export default function NotFoundContent() {
  const { t } = useTranslation();
  return (
    <>
      <p className="text-base text-ink-soft">{t("nf.body")}</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-semibold hover:opacity-90 transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-lg">home</span>
        {t("login.back-home")}
      </Link>
    </>
  );
}
