"use client";

import { useEffect, useState } from "react";

/**
 * Katalog paket milik server.
 *
 * Landing dan halaman tagihan mengambil harga dari sini supaya angka yang
 * tampil selalu sama dengan yang ditagih. Ada fallback: kalau API belum
 * sempat jawab, komponen memakai harga bawaan yang sudah ada, jadi tampilan
 * tidak pernah kosong atau meleset total.
 */

export interface CatalogPackage {
  key: string;
  name: string;
  price: number;
  periodDays: number;
  monthly: boolean;
  maxActivePortfolios: number;
}

/** Id plan di PricingSection dipetakan ke key paket di database. */
export const PLAN_ID_TO_PACKAGE_KEY: Record<string, string> = {
  "cv-starter": "cv_starter",
  "cv-ai-generate": "cv_ai_generate",
  "cv-analyzer": "cv_analyzer",
  "portfolio-web": "portfolio_web",
  starter: "starter_monthly",
  pro: "pro_monthly",
  business: "business_monthly",
};

/**
 * Paket yang memang dipasarkan di landing. Paket lain tetap bisa dibeli lewat
 * halaman tagihan, tapi tidak muncul di daftar utama supaya tidak terasa
 * tiba-tiba dan tidak butuh penjelasan.
 */
export const MARKETED_PACKAGE_KEYS: readonly string[] = [
  "cv_starter",
  "cv_ai_generate",
  "cv_analyzer",
  "portfolio_web",
  "starter_monthly",
  "pro_monthly",
  "business_monthly",
  "bundle_hemat",
];

export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

/**
 * Harga satu paket dari katalog, atau `undefined` kalau belum termuat.
 * `fallback` dipakai sampai katalog tiba.
 */
export function useCatalogPrices(): (key: string, fallback: number) => number {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/packages", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { packages?: CatalogPackage[] } | null) => {
        if (cancelled || !data?.packages) return;
        const map: Record<string, number> = {};
        for (const p of data.packages) map[p.key] = p.price;
        setPrices(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (key, fallback) => prices[key] ?? fallback;
}