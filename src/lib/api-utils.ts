import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { adminUsers, usageLogs } from "@/db/schema";
import { eq, and, count as countFn, gte, sql } from "drizzle-orm";
import { getUserAccess } from "@/lib/access";

/* ─── Error response shape ─── */
export interface ApiError {
  error: string;
  message: string;
  redirectUrl?: string;
}

/* ─── Success response shape ─── */
export type ApiResult<T> = { data: T } | ApiError;

/* ─── Consistent error responses ─── */
export function errorResponse(
  error: string,
  message: string,
  status: number = 400,
  extras?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error, message, ...extras } satisfies ApiError, { status });
}

/* ─── Auth helpers ─── */
export async function withAuth(): Promise<
  | { userId: string }
  | NextResponse
> {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(
      "AUTH_REQUIRED",
      "Anda harus login terlebih dahulu",
      401,
    ) as NextResponse;
  }
  return { userId: session.user.id };
}

export async function withAdmin(): Promise<
  | { userId: string; email: string }
  | NextResponse
> {
  const session = await auth();
  if (!session?.user?.email) {
    return errorResponse("UNAUTHORIZED", "Hanya admin yang bisa mengakses endpoint ini.", 403) as NextResponse;
  }
  const raw = process.env.ADMIN_EMAILS || "";
  const adminEmails = raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const email = session.user.email.toLowerCase();
  if (adminEmails.includes(email)) {
    return { userId: session.user.id, email: session.user.email };
  }

  // Admin tambahan dari dashboard (tabel admin_users), supaya menambah admin
  // tidak perlu mengubah environment variable dan deploy ulang.
  try {
    const [row] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);
    if (row) {
      return { userId: session.user.id, email: session.user.email };
    }
  } catch (dbError) {
    console.error("[withAdmin] gagal memeriksa admin_users:", dbError instanceof Error ? dbError.message : dbError);
  }

  return errorResponse("UNAUTHORIZED", "Hanya admin yang bisa mengakses endpoint ini.", 403) as NextResponse;
}

/* ─── Error boundary wrapper ─── */
export function apiHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse | void>,
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const result = await handler(request, ...args);
      return result ?? NextResponse.json({ success: true });
    } catch (error) {
      console.error(`[API Error] ${request.nextUrl.pathname}:`, error);
      const message =
        process.env.NODE_ENV === "production"
          ? "Terjadi kesalahan server. Silakan coba lagi."
          : `Terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}`;
      return errorResponse("SERVER_ERROR", message, 500);
    }
  };
}

/* ─── Cache control helpers ─── */
export function staleWhileRevalidate(seconds: number = 60): Record<string, string> {
  return {
    "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 10}`,
  };
}

