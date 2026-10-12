"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import type { PortfolioData } from "@/components/portfolio/types";

export interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  data: PortfolioData | null;
  themeId: string;
  /** Tambahan data live-builder (sectionOrder / visibility) */
  extras?: { sectionOrder?: string[]; sectionVisibility?: Record<string, boolean> };
}

interface PortfolioPlan {
  maxActive: number;
  used: number;
  remaining: number;
  entitled: boolean;
  upgradeUrl: string;
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,49}$/;

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default function PublishDialog({ open, onClose, data, themeId, extras }: PublishDialogProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const router = useRouter();

  const [slug, setSlug] = useState("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"published" | "draft" | "archived" | null>(null);
  const [plan, setPlan] = useState<PortfolioPlan | null>(null);
  const [updateMode, setUpdateMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Cek status publish + entitlement saat dialog dibuka
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio/publish");
      if (res.ok) {
        const body = await res.json();
        setPlan(body.plan ?? null);
        setStatus(body.status ?? null);
        if (body.published) {
          setPublishedUrl(body.url);
          setSlug(body.slug);
        } else {
          setPublishedUrl(null);
          if (body.slug) setSlug(body.slug);
        }
      } else {
        setPlan({
          maxActive: 1,
          used: 0,
          remaining: 1,
          entitled: true,
          upgradeUrl: "/settings/billing?plan=portfolio-web",
        });
      }
    } catch {
      setPlan({
        maxActive: 1,
        used: 0,
        remaining: 1,
        entitled: true,
        upgradeUrl: "/settings/billing?plan=portfolio-web",
      });
    } finally {
      setChecked(true);
    }
  }, []);

  const slugInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setCopied(false);
      setChecked(false);
      setPlan(null);
      setStatus(null);
      setUpdateMode(false);
      setShowDeleteConfirm(false);
      setPublishedUrl(null);
      const name = [data?.formData?.heroFirstName, data?.formData?.heroLastName].filter(Boolean).join(" ") || "";
      setSlug(slugifyName(name) || "portofolio-saya");
      refresh();
      setTimeout(() => slugInputRef.current?.focus(), 50);
    }
  }, [open, data, refresh]);

  // Escape-to-close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handlePublish = async () => {
    if (!data) return;
    setError(null);
    const s = slug.trim().toLowerCase();
    if (!SLUG_REGEX.test(s)) {
      setError(t("publish.slug-invalid"));
      return;
    }
    setPublishing(true);
    try {
      const dataRecord = data ? (data as unknown as Record<string, unknown>) : null;
      const payload: Record<string, unknown> = {
        slug: s,
        themeId,
        data: {
          ...data,
          fontSize: dataRecord?.fontSize,
          alignment: dataRecord?.alignment,
          sectionOrder: extras?.sectionOrder,
          sectionVisibility: extras?.sectionVisibility,
        },
        fontSize: dataRecord?.fontSize,
        alignment: dataRecord?.alignment,
      };
      const res = await fetch("/api/portfolio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message || "Gagal publish");
        if ((body.error === "QUOTA_EXCEEDED" || body.error === "PORTFOLIO_PACKAGE_REQUIRED") && body.upgradeUrl) {
          setPlan((prev) =>
            prev
              ? { ...prev, remaining: 0, upgradeUrl: body.upgradeUrl }
              : { maxActive: 1, used: 1, remaining: 0, entitled: false, upgradeUrl: body.upgradeUrl }
          );
        }
        return;
      }
      setPublishedUrl(body.url);
      setSlug(body.slug);
      setStatus("published");
      setUpdateMode(false);
      addToast({ type: "success", message: t("publish.success") });
      refresh();
    } catch {
      setError(t("publish.error-network"));
    } finally {
      setPublishing(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/publish", { method: "PATCH" });
      if (!res.ok) throw new Error("archive failed");
      setPublishedUrl(null);
      setStatus("archived");
      setUpdateMode(false);
      addToast({ type: "info", message: "Portfolio ditutup (diarsipkan). Slug Anda tetap tersimpan." });
      refresh();
    } catch {
      setError(t("publish.error-network"));
    } finally {
      setArchiving(false);
    }
  };

  const handleDeletePermanent = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/publish", { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setPublishedUrl(null);
      setStatus(null);
      setUpdateMode(false);
      setShowDeleteConfirm(false);
      addToast({ type: "info", message: "Portfolio dihapus permanen dan slug dilepas." });
      refresh();
    } catch {
      setError(t("publish.error-network"));
    } finally {
      setDeleting(false);
    }
  };

  const copyLink = async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ type: "error", message: t("publish.copy-failed") });
    }
  };

  const goUpgrade = () => {
    const url = plan?.upgradeUrl || "/settings/billing?plan=portfolio-web";
    router.push(url);
  };

  if (!open) return null;

  const quotaKnown = checked && plan !== null;
  const isPublished = status === "published" && !!publishedUrl;
  const isQuotaExceeded = quotaKnown && plan.remaining <= 0 && !isPublished;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("publish.title")}
    >
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t("publish.close")}
      />
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
              {t("publish.title")}
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-1">{t("publish.desc")}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label={t("publish.close")}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── SUDAH LIVE ── */}
        {isPublished && !showDeleteConfirm && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                {t("publish.live")}
              </p>
              <button
                onClick={() => window.open(publishedUrl, "_blank")}
                className="text-sm text-primary font-medium hover:underline break-all text-left"
              >
                {publishedUrl.replace(/^https?:\/\//, "")}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">{copied ? "check" : "link"}</span>
                {copied ? t("publish.copied") : t("publish.copy")}
              </button>
              <button
                onClick={() => window.open(publishedUrl, "_blank")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface font-label-bold hover:bg-surface-container-low active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">open_in_new</span>
                {t("publish.open")}
              </button>
            </div>

            <button
              onClick={() => { setUpdateMode((prev) => !prev); setError(null); if (!updateMode) setTimeout(() => slugInputRef.current?.focus(), 50); }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-fixed text-primary font-label-bold hover:brightness-95 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">{updateMode ? "close" : "edit"}</span>
              {updateMode ? t("publish.cancel-update") : t("publish.update-content")}
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant">
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold text-xs hover:bg-surface-container-low active:scale-95 transition-all disabled:opacity-50"
              >
                {archiving ? (
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">archive</span>
                )}
                Tutup (Arsip)
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-error/30 text-error font-label-bold text-xs hover:bg-error-container/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Hapus Permanen
              </button>
            </div>
          </div>
        )}

        {/* ── KONFIRMASI HAPUS PERMANEN ── */}
        {showDeleteConfirm && (
          <div className="space-y-4">
            <div className="rounded-xl border border-error/30 bg-error-container/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-error font-label-bold text-sm">
                <span className="material-symbols-outlined text-lg">warning</span>
                Konfirmasi Hapus Permanen
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tindakan ini akan menghapus portfolio ini secara permanen dan melepas slug{" "}
                <span className="font-mono text-on-surface font-semibold">{slug}</span>. Slug akan tersedia untuk pengguna lain.
              </p>
            </div>

            {error && (
              <p className="text-xs text-error flex items-center gap-1.5 bg-error-container/20 rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface font-label-bold hover:bg-surface-container transition-all text-sm"
              >
                Batal
              </button>

              <button
                onClick={handleDeletePermanent}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-error text-on-error font-label-bold hover:opacity-90 active:scale-95 transition-all text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                ) : (
                  "Ya, Hapus Permanen"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── UNARCHIVED / BELUM PUBLISH & QUOTA EXCEEDED ── */}
        {!isPublished && isQuotaExceeded && !showDeleteConfirm && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0">lock</span>
                <div>
                  <p className="font-label-bold text-amber-800">Batas Portfolio Tercapai</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Kamu sudah punya {plan?.used} portfolio aktif dari batas {plan?.maxActive} di paket gratis. Tutup salah satu atau aktifkan paket Portfolio Web untuk menambah slot.
                  </p>
                </div>
              </div>
              <button
                onClick={goUpgrade}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">workspace_premium</span>
                Aktifkan Paket Portfolio Web
              </button>
            </div>
          </div>
        )}

        {/* ── FORM SLUG (BELUM LIVE ATAU SEDANG UPDATE) ── */}
        {(!isPublished || updateMode) && !isQuotaExceeded && !showDeleteConfirm && (
          <div className="space-y-4">
            {isPublished && updateMode && (
              <p className="text-xs font-semibold text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">edit</span>
                Memperbarui konten portfolio live
              </p>
            )}

            {status === "archived" && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">archive</span>
                Portfolio ini saat ini diarsipkan. Terbitkan kembali untuk mengaktifkan URL.
              </p>
            )}

            <div>
              <label className="text-label-sm text-on-surface-variant block mb-1.5">{t("publish.slug-label")}</label>
              <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-4 py-2.5 border border-outline-variant focus-within:border-primary transition-colors">
                <span className="text-label-sm text-outline whitespace-nowrap">aicareerhub.com/p/</span>
                <input
                  ref={slugInputRef}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="nama-kamu"
                  className="bg-transparent border-none p-0 focus:ring-0 font-label-bold text-on-surface min-w-0 flex-1"
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5">{t("publish.slug-hint")}</p>
            </div>

            {error && (
              <p className="text-xs text-error flex items-center gap-1.5 bg-error-container/20 rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}

            <button
              onClick={handlePublish}
              disabled={publishing || !quotaKnown}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  {t("publish.publishing")}
                </>
              ) : !quotaKnown ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  Memeriksa ketersediaan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  {isPublished && updateMode ? "Perbarui Portfolio" : "Terbitkan Portfolio"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
