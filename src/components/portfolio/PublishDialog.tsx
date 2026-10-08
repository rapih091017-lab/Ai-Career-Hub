"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import type { PortfolioData } from "@/components/portfolio/types";

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  data: PortfolioData | null;
  themeId: string;
  /** Tambahan data live-builder (sectionOrder / visibility) */
  extras?: { sectionOrder?: string[]; sectionVisibility?: Record<string, boolean> };
}

interface PortfolioPlan {
  entitled: boolean;
  trialUsed: boolean;
  trialAvailable: boolean;
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
  const [plan, setPlan] = useState<PortfolioPlan | null>(null);
  const [updateMode, setUpdateMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
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
        if (body.published) {
          setPublishedUrl(body.url);
          setSlug(body.slug);
        } else {
          setPublishedUrl(null);
        }
      } else {
        // Server error, asumsikan trial masih tersedia agar publish tidak terkunci
        setPlan({ entitled: false, trialUsed: false, trialAvailable: true, upgradeUrl: "/settings/billing?plan=portfolio-web" });
      }
    } catch {
      setPlan({ entitled: false, trialUsed: false, trialAvailable: true, upgradeUrl: "/settings/billing?plan=portfolio-web" });
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
      setUpdateMode(false);
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
      const payload: Record<string, unknown> = {
        slug: s,
        theme: themeId,
        data: {
          ...data,
          sectionOrder: extras?.sectionOrder,
          sectionVisibility: extras?.sectionVisibility,
        },
      };
      const res = await fetch("/api/portfolio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message || "Gagal publish");
        // Kena gating paket → paksa tampilan upgrade
        if (body.error === "PORTFOLIO_PACKAGE_REQUIRED" && body.upgradeUrl) {
          setPlan({ entitled: false, trialUsed: true, trialAvailable: false, upgradeUrl: body.upgradeUrl });
          setUpdateMode(false);
        }
        return;
      }
      setPublishedUrl(body.url);
      setSlug(body.slug);
      setUpdateMode(false);
      addToast({ type: "success", message: t("publish.success") });
    } catch {
      setError(t("publish.error-network"));
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setUnpublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/publish", { method: "DELETE" });
      if (!res.ok) throw new Error("unpublish failed");
      setPublishedUrl(null);
      setUpdateMode(false);
      addToast({ type: "info", message: t("publish.unpublished") });
    } catch {
      setError(t("publish.error-network"));
    } finally {
      setUnpublishing(false);
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

  const canUpdate = plan?.entitled === true;
  const trialCanPublish = !publishedUrl && plan?.trialAvailable === true;
  const entitledCanPublish = plan?.entitled === true;
  // Form muncul saat: (a) publish pertama tersedia, atau (b) user berbayar
  // sedang memperbarui konten/ganti link.
  const showForm =
    !publishedUrl
      ? entitledCanPublish || trialCanPublish
      : updateMode && canUpdate;
  // User bebas (bukan premium/paid) yang sudah publish, butuh upgrade utk update.
  const showUpgradeGate = !plan?.entitled && plan?.trialUsed === true;

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

        {/* ── SUDAH LIVE: kelola link / update konten ── */}
        {publishedUrl && (
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

            {/* User berbayar bisa update konten / ganti link */}
            {canUpdate && (
              <button
                onClick={() => { setUpdateMode((prev) => !prev); setError(null); if (!updateMode) setTimeout(() => slugInputRef.current?.focus(), 50); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-fixed text-primary font-label-bold hover:brightness-95 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">{updateMode ? "close" : "edit"}</span>
                {updateMode ? t("publish.cancel-update") : t("publish.update-content")}
              </button>
            )}

            {/* User free yang trial-nya sudah terpakai → upgrade */}
            {showUpgradeGate && !updateMode && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">lock</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">{t("publish.upgrade-title")}</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{t("publish.upgrade-desc")}</p>
                  </div>
                </div>
                <button
                  onClick={goUpgrade}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">workspace_premium</span>
                  {t("publish.upgrade-btn")}
                  <span className="text-xs opacity-80">{t("publish.upgrade-price")}</span>
                </button>
              </div>
            )}

            <button
              onClick={handleUnpublish}
              disabled={unpublishing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-error/30 text-error font-label-bold hover:bg-error-container/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {unpublishing ? (
                <span className="material-symbols-outlined text-lg animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-lg">visibility_off</span>
              )}
              {t("publish.unpublish")}
            </button>
          </div>
        )}

        {/* ── Upgrade gate (free, trial habis, belum live) ── */}
        {!publishedUrl && showUpgradeGate && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0">lock</span>
                <div>
                  <p className="font-label-bold text-amber-800">{t("publish.upgrade-title")}</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{t("publish.upgrade-desc-empty")}</p>
                </div>
              </div>
              <button
                onClick={goUpgrade}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">workspace_premium</span>
                {t("publish.upgrade-btn")}
                <span className="text-xs opacity-80">{t("publish.upgrade-price")}</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-error flex items-center gap-1.5 bg-error-container/20 rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── Form slug (publish pertama / update oleh user berbayar) ── */}
        {showForm && (
          <div className="space-y-4">
            {publishedUrl && updateMode && (
              <p className="text-xs font-semibold text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">edit</span>
                {t("publish.updating-note")}
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
              <p className="text-[11px] text-on-surface-variant mt-1.5">{t("publish.slug-hint")}</p>
            </div>

            {error && (
              <p className="text-xs text-error flex items-center gap-1.5 bg-error-container/20 rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}

            <button
              onClick={handlePublish}
              disabled={publishing || !checked}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  {t("publish.publishing")}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  {publishedUrl && updateMode ? t("publish.btn-update") : t("publish.btn")}
                </>
              )}
            </button>

            <p className="text-[11px] text-on-surface-variant text-center leading-relaxed">
              {publishedUrl && updateMode
                ? t("publish.update-note")
                : trialCanPublish
                  ? t("publish.trial-note")
                  : t("publish.paid-note")}
            </p>
          </div>
        )}

        {/* ── Loading status saat dialog baru dibuka ── */}
        {!publishedUrl && !showUpgradeGate && !showForm && (
          <div className="py-6 flex flex-col items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
            <p className="text-sm">Memeriksa status publish...</p>
          </div>
        )}
      </div>
    </div>
  );
}
