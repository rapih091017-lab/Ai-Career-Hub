"use client";

/**
 * Navbar tunggal untuk seluruh situs.
 *
 * Dua bentuk dari satu komponen, sesuai permintaan: bentuk `pill` dipakai
 * landing dan halaman publik (nav melayang dengan sudut membulat), bentuk
 * `bar` dipakai halaman aplikasi (nav menempel penuh). Isi, urutan, dan
 * perilakunya identik — yang berbeda hanya bentuknya, supaya halaman publik
 * dan dashboard tidak terlihat seperti dua situs yang berbeda.
 *
 * Tinggi navigasi dikunci lewat token kelas di sini. Halaman memakai
 * `pt-24` untuk memberi ruang, jadi kalau tinggi ini berubah, isi seluruh
 * halaman ikut bergeser.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import LogoutConfirmModal from "@/components/ui/LogoutConfirmModal";
import { AdminMenuItem } from "@/components/AdminMenuItem";
import NavGroupMenu from "@/components/nav/NavGroupMenu";
import { ANNOUNCEMENT, LANDING_LINKS, NAV_GROUPS } from "@/lib/nav-items";

interface Props {
  /**
   * `pill` = nav melayang dengan sudut membulat (landing, halaman publik).
   * `bar`   = navtempel penuh selebar layar (dashboard, halaman aplikasi).
   */
  variant?: "pill" | "bar";
  /** Bar pengumuman di bawah nav, dipakai di halaman publik saja. */
  showAnnouncement?: boolean;
}

export default function SiteHeader({ variant = "bar", showAnnouncement = false }: Props) {
  const isPill = variant === "pill";
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const { t, lang, toggleLang } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const shell = isPill
    ? "fixed top-0 md:top-4 left-0 md:left-1/2 right-0 md:-translate-x-1/2 z-50 w-full md:w-[calc(100%-32px)] md:max-w-7xl bg-surface-container-lowest/85 backdrop-blur-lg border-b md:border md:rounded-2xl md:shadow-lg border-outline-variant/10"
    : "fixed top-0 left-0 right-0 z-50 w-full bg-surface-container-lowest border-b border-outline-variant/10 shadow-sm";

  return (
    <>
      <LogoutConfirmModal open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} />

      <header className={shell}>
        <div
          className={`mx-auto flex items-center justify-between gap-4 px-margin-mobile md:px-gutter ${
            isPill ? "py-3" : "py-4"
          }`}
        >
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                auto_awesome
              </span>
            </span>
            <span className="font-headline-md text-[18px] font-bold tracking-tight text-primary">
              AI Career Hub
            </span>
          </Link>

          <nav aria-label={t("nav.menu-label")} className="hidden lg:flex items-center gap-1">
            {NAV_GROUPS.map((group) => (
              <NavGroupMenu key={group.labelKey} group={group} isLoggedIn={isLoggedIn} variant="desktop" />
            ))}
            {LANDING_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 font-label-bold text-on-surface-variant transition-colors hover:text-primary"
              >
                {t(item.labelKey, item.label)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              title={t("header.lang-toggle")}
              aria-label={t("header.lang-toggle")}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                translate
              </span>
              {lang === "id" ? "EN" : "ID"}
            </button>

            {isLoggedIn ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-expanded={accountOpen}
                  aria-label={t("nav.akun-saya")}
                  className="flex cursor-pointer items-center gap-2 rounded-full pl-1 pr-2 transition-colors hover:bg-surface-container-low"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 ${
                      session?.user?.name
                        ? "bg-primary text-white"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {session?.user?.name ? (
                      <span className="text-sm font-bold">{session.user.name.charAt(0).toUpperCase()}</span>
                    ) : (
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">
                        account_circle
                      </span>
                    )}
                  </span>
                  <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">
                    expand_more
                  </span>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full z-[60] mt-2 w-56 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest py-2 shadow-xl">
                    {session?.user?.email && (
                      <p className="mb-1 border-b border-outline-variant/20 px-4 py-2 text-xs text-on-surface-variant">
                        {session.user.email}
                      </p>
                    )}
                    <AdminMenuItem onNavigate={() => setAccountOpen(false)} />
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error transition-colors hover:bg-error-container/30"
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">
                        logout
                      </span>
                      {t("header.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/#pricing"
                className="rounded-lg bg-primary px-4 py-2 font-label-bold text-on-primary transition-all hover:brightness-110 active:scale-95"
              >
                {t("nav.try-free")}
              </Link>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={t("nav.menu-label")}
              className="text-on-surface-variant transition-colors hover:text-primary lg:hidden"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-outline-variant/10 bg-surface-container-lowest lg:hidden"
            >
              <div className="max-h-[70vh] space-y-1 overflow-y-auto px-margin-mobile py-3">
                {NAV_GROUPS.map((group) => (
                  <NavGroupMenu key={group.labelKey} group={group} isLoggedIn={isLoggedIn} variant="mobile" />
                ))}
                <div className="space-y-1 pt-2">
                  {LANDING_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2.5 font-label-bold text-on-surface"
                    >
                      {t(item.labelKey, item.label)}
                    </Link>
                  ))}
                </div>
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 font-label-bold text-on-surface-variant"
                  >
                    {t("nav.login")}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {showAnnouncement && (
        <div className="fixed left-0 right-0 top-[72px] z-40 hidden md:block">
          <div className="mx-auto w-[calc(100%-32px)] max-w-7xl">
            <Link
              href={ANNOUNCEMENT.href}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                campaign
              </span>
              {t(ANNOUNCEMENT.textKey, ANNOUNCEMENT.text)}
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}