"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminBtnSecondary } from "@/components/admin/ui";
import { adminNavLabel } from "@/lib/admin-nav";
import { useToast } from "@/components/ui/toast";

/**
 * Kerangka semua halaman /admin.
 *
 * Dulu setiap halaman mengulang header + tombol "Kembali ke Admin" dan
 * navigasi admin berdesakan di header. Sekarang sidebar persisten dipasang
 * sekali di `src/app/admin/layout.tsx`, dan pemeriksaan status admin juga
 * dijalankan sekali di sini alih-alih di setiap halaman.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const [access, setAccess] = useState<"checking" | "granted" | "denied">("checking");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me/role")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.isAdmin) {
          setAccess("granted");
          return;
        }
        setAccess("denied");
        addToast({ type: "error", message: "Halaman ini khusus admin." });
        router.replace("/dashboard");
      })
      .catch(() => {
        if (!active) return;
        setAccess("denied");
        router.replace("/dashboard");
      });
    return () => {
      active = false;
    };
  }, [router, addToast]);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader />

      {access === "checking" ? (
        <div className="flex min-h-[70vh] items-center justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary"
            role="status"
            aria-label="Memuat panel admin"
          />
        </div>
      ) : access === "denied" ? (
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="material-symbols-outlined text-[40px] text-error" aria-hidden="true">
            block
          </span>
          <p className="text-body-md text-on-surface-variant">
            Halaman ini khusus admin. Mengalihkan ke dashboard…
          </p>
        </div>
      ) : (
        // pt-16 memberi ruang untuk AppHeader yang posisinya fixed.
        <div className="pt-16">
          {/* Bar navigasi mobile: sidebar disembunyikan di layar kecil. */}
          <div className="sticky top-16 z-30 border-b border-outline-variant/50 bg-surface-container-lowest/95 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-margin-mobile py-2.5 md:px-gutter">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className={`${adminBtnSecondary} h-10 px-3`}
                aria-label="Buka menu admin"
                aria-expanded={menuOpen}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  menu
                </span>
                Menu
              </button>
              <span className="truncate text-label-bold text-on-surface-variant">{adminNavLabel(pathname)}</span>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-margin-mobile pb-16 pt-6 md:px-gutter lg:pt-8">
            <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
      )}
    </div>
  );
}
