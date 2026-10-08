import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliates, referralClicks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_DAYS, isValidAffiliateCode } from "@/lib/affiliate";

/**
 * GET /r/<kode>: link referral. Menanam cookie 25 hari lalu mengarahkan ke
 * beranda. Kode tidak valid tetap diarahkan tanpa cookie (tidak membocorkan
 * validitas kode). Klik dicatat untuk statistik dashboard affiliate.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const response = NextResponse.redirect(new URL("/", request.url));

  const normalized = code.trim().toLowerCase();
  if (!isValidAffiliateCode(normalized)) return response;

  const [affiliate] = await db
    .select({ id: affiliates.id })
    .from(affiliates)
    .where(and(eq(affiliates.code, normalized), eq(affiliates.status, "approved")))
    .limit(1);
  if (!affiliate) return response;

  response.cookies.set(REFERRAL_COOKIE, normalized, {
    maxAge: REFERRAL_COOKIE_DAYS * 24 * 60 * 60,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  try {
    await db.insert(referralClicks).values({ affiliateId: affiliate.id, landing: "/" });
  } catch {
    // Statistik klik tidak boleh menghalangi redirect pengunjung.
  }

  return response;
}