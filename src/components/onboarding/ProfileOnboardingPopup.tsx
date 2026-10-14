"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import Modal from "@/components/Modal";

type OnboardingAction = "linkedin" | "upload" | "skip";

/**
 * Langkah pertama setelah login: isi profil.
 *
 * Hanya muncul untuk pengguna baru. Penandainya disimpan di server
 * (`users.onboarding_completed_at`), jadi tidak muncul lagi di browser lain
 * dan tidak muncul lagi setelah profil diisi.
 *
 * Opsi yang ditawarkan adalah yang benar-benar bekerja hari ini: menyalin
 * teks profil LinkedIn sendiri, atau mengunggah berkas CV. Membaca tautan
 * LinkedIn secara otomatis tidak bisa dilakukan karena LinkedIn memblokir
 * akses otomatis — jadi tidak ditawarkan sebagai janji yang tidak bisa
 * ditepati.
 */
export function ProfileOnboardingPopup({
  onStartImport,
  onFinishImport,
}: {
  /** Membuka modal impor profil yang sudah ada (tempel teks / unggah berkas). */
  onStartImport: () => void;
  /** Dipanggil setelah profil berhasil diisi lewat modal impor. */
  onFinishImport?: () => void;
}) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<OnboardingAction | null>(null);
  const [checked, setChecked] = useState(false);

  // Cek status satu kali setelah sesi siap. Default tersembunyi supaya
  // pengguna lama tidak pernah melihatnya bahkan sesaat.
  useEffect(() => {
    if (!session?.user?.id) return;
    let alive = true;
    fetch("/api/onboarding/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { isNewUser?: boolean } | null) => {
        if (!alive || !data) return;
        if (data.isNewUser) setOpen(true);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setChecked(true);
      });
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  const markDone = useCallback(async () => {
    await fetch("/api/onboarding/profile", { method: "POST" }).catch(() => {});
  }, []);

  const handleAction = async (action: OnboardingAction) => {
    if (busy) return;
    setBusy(action);

    if (action === "skip") {
      await markDone();
      setOpen(false);
      return;
    }

    // Tandai selesai sekarang: kalau popup ditutup tanpa mengisi, tidak
    // perlu muncul lagi. Import tetap berjalan di modal berikutnya.
    await markDone();
    setOpen(false);
    onStartImport();
    onFinishImport?.();
  };

  if (!checked || !session?.user?.id || !open) return null;

  return (
    <Modal open={open} onClose={() => undefined} title={t("onboarding.title")} size="max-w-md">
      <div className="space-y-4">
        <p className="text-label-sm text-on-surface-variant">{t("onboarding.desc")}</p>

        <div className="space-y-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => handleAction("linkedin")}
            className="flex w-full items-start gap-3 rounded-xl border border-outline-variant px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-xl text-primary">content_copy</span>
            <span>
              <span className="block text-label-bold text-on-surface">{t("onboarding.linkedin")}</span>
              <span className="block text-label-sm text-on-surface-variant">
                {t("onboarding.linkedin-desc")}
              </span>
            </span>
          </button>

          <button
            type="button"
            disabled={busy !== null}
            onClick={() => handleAction("upload")}
            className="flex w-full items-start gap-3 rounded-xl border border-outline-variant px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-xl text-primary">upload_file</span>
            <span>
              <span className="block text-label-bold text-on-surface">{t("onboarding.upload")}</span>
              <span className="block text-label-sm text-on-surface-variant">
                {t("onboarding.upload-desc")}
              </span>
            </span>
          </button>
        </div>

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => handleAction("skip")}
          className="w-full rounded-lg px-4 py-2.5 text-label-bold text-on-surface-variant hover:bg-surface-container disabled:opacity-60"
        >
          {t("onboarding.skip")}
        </button>
      </div>
    </Modal>
  );
}