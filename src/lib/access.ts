import { db } from "@/db";
import { payments, packages as packagesTable } from "@/db/schema";
import { eq, and, gte, asc } from "drizzle-orm";
import { normalizePackageLimits } from "@/lib/package-limits";
import { CURRENT_PACKAGES, UNMARKETED_PACKAGE_KEYS, FREE_LIMITS as STATIC_FREE_LIMITS, currentEquivalentPackage } from "@/lib/package-catalog-static";

/* â”€â”€â”€ Feature Keys â”€â”€â”€ */
export type Feature =
  | "ai_cv_generate"
  | "cv_analyzer"
  | "ai_revision"
  | "ai_suggestion"
  | "cover_letter"
  | "portfolio_web"
  | "pdf_export"
  | "bulk_analyzer"
  | "white_label";

/* â”€â”€â”€ Package Definitions â”€â”€â”€ */
export interface PackageDef {
  id: string;
  name: string;
  price: number;
  periodDays: number;
  monthly?: boolean;
  maxActivePortfolios: number;
  limits: Record<Feature, number | "unlimited" | false>;
}

/**
 * Master list paket.
 *
 * Dua peran:
 * 1. Fallback saat database tidak bisa dibaca.
 * 2. Sumber untuk paket lama yang sudah tidak dijual, supaya pembayaran yang
 *    sudah dibuat sebelumnya tetap resolve dan pembeli tidak kehilangan haknya.
 *
 * Paket yang dijual saat ini ada di tabel `packages` (kolom `active = true`).
 */
