"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { adminBtnSecondary, adminIconButton } from "./ui";

interface AdminSidebarProps {
  /** Drawer mobile terbuka? State dipegang AdminShell agar bar mobile bisa memicunya. */
  open: boolean;
  onClose: () => void;
}

/**
 * Navigasi panel admin.
 *
 * Desktop: panel sticky berisi semua menu (dulu menu ini berupa deretan
 * tombol di header yang berdesakan dan membungkus di layar kecil).
 * Mobile: drawer geser dari kiri dengan backdrop, fokus kembali ke tombol
 * menu saat ditutup, dan tombol Escape untuk menutup.
 */
export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  // Saat drawer terbuka: kunci scroll halaman dan sediakan jalan keluar lewat Escape.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const email = session?.user?.email ?? session?.user?.name ?? "Admin";

  const nav = (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
      <div className="flex items-center gap-2.5 px-2 pt-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-error/10">
          <span
            className="material-symbols-outlined text-[20px] text-error"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            admin_panel_settings
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate font-headline-md text-[16px] leading-tight text-on-surface">Admin Panel</p>
          <p className="truncate text-label-sm text-on-surface-variant">AI Career Hub</p>
        </div>
      </div>

      <nav aria-label="Navigasi panel admin" className="flex flex-col gap-5">
        {ADMIN_NAV.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant/70">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.hint}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-label-bold transition-colors duration-200 ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {active ? (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-outline-variant/50 pt-4">
        <div className="px-1">
          <p className="text-label-sm text-on-surface-variant">Masuk sebagai</p>
          <p className="truncate text-label-bold text-on-surface" title={email}>
            {email}
          </p>
        </div>
        <Link href="/" className={`${adminBtnSecondary} w-full`}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            open_in_new
          </span>
          Lihat situs
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: panel tetap.
           Tinggi dibatasi 100vh - 9rem: 5rem offset sticky + 4rem padding bawah
           pembungkus. Tanpa batas ini, panel terdesak ke atas di akhir halaman
           dan bagian atasnya tertutup AppHeader yang fixed. */}
      <aside className="sticky top-20 hidden max-h-[calc(100vh-9rem)] w-64 shrink-0 overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-soft lg:flex lg:flex-col">
        {nav}
      </aside>

      {/* Mobile: drawer */}
      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu panel admin"
            className="absolute left-0 top-0 flex h-full w-[85%] max-w-xs flex-col bg-surface-container-lowest shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/50 px-4 py-3">
              <p className="text-label-bold text-on-surface">Menu Admin</p>
              <button type="button" onClick={onClose} className={adminIconButton} aria-label="Tutup menu">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}
    </>
  );
}
