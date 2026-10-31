"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export const SPLIT_MIN = 30;
export const SPLIT_MAX = 70;
export const SPLIT_DEFAULT = 50;
const STORAGE_KEY = "builder_split_pct";

export const clampSplit = (v: number) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(v * 10) / 10));

/** Lebar panel kiri (%) yang diingat per peramban; bukan data CV. */
export function usePanelSplit() {
  const [pct, setPct] = useState(SPLIT_DEFAULT);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(STORAGE_KEY));
      if (Number.isFinite(v) && v >= SPLIT_MIN && v <= SPLIT_MAX) setPct(v);
    } catch {
      /* storage tidak bisa diakses: pakai 50% */
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(pct));
    } catch {
      /* abaikan */
    }
  }, [pct]);
  return [pct, setPct] as const;
}

interface PanelSplitterProps {
  value: number;
  onChange: (pct: number) => void;
  /** Kontainer kedua panel; lebarnya = 100%. */
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * Pemisah panel form/pratinjau (lg ke atas). Seret dengan mouse/sentuh,
 * panah kiri/kanan menggeser 5%, Home/End ke batas, dobel klik = 50%.
 */
export function PanelSplitter({ value, onChange, containerRef }: PanelSplitterProps) {
  const [dragging, setDragging] = useState(false);

  const pctAt = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return value;
    return clampSplit(((clientX - rect.left) / rect.width) * 100);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Lebar panel isian"
      aria-valuenow={Math.round(value)}
      aria-valuemin={SPLIT_MIN}
      aria-valuemax={SPLIT_MAX}
      aria-valuetext={`Panel isian ${Math.round(value)}% lebar layar`}
      tabIndex={0}
      title="Seret untuk mengubah lebar panel. Klik dua kali untuk 50%."
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        onChange(pctAt(e.clientX));
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        setDragging(false);
      }}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={() => onChange(SPLIT_DEFAULT)}
      onKeyDown={(e) => {
        const next =
          e.key === "ArrowLeft" ? value - 5 : e.key === "ArrowRight" ? value + 5 : e.key === "Home" ? SPLIT_MIN : e.key === "End" ? SPLIT_MAX : null;
        if (next === null) return;
        e.preventDefault();
        onChange(clampSplit(next));
      }}
      className="group relative hidden w-2 shrink-0 cursor-col-resize touch-none select-none bg-outline-variant/30 transition-colors hover:bg-primary/25 focus-visible:bg-primary/30 focus-visible:outline-none lg:block"
      data-dragging={dragging || undefined}
    >
      {/* Pegangan terlihat di tengah */}
      <span
        aria-hidden="true"
        className={`absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
          dragging ? "bg-primary" : "bg-outline-variant group-hover:bg-primary group-focus-visible:bg-primary"
        }`}
      />
    </div>
  );
}
