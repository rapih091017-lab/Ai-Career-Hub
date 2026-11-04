"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const TOUR_SEEN_KEY = "cv_builder_tour_seen";

export function tourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    // Storage tidak bisa diakses: anggap sudah dilihat agar tur tidak muncul tiap kali dibuka.
    return true;
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    /* storage tidak bisa diakses */
  }
}

interface TourStep {
  title: string;
  body: string;
  /** Teks untuk layar < lg bila berbeda (pratinjau & toolbar ada di layar terpisah). */
  narrow?: string;
  /** Elemen yang disorot (`data-tour`), dicoba berurutan; yang pertama terlihat dipakai. */
  anchors: string[];
}

const STEPS: TourStep[] = [
  {
    title: "Mulai dari Target Pekerjaan",
    body: "Tulis posisi yang kamu lamar dan tempel teks lowongannya. Bagian ini tidak dicetak di CV, tapi jadi acuan semua saran AI.",
    anchors: ["step-target"],
  },
  {
    title: "Isi form langkah demi langkah",
    body: "Lanjutkan ke Data Diri, Pengalaman, Pendidikan, dan seterusnya. Ikon (i) di samping kolom berisi contoh isian. Semua perubahan tersimpan otomatis.",
    anchors: ["form"],
  },
  {
    title: "Edit langsung di pratinjau",
    body: "Klik teks di pratinjau untuk mengubahnya di tempat. Klik bagian lain untuk lompat ke kolomnya di form.",
    narrow: "Ketuk Lihat CV untuk melihat hasilnya. Ketuk teks di pratinjau untuk lompat ke kolomnya di form.",
    anchors: ["preview", "preview-open"],
  },
  {
    title: "Atur tampilan dan template",
    body: "Ganti template, font, ukuran, dan rata teks dari toolbar. Menu Lainnya berisi urutan bagian, warna, spasi, dan margin.",
    narrow: "Di layar pratinjau, ketuk Format untuk mengganti template, font, ukuran, urutan bagian, dan warna.",
    anchors: ["toolbar", "preview-open"],
  },
  {
    title: "Unduh PDF",
    body: "Kalau sudah rapi, tekan PDF untuk mengunduh CV. Buka panduan ini lagi kapan saja lewat tombol Panduan.",
    narrow: "Tombol PDF ada di layar pratinjau. Buka panduan ini lagi kapan saja lewat tombol Panduan.",
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

/** Tur singkat builder: dialog modal (fokus terkurung, Escape = lewati) + sorotan elemen terkait. */
export function BuilderTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [wide, setWide] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const finish = useCallback(() => {
    markTourSeen();
    onClose();
  }, [onClose]);

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
  }, [index]);

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
          Panduan {index + 1} dari {STEPS.length}
        </p>
        <h2 id="builder-tour-title" className="mt-1 text-base font-semibold text-on-surface">{step.title}</h2>
        <p id="builder-tour-body" className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
          {wide ? step.body : step.narrow ?? step.body}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={finish} className="min-h-11 rounded-lg px-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container sm:min-h-9">
            Lewati
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
              {last ? "Selesai" : "Berikutnya"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
