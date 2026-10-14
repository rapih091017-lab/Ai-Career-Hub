/**
 * Definisi paket statis (fallback dan sumber untuk paket lama).
 *
 * Dipisah dari `access.ts` supaya aturan harga bisa diuji tanpa database.
 * Sumber kebenaran saat runtime tetap tabel `packages`.
 */

export type FeatureValue = number | "unlimited" | false;

export interface StaticPackage {
  id: string;
  name: string;
  price: number;
  periodDays: number;
  monthly?: boolean;
  maxActivePortfolios: number;
  limits: Record<string, FeatureValue>;
}

// `false` berarti fitur tidak termasuk paket. Nilai literal `false` dipakai di
// sini agar tiap paket selalu menyebut semua fitur.
const NO_FEATURE = false as const;

const limits = (over: Record<string, FeatureValue> = {}) => ({
  ai_cv_generate: NO_FEATURE,
  cv_analyzer: NO_FEATURE,
  ai_revision: NO_FEATURE,
  ai_suggestion: NO_FEATURE,
  cover_letter: NO_FEATURE,
  portfolio_web: NO_FEATURE,
  pdf_export: NO_FEATURE,
  bulk_analyzer: NO_FEATURE,
  white_label: NO_FEATURE,
  ...over,
});

/** Paket yang dijual saat ini. */
export const CURRENT_PACKAGES: Record<string, StaticPackage> = {
cek_cv: {
    id: "cek_cv",
    name: "Cek CV",
    price: 9000,
    periodDays: 30,
    maxActivePortfolios: 0,
    limits: limits({ cv_analyzer: 3 }),
  },
  bikin_cv: {
    id: "bikin_cv",
    name: "Bikin CV",
    price: 19000,
    periodDays: 30,
    maxActivePortfolios: 0,
    limits: limits({ ai_cv_generate: 3, ai_revision: 5, ai_suggestion: 5, pdf_export: "unlimited" }),
  },
surat_lamaran: {
    id: "surat_lamaran",
    name: "Surat Lamaran",
    price: 9000,
    periodDays: 30,
    maxActivePortfolios: 0,
    limits: limits({ cover_letter: 2 }),
  },
portfolio_web: {
    id: "portfolio_web",
    name: "Portfolio Web",
    price: 29000,
    periodDays: 30,
    maxActivePortfolios: 1,
    // Tidak dijual terpisah lagi (lihat `UNMARKETED_PACKAGE_KEYS`). Definisi
    // ini tetap disimpan karena portfolio_web masih jadi hak di dalam Pro/Max,
    // dan pembayaran lama masih memakainya.
    limits: limits({
      portfolio_web: 1,
      pdf_export: "unlimited",
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
    }),
  },
  paket_lamaran: {
    id: "paket_lamaran",
    name: "Paket Lengkap 1 Lamaran",
    price: 34000,
    periodDays: 30,
maxActivePortfolios: 0,
    limits: limits({
      ai_cv_generate: 3,
      cv_analyzer: 3,
      ai_revision: 5,
      ai_suggestion: 5,
      cover_letter: 2,
      pdf_export: "unlimited",
    }),
  },
  lite_bulanan: {
    id: "lite_bulanan",
    name: "Lite Bulanan",
    price: 19000,
    periodDays: 30,
    monthly: true,
    maxActivePortfolios: 0,
    limits: limits({
      ai_cv_generate: 10,
      cv_analyzer: 3,
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: 5,
      pdf_export: "unlimited",
    }),
  },
  pro_bulanan: {
    id: "pro_bulanan",
    name: "Pro Bulanan",
    price: 39000,
    periodDays: 30,
    monthly: true,
    maxActivePortfolios: 1,
    limits: limits({
      ai_cv_generate: "unlimited",
      cv_analyzer: "unlimited",
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: "unlimited",
      portfolio_web: 1,
      pdf_export: "unlimited",
    }),
  },
  max_bulanan: {
    id: "max_bulanan",
    name: "Max Bulanan",
    price: 79000,
    periodDays: 30,
    monthly: true,
    maxActivePortfolios: 5,
    limits: limits({
      ai_cv_generate: "unlimited",
      cv_analyzer: "unlimited",
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: "unlimited",
      portfolio_web: "unlimited",
      pdf_export: "unlimited",
    }),
  },
};

