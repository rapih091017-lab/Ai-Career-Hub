import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth as getServerSession } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioAssets, portfolioPages } from "@/db/schema";

export const dynamic = "force-dynamic";

export const GET = async (
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  const { id } = await ctx.params;

  const [row] = await db
    .select()
    .from(portfolioAssets)
    .where(eq(portfolioAssets.id, id))
    .limit(1);

  if (!row) return errorResponse("ASSET_NOT_FOUND", "Gambar tidak ditemukan", 404);

  const session = await getServerSession();
  const isOwner = !!session?.user?.id && session.user.id === row.userId;

  if (!isOwner) {
    const needle = `/api/portfolio/assets/${id}`;
    const pages = await db
      .select({ data: portfolioPages.data })
      .from(portfolioPages)
      .where(eq(portfolioPages.status, "published"));
    const referenced = pages.some((p) =>
      JSON.stringify(p.data ?? "").includes(needle),
    );
    if (!referenced) {
      return errorResponse("ASSET_NOT_FOUND", "Gambar tidak ditemukan", 404);
    }
  }

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(row.bytes),
    },
  });
};
