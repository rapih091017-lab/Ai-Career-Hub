import { db } from "@/db";
import { payments, packages as packagesTable } from "@/db/schema";
import { eq, and, gte, asc } from "drizzle-orm";

/* ─── Feature Keys ─── */
export type Feature =
  | "ai_cv_generate"
  | "cv_analyzer"
  | "ai_revision"
  | "ai_suggestion"
  | "portfolio_web"
  | "pdf_export"
  | "bulk_analyzer"
  | "white_label";

/* ─── Package Definitions ─── */
export interface PackageDef {
  id: string;
  name: string;
  price: number;
  periodDays: number;
  monthly?: boolean;
  limits: Record<Feature, number | "unlimited" | false>;
}

/**
 * Master list of all buyable packages.
 * Sync this with PricingSection.tsx plans.
 */
export const PACKAGES: Record<string, PackageDef> = {
  // ── SATUAN ──
  cv_starter: {
    id: "cv_starter", name: "CV Starter", price: 7000, periodDays: 7,
    limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: false, ai_suggestion: false, portfolio_web: false, pdf_export: 1, bulk_analyzer: false, white_label: false },
  },
  cv_ai_generate: {
    id: "cv_ai_generate", name: "CV + AI Generate", price: 12000, periodDays: 30,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: false, ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  cv_analyzer: {
    id: "cv_analyzer", name: "CV Analyzer", price: 9000, periodDays: 30,
    limits: { ai_cv_generate: false, cv_analyzer: 1, ai_revision: false, ai_suggestion: false, portfolio_web: false, pdf_export: false, bulk_analyzer: false, white_label: false },
  },
  portfolio_web: {
    id: "portfolio_web", name: "Portfolio Web", price: 35000, periodDays: 30,
    limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: false, ai_suggestion: false, portfolio_web: 1, pdf_export: false, bulk_analyzer: false, white_label: false },
  },
  bundle_hemat: {
    id: "bundle_hemat", name: "Bundle Hemat", price: 49000, periodDays: 60,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: 1, ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: 1, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },

  // ── SINGLE CV (legacy) ──
  single_cv: {
    id: "single_cv", name: "Single CV AI Revision", price: 25000, periodDays: 365,
    limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: false, pdf_export: false, bulk_analyzer: false, white_label: false },
  },

  // ── LANGGANAN BULANAN ──
  premium_pass_30d: {
    id: "premium_pass_30d", name: "Premium Pass 30 Hari", price: 119000, periodDays: 30, monthly: true,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: "unlimited", pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  starter_monthly: {
    id: "starter_monthly", name: "Starter", price: 15000, periodDays: 30, monthly: true,
    limits: { ai_cv_generate: 5, cv_analyzer: false, ai_revision: false, ai_suggestion: false, portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  pro_monthly: {
    id: "pro_monthly", name: "Pro", price: 29000, periodDays: 30, monthly: true,
    limits: { ai_cv_generate: "unlimited", cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: 1, pdf_export: "unlimited", bulk_analyzer: false, white_label: false },
  },
  business_monthly: {
    id: "business_monthly", name: "Business", price: 79000, periodDays: 30, monthly: true,
    limits: { ai_cv_generate: 20, cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: 3, pdf_export: "unlimited", bulk_analyzer: "unlimited", white_label: "unlimited" },
  },
};

/* ─── Get Packages from DB (with fallback to hardcoded) ─── */

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
const CACHE_TTL_MS = 60_000; // 1 menit

function dbRowToPackageDef(row: DbPackageRow): PackageDef {
  const hardcoded = PACKAGES[row.key];
  return {
    id: row.key,
    name: row.name,
    price: row.price,
    periodDays: row.periodDays,
    monthly: row.monthly || undefined,
    limits: row.limits || hardcoded?.limits || FREE_LIMITS,
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
      packagesCache = { ...PACKAGES };
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
    packagesCache = { ...PACKAGES };
    cacheTimestamp = Date.now();
    return packagesCache;
  }
}

/* ─── Default free limits ─── */
export const FREE_LIMITS: Record<Feature, number | "unlimited" | false> = {
  ai_cv_generate: 2,
  cv_analyzer: 2,
  ai_revision: 3,
  ai_suggestion: 3,
  portfolio_web: false,
  pdf_export: 2,
  bulk_analyzer: false,
  white_label: false,
};

/* ─── User Access Result ─── */
export interface UserAccess {
  /** Best-tier package name for display */
  tierName: string;
  /** Merged limits (highest from all active packages) */
  limits: Record<Feature, number | "unlimited" | false>;
  /** Premium flag (has any paid active package) */
  isPremium: boolean;
  /** Active packages list */
  activePackages: string[];
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
  const allPackages = await getPackagesDb();

  for (const payment of activePayments) {
    const pkg = allPackages[payment.packageType] || PACKAGES[payment.packageType];
    if (!pkg) continue;
    activePackageIds.add(pkg.id);

    for (const [feat, limit] of Object.entries(pkg.limits) as [Feature, number | "unlimited" | false][]) {
      if (limit === "unlimited") {
        merged[feat] = "unlimited";
      } else if (limit !== false && merged[feat] !== "unlimited") {
        if (typeof merged[feat] === "number") {
          merged[feat] = Math.max(merged[feat] as number, limit);
        } else {
          merged[feat] = limit;
        }
      }
    }
  }

  const activePackages = [...activePackageIds];
  const isPremium = activePackages.length > 0;

  // Determine best tier name
  const tierPriority = ["business_monthly", "pro_monthly", "premium_pass_30d", "starter_monthly", "bundle_hemat", "cv_ai_generate", "cv_starter", "single_cv", "cv_analyzer", "portfolio_web"];
  let tierName = "Free";
  for (const id of tierPriority) {
    if (activePackageIds.has(id)) {
      tierName = allPackages[id]?.name || PACKAGES[id]?.name || "Premium";
      break;
    }
  }

  return { tierName, limits: merged, isPremium, activePackages };
}