/**
 * Paket yang tidak lagi dipasarkan sebagai produk berdiri sendiri.
 *
 * `portfolio_web` keluar dari daftar harga: sebagai produk satuan Rp29.000
 * ia terlihat seperti aset yang dibeli sekali, padahal yang sebenarnya adalah
 * komponen di dalam paket bulanan. Definisi paketnya tetap disimpan supaya
 * pembeli lama tidak kehilangan hak.
 */
export const UNMARKETED_PACKAGE_KEYS: readonly string[] = ["portfolio_web"];

/**
 * Masa percobaan portfolio web untuk pengguna tanpa paket berbayar.
 *
 * Dua hari, bukan kuota bulanan: portfolio dipakai untuk menunjukkan kerja ke
 * perekrut, jadi cukup waktu untuk mencoba. Pengguna yang sudah pernah membuat
 * portfolio sebelum aturan ini berlaku tetap punya jatah lamanya (lihat route
 * portfolio suggest).
 */
export const PORTFOLIO_TRIAL_DAYS = 2;

/**
 * Jatah pengguna tanpa paket berbayar, per bulan kalender.
 *
 * Sengaja 1 per fitur. Dulu 2-3, dan itu membuat produk satuan tidak punya
 * alasan untuk dibeli: Cek CV dijual Rp9.000 untuk 1x cek padahal gratis sudah
 * memberi 2x. Sekarang setiap paket satuan memberi minimal 2-3x dari apa yang
 * dijualnya, jadi gratis benar-benar cicipan, bukan pengganti.
 *
 * `portfolio_web` bukan kuota bulanan: masa percobaannya diatur terpisah.
 */
export const FREE_LIMITS: Record<string, number | "unlimited" | false> = {
  ai_cv_generate: 1,
  cv_analyzer: 1,
  ai_revision: 1,
  ai_suggestion: 1,
  cover_letter: 1,
  portfolio_web: 1,
  pdf_export: 1,
  bulk_analyzer: false,
  white_label: false,
};

/**
 * Paket lama: tidak dijual lagi, tapi pembayaran yang sudah dibuat masih
 * mereferensikannya. Definisi ini menjaga agar hak pembeli lama tetap hidup
 * saat database tidak bisa dibaca.
 */
export const LEGACY_PACKAGES: Record<string, StaticPackage> = {
  cv_starter: {
    id: "cv_starter",
    name: "Coba Pro 3 Hari",
    price: 7000,
    periodDays: 3,
    maxActivePortfolios: 0,
    limits: limits({
      ai_cv_generate: 10,
      cv_analyzer: 3,
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: "unlimited",
      pdf_export: "unlimited",
    }),
  },
  cv_ai_generate: {
    id: "cv_ai_generate",
    name: "CV + AI Generate",
    price: 12000,
    periodDays: 30,
    maxActivePortfolios: 0,
    limits: limits({
      ai_cv_generate: "unlimited",
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: "unlimited",
      pdf_export: "unlimited",
    }),
  },
  cv_analyzer: {
    id: "cv_analyzer",
    name: "CV Analyzer",
    price: 9000,
    periodDays: 30,
    maxActivePortfolios: 0,
    limits: limits({ cv_analyzer: 1 }),
  },
  single_cv: {
    id: "single_cv",
    name: "Single CV AI Revision",
    price: 25000,
    periodDays: 365,
    maxActivePortfolios: 0,
    limits: limits({ ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited" }),
  },
  starter_monthly: {
    id: "starter_monthly",
    name: "Starter",
    price: 15000,
    periodDays: 30,
    monthly: true,
    maxActivePortfolios: 0,
    limits: limits({ ai_cv_generate: 5, pdf_export: "unlimited" }),
  },
  pro_monthly: {
    id: "pro_monthly",
    name: "Pro",
    price: 29000,
    periodDays: 30,
    monthly: true,
    maxActivePortfolios: 0,
    limits: limits({
      ai_cv_generate: "unlimited",
      cv_analyzer: "unlimited",
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: "unlimited",
      portfolio_web: 1,
      pdf_export: "unlimited",
    }),
  },
  bundle_hemat: {
    id: "bundle_hemat",
    name: "Paket Lamaran",
    price: 49000,
    periodDays: 60,
    maxActivePortfolios: 5,
    limits: limits({
      ai_cv_generate: "unlimited",
      cv_analyzer: 1,
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: "unlimited",
      portfolio_web: "unlimited",
      pdf_export: "unlimited",
    }),
  },
  business_monthly: {
    id: "business_monthly",
    name: "Business",
    price: 79000,
    periodDays: 30,
    monthly: true,
    maxActivePortfolios: 5,
    limits: limits({
      ai_cv_generate: 20,
      cv_analyzer: "unlimited",
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: "unlimited",
      portfolio_web: 3,
      pdf_export: "unlimited",
      bulk_analyzer: "unlimited",
      white_label: "unlimited",
    }),
  },
  premium_pass_30d: {
    id: "premium_pass_30d",
    name: "Premium Pass 30 Hari",
    price: 119000,
    periodDays: 30,
    monthly: true,
    maxActivePortfolios: 5,
    limits: limits({
      ai_cv_generate: "unlimited",
      cv_analyzer: "unlimited",
      ai_revision: "unlimited",
      ai_suggestion: "unlimited",
      cover_letter: "unlimited",
      portfolio_web: "unlimited",
      pdf_export: "unlimited",
    }),
  },
};

/**
 * Batas wajar model mendalam (Cek CV) per bulan.
 *
 * Longgar jauh di atas pemakaian normal (1-2 cek per hari). Yang di luar
 * batas tidak diblokir: analisis tetap jalan, hanya memakai model ringan.
 * Klaim "tanpa batas" di kartu harga menyebut angka ini, jadi tertulis sama
 * dengan yang terjadi.
 */
export const PRO_CHECK_FAIR_USE = {
  free: 0,
  lite: 3,
  pro: 60,
  max: 120,
} as const;

export type ProCheckTier = keyof typeof PRO_CHECK_FAIR_USE;

/**
 * Paket lama dipetakan ke paket termurah yang masih memberi haknya.
 *
 * Pembeli lama tidak kehilangan apa pun (haknya tetap dari snapshot pembayaran),
 * tapi nama paketnya tidak lagi jadi "pro_monthly" atau "Bundle Hemat" yang
 * sudah tidak dijual. Yang tampil selalu paket yang sedang aktif, supaya riwayat
 * dan tier keduanya masuk akal.
 *
 * Dipilih paket termurah yang kuotanya masih menutupi paket lama, bukan paket
 * termurah tanpa syarat: `bundle_hemat` pernah memberi portfolio tanpa batas,
 * jadi padanannya Max, bukan Paket Lengkap.
 */
export const LEGACY_EQUIVALENTS: Record<string, string> = {
  cv_starter: "lite_bulanan",
  cv_ai_generate: "pro_bulanan",
  cv_analyzer: "cek_cv",
  single_cv: "lite_bulanan",
  starter_monthly: "lite_bulanan",
  pro_monthly: "pro_bulanan",
  business_monthly: "max_bulanan",
  premium_pass_30d: "max_bulanan",
  bundle_hemat: "max_bulanan",
  portfolio_web: "pro_bulanan",
};

/**
 * Kunci paket yang harus dipakai untuk ditampilkan.
 *
 * Paket yang masih dijual apa adanya dikembalikan apa adanya, jadi pemetaan ini
 * tidak merusak paket baru.
 */
export function currentEquivalentPackage(key: string): string {
  return LEGACY_EQUIVALENTS[key] ?? key;
}
