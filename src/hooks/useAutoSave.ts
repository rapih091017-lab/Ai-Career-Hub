"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CvData } from "@/components/cv-templates";
import { buildCvSaveBody } from "@/lib/builder-save";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  /** Kirim perubahan yang tertunda sekarang; true bila DB sudah sama dengan data terbaru. */
  flush: () => Promise<boolean>;
}

const DEBOUNCE_MS = 2000;
/** Jeda sebelum percobaan ulang ke-1, ke-2, ke-3. */
export const AUTOSAVE_RETRY_DELAYS_MS = [2000, 4000, 8000];

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Autosave CV ke /api/cv-documents/[id].
 *
 * - `enabled` baru true setelah data selesai dimuat tanpa error. Saat itu
 *   data yang dimuat dijadikan baseline, jadi membuka CV tidak memicu PUT.
 * - Baseline (`savedJson`) hanya diperbarui setelah PUT sukses, jadi
 *   perubahan yang gagal tersimpan tetap dianggap belum tersimpan.
 * - Gagal → coba ulang 3x (2/4/8 dtk). Status "error" bertahan sampai ada
 *   simpan yang berhasil.
 * - Perubahan yang belum terkirim di-flush saat pagehide/unmount dengan
 *   fetch keepalive.
 */
export function useAutoSave(cvId: string, cvData: CvData, enabled: boolean): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const latestJson = useRef<string | null>(null);
  const savedJson = useRef<string | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const alive = useRef(true);

  latestJson.current = enabled ? buildCvSaveBody(cvData) : null;

  // Baseline = data hasil muat, diset sekali saat enabled pertama kali true.
  useEffect(() => {
    if (enabled && savedJson.current === null) savedJson.current = latestJson.current;
    if (!enabled) savedJson.current = null;
  }, [enabled, cvId]);

  const putOnce = useCallback(
    async (body: string) => {
      const res = await fetch(`/api/cv-documents/${cvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });
      return res.ok;
    },
    [cvId],
  );

  const runSave = useCallback(async () => {
    for (let attempt = 0; attempt <= AUTOSAVE_RETRY_DELAYS_MS.length; attempt++) {
      if (!alive.current) return;
      // Selalu kirim versi terbaru; kalau sudah tersimpan, tidak ada yang dikirim.
      const body = latestJson.current;
      if (body === null || body === savedJson.current) return;
      if (attempt > 0) await wait(AUTOSAVE_RETRY_DELAYS_MS[attempt - 1]);
      if (!alive.current) return;
      const current = latestJson.current;
      if (current === null || current === savedJson.current) return;
      // Status error tetap tampil sampai ada simpan yang berhasil.
      setSaveStatus((s) => (s === "error" ? "error" : "saving"));
      let ok = false;
      try {
        ok = await putOnce(current);
      } catch {
        ok = false;
      }
      if (!alive.current) return;
      if (ok) {
        savedJson.current = current;
        setSaveStatus("saved");
        setLastSaved(new Date());
        setTimeout(() => {
          if (alive.current) setSaveStatus((s) => (s === "saved" ? "idle" : s));
        }, 2000);
        return;
      }
    }
    if (alive.current) setSaveStatus("error");
  }, [putOnce]);

  const json = latestJson.current;
  useEffect(() => {
    if (!cvId || !enabled || json === null || json === savedJson.current) return;
    const timer = setTimeout(() => {
      // Antrekan agar PUT tidak saling balapan dan tiba tidak berurutan.
      chain.current = chain.current.then(runSave);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [json, cvId, enabled, runSave]);

  // Flush perubahan yang belum terkirim saat tab ditutup / pindah halaman.
  useEffect(() => {
    alive.current = true;
    const flush = () => {
      const body = latestJson.current;
      if (!cvId || body === null || savedJson.current === null || body === savedJson.current) return;
      try {
        fetch(`/api/cv-documents/${cvId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
        savedJson.current = body;
      } catch {
        /* peramban menolak keepalive (mis. body terlalu besar) */
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
      alive.current = false;
    };
  }, [cvId]);

  const flushNow = useCallback(async () => {
    chain.current = chain.current.then(runSave);
    await chain.current;
    return latestJson.current !== null && latestJson.current === savedJson.current;
  }, [runSave]);

  return { saveStatus, lastSaved, flush: flushNow };
}