export const PACKAGES: Record<string, PackageDef> = {
  // ── SATUAN ──
  cek_cv: {
    id: "cek_cv", name: "Cek CV", price: 9000, periodDays: 30, maxActivePortfolios: 0,
    limits: { ai_cv_generate: false, cv_analyzer: 3, ai_revision: false, ai_suggestion: false, cover_letter: false, portfolio_web: false, pdf_export: false, bulk_analyzer: false, white_label: false },
  },
  bikin_cv: {
    id: "bikin_cv", name: "Bikin CV", price: 19000, periodDays: 30, maxActivePortfolios: 0,
    limits: { ai_cv_generate: 3, cv_analyzer: false, ai_revision: 5, ai_suggestion: 5, cover_letter: false, portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  surat_lamaran: {
    id: "surat_lamaran", name: "Surat Lamaran", price: 9000, periodDays: 30, maxActivePortfolios: 0,
    limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: false, ai_suggestion: false, cover_letter: 2, portfolio_web: false, pdf_export: false, bulk_analyzer: false, white_label: false },
  },
  paket_lamaran: {
    id: "paket_lamaran", name: "Paket Lengkap 1 Lamaran", price: 34000, periodDays: 30, maxActivePortfolios: 0,
    limits: { ai_cv_generate: 3, cv_analyzer: 3, ai_revision: 5, ai_suggestion: 5, cover_letter: 2, portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },

  // ── BULANAN (30 hari, dibayar sekali) ──
  lite_bulanan: {
    id: "lite_bulanan", name: "Lite Bulanan", price: 19000, periodDays: 30, monthly: true, maxActivePortfolios: 0,
    limits: { ai_cv_generate: 10, cv_analyzer: 3, ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: 5, portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  pro_bulanan: {
    id: "pro_bulanan", name: "Pro Bulanan", price: 39000, periodDays: 30, monthly: true, maxActivePortfolios: 1,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: 1, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  max_bulanan: {
    id: "max_bulanan", name: "Max Bulanan", price: 79000, periodDays: 30, monthly: true, maxActivePortfolios: 5,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: "unlimited", pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },

  // ── LAMA: tidak dijual lagi, tapi pembayaran lama masih memakainya ──
  portfolio_web: {
    id: "portfolio_web", name: "Portfolio Web", price: 29000, periodDays: 30, maxActivePortfolios: 1,
    limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: false, portfolio_web: 1, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  cv_starter: {
    id: "cv_starter", name: "Coba Pro 3 Hari", price: 7000, periodDays: 3, maxActivePortfolios: 0,
    limits: { ai_cv_generate: 10, cv_analyzer: 3, ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  cv_ai_generate: {
    id: "cv_ai_generate", name: "CV + AI Generate", price: 12000, periodDays: 30, maxActivePortfolios: 0,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: false, ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  cv_analyzer: {
    id: "cv_analyzer", name: "CV Analyzer", price: 9000, periodDays: 30, maxActivePortfolios: 0,
    limits: { ai_cv_generate: false, cv_analyzer: 1, ai_revision: false, ai_suggestion: false, cover_letter: false, portfolio_web: false, pdf_export: false, bulk_analyzer: false, white_label: false },
  },
  bundle_hemat: {
    id: "bundle_hemat", name: "Paket Lamaran", price: 49000, periodDays: 60, maxActivePortfolios: 5,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: 1, ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: "unlimited", pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },

  // SINGLE CV (lama)
  single_cv: {
    id: "single_cv", name: "Single CV AI Revision", price: 25000, periodDays: 365, maxActivePortfolios: 0,
    limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: false, pdf_export: false, bulk_analyzer: false, white_label: false },
  },

  // BULANAN (lama)
  premium_pass_30d: {
    id: "premium_pass_30d", name: "Premium Pass 30 Hari", price: 119000, periodDays: 30, monthly: true, maxActivePortfolios: 5,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: "unlimited", pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  starter_monthly: {
    id: "starter_monthly", name: "Starter", price: 15000, periodDays: 30, monthly: true, maxActivePortfolios: 0,
    limits: { ai_cv_generate: 5, cv_analyzer: false, ai_revision: false, ai_suggestion: false, cover_letter: false, portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  pro_monthly: {
    id: "pro_monthly", name: "Pro", price: 29000, periodDays: 30, monthly: true, maxActivePortfolios: 0,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: 1, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  business_monthly: {
    id: "business_monthly", name: "Business", price: 79000, periodDays: 30, monthly: true, maxActivePortfolios: 5,
    limits: { ai_cv_generate: 20, cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", cover_letter: "unlimited", portfolio_web: 3, pdf_export: "unlimited", bulk_analyzer: "unlimited", white_label: "unlimited" },
  },
};

/* â”€â”€â”€ Get Packages from DB (with fallback to hardcoded) â”€â”€â”€ */

interface DbPackageRow {
  key: string;
  name: string;
  price: number;
  periodDays: number;
  monthly: boolean | null;
  limits: Record<string, number | "unlimited" | false> | null;
  active: boolean;
}

let packagesCache: Record<string, PackageDef> | null = null;
let cacheTimestamp = 0;
// Cache ini hanya menahan lonjakan permintaan berdekatan, bukan untuk
// menahan perubahan. Dulu 60 detik, jadi harga yang baru diubah di panel
// admin baru terlihat di situs setelah satu menit, dan admin mengira
// simpanannya gagal.
const CACHE_TTL_MS = 10_000;

/**
 * Katalog cadangan ketika database tidak bisa dibaca.
 *
 * Hanya paket yang memang dijual: paket lama yang sudah tidak dipasarkan
 * tidak boleh muncul di halaman harga karena DB sempat kosong atau error.
 */
function sellableFallback(): Record<string, PackageDef> {
  const out: Record<string, PackageDef> = {};
  for (const key of Object.keys(CURRENT_PACKAGES)) {
    if (UNMARKETED_PACKAGE_KEYS.includes(key)) continue;
    if (PACKAGES[key]) out[key] = PACKAGES[key];
  }
  return out;
}

function dbRowToPackageDef(row: DbPackageRow): PackageDef {
  const hardcoded = PACKAGES[row.key];
  // Bentuk teks di database pernah terjadi. Kalau tidak diparsing, paket yang
  // sudah dibayar tidak membuka fiturnya.
  const limits = (normalizePackageLimits(row.limits) ??
    hardcoded?.limits ??
    FREE_LIMITS) as Record<Feature, number | "unlimited" | false>;
  return {
    id: row.key,
    name: row.name,
    price: row.price,
    periodDays: row.periodDays,
    monthly: row.monthly || undefined,
    maxActivePortfolios: hardcoded?.maxActivePortfolios ?? 0,
    limits,
  };
}

export async function getPackagesDb(): Promise<Record<string, PackageDef>> {
  // Return cache if fresh
  if (packagesCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return packagesCache;
  }

  try {
    const rows = await db
      .select({
        key: packagesTable.key,
        name: packagesTable.name,
        price: packagesTable.price,
        periodDays: packagesTable.periodDays,
        monthly: packagesTable.monthly,
        limits: packagesTable.limits,
        active: packagesTable.active,
      })
      .from(packagesTable)
      .where(eq(packagesTable.active, true))
      .orderBy(packagesTable.sortOrder);

    if (rows.length === 0) {
      // DB kosong, fallback ke hardcoded
      packagesCache = sellableFallback();
      cacheTimestamp = Date.now();
      return packagesCache;
    }

    const result: Record<string, PackageDef> = {};
    for (const row of rows) {
      if (row.active) {
        result[row.key] = dbRowToPackageDef(row);
      }
    }

    packagesCache = result;
    cacheTimestamp = Date.now();
    return result;
  } catch (error) {
    console.error("Failed to fetch packages from DB, using hardcoded:", error);
    packagesCache = sellableFallback();
    cacheTimestamp = Date.now();
    return packagesCache;
  }
}

/* â”€â”€â”€ Default free limits â”€â”€â”€ */
/**
 * Jatah pengguna tanpa paket berbayar.
 *
 * Sumber tunggalnya ada di `package-catalog-static.ts` supaya komponen client
 * (kartu harga di landing) dan server (penegakan kuota) memakai angka yang
 * sama. Kalau bedanya, tabel perbandingan bisa saja menampilkan gratis
 * lebih besar dari paket yang dijual.
 */
export const FREE_LIMITS = STATIC_FREE_LIMITS as Record<
  Feature,
  number | "unlimited" | false
>;

/* â”€â”€â”€ User Access Result â”€â”€â”€ */
export interface UserAccess {
  /** Best-tier package name for display */
  tierName: string;
  /** Merged limits (highest from all active packages) */
  limits: Record<Feature, number | "unlimited" | false>;
  /** Premium flag (has any paid active package) */
  isPremium: boolean;
  /** Fitur yang benar-benar diberikan paket berbayar (bukan kuota gratis).
   * Dipakai untuk gate model AI premium, mis. pembeli portfolio_web TIDAK
   * dapat R1 walau free limit cv_analyzer = 2. */
  purchasedFeatures: Record<Feature, number | "unlimited" | false>;
  /** Active packages list */
  activePackages: string[];
  /** Max active portfolios count */
  maxActivePortfolios: number;
  packageDef?: {
    maxActivePortfolios: number;
  };
}

export function maxActivePortfoliosFor(access: UserAccess): number {
  return access.maxActivePortfolios ?? access.packageDef?.maxActivePortfolios ?? 1;
}

/**
 * Get merged user access from all active payments.
 * Merged = highest value wins across all active packages.
 */
export async function getUserAccess(userId: string): Promise<UserAccess> {
  const now = new Date();

  const activePayments = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.paymentStatus, "success"),
        gte(payments.expiresAt, now),
      ),
    );

  const activePackageIds = new Set<string>();
  const merged: Record<Feature, number | "unlimited" | false> = { ...FREE_LIMITS };
  // Baseline tanpa kuota gratis, hanya fitur yang benar-benar dibeli pengguna.
  const purchased: Record<Feature, number | "unlimited" | false> = Object.fromEntries(
    Object.keys(FREE_LIMITS).map((k) => [k, false]),
  ) as Record<Feature, number | "unlimited" | false>;
  const allPackages = await getPackagesDb();
  let maxActivePortfolios = 1;

  for (const payment of activePayments) {
    // Satu baris payment bisa memuat beberapa paket: checkout menggabungkan
    // pilihan jadi `packageType` berformat "cek_cv+bikin_cv". Kalau string itu
    // dicari apa adanya, tidak ada yang cocok dan pembeli sudah bayar tapi
    // tidak dapat apa-apa. Jadi dipecah per paket.
    const keys = (payment.packageType || "")
      .split("+")
      .map((k) => k.trim())
      .filter(Boolean);
    const pkgs = keys
      .map((key) => allPackages[key] || PACKAGES[key])
      .filter((p): p is PackageDef => Boolean(p));
    if (pkgs.length === 0) continue;

    for (const pkg of pkgs) {
      // Identitasnya dipetakan ke paket yang sedang dijual supaya tier dan
      // daftar paket aktif tidak menampilkan "Bundle Hemat" yang sudah dihapus.
      // Hak itself tetap dari definisi lama atau snapshot, jadi tidak ada yang
      // berkurang untuk pembeli lama.
      activePackageIds.add(currentEquivalentPackage(pkg.id));
      if (pkg.maxActivePortfolios > 0) {
        maxActivePortfolios = Math.max(maxActivePortfolios, pkg.maxActivePortfolios);
      }
    }

    // Snapshot limits diambil saat order dibuat, definisi fitur terkunci apa
    // adanya saat user bayar. Fallback ke katalog saat ini untuk order lama
    // (sebelum fitur snapshot ada). Untuk order gabungan, snapshot-nya sudah
    // hasil gabungan jadi dipakai sekali, bukan digabung paket per paket.
    const snapshot = payment.limits && Object.keys(payment.limits).length > 0
      ? payment.limits
      : null;
    const limitSources = snapshot ? [snapshot] : pkgs.map((p) => p.limits);

    for (const source of limitSources) {
      for (const [feat, limit] of Object.entries(source) as [Feature, number | "unlimited" | false][]) {
        for (const acc of [merged, purchased]) {
          if (limit === "unlimited") {
            acc[feat] = "unlimited";
          } else if (limit !== false && acc[feat] !== "unlimited") {
            if (typeof acc[feat] === "number") {
              acc[feat] = Math.max(acc[feat] as number, limit);
            } else {
              acc[feat] = limit;
            }
          }
        }
      }
    }
  }

  const activePackages = [...activePackageIds];
  const isPremium = activePackages.length > 0;

  // Determine best tier name
  // Urutan dari yang paling tinggi. Semua kunci paket yang dijual hari ini
  // harus ada di sini: kalau tidak, `tierName` jatuh ke "Free" padahal
  // `isPremium` true, jadi orang yang baru bayar membaca "Free" di header.
  const tierPriority = [
    "max_bulanan",
    "business_monthly",
    "pro_bulanan",
    "premium_pass_30d",
    "pro_monthly",
    "lite_bulanan",
    "starter_monthly",
    "bundle_hemat",
    "paket_lamaran",
    "portfolio_web",
    "bikin_cv",
    "surat_lamaran",
    "cek_cv",
    "cv_ai_generate",
    "cv_starter",
    "single_cv",
    "cv_analyzer",
  ];
  let tierName = "Free";
  for (const id of tierPriority) {
    if (activePackageIds.has(id)) {
      tierName = allPackages[id]?.name || PACKAGES[id]?.name || "Premium";
      break;
    }
  }

  return {
    tierName,
    limits: merged,
    purchasedFeatures: purchased,
    isPremium,
    activePackages,
    maxActivePortfolios,
    packageDef: { maxActivePortfolios },
  };
}
