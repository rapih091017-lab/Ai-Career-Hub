import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-utils";
import { db } from "@/db";
import { jobPosts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/** GET /api/jobs: daftar loker yang sudah dipublikasikan (publik, untuk /karir). */
export const GET = apiHandler(async () => {
  const jobs = await db
    .select({
      id: jobPosts.id,
      title: jobPosts.title,
      company: jobPosts.company,
      location: jobPosts.location,
      description: jobPosts.description,
      applyUrl: jobPosts.applyUrl,
      imageUrl: jobPosts.imageUrl,
      createdAt: jobPosts.createdAt,
    })
    .from(jobPosts)
    .where(eq(jobPosts.isPublished, true))
    .orderBy(desc(jobPosts.createdAt))
    .limit(60);

  return NextResponse.json({ jobs });
});
