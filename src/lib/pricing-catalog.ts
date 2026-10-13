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
  /** Kuota tiap fitur. `false` berarti tidak termasuk, `"unlimited"` berarti tanpa batas. */
  limits?: Record<string, number | "unlimited" | false>;
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
 * Pengelompokan paket supaya pembeli tidak perlu menebak bedanya.
 *
 * Dua kelompok besar: paket satuan (dibeli sekali untuk satu kebutuhan) dan
 * paket bulanan (langganan). Paket satuan dikelompokkan lagi per produk supaya
 * yang dicari CV tidak tenggelam di antara paket lain.
 */
export type PackageGroup = "single" | "monthly";

/** Produk untuk mengelompokkan paket satuan. */
export type SingleProduct = "cv" | "checker" | "portfolio" | "writing";

const SINGLE_PRODUCT_BY_KEY: Record<string, SingleProduct> = {
  cv_starter: "cv",
  cv_ai_generate: "cv",
  single_cv: "cv",
  cv_analyzer: "checker",
  portfolio_web: "portfolio",
};

export function packageGroup(pkg: { key: string; monthly?: boolean }): PackageGroup {
  // Bulanan selalu jadi kelompok langganan; sisanya paket satuan.
  return pkg.monthly ? "monthly" : "single";
}

export function singleProductOf(key: string): SingleProduct {
  return SINGLE_PRODUCT_BY_KEY[key] ?? "writing";
}

/** Urutan tampil paket satuan: CV dulu karena paling dicari. */
export const SINGLE_PRODUCT_ORDER: readonly SingleProduct[] = ["cv", "checker", "portfolio", "writing"];

/** Label fitur untuk daftar isi paket. Satu nama fitur = satu baris benefits. */
const FEATURE_ORDER: readonly string[] = [
  "ai_cv_generate",
  "cv_analyzer",
  "ai_revision",
  "ai_suggestion",
  "cover_letter",
  "portfolio_web",
  "pdf_export",
  "bulk_analyzer",
  "white_label",
];

/**
 * Daftar isi paket dibaca dari `limits` di database, bukan ditulis manual per
 * kartu. Kalau kuota paket berubah, teksnya ikut berubah tanpa perlu disunting
 * di halaman.
 */
export function packageBenefits(pkg: CatalogPackage): { key: string; value: number | "unlimited" }[] {
  if (!pkg.limits) return [];
  return FEATURE_ORDER.filter((f) => pkg.limits?.[f] !== false && pkg.limits?.[f] !== undefined).map((f) => ({
    key: f,
    value: pkg.limits![f] as number | "unlimited",
  }));
}

/** Label satu baris isi paket, misalnya "3x cek CV" atau "Cover letter tanpa batas". */
export function benefitLabel(
  benefit: { key: string; value: number | "unlimited" },
  t: (key: string) => string,
): string {
  const name = t(`billing.limit.${benefit.key}`);
  return benefit.value === "unlimited" ? `${name} ${t("billing.limit.unlimited")}` : `${benefit.value}x ${name}`;
}

/** Masa berlaku paket dalam bahasa manusia. */
export function periodLabel(pkg: CatalogPackage, t: (key: string) => string): string {
  if (pkg.monthly) return t("billing.period.monthly");
  if (pkg.periodDays >= 365) return t("billing.period.year");
  return `${pkg.periodDays} ${t("billing.period.days")}`;
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

/**
 * Daftar lengkap paket dari katalog. Dipakai halaman tagihan supaya daftar di
 * sana sama persis dengan yang contoh di landing, bukan duplikat yang bisa
 * berbeda satu per satu.
 */
export function useCatalogPackages(): { packages: CatalogPackage[]; loading: boolean } {
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/packages", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { packages?: CatalogPackage[] } | null) => {
        if (cancelled || !data?.packages) return;
        setPackages(data.packages);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { packages, loading };
}