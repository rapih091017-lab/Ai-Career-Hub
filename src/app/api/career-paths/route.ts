import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-utils";
import { db } from "@/db";
import { careerPaths } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

/** GET /api/career-paths: jalur karier yang sudah dipublikasikan.
 * Publik dan aman di-cache karena isinya jarang berubah. */
export const GET = apiHandler(async () => {
  const rows = await db
    .select({
      id: careerPaths.id,
      slug: careerPaths.slug,
      role: careerPaths.role,
      category: careerPaths.category,
      summary: careerPaths.summary,
      levels: careerPaths.levels,
      skills: careerPaths.skills,
      steps: careerPaths.steps,
      sortOrder: careerPaths.sortOrder,
    })
    .from(careerPaths)
    .where(eq(careerPaths.isPublished, true))
    .orderBy(asc(careerPaths.sortOrder), asc(careerPaths.role));

  return NextResponse.json(
    { careerPaths: rows },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
});
