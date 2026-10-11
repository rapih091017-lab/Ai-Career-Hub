"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ValidatedPortfolioData } from "./schema";

export type CachedDraft = {
  name: string;
  data: ValidatedPortfolioData;
  updatedAt: string;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function cacheKey(draftId: string): string {
  return `portfolio_cache_v1_${draftId}`;
}

export function readCache(draftId: string): CachedDraft | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(draftId));
    if (!raw) return null;
    return JSON.parse(raw) as CachedDraft;
  } catch {
    return null;
  }
}

export function writeCache(draftId: string, draft: CachedDraft): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(cacheKey(draftId), JSON.stringify(draft));
  } catch {
    // Cache penuh atau ditolak browser. Tidak menggagalkan alur: server
    // tetap sumber kebenaran dan banner offline memberi tahu user.
  }
}

export function clearCache(draftId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(cacheKey(draftId));
  } catch {
    /* diabaikan */
  }
}

const DEBOUNCE_MS = 1200;

export type UsePortfolioDraftResult = {
  draftId: string | null;
  data: ValidatedPortfolioData | null;
  setData: (
    next: ValidatedPortfolioData | ((p: ValidatedPortfolioData) => ValidatedPortfolioData),
  ) => void;
  name: string;
  setName: (n: string) => void;
  status: SaveStatus;
  offline: boolean;
  error: string | null;
  lastSavedAt: string | null;
  retry: () => void;
  /** Paksa flush perubahan tertunda sekarang; true kalau aman (tersimpan / tak ada yang tertunda). */
  flushNow: () => Promise<boolean>;
  loading: boolean;
};

export function usePortfolioDraft(draftId: string | null): UsePortfolioDraftResult {
  const [data, setDataState] = useState<ValidatedPortfolioData | null>(null);
  const [name, setName] = useState("Portfolio saya");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ValidatedPortfolioData | null>(null);
  const hydratedFor = useRef<string | null>(null);
  // Cermin state data: dipakai setData untuk menghitung nilai berikutnya tanpa
  // menaruh side effect ke dalam updater setState.
  const dataRef = useRef<ValidatedPortfolioData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!draftId) {
      setLoading(false);
      return;
    }
    if (hydratedFor.current === draftId) return;
    hydratedFor.current = draftId;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ draftId });
        const res = await fetch(`/api/portfolio/draft?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("gagal memuat");
        const json = (await res.json()) as CachedDraft;
        if (cancelled) return;
        setDataState(json.data);
        setName(json.name);
        setLastSavedAt(json.updatedAt);
        setOffline(false);
        writeCache(draftId, json);
      } catch {
        const cached = readCache(draftId);
        if (cancelled) return;
        if (cached) {
          setDataState(cached.data);
          setName(cached.name);
          setLastSavedAt(cached.updatedAt);
          setOffline(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (!draftId || !pending.current) return true;
    const body = pending.current;
    pending.current = null;
    setStatus("saving");
    try {
      const res = await fetch("/api/portfolio/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, name, data: body }),
      });
      if (!res.ok) throw new Error("gagal menyimpan");
      const json = (await res.json()) as { updatedAt: string };
      setStatus("saved");
      setError(null);
      setOffline(false);
      setLastSavedAt(json.updatedAt);
      writeCache(draftId, { name, data: body, updatedAt: json.updatedAt });
      return true;
    } catch {
      pending.current = body;
      setStatus("error");
      setOffline(true);
      setError("Perubahan belum masuk server. Ketuk coba lagi.");
      writeCache(draftId, { name, data: body, updatedAt: new Date().toISOString() });
      return false;
    }
  }, [draftId, name]);

  const setData = useCallback(
    (next: ValidatedPortfolioData | ((p: ValidatedPortfolioData) => ValidatedPortfolioData)) => {
      const prev = dataRef.current;
      if (!prev) return;
      const value = typeof next === "function" ? next(prev) : next;
      dataRef.current = value;
      pending.current = value;
      setDataState(value);
    },
    [],
  );

  // Jadwalkan flush dari effect, bukan dari updater setState.
  useEffect(() => {
    if (!pending.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, flush]);

  // Nama ikut di-flush bersama data berikutnya, tapi kalau hanya nama berubah
  // dan data sudah tersimpan, jadwalkan flush nama juga.
  const setNameAndSchedule = useCallback((n: string) => {
    setName(n);
    if (!pending.current) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    }
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const retry = useCallback(() => {
    if (!pending.current) return;
    void flush();
  }, [flush]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return {
    draftId,
    data,
    setData,
    name,
    setName: setNameAndSchedule,
    status,
    offline,
    error,
    lastSavedAt,
    retry,
    flushNow: flush,
    loading,
  };
}
