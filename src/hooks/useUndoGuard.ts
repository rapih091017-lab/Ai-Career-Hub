"use client";

import { useEffect, useMemo, useRef } from "react";

export const UNDO_BLOCKED_MESSAGE = "Kolom sudah diubah, urungkan dibatalkan.";

/**
 * Penjaga tombol Urungkan setelah hasil AI diterapkan. `markApplied()`
 * dipanggil tepat setelah nilai AI diterapkan; nilai pertama yang terlihat
 * setelahnya dicatat sebagai "hasil terima". Fungsi yang dikembalikan
 * bernilai true selama nilai sekarang masih sama dengan hasil itu, jadi
 * Urungkan tidak menimpa editan user setelah menerima saran.
 */
export function useUndoGuard<T>(value: T, equals: (a: T, b: T) => boolean = Object.is) {
  const current = useRef(value);
  current.current = value;
  const pending = useRef<{ v: T } | null>(null);
  const eq = useRef(equals);
  eq.current = equals;

  useEffect(() => {
    if (pending.current) {
      pending.current.v = value;
      pending.current = null;
    }
  }, [value]);

  return useMemo(
    () => ({
      markApplied: () => {
        // Bila nilai tidak berubah setelah diterapkan, nilai saat ini yang jadi acuan.
        const token = { v: current.current };
        pending.current = token;
        return () => eq.current(current.current, token.v);
      },
    }),
    [],
  );
}
