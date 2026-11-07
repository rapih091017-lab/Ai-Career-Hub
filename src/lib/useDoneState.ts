"use client";

import { useCallback, useEffect, useState } from "react";

export interface DoneState {
  isDone: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Jumlah id yang sudah ditandai di antara `ids`. */
  countDone: (ids: string[]) => number;
}

/**
 * Status "sudah diperbaiki" per item. Dengan `storageKey` tersimpan di
 * localStorage (per id hasil); tanpa key hanya hidup di memori. Akses storage
 * dibungkus try/catch karena bisa diblokir (mode privat, situs diblokir).
 */
export function useDoneState(storageKey: string | null): DoneState {
  const [done, setDone] = useState<Set<string>>(() => new Set());
  // Simpan baru boleh jalan setelah data lama dibaca, kalau tidak isi storage
  // tertimpa himpunan kosong saat mount.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    let next = new Set<string>();
    if (storageKey) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) next = new Set(parsed.filter((x): x is string => typeof x === "string"));
      } catch {
        // storage tidak bisa dibaca: mulai kosong
      }
    }
    setDone(next);
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || loadedKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...done]));
    } catch {
      // storage penuh/diblokir: status tetap ada di memori
    }
  }, [done, storageKey, loadedKey]);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isDone = useCallback((id: string) => done.has(id), [done]);
  const countDone = useCallback((ids: string[]) => ids.filter((id) => done.has(id)).length, [done]);

  return { isDone, toggle, countDone };
}
