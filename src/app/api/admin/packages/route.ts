import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { packages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PACKAGES } from "@/lib/access";
import { withAdmin, apiHandler, staleWhileRevalidate } from "@/lib/api-utils";

/* ─── GET — List All Packages ─── */
export const GET = apiHandler(async () => {
  const admin = await withAdmin();
  if (admin instanceof NextResponse) return admin;

  const allPackages = await db
    .select()
    .from(packages)
    .orderBy(packages.sortOrder);

  return NextResponse.json(allPackages, {
    status: 200,
    headers: staleWhileRevalidate(60),
  });
});

/* ─── PUT — Update a Package ─── */
export const PUT = apiHandler(async (request: NextRequest) => {
  const admin = await withAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await request.json();
  const { key, updates } = body;

  if (!key || !updates || typeof updates !== "object") {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Key dan updates diperlukan." },
      { status: 400 },
    );
  }

  // Only allow updating specific fields
  const allowedFields = ["name", "price", "periodDays", "monthly", "badge", "description", "active", "sortOrder", "limits"];
  const cleanUpdates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in updates) {
      cleanUpdates[field] = updates[field];
    }
  }
  cleanUpdates.updatedAt = new Date();

  const [updated] = await db
    .update(packages)
    .set(cleanUpdates)
    .where(eq(packages.key, key))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `Package dengan key "${key}" tidak ditemukan.` },
      { status: 404 },
    );
  }

  return NextResponse.json(updated, { status: 200 });
});

/* ─── POST /seed — Seed Initial Packages ─── */
// Not wrapped in apiHandler/withAdmin — parent POST handler already provides both
async function handleSeed() {
  // Check if already seeded
  const existing = await db.select({ key: packages.key }).from(packages);
  const existingKeys = new Set(existing.map((p) => p.key));

  let seeded = 0;
  let skipped = 0;

  for (const [key, pkg] of Object.entries(PACKAGES)) {
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    await db.insert(packages).values({
      key,
      name: pkg.name,
      price: pkg.price,
      periodDays: pkg.periodDays,
      monthly: pkg.monthly || false,
      limits: pkg.limits as Record<string, number | "unlimited" | false>,
      active: true,
      sortOrder: Object.keys(PACKAGES).indexOf(key),
    });
    seeded++;
  }

  return NextResponse.json(
    { message: `Seeded ${seeded} packages. Skipped ${skipped} (already exist).` },
    { status: 200 },
  );
}

// Route POST handler — dispatch to handleSeed
export const POST = apiHandler(async (request: NextRequest) => {
  const admin = await withAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "seed") {
    return await handleSeed();
  }

  return NextResponse.json(
    { error: "INVALID_ACTION", message: "Action tidak valid. Gunakan ?action=seed" },
    { status: 400 },
  );
});
