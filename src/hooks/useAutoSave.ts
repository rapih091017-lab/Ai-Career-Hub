"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CvData } from "@/components/cv-templates";
import { buildCvSaveBody } from "@/lib/builder-save";

/** conflict = CV diubah di tab/perangkat lain (409); rejected = server menolak isi (4xx). */
export type SaveStatus = "idle" | "saving" | "saved" | "error" | "conflict" | "rejected";

export const TOO_LARGE_MESSAGE = "CV terlalu besar untuk disimpan (maks ±200KB). Kurangi isi bagian yang panjang.";

/** Tambahkan updatedAt versi yang dilihat tab ini ke body PUT. */
function withExpected(body: string, expected: string | null): string {
  if (!expected) return body;
  return JSON.stringify({ ...JSON.parse(body), expectedUpdatedAt: expected });
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  /** Kirim perubahan tertunda dan tunggu PUT sukses; false bila gagal setelah semua percobaan. */
  flush: () => Promise<boolean>;
  /** updatedAt CV versi yang terakhir dimuat/disimpan tab ini (ISO), untuk deteksi 409. */
  getUpdatedAt: () => string | null;
  /** Pesan untuk status error/rejected. */
  errorMessage: string | null;
  /** Setelah konflik dan konfirmasi user: simpan versi tab ini menimpa versi server. */
  overwrite: () => Promise<boolean>;
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
export function useAutoSave(
  cvId: string,
  cvData: CvData,
  enabled: boolean,
  initialUpdatedAt?: string | null,
  /** Template ikut disimpan, jadi flush sebelum unduh PDF juga mencakup ganti template. */
  templateId?: string,
): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Konflik 409: autosave berhenti sampai user memilih muat ulang atau timpa.
  const blocked = useRef(false);
  // Body yang ditolak server (400/413): tidak dikirim ulang sampai isinya berubah.
  const rejectedJson = useRef<string | null>(null);

  const latestJson = useRef<string | null>(null);
  const savedJson = useRef<string | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const alive = useRef(true);
  const updatedAt = useRef<string | null>(null);
  if (updatedAt.current === null && initialUpdatedAt) updatedAt.current = initialUpdatedAt;

  // Catat updatedAt dari respons PUT (bila ada) supaya ekspor PDF bisa minta 409.
  const rememberUpdatedAt = useCallback(async (res: Response) => {
    try {
      const json = typeof res.json === "function" ? await res.json() : null;
      if (json && typeof json.updatedAt === "string") updatedAt.current = json.updatedAt;
    } catch {
      /* respons tanpa JSON: biarkan nilai lama */
    }
  }, []);

  latestJson.current = enabled ? buildCvSaveBody(cvData, templateId) : null;

  // Baseline = data hasil muat, diset sekali saat enabled pertama kali true.
  useEffect(() => {
    if (enabled && savedJson.current === null) savedJson.current = latestJson.current;
    if (!enabled) savedJson.current = null;
  }, [enabled, cvId]);

  type PutResult = "ok" | "conflict" | "rejected" | "retry";
  const putOnce = useCallback(
    async (body: string, check = true): Promise<PutResult> => {
      const res = await fetch(`/api/cv-documents/${cvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: check ? withExpected(body, updatedAt.current) : body,
      });
      if (res.ok) {
        await rememberUpdatedAt(res);
        return "ok";
      }
      if (res.status === 409) return "conflict";
      // 4xx lain (400/413) tidak akan berhasil bila dikirim ulang apa adanya.
      if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
        setErrorMessage(res.status === 413 ? TOO_LARGE_MESSAGE : "Data CV ditolak server dan belum tersimpan.");
        return "rejected";
      }
      return "retry";
    },
    [cvId, rememberUpdatedAt],
  );

  const runSave = useCallback(async () => {
    for (let attempt = 0; attempt <= AUTOSAVE_RETRY_DELAYS_MS.length; attempt++) {
      if (!alive.current || blocked.current) return;
      // Selalu kirim versi terbaru; kalau sudah tersimpan, tidak ada yang dikirim.
      const body = latestJson.current;
      if (body === null || body === savedJson.current || body === rejectedJson.current) return;
      if (attempt > 0) await wait(AUTOSAVE_RETRY_DELAYS_MS[attempt - 1]);
      if (!alive.current || blocked.current) return;
      const current = latestJson.current;
      if (current === null || current === savedJson.current || current === rejectedJson.current) return;
      // Status error tetap tampil sampai ada simpan yang berhasil.
      setSaveStatus((s) => (s === "error" || s === "rejected" ? s : "saving"));
      let result: PutResult = "retry";
      try {
        result = await putOnce(current);
      } catch {
        result = "retry";
      }
      if (!alive.current) return;
      if (result === "ok") {
        savedJson.current = current;
        rejectedJson.current = null;
        setErrorMessage(null);
        setSaveStatus("saved");
        setLastSaved(new Date());
        setTimeout(() => {
          if (alive.current) setSaveStatus((s) => (s === "saved" ? "idle" : s));
        }, 2000);
        return;
      }
      if (result === "conflict") {
        blocked.current = true;
        setSaveStatus("conflict");
        return;
      }
      if (result === "rejected") {
        rejectedJson.current = current;
        setSaveStatus("rejected");
        return;
      }
    }
    if (alive.current) {
      setErrorMessage("Perubahan belum tersimpan. Periksa koneksi; kami akan mencoba lagi saat kamu mengedit.");
      setSaveStatus("error");
    }
  }, [putOnce]);

  const overwrite = useCallback(async () => {
    const body = latestJson.current;
    if (body === null) return false;
    let result: PutResult = "retry";
    try {
      result = await putOnce(body, false);
    } catch {
      result = "retry";
    }
    if (result !== "ok") return false;
    blocked.current = false;
    savedJson.current = body;
    setSaveStatus("saved");
    setLastSaved(new Date());
    return true;
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
      if (!cvId || blocked.current || body === null || savedJson.current === null || body === savedJson.current) return;
      try {
        // Baseline baru diperbarui setelah respons OK; kalau gagal,
        // perubahan tetap dianggap belum tersimpan (flush/ekspor akan mencoba lagi).
        fetch(`/api/cv-documents/${cvId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: withExpected(body, updatedAt.current),
          keepalive: true,
        })
          .then((res) => {
            if (!res.ok) return;
            savedJson.current = body;
            void rememberUpdatedAt(res);
          })
          .catch(() => {});
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
  }, [cvId, rememberUpdatedAt]);

  const flushNow = useCallback(async () => {
    chain.current = chain.current.then(runSave);
    await chain.current;
    return latestJson.current !== null && latestJson.current === savedJson.current;
  }, [runSave]);

  const getUpdatedAt = useCallback(() => updatedAt.current, []);

  return { saveStatus, lastSaved, flush: flushNow, getUpdatedAt, errorMessage, overwrite };
}
