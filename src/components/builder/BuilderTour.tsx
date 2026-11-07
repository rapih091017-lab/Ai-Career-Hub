"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";

export const TOUR_SEEN_KEY = "cv_builder_tour_seen";

export function tourSeen(storageKey: string = TOUR_SEEN_KEY): boolean {
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    // Storage tidak bisa diakses: anggap sudah dilihat agar tur tidak muncul tiap kali dibuka.
    return true;
  }
}

function markTourSeen(storageKey: string) {
  try {
    localStorage.setItem(storageKey, "1");
  } catch {
    /* storage tidak bisa diakses */
  }
}

/** title/body/narrow berisi kunci i18n. */
export interface TourStep {
  title: string;
  body: string;
  /** Teks untuk layar < lg bila berbeda (pratinjau & toolbar ada di layar terpisah). */
  narrow?: string;
  /** Elemen yang disorot (`data-tour`), dicoba berurutan; yang pertama terlihat dipakai. */
  anchors: string[];
}

const CV_STEPS: TourStep[] = [
  {
    title: "builder.tour.target-title",
    body: "builder.tour.target-body",
    anchors: ["step-target"],
  },
  {
    title: "builder.tour.form-title",
    body: "builder.tour.form-body",
    anchors: ["form"],
  },
  {
    title: "builder.tour.preview-title",
    body: "builder.tour.preview-body",
    narrow: "builder.tour.preview-narrow",
    anchors: ["preview", "preview-open"],
  },
  {
    title: "builder.tour.style-title",
    body: "builder.tour.style-body",
    narrow: "builder.tour.style-narrow",
    anchors: ["toolbar", "preview-open"],
  },
  {
    title: "builder.tour.pdf-title",
    body: "builder.tour.pdf-body",
    narrow: "builder.tour.pdf-narrow",
    anchors: ["pdf", "preview-open"],
  },
];

function visibleAnchor(names: string[]): HTMLElement | null {
  for (const name of names) {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

interface BuilderTourProps {
  open: boolean;
  onClose: () => void;
  /** Langkah tur; bawaan = tur builder CV. */
  steps?: TourStep[];
  /** Kunci localStorage penanda tur sudah dilihat; bawaan = builder CV. */
  storageKey?: string;
}

/** Tur singkat builder: dialog modal (fokus terkurung, Escape = lewati) + sorotan elemen terkait. */
export function BuilderTour({ open, onClose, steps: STEPS = CV_STEPS, storageKey = TOUR_SEEN_KEY }: BuilderTourProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [wide, setWide] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const finish = useCallback(() => {
    markTourSeen(storageKey);
    onClose();
  }, [onClose, storageKey]);

  // Buka: mulai dari langkah pertama, simpan fokus untuk dikembalikan saat ditutup.
  useEffect(() => {
    if (!open) return;
    setIndex(0);
    returnFocus.current = document.activeElement as HTMLElement | null;
    return () => {
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const measure = useCallback(() => {
    setWide(window.matchMedia("(min-width: 1024px)").matches);
    const el = visibleAnchor(STEPS[index].anchors);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [index, STEPS]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    // Langkah form beranimasi saat berganti; ukur ulang sesudahnya.
    const t = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (open) primaryRef.current?.focus({ preventScroll: true });
  }, [open, index]);

  if (!open) return null;

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      finish();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
    if (!items.length) return;
    const first = items[0];
    const lastItem = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastItem.focus();
    } else if (!e.shiftKey && document.activeElement === lastItem) {
      e.preventDefault();
      first.focus();
    }
  };

  const pad = 6;
  return (
    <div className="fixed inset-0 z-[90]" onKeyDown={onKeyDown}>
      {/* Lapisan gelap dengan "lubang" di elemen yang disorot. */}
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-xl ring-2 ring-lime transition-all duration-200"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-black/45" />
      )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="builder-tour-title"
        aria-describedby="builder-tour-body"
        className="fixed inset-x-4 bottom-4 mx-auto max-w-md rounded-2xl bg-surface-container-lowest p-5 shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[24rem] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <p className="text-xs font-semibold text-on-surface-variant">
          {t("builder.tour.progress").replace("{n}", String(index + 1)).replace("{total}", String(STEPS.length))}
        </p>
        <h2 id="builder-tour-title" className="mt-1 text-base font-semibold text-on-surface">{t(step.title)}</h2>
        <p id="builder-tour-body" className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
          {t(wide ? step.body : step.narrow ?? step.body)}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={finish} className="min-h-11 rounded-lg px-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container sm:min-h-9">
            {t("builder.tour.skip")}
          </button>
          <div className="ml-auto flex gap-2">
            {index > 0 && (
              <button type="button" onClick={() => setIndex(index - 1)} className="min-h-11 rounded-lg border border-outline/30 px-3 text-sm font-medium text-on-surface hover:bg-surface-container sm:min-h-9">
                Kembali
              </button>
            )}
            <button
              ref={primaryRef}
              type="button"
              onClick={() => (last ? finish() : setIndex(index + 1))}
              className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:brightness-110 sm:min-h-9"
            >
              {last ? t("builder.tour.done") : t("builder.tour.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
