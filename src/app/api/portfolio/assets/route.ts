import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioAssets } from "@/db/schema";
import {
  MAX_ASSET_BYTES,
  ALLOWED_MIME,
  isAllowedMime,
  assetUrl,
  readImageSize,
} from "@/lib/portfolio/assets";

export const dynamic = "force-dynamic";

export const POST = apiHandler(async (request: NextRequest) => {
  const authRes = await withAuth();
  if (authRes instanceof NextResponse) return authRes;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return errorResponse("NO_FILE", "Tidak ada berkas yang diunggah", 400);
  }

  if (!isAllowedMime(file.type)) {
    return errorResponse(
      "UNSUPPORTED_TYPE",
      `Format ${file.type || "tidak dikenal"} tidak didukung. Gunakan: ${ALLOWED_MIME.join(", ")}.`,
      415,
    );
  }

  if (file.size > MAX_ASSET_BYTES) {
    return errorResponse(
      "FILE_TOO_LARGE",
      `Ukuran maksimal 4 MB. Berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      413,
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const [existing] = await db
    .select()
    .from(portfolioAssets)
    .where(
      and(eq(portfolioAssets.userId, authRes.userId), eq(portfolioAssets.sha256, sha256)),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      url: assetUrl(existing.id),
      width: existing.width,
      height: existing.height,
      bytes: existing.bytes,
      deduplicated: true,
    });
  }

  const size = readImageSize(buf, file.type);
  const [row] = await db
    .insert(portfolioAssets)
    .values({
      userId: authRes.userId,
      mime: file.type,
      bytes: buf.byteLength,
      width: size?.width ?? null,
      height: size?.height ?? null,
      sha256,
      data: buf,
    })
    .returning({ id: portfolioAssets.id });

  return NextResponse.json(
    {
      id: row.id,
      url: assetUrl(row.id),
      width: size?.width ?? null,
      height: size?.height ?? null,
      bytes: buf.byteLength,
      deduplicated: false,
    },
    { status: 201 },
  );
});
