import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { apiHandler, staleWhileRevalidate } from "@/lib/api-utils";

export const GET = apiHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 }
    );
  }

  const docs = await db
    .select({
      id: cvDocuments.id,
      jobTitle: cvDocuments.jobTitle,
      templateId: cvDocuments.templateId,
      createdAt: cvDocuments.createdAt,
      updatedAt: cvDocuments.updatedAt,
    })
    .from(cvDocuments)
    .where(eq(cvDocuments.userId, session.user.id))
    .orderBy(desc(cvDocuments.createdAt));

  return NextResponse.json(docs, {
    status: 200,
    headers: staleWhileRevalidate(30),
  });
});
