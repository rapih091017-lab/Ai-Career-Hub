"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  const [slug, setSlug] = useState("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Cek status saat dialog dibuka
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio/publish");
      if (res.ok) {
        const body = await res.json();
        if (body.published) {
          setPublishedUrl(body.url);
          setSlug(body.slug);
        } else {
          setPublishedUrl(null);
        }
      }
    } catch {
      /* server down — biarkan default */
    } finally {
      // Selalu aktifkan tombol Publish, walau status fetch gagal
      setChecked(true);
    }
  }, []);

  const slugInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setCopied(false);
      setChecked(false);
      setPublishedUrl(null);
      const name = [data?.formData?.heroFirstName, data?.formData?.heroLastName].filter(Boolean).join(" ") || "";
      setSlug(slugifyName(name) || "portofolio-saya");
      refresh();
      // Fokus ke input slug untuk aksesibilitas keyboard
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
        return;
      }
      setPublishedUrl(body.url);
      setSlug(body.slug);
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

  if (!open) return null;

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
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
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

        {publishedUrl ? (
          /* ── Sudah publish: tampilkan link ── */
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
        ) : (
          /* ── Belum publish: form slug ── */
          <div className="space-y-4">
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
                  {t("publish.btn")}
                </>
              )}
            </button>

            <p className="text-[11px] text-on-surface-variant text-center leading-relaxed">{t("publish.free-note")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
