import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-utils";
import { db } from "@/db";
import { jobPosts } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import {
  JOB_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  type JobSort,
  isJobSort,
  isJobType,
  isEmploymentType,
} from "@/lib/job-classification";

/**
 * GET /api/jobs: daftar lowongan yang dipublikasikan (publik, untuk /karir).
 *
 * Pencarian, filter, dan pengurutan dijalankan di SQL, bukan di browser:
 * daftar dibatasi 60 baris, jadi menyaring setelah dipotong akan
 * menghasilkan halaman yang terlihat benar padahal belum semua lowongan
 * ikut_DISARING.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim() ?? "";
  const category = params.get("category") ?? "";
  const employment = params.get("employment") ?? "";
  const sortParam = params.get("sort") ?? "newest";
  const sort: JobSort = isJobSort(sortParam) ? sortParam : "newest";

  const filters: SQL[] = [eq(jobPosts.isPublished, true)];

  if (isJobType(category)) {
    filters.push(eq(jobPosts.jobType, category));
  }
  if (isEmploymentType(employment)) {
    filters.push(eq(jobPosts.employmentType, employment));
  }
  if (query) {
    // ILIKE dengan wildcard, escaped supaya % dan _ dari pengguna tidak
    // berubah jadi operator LIKE yang tidak lagi ESCAPE.
    const escaped = query.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    const pattern = `%${escaped}%`;
    const textMatch = or(
      ilike(jobPosts.title, pattern),
      ilike(jobPosts.company, pattern),
      ilike(jobPosts.location, pattern),
      ilike(jobPosts.description, pattern),
    );
    if (textMatch) filters.push(textMatch);
  }

  // Pengurutan judul selalu rapikan huruf besar-kecil supaya "admin" dan
  // "Admin" tidak terbelah jadi dua blok.
  const orderBy =
    sort === "title"
      ? [asc(jobPosts.title), desc(jobPosts.createdAt)]
      : sort === "company"
        ? [asc(jobPosts.company), desc(jobPosts.createdAt)]
        : [desc(jobPosts.createdAt)];

  const jobs = await db
    .select({
      id: jobPosts.id,
      title: jobPosts.title,
      company: jobPosts.company,
      location: jobPosts.location,
      description: jobPosts.description,
      applyUrl: jobPosts.applyUrl,
      imageUrl: jobPosts.imageUrl,
      jobType: jobPosts.jobType,
      employmentType: jobPosts.employmentType,
      deadline: jobPosts.deadline,
      createdAt: jobPosts.createdAt,
    })
    .from(jobPosts)
    .where(and(...filters))
    .orderBy(...orderBy)
    .limit(60);

  return NextResponse.json({
    jobs,
    // Label dikirim dari server supaya halaman tidak perlu kamus terpisah
    // dan tidak bisa menampilkan kategori yang tidak dikenal.
    labels: { jobType: JOB_TYPE_LABELS, employmentType: EMPLOYMENT_TYPE_LABELS },
  });
});