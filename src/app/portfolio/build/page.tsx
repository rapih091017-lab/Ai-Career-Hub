"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";
import { portfolioDataSchema } from "@/lib/portfolio/schema";
import { readLegacyDraft, clearLegacyDraft } from "@/lib/portfolio/legacy-migration";

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
 * - Kalau belum ada, isi dari draft legacy localStorage (migrasi sekali) bila
 *   valid, kalau tidak pakai draft kosong, lalu buat draft server.
 */
export default function NewBuildPage() {
  const router = useRouter();
  const fired = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const createDraft = async () => {
    setError(null);
    try {
      const latestRes = await fetch("/api/portfolio/draft", { cache: "no-store" });
      const latest = latestRes.ok ? await latestRes.json() : null;

      if (latest?.draftId) {
        // Draft server sudah ada: legacy (kalau ada) tidak dipakai supaya
        // tidak menimpa data yang lebih baru.
        clearLegacyDraft();
        router.replace(`/portfolio/build/${latest.draftId}`);
        return;
      }

      const legacy = readLegacyDraft();
      const legacyParsed = legacy ? portfolioDataSchema.safeParse(legacy) : null;
      const data = legacyParsed?.success
        ? legacyParsed.data
        : portfolioDataSchema.parse(emptyFormData());

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
      // Draft server berhasil dibuat: kunci legacy sudah dimigrasi (atau
      // ditinggalkan), aman dihapus sekali.
      clearLegacyDraft();
      router.replace(`/portfolio/build/${json.draftId}`);
    } catch {
      setError("Gagal membuat draft. Periksa koneksi lalu coba lagi.");
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
            onClick={() => {
              fired.current = false;
              void createDraft();
            }}
            className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"
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
