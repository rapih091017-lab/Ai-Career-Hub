import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { usageLogs } from "@/db/schema";
import { eq, and, count as countFn, gte } from "drizzle-orm";
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
  if (!adminEmails.includes(session.user.email.toLowerCase())) {
    return errorResponse("UNAUTHORIZED", "Hanya admin yang bisa mengakses endpoint ini.", 403) as NextResponse;
  }
  return { userId: session.user.id, email: session.user.email };
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
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

/* ─── Quota check helper ─── */
export async function checkQuota(
  userId: string,
  actionType: "ai_suggestion" | "ai_revision" | "checker_check" | "cv_build" | "portfolio_generate" | "pdf_export",
): Promise<{ allowed: true } | NextResponse> {
  const access = await getUserAccess(userId);
  // Determine the limit key based on action type
  let limitKey: string;
  switch (actionType) {
    case "ai_suggestion":
      limitKey = "ai_suggestion";
      break;
    case "ai_revision":
      limitKey = "ai_revision";
      break;
    case "checker_check":
      limitKey = "cv_analyzer";
      break;
    case "portfolio_generate":
      limitKey = "portfolio_generate";
      break;
    case "pdf_export":
      limitKey = "pdf_export";
      break;
    default:
      limitKey = actionType;
  }

  const limit = (access.limits as Record<string, number | "unlimited" | false>)[limitKey];

  if (limit === false) {
    return errorResponse(
      "FEATURE_NOT_AVAILABLE",
      `Fitur ${actionType} tidak tersedia di paket kamu. Upgrade untuk mengakses.`,
      403,
    ) as NextResponse;
  }

  if (limit !== "unlimited") {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const [usageRow] = await db
      .select({ value: countFn() })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.userId, userId),
          eq(usageLogs.actionType, actionType),
          gte(usageLogs.createdAt, firstOfMonth),
        ),
      );

    if (usageRow.value >= limit) {
      return errorResponse(
        "QUOTA_EXCEEDED",
        `Batas gratis ${actionType} sudah terpakai (${limit}/${limit}). Upgrade ke Premium untuk unlimited.`,
        403,
      ) as NextResponse;
    }
  }

  return { allowed: true };
}

/* ─── Log usage ─── */
export async function logUsage(
  userId: string,
  actionType: string,
  resourceId?: string,
): Promise<void> {
  await db.insert(usageLogs).values({
    userId,
    actionType,
    resourceId: resourceId ?? null,
  });
}
