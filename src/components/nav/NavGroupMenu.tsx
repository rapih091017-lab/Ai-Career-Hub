"use client";

/**
 * Dropdown grup navigasi, dipakai navbar publik maupun navbar aplikasi.
 *
 * Desktop: tombol grup membuka panel berisi item-nya. Mobile: grup jadi
 * accordion di dalam menu. Perilaku ini sengaja dipisah dari komponen header
 * supaya dua versi navbar hanya berbeda pada bentuknya, bukan cara navigasinya.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { isNavActive, type NavGroup, type NavItem } from "@/lib/nav-items";

function itemHref(item: NavItem, isLoggedIn: boolean): string {
  // Tamu yang menekan item bertanda butuh sesi diarahkan ke login sambil
  // membawa tujuannya, supaya tidak kehilangan tempat yang mau dibuka.
  if (item.requiresAuth && !isLoggedIn) {
    return `/login?next=${encodeURIComponent(item.href)}`;
  }
  return item.href;
}

interface Props {
  group: NavGroup;
  isLoggedIn: boolean;
  /** Tablet/layar kecil: tombol group disembunyikan, isi jadi accordion. */
  variant: "desktop" | "mobile";
}

export default function NavGroupMenu({ group, isLoggedIn, variant }: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const groupActive = group.items.some((item) => isNavActive(item, pathname));

  useEffect(() => {
    if (variant !== "desktop" || !open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, variant]);

  // Kalau halaman berpindah lewat klik di dalam menu, panel ikut menutup.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const label = t(group.labelKey);

  if (variant === "mobile") {
    return (
      <div className="border-b border-hairline pb-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-label-bold transition-colors ${
            groupActive ? "text-green-deep" : "text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            {group.icon}
          </span>
          {label}
          <span className="material-symbols-outlined ml-auto text-lg" aria-hidden="true">
            {open ? "expand_less" : "expand_more"}
          </span>
        </button>
        {open && (
          <ul className="mt-1 space-y-1 pl-4">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={itemHref(item, isLoggedIn)}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-on-surface-variant hover:bg-lime/15 hover:text-ink"
                >
                  {t(item.labelKey, item.label)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 rounded-lg px-3 py-2 font-label-bold transition-colors ${
          groupActive || open
            ? "bg-lime/25 text-primary"
            : "text-on-surface-variant hover:text-green-deep"
        }`}
      >
        {label}
        <span className="material-symbols-outlined text-lg" aria-hidden="true">
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] min-w-[232px] rounded-[14px] border-2 border-ink bg-paper py-2 shadow-hard-sm">
          {group.items.map((item) => {
            const active = isNavActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={itemHref(item, isLoggedIn)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-lime/25 font-label-bold text-ink"
                    : "text-on-surface hover:bg-lime/15 hover:text-ink"
                }`}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                {t(item.labelKey, item.label)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}