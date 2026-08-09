"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import Modal from "@/components/Modal";
import MagneticButton from "@/components/MagneticButton";

function BuilderNewFormContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  // ?next=surat-formal | surat-motivation → setelah CV dibuat, langsung lanjut
  // ke halaman surat lamaran dengan style terpilih (dipakai CTA hasil checker).
  const next = searchParams.get("next");

  // ── Back to checker review ──
  const [checkerSource] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("checker_source");
      } catch {}
    }
    return null;
  });

  const [jobTitle, setJobTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [fillMethod, setFillMethod] = useState<"profile" | "empty" | null>(null);

  // Cek apakah user punya profil & langsung tampilkan popup
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        setProfileExists(res.ok);
        setShowPopup(true);
      })
      .catch(() => {
        setProfileExists(false);
        setShowPopup(true);
      });
  }, []);

  const handleCreate = async (useProfile: boolean) => {
    setFillMethod(useProfile ? "profile" : "empty");
    setIsCreating(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/cv-documents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitle.trim() || null,
          jobDescription: "",
          templateId: templateId || undefined,
          useProfile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (next === "surat-formal") router.push(`/surat-lamaran/${data.id}?style=formal`);
        else if (next === "surat-motivation") router.push(`/surat-lamaran/${data.id}?style=motivation`);
        else router.push(`/builder/${data.id}`);
      } else {
        if (data.error === "PROFILE_NOT_FOUND") {
          setErrorMessage(
            t("cv.new.profile-redirect"),
          );
          setTimeout(() => router.push(data.redirectUrl || "/profile"), 1500);
        } else {
          setErrorMessage(data.message || t("cv.new.generic-error"));
        }
        setIsCreating(false);
      }
    } catch {
      setErrorMessage(t("cv.new.connection-error"));
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* ── Back to Checker Review ── */}
      {checkerSource && (
        <div className="flex justify-start">
          <button
            onClick={() => {
              try { sessionStorage.removeItem("checker_source"); } catch {}
              router.push(checkerSource);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-[14px] group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            Kembali ke Hasil Review CV
          </button>
        </div>
      )}

      {/* Headline */}
      <div className="text-center space-y-3 pt-12">
        <h1 className="text-[28px] font-bold text-on-surface">{t("cv.new.title")}</h1>
        <p className="text-sm text-on-surface-variant max-w-[400px] mx-auto">
          {t("cv.new.subtitle")}
        </p>
      </div>

      {/* Ambil pilihan lewat popup — konten halaman sebagai fallback */}
      <div className="flex justify-center pt-8">
        <div className="bg-white rounded-xl shadow-premium-md p-8 max-w-md w-full text-center border border-outline-variant/50 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-primary text-[32px]">description</span>
          </div>
          <p className="text-sm text-on-surface-variant">
            {t("cv.new.popup-hint")}
          </p>
          <MagneticButton>
            <button
              onClick={() => setShowPopup(true)}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all"
            >
              {t("cv.new.open-popup")}
            </button>
          </MagneticButton>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-100/30 border border-red-200 text-left">
              <span className="material-symbols-outlined text-error text-lg select-none shrink-0">error</span>
              <p className="text-sm text-error">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── POPUP ── */}
      <Modal open={showPopup && !isCreating} onClose={() => { if (!isCreating) setShowPopup(false); }} title={t("cv.new.title")} size="max-w-md">
        <div className="space-y-5 pt-2">
          {/* Job Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface-variant">
              {t("cv.new.target-position")} <span className="text-outline font-normal">{t("cv.new.optional")}</span>
            </label>
            <input
              className="w-full p-3 rounded-xl border border-outline-variant bg-background text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(13,115,119,0.1)] transition-all"
              placeholder="Frontend Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-outline flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              {t("cv.new.position-hint")}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            <MagneticButton className="w-full">
              <button
                onClick={() => handleCreate(true)}
                disabled={isCreating}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/5 border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-[0.98] disabled:opacity-50"
              >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-on-surface">{t("cv.new.fill-profile")}</p>
                <p className="text-xs text-outline">
                  {profileExists
                    ? t("cv.new.fill-profile-desc-exists")
                    : t("cv.new.fill-profile-desc-empty")}
                </p>
              </div>
              {!profileExists && (
                <span className="material-symbols-outlined text-amber-600 text-lg ml-auto">warning</span>
              )}
            </button>

            </MagneticButton>
            <MagneticButton className="w-full">
              <button
                onClick={() => handleCreate(false)}
                disabled={isCreating}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-outline-variant hover:border-outline hover:bg-surface-container-low transition-all active:scale-[0.98] disabled:opacity-50"
              >
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-on-surface">{t("cv.new.start-empty")}</p>
                <p className="text-xs text-outline">{t("cv.new.start-empty-desc")}</p>
              </div>
            </button>
            </MagneticButton>
          </div>
        </div>
      </Modal>

      {/* Loading overlay saat creating */}
      {isCreating && (
        <div className="fixed inset-0 z-[110] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant">
              {fillMethod === "profile" ? t("cv.new.loading-profile") : t("cv.new.loading-empty")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function BuilderNewPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />

        <main className="flex justify-center pt-16 pb-16 px-5">
          <div className="w-full max-w-[500px] flex flex-col gap-6">
            <Suspense fallback={
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
              </div>
            }>
              <BuilderNewFormContent />
            </Suspense>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
