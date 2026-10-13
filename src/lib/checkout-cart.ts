"use client";

import { useEffect, useRef } from "react";

/**
 * Keranjang checkout disimpan di peramban supaya pilihan paket tidak hilang
 * ketika pengguna menutup tab lalu kembali. Ini yang membuat halaman checkout
 * bisa langsung menampilkan ringkasan, bukan memintanya memilih ulang.
 *
 * Isinya bukan data sensitif: hanya kunci paket dan id CV milik pengguna itu
 * sendiri yang sudah ada di server.
 */
const CART_KEY = "ach:checkout-cart";

export interface StoredCart {
  keys: string[];
  cvId?: string;
  /** Waktu simpan terakhir; dipakai untuk membedakan keranjang basi. */
  savedAt: number;
}

/** Keranjang dianggap basi setelah 7 hari agar tidak mengikat pengguna lama. */
const CART_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function readStoredCart(): StoredCart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    if (!Array.isArray(parsed?.keys) || parsed.keys.length === 0) return null;
    const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
    if (Date.now() - savedAt > CART_MAX_AGE_MS) {
      window.localStorage.removeItem(CART_KEY);
      return null;
    }
    const keys = parsed.keys.filter((k): k is string => typeof k === "string" && k.length > 0);
    if (keys.length === 0) return null;
    return { keys, cvId: typeof parsed.cvId === "string" ? parsed.cvId : undefined, savedAt };
  } catch {
    return null;
  }
}

export function writeStoredCart(cart: { keys: string[]; cvId?: string }): void {
  if (typeof window === "undefined") return;
  try {
    if (cart.keys.length === 0) {
      window.localStorage.removeItem(CART_KEY);
      return;
    }
    window.localStorage.setItem(
      CART_KEY,
      JSON.stringify({ keys: cart.keys, cvId: cart.cvId, savedAt: Date.now() } satisfies StoredCart),
    );
  } catch {
    // Penyimpanan peramban penuh atau diblokir: checkout tetap bisa jalan.
  }
}

export function clearStoredCart(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CART_KEY);
  } catch {
    // diam saja
  }
}

/**
 * Catat niat checkout supaya keranjang yang ditinggalkan bisa dipicu follow-up
 * nanti. Debounce supaya mengetik atau mencet PackageMode tidak Createsatu
 * permintaan per ketikan.
 */
export function useCheckoutIntent(
  keys: string[],
  amount: number | undefined,
  cvId: string | undefined,
  enabled: boolean,
): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef<string>("");

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const payload = keys.join(",");
    if (keys.length === 0) {
      // Keranjang kosong: tutup niat yang masih terbuka.
      fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageKeys: [] }),
        keepalive: true,
      }).catch(() => {});
      lastSent.current = "";
      return;
    }
    if (lastSent.current === payload) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastSent.current = payload;
      fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageKeys: keys, amount, cvDocumentId: cvId }),
      }).catch(() => {});
    }, 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [keys.join(","), amount, cvId, enabled]);
}

/** Tandai niat sebagai "sudah buat order" supaya tidak dihitung menggantung. */
export function markCheckoutStarted(paymentId?: string): void {
  fetch("/api/checkout/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "started", paymentId }),
    keepalive: true,
  }).catch(() => {});
}