"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

/**
 * Item menu "Panel Admin" yang hanya dirender untuk akun admin.
 * Memanggil /api/me/role sekali; endpoint admin tetap punya guard sendiri,
 * jadi ini murni kontrol tampilan.
 */
export function AdminMenuItem({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me/role")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <button
      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
      onClick={() => {
        onNavigate?.();
        router.push("/admin");
      }}
    >
      <span className="material-symbols-outlined text-lg text-on-surface-variant">shield_person</span>
      {t("header.admin")}
    </button>
  );
}
