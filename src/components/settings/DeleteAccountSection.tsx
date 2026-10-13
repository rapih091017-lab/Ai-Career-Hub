"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";

/**
 * Zona berbahaya: hapus akun beserta seluruh datanya.
 *
 * Janji ini sudah tertulis di halaman Privacy dan FAQ, jadi harus bisa
 * dijalankan orangnya. Penghapusan permanen, jadi pengguna diminta mengetik
 * kata konfirmasi dulu — tidak ada tombol yang bisa salah klik.
 */
export function DeleteAccountSection() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === "HAPUS";

  const handleDelete = async () => {
    if (!canDelete || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || t("account.delete-failed"));
      // Keluar dulu supaya cookie sesi tidak menunjuk akun yang sudah hilang.
      await signOut({ callbackUrl: "/" });
      addToast({ type: "success", message: t("account.delete-done") });
      router.push("/");
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : t("account.delete-failed"),
      });
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-error/30 bg-error-container/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-label-bold text-on-surface">{t("account.delete-title")}</h2>
          <p className="text-sm text-on-surface-variant mt-1">{t("account.delete-desc")}</p>
        </div>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 items-center rounded-xl border border-error/50 px-4 text-sm font-bold text-error hover:bg-error/10"
          >
            {t("account.delete-open")}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-4 space-y-3 border-t border-error/20 pt-4">
          <p className="text-sm text-on-surface-variant">{t("account.delete-warning")}</p>
          <label className="block text-sm text-on-surface">
            <span className="mb-1 block">{t("account.delete-confirm-label")}</span>
            <input
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={t("account.delete-confirm-placeholder")}
              className="w-full max-w-xs rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-on-surface focus:border-error focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || busy}
              className="inline-flex min-h-11 items-center rounded-xl bg-error px-4 text-sm font-bold text-on-error disabled:opacity-50"
            >
              {busy ? t("account.delete-working") : t("account.delete-confirm")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
              }}
              className="inline-flex min-h-11 items-center rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:bg-surface-container"
            >
              {t("account.delete-cancel")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}