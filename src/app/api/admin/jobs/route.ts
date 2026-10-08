import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { jobPosts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { jobPostSchema } from "@/lib/job-post-schemas";

/** GET /api/admin/jobs: semua loker (termasuk draft) untuk panel admin. */
export const GET = apiHandler(async () => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const jobs = await db.select().from(jobPosts).orderBy(desc(jobPosts.createdAt));
  return NextResponse.json({ jobs });
});

/** POST /api/admin/jobs: buat loker baru. */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = jobPostSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid", 400);
  }

  const data = parsed.data;
  const [job] = await db
    .insert(jobPosts)
    .values({
      title: data.title,
      company: data.company ?? null,
      location: data.location ?? null,
      description: data.description ?? null,
      applyUrl: data.applyUrl,
      imageUrl: data.imageUrl ?? null,
      isPublished: data.isPublished ?? false,
      createdBy: auth.userId,
    })
    .returning();

  return NextResponse.json({ job }, { status: 201 });
});