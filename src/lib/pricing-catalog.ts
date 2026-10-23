"use client";

import { useEffect, useState } from "react";
import { CURRENT_PACKAGES } from "@/lib/package-catalog-static";

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

/** Pemetaan plan lama di landing → kunci paket di katalog. */
/**
 * Peta backwards-compatible untuk plan id lama, kalau ada tautan lama yang
 * masih membawa `?plan=`. Plan id sekarang sama dengan kunci paket, jadi peta
 * ini hanya untuk tautan lama.
 */
export const PLAN_ID_TO_PACKAGE_KEY: Record<string, string> = {
  "cv-starter": "bikin_cv",
  "cv-ai-generate": "bikin_cv",
  "cv-analyzer": "cek_cv",
  starter: "lite_bulanan",
  pro: "pro_bulanan",
  business: "max_bulanan",
  bundle: "paket_lamaran",
  // Plan id yang sekarang sama dengan kunci paket.
  cek_cv: "cek_cv",
  bikin_cv: "bikin_cv",
  surat_lamaran: "surat_lamaran",
  paket_lamaran: "paket_lamaran",
  lite_bulanan: "lite_bulanan",
  pro_bulanan: "pro_bulanan",
  max_bulanan: "max_bulanan",
};

/**
 * Paket yang memang dipasarkan di landing dan di checkout.
 *
 * `portfolio_web` sengaja tidak ada di sini. Sebagai produk satuan Rp29.000 ia
 * terbaca seperti aset yang dibeli sekali, padahal yang sebenarnya adalah
 * fitur di dalam paket bulanan: orang yang butuh portfolio serius akan ambil
 * Pro atau Max, bukan membeli tautan sekali pakai. Portofolio gratis tetap
 * ada sebagai percobaan 2 hari.
 */
export const MARKETED_PACKAGE_KEYS: readonly string[] = [
  "cek_cv",
  "bikin_cv",
  "surat_lamaran",
  "paket_lamaran",
  "lite_bulanan",
  "pro_bulanan",
  "max_bulanan",
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
  cek_cv: "checker",
  bikin_cv: "cv",
  surat_lamaran: "writing",
  paket_lamaran: "cv",
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
  const benefits = FEATURE_ORDER.filter((f) => pkg.limits?.[f] !== false && pkg.limits?.[f] !== undefined).map((f) => ({
    key: f,
    value: pkg.limits![f] as number | "unlimited",
  }));

  // LinkedIn Optimizer memakai jatah cv_analyzer yang sama, dengan penghitung
  // terpisah. Barisnya ditampilkan sendiri supaya pembeli tahu fitur ini ikut
  // tanpa menambah kolom baru di katalog atau database.
  const analyzer = pkg.limits.cv_analyzer;
  if (analyzer !== false && analyzer !== undefined) {
    const index = benefits.findIndex((benefit) => benefit.key === "cv_analyzer");
    benefits.splice(index + 1, 0, { key: "linkedin_optimizer", value: analyzer });
  }

  return benefits;
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
 * Nama paket yang ditampilkan untuk satu baris pembayaran.
 *
 * Satu order bisa memuat beberapa paket ("cek_cv+bikin_cv"), dan pembayaran
 * lama bisa memuat paket yang sudah tidak dijual. Kuncinya dipetakan ke paket
 * yang sedang aktif dulu, lalu namanya diambil dari katalog, supaya riwayat
 * tidak pernah menampilkan `bundle_hemat` atau `pro_monthly` mentah ke user.
 */
export function describePackageKeys(
  type: string,
  nameByKey: Record<string, string>,
  equivalent: (key: string) => string = (key) => key,
): string {
  const names = type
    .split("+")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((key) => {
      const resolved = equivalent(key);
      return nameByKey[resolved] ?? resolved;
    });
  return names.length > 0 ? names.join(" + ") : type;
}

/**
 * Bentuk katalog dari definisi statis di `package-catalog-static`.
 *
 * Dipakai sebagai data awal sebelum jawaban dari /api/packages datang. Tanpa ini,
 * render pertama tabel perbandingan mengisi semua kolom berbayar dengan "—",
 * dan kalau JavaScript gagal atau lambat, pengunjung tidak melihat harga
 * paket mana pun sama sekali.
 *
 * Hanya paket yang memang dijual. Sumber kebenaran tetap tabel `packages`;
 * begitu jawabannya sampai, nilainya diganti dengan yang dari database.
 */
function staticCatalogPackages(): CatalogPackage[] {
  return MARKETED_PACKAGE_KEYS.map((key) => {
    const pkg = CURRENT_PACKAGES[key];
    return {
      key,
      name: pkg.name,
      price: pkg.price,
      periodDays: pkg.periodDays,
      monthly: Boolean(pkg.monthly),
      maxActivePortfolios: pkg.maxActivePortfolios,
      limits: pkg.limits,
    };
  });
}

/**
 * Harga satu paket dari katalog, atau `undefined` kalau belum termuat.
 * `fallback` dipakai sampai katalog tiba.
 */
export function useCatalogPrices(): (key: string, fallback: number) => number {
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(MARKETED_PACKAGE_KEYS.map((key) => [key, CURRENT_PACKAGES[key].price])),
  );

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
  const [packages, setPackages] = useState<CatalogPackage[]>(staticCatalogPackages);
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