"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";

/**
 * Minta testimoni setelah pengguna memakai produk.
 *
 * Testimoni tidak pernah terbit otomatis: yang terkirim masuk ke antrean
 * admin. Testimoni reklame adalah risiko terbesar untuk pembeli yang teliti,
 * jadi tidak ada jalan pintas untuk membuatnya terbit sendiri.
 */
export function TestimonialRequest({ defaultName }: { defaultName?: string }) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName ?? "");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/testimonials/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, role, text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || t("testimonial.error"));
      setSent(true);
      addToast({ type: "success", message: t("testimonial.sent") });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : t("testimonial.error"),
      });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:bg-surface-container"
      >
        <span className="material-symbols-outlined text-lg">rate_review</span>
        {t("testimonial.open")}
      </button>
    );
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm text-on-surface">
        <p className="font-semibold">{t("testimonial.sent-title")}</p>
        <p className="mt-1 text-on-surface-variant">{t("testimonial.sent-desc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-outline-variant/40 p-4">
      <div>
        <p className="font-label-bold text-on-surface">{t("testimonial.title")}</p>
        <p className="text-xs text-on-surface-variant">{t("testimonial.desc")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-on-surface-variant">{t("testimonial.name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-on-surface-variant">{t("testimonial.role")}</span>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={t("testimonial.role-placeholder")}
            className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-on-surface-variant">{t("testimonial.text")}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-outline-variant bg-background px-3 py-2"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || name.trim().length < 2 || role.trim().length < 2 || text.trim().length < 20}
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-50"
        >
          {busy ? t("testimonial.sending") : t("testimonial.send")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-11 items-center rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:bg-surface-container"
        >
          {t("testimonial.cancel")}
        </button>
      </div>
      <p className="text-xs text-on-surface-variant">{t("testimonial.review-note")}</p>
    </div>
  );
}