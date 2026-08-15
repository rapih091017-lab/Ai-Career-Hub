"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import LogoutConfirmModal from "@/components/ui/LogoutConfirmModal";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Resumes", href: "/dashboard" },
  { label: "Surat", href: "/surat-lamaran" },
  { label: "Templates", href: "/builder/new" },
  { label: "Resources", href: "/checker" },
];

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t, lang, toggleLang } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = () => {
    setIsDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : null;

  return (
    <>
      <LogoutConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
      />
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-sm border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter py-4 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-headline-md text-[18px] font-bold text-primary tracking-tight">
            AI Career Hub
          </span>
        </Link>

        {/* Desktop Nav — lg:flex agar 5 item (Dashboard, My Resumes, Surat, Templates, Resources)
         * tidak bertabrakan dengan menu user di layar md (768-1024px) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/builder/new" && pathname.startsWith("/builder")) ||
              (item.href === "/surat-lamaran" && pathname.startsWith("/surat-lamaran"));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`font-label-bold transition-colors ${
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 md:gap-6">

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              title={t("header.lang-toggle")}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
              aria-label={t("header.lang-toggle")}
            >
              <span className="material-symbols-outlined text-[16px]">translate</span>
              <span>{lang === "id" ? "EN" : "ID"}</span>
            </button>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 pl-4 border-l border-outline-variant/30 cursor-pointer group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-primary/20 ${
                    userInitial
                      ? "bg-primary text-white"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {userInitial ? (
                    <span className="font-bold text-sm">{userInitial}</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">account_circle</span>
                  )}
                </div>
                <span className="hidden md:block font-label-bold text-on-surface group-hover:text-primary transition-colors">
                  {session?.user?.name || "User"}
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-outline-variant/30 py-2 z-[100]">
                  {session?.user?.name && (
                    <p className="px-4 py-2 text-xs text-on-surface-variant border-b border-outline-variant/30 mb-1">
                      {session.user.email}
                    </p>
                  )}
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                    onClick={() => { setIsDropdownOpen(false); router.push("/dashboard"); }}
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">dashboard</span>
                    Dashboard
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                    onClick={() => { setIsDropdownOpen(false); router.push("/surat-lamaran"); }}
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">mail</span>
                    Surat & Motivation Letter
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                    onClick={() => { setIsDropdownOpen(false); router.push("/profile"); }}
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">person</span>
                    {t("header.profile")}
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                    onClick={() => { setIsDropdownOpen(false); router.push("/settings/profile"); }}
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">settings</span>
                    {t("header.settings")}
                  </button>
                  <div className="border-t border-outline-variant/30 my-1" />
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
                    onClick={handleSignOut}
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    {t("header.logout")}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-on-surface-variant hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav — with AnimatePresence */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-white border-t border-outline-variant/10"
          >
            <div className="px-margin-mobile py-4 space-y-3">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg font-label-bold transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <hr className="border-outline-variant/30 my-2" />
              <button
                onClick={() => { setIsMobileMenuOpen(false); toggleLang(); }}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-bold"
              >
                <span className="material-symbols-outlined text-lg">translate</span>
                {t("header.lang-full")}
              </button>
              <Link
                href="/settings/profile"
                className="block px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-bold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("header.settings")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}
