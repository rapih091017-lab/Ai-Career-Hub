"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { AdminMenuItem } from "@/components/AdminMenuItem";

type MenuItem = {
  key: string;
  icon: string;
  label: string;
  href: string;
};

/**
 * Menu akun untuk halaman landing.
 *
 * Landing dan dashboard harus memberi affordance yang sama: di dashboard, klik
 * avatar membuka daftar pilihan. Kalau landing cuma melempar ke dashboard, orang
 * merasa memakai aplikasi yang berbeda.
 */
export function AccountMenu() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Klik di luar atau tekan Escape menutup menu, seperti dropdown biasa.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted) {
    return <div className="w-11 h-11 rounded-full bg-surface-container-high animate-pulse" />;
  }
  if (!session) return null;

  const name = session.user?.name || "Pengguna";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  const items: MenuItem[] = [
    { key: "dashboard", icon: "dashboard", label: t("nav.dashboard"), href: "/dashboard" },
    { key: "profile", icon: "person", label: t("nav.profile"), href: "/settings/profile" },
    { key: "settings", icon: "settings", label: t("header.settings"), href: "/settings/security" },
    { key: "affiliate", icon: "redeem", label: t("header.affiliate"), href: "/affiliate" },
  ];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={name}
        className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="font-bold text-sm">{initial}</span>
        <span className="sr-only">{name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 py-2 z-[100]"
        >
          <p className="px-4 py-2 text-xs text-on-surface-variant border-b border-outline-variant/30 mb-1 truncate">
            {session.user?.email || name}
          </p>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={() => go(item.href)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-on-surface-variant">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <AdminMenuItem onNavigate={() => setOpen(false)} />
          <div className="border-t border-outline-variant/30 my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            {t("header.logout")}
          </button>
        </div>
      )}
    </div>
  );
}