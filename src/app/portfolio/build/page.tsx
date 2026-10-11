"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";
import { portfolioDataSchema } from "@/lib/portfolio/schema";
import {
  readLegacyDraft,
  clearLegacyDraft,
  migrateLegacyPayload,
  shouldClearLegacy,
} from "@/lib/portfolio/legacy-migration";

/** Draft benar-benar kosong; semua field wajib schema ikut diisi. */
function emptyFormData() {
  return {
    formData: {
      heroPhotoUrl: "",
      heroHeadline: "",
      heroSubHeadline: "",
      heroBgUrl: "",
      heroFirstName: "",
      heroLastName: "",
      heroCreativeTitle: "",
      heroBio: "",
      aboutText: "",
      aboutYearsExp: "",
      aboutProjectsDone: "",
      aboutClientsHappy: "",
      skillsMain: "",
      skillsTools: "",
      skillsLanguages: "",
      contactEmail: "",
      contactPhone: "",
      contactLinkedin: "",
      contactGithub: "",
    },
    projects: [],
    experiences: [],
    educations: [],
    certifications: [],
    organizations: [],
    hobbies: [],
    testimonials: [],
    extraLinks: [],
  };
}

/**
 * Halaman pembuat draft: mengarahkan user ke builder terikat draft.
 * - Kalau sudah ada draft server, pakai itu (tidak membuat draft ganda).
 * - Kalau belum ada, isi dari draft legacy localStorage bila lolos migrasi
 *   (field bermasalah di-coerce dulu); kalau gagal, legacy dipertahankan dan
 *   draft kosong dipakai, lalu buat draft server.
 */
export default function NewBuildPage() {
  const router = useRouter();
  const fired = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createDraft = async () => {
    setError(null);
    setBusy(true);
    try {
      const latestRes = await fetch("/api/portfolio/draft", { cache: "no-store" });
      const latest = latestRes.ok ? await latestRes.json() : null;

      if (latest?.draftId) {
        // Draft server sudah ada: data di sana lebih baru. Legacy tidak dibaca
        // dan tidak dihapus; hapus kunci hanya setelah migrasi sukses atau kosong.
        router.replace(`/portfolio/build/${latest.draftId}`);
        return;
      }

      const legacy = readLegacyDraft();
      const migrated = migrateLegacyPayload(legacy);
      const data = migrated ?? portfolioDataSchema.parse(emptyFormData());

      const res = await fetch("/api/portfolio/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.draftId) {
        setError("Gagal membuat draft. Periksa koneksi lalu coba lagi.");
        return;
      }
      if (shouldClearLegacy(legacy, migrated)) clearLegacyDraft();
      router.replace(`/portfolio/build/${json.draftId}`);
    } catch {
      setError("Gagal membuat draft. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void createDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <AuthGuard>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <span className="material-symbols-outlined text-6xl text-error" aria-hidden="true">
            cloud_off
          </span>
          <p className="text-sm text-on-surface-variant">{error}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              fired.current = false;
              void createDraft();
            }}
            className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Coba lagi
          </button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <PortfolioSkeleton message="Menyiapkan draft baru" />
    </AuthGuard>
  );
}
