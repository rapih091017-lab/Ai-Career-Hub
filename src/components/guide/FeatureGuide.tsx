"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FeatureTour } from "@/components/guide/FeatureTour";
import { guideFeature, guideHref, tourSeen, type GuideFeatureId } from "@/lib/guide-features";
import { useTranslation } from "@/lib/i18n";

/**
 * Tombol "Panduan" + tur fitur. Tur muncul sendiri sekali (saat `ready`), setelah itu
 * hanya lewat tombol ini. Diletakkan di kanan judul halaman agar posisinya sama di tiap fitur.
 */
export function FeatureGuide({ id, ready = true, className = "" }: { id: GuideFeatureId; ready?: boolean; className?: string }) {
  const { t } = useTranslation();
  const feature = guideFeature(id);
  const [open, setOpen] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (!ready || checked.current || !feature.tourKey) return;
    checked.current = true;
    if (!tourSeen(feature.tourKey)) setOpen(true);
  }, [ready, feature.tourKey]);

  const close = useCallback(() => setOpen(false), []);
  if (!feature.tour || !feature.tourKey) return null;

  return (
    <>
      <GuideButton onClick={() => setOpen(true)} label={t("guide.button")} aria={t("guide.button-aria")} className={className} />
      <FeatureTour open={open} onClose={close} steps={feature.tour} storageKey={feature.tourKey} guideHref={guideHref(id)} />
    </>
  );
}

/** Tampilan tombol Panduan; dipakai juga builder CV dan portofolio yang punya tur sendiri. */
export function GuideButton({ onClick, label, aria, className = "" }: { onClick: () => void; label: string; aria: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      data-guide-button
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-ink/30 bg-paper px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-lime/20 ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">help</span>
      {label}
    </button>
  );
}