export function noCache(): Record<string, string> {
  return {
    "Cache-Control": "private, no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

/** Paket yang menjual fitur tertentu, dipakai untuk mengarahkan pengguna yang
 *  fiturnya tidak termasuk ke tempat yang benar. */
const PACKAGE_SELLING_FEATURE: Record<string, string> = {
  cv_analyzer: "Paket Cek CV",
  cover_letter: "Paket Surat Lamaran",
  ai_cv_generate: "Paket Bikin CV",
  portfolio_web: "Paket Pro",
  ai_revision: "Paket Pro",
  ai_suggestion: "Paket Pro",
  pdf_export: "Paket Bikin CV",
};

const LIMIT_KEY_LABEL: Record<string, string> = {
  ai_suggestion: "saran perbaikan",
  ai_revision: "penulisan ulang",
  checker_check: "cek CV",
  cv_build: "pembuatan CV",
  portfolio_generate: "portfolio web",
  pdf_export: "ekspor PDF",
  cover_letter_generate: "surat lamaran",
};

const FEATURE_NOT_AVAILABLE_LABEL: Record<string, string> = {
  ...LIMIT_KEY_LABEL,
  cv_analyzer: "cek CV",
  cover_letter: "surat lamaran",
  ai_cv_generate: "pembuatan CV",
  pdf_export: "ekspor PDF",
  portfolio_web: "portfolio web",
  ai_revision: "penulisan ulang",
  ai_suggestion: "saran perbaikan",
};

/**
 * Awal bulan berjalan dalam UTC. Dipakai bersama oleh checkQuota dan
 * /api/usage supaya angka kuota di halaman tagihan sama dengan yang ditegakkan,
 * apa pun zona waktu server.
 */
export function startOfMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/* ─── Quota check helper ─── */
export type QuotaAction =
  | "ai_suggestion"
  | "ai_revision"
  | "checker_check"
  | "cv_build"
  | "portfolio_generate"
  | "pdf_export"
  | "cover_letter_generate";

const QUOTA_LIMIT_KEY: Record<QuotaAction, string> = {
  ai_suggestion: "ai_suggestion",
  ai_revision: "ai_revision",
  checker_check: "cv_analyzer",
  portfolio_generate: "portfolio_web",
  pdf_export: "pdf_export",
  cover_letter_generate: "cover_letter",
  // Paket menjual fitur ini sebagai ai_cv_generate; log tetap "cv_build".
  cv_build: "ai_cv_generate",
};

/** Ambil limit paket untuk aksi; respons 403 bila fitur tidak tersedia. */
async function resolveQuotaLimit(
  userId: string,
  actionType: QuotaAction,
): Promise<{ limit: number | "unlimited"; label: string; isPremium: boolean } | NextResponse> {
  const access = await getUserAccess(userId);
  const limitKey = QUOTA_LIMIT_KEY[actionType] ?? actionType;
  const limit = (access.limits as Record<string, number | "unlimited" | false>)[limitKey];
  const label = FEATURE_NOT_AVAILABLE_LABEL[actionType] ?? actionType;

  if (limit === undefined) {
    // Key yang tidak terdaftar di paket berarti pemetaan di atas salah.
    // Tolak, jangan anggap tanpa batas.
    console.error(`[checkQuota] limit untuk "${limitKey}" (${actionType}) tidak ada di paket ${access.tierName}`);
    return errorResponse(
      "FEATURE_NOT_AVAILABLE",
      `${label} tidak tersedia di paket kamu.`,
      403,
    ) as NextResponse;
  }

  if (limit === false) {
    // Paket berbayar pun bisa punya fitur yang tidak termasuk, jadi pesannya
    // menyebut paket yang memang menjual fitur itu, bukan "upgrade" generik.
    const owner = PACKAGE_SELLING_FEATURE[limitKey];
    return errorResponse(
      "FEATURE_NOT_AVAILABLE",
      owner
        ? `${label} tidak termasuk di paket yang kamu punya. ${owner} sudah memuatnya.`
        : `${label} tidak tersedia di paket kamu.`,
      403,
    ) as NextResponse;
  }

  return { limit, label, isPremium: access.isPremium };
}

function quotaExceededResponse(label: string, limit: number, isPremium: boolean, period: QuotaPeriod = "month"): NextResponse {
  if (period === "lifetime") {
    // Jatah seumur akun: tidak pulih tanggal 1.
    return errorResponse(
      "QUOTA_EXCEEDED",
      `Batas ${label} sudah terpakai (${limit}/${limit}). Naik paket lewat halaman tagihan untuk menambah jatah.`,
      403,
    ) as NextResponse;
  }
  // Dua kasus yang perlu kalimat berbeda: pengguna yang belum bayar, dan
  // pengguna yang sudah membayar lalu kehabisan kuota. Memberi tahu orang
  // yang sudah beli "upgrade" adalah cara tercepat jadi tiket kecewa.
  const extra = isPremium
    ? `Kuotanya habis bulan ini, sudah termasuk dalam paket yang kamu beli.`
    : `Kuota paketmu bulan ini sudah habis.`;
  return errorResponse(
    "QUOTA_EXCEEDED",
    `${label} sudah terpakai ${limit}/${limit}. ${extra} Bisa dipakai lagi tanggal 1, atau naik paket lewat halaman tagihan.`,
    403,
  ) as NextResponse;
}

/** Periode hitung kuota: "month" = sejak tanggal 1 (UTC), "lifetime" = seumur akun. */
export type QuotaPeriod = "month" | "lifetime";
export interface QuotaOptions {
  period?: QuotaPeriod;
}

/**
 * Periode yang ditegakkan per aksi. ai_suggestion & ai_revision sengaja
 * seumur akun (menekan biaya AI); /api/usage memakai peta yang sama.
 */
export const QUOTA_PERIOD: Record<QuotaAction, QuotaPeriod> = {
  ai_suggestion: "lifetime",
  ai_revision: "lifetime",
  checker_check: "month",
  cv_build: "month",
  portfolio_generate: "month",
  pdf_export: "month",
  cover_letter_generate: "month",
};

function usageWhere(userId: string, actionType: string, period: QuotaPeriod) {
  const base = [eq(usageLogs.userId, userId), eq(usageLogs.actionType, actionType)];
  return period === "lifetime" ? and(...base) : and(...base, gte(usageLogs.createdAt, startOfMonthUtc()));
}

export async function checkQuota(
  userId: string,
  actionType: QuotaAction,
  opts: QuotaOptions = {},
): Promise<{ allowed: true } | NextResponse> {
  const period = opts.period ?? "month";
  const resolved = await resolveQuotaLimit(userId, actionType);
  if (resolved instanceof NextResponse) return resolved;
  const { limit, label, isPremium } = resolved;

  if (limit !== "unlimited") {
    const [usageRow] = await db
      .select({ value: countFn() })
      .from(usageLogs)
      .where(usageWhere(userId, actionType, period));

    if (usageRow.value >= limit) {
      return quotaExceededResponse(label, limit, isPremium, period);
    }
  }

  return { allowed: true };
}

/* ─── Reservasi kuota (anti-race) ─── */
export interface QuotaReservation {
  /** Kembalikan kuota bila pekerjaan gagal (hapus baris reservasi). */
  refund(): Promise<void>;
  /** Tautkan baris reservasi ke resource yang berhasil dibuat (opsional). */
  attach(resourceId: string): Promise<void>;
}

/**
 * Cek kuota dan langsung mencatat pemakaian dalam satu transaksi.
 *
 * checkQuota + logUsage terpisah membuka celah: dua permintaan paralel sama-sama
 * lolos hitung sebelum salah satunya mencatat. Di sini advisory lock per
 * (user, aksi) membuat hitung-lalu-insert berjalan bergantian, dan baris yang
 * di-insert berfungsi sebagai reservasi. Bila pekerjaan gagal, panggil refund().
 */
export async function reserveQuota(
  userId: string,
  actionType: QuotaAction,
  resourceId?: string,
  opts: QuotaOptions = {},
): Promise<QuotaReservation | NextResponse> {
  const period = opts.period ?? "month";
  const resolved = await resolveQuotaLimit(userId, actionType);
  if (resolved instanceof NextResponse) return resolved;
  const { limit, label, isPremium } = resolved;
  const normalizedResource = resourceId && UUID_RE.test(resourceId) ? resourceId : null;

  const reservedId = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`quota:${userId}:${actionType}`}))`);
    if (limit !== "unlimited") {
      const [usageRow] = await tx
        .select({ value: countFn() })
        .from(usageLogs)
        .where(usageWhere(userId, actionType, period));
      if (usageRow.value >= limit) return null;
    }
    const [row] = await tx
      .insert(usageLogs)
      .values({ userId, actionType, resourceId: normalizedResource })
      .returning({ id: usageLogs.id });
    return row.id;
  });

  if (!reservedId) return quotaExceededResponse(label, limit as number, isPremium, period);

  return {
    async refund() {
      try {
        await db.delete(usageLogs).where(eq(usageLogs.id, reservedId));
      } catch (err) {
        console.error(`[reserveQuota] gagal mengembalikan kuota ${actionType}`, err);
      }
    },
    async attach(id: string) {
      if (!UUID_RE.test(id)) return;
      try {
        await db.update(usageLogs).set({ resourceId: id }).where(eq(usageLogs.id, reservedId));
      } catch (err) {
        console.error(`[reserveQuota] gagal menautkan resource ${actionType}`, err);
      }
    },
  };
}

/* ─── Batas per jam lintas instance (anti-penyalahgunaan, bukan kuota) ─── */

/**
 * Hitung baris usage_logs `actionType` milik user dalam satu jam terakhir dan,
 * bila masih di bawah `max`, catat satu baris baru dalam transaksi yang sama.
 * Berbasis DB supaya batasnya berlaku di semua instance serverless, tidak
 * hanya di memori satu proses.
 */
export async function consumeHourlyLimit(
  userId: string,
  actionType: string,
  max: number,
  resourceId?: string,
): Promise<{ allowed: true; logId: string } | { allowed: false; resetInSeconds: number }> {
  const windowStart = new Date(Date.now() - 3600_000);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`hourly:${userId}:${actionType}`}))`);
    const [row] = await tx
      .select({ value: countFn(), oldest: sql<Date | string | null>`min(${usageLogs.createdAt})` })
      .from(usageLogs)
      .where(and(eq(usageLogs.userId, userId), eq(usageLogs.actionType, actionType), gte(usageLogs.createdAt, windowStart)));
    if (row.value >= max) {
      const oldest = row.oldest ? new Date(row.oldest).getTime() : Date.now();
      const resetInSeconds = Math.max(1, Math.ceil((oldest + 3600_000 - Date.now()) / 1000));
      return { allowed: false as const, resetInSeconds };
    }
    const [logged] = await tx
      .insert(usageLogs)
      .values({
        userId,
        actionType,
        resourceId: resourceId && UUID_RE.test(resourceId) ? resourceId : null,
      })
      .returning({ id: usageLogs.id });
    return { allowed: true as const, logId: logged.id };
  });
}

/** Hapus satu baris usage_logs (mis. render gagal tidak memakan jatah per jam). */
export async function deleteUsageLog(id: string): Promise<void> {
  try {
    await db.delete(usageLogs).where(eq(usageLogs.id, id));
  } catch (err) {
    console.error("[deleteUsageLog] gagal menghapus log", err);
  }
}

/* ─── Log usage ─── */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Catat pemakaian fitur. resource_id di DB bertipe UUID, nilai non-UUID
 * (misal nama file) akan ditolak Postgres (22P02), jadi dinormalisasi ke null.
 */
export async function logUsage(
  userId: string,
  actionType: string,
  resourceId?: string,
): Promise<void> {
  await db.insert(usageLogs).values({
    userId,
    actionType,
    resourceId: resourceId && UUID_RE.test(resourceId) ? resourceId : null,
  });
}