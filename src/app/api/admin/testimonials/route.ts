import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { withAdmin, apiHandler, noCache } from "@/lib/api-utils";
import { db } from "@/db";
import { testimonials } from "@/db/schema";

/** GET /api/admin/testimonials: semua testimoni termasuk draf (admin). */
export const GET = apiHandler(async () => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;
  const rows = await db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt));
  return NextResponse.json({ testimonials: rows }, { headers: noCache() });
});
