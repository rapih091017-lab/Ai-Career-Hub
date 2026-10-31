import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments } from "@/db/schema";
import { apiHandler, errorResponse } from "@/lib/api-utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { normalizeCvDocument } from "@/lib/cv-normalize";
import { CvPrintFormatSchema, cvRenderProps } from "@/lib/cv-print-format";
import { buildCvPdfHtml } from "@/lib/pdf/cv-html";
import { printStandaloneHtml } from "@/lib/pdf/chromium";

export const runtime = "nodejs";
// Cold start: ekstraksi binary Chromium + launch butuh waktu. Warm: ~2-4s.
export const maxDuration = 60;

const BodySchema = z.object({
  format: CvPrintFormatSchema.default({}),
  /** updatedAt CV yang dilihat klien; bila DB lebih baru → 409. */
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
});

/** Batas anti-penyalahgunaan per user (bukan kuota paket). */
const LIMITS = [
  { suffix: "m", maxRequests: 6, windowSeconds: 60 },
  { suffix: "h", maxRequests: 60, windowSeconds: 3600 },
];

/**
 * POST /api/cv-documents/[id]/pdf
 *
 * PDF CV dari builder. Bebas kuota untuk semua paket (keputusan user
 * 2026-10-31), tapi wajib login, CV harus milik user, dan dibatasi rate
 * limit. Data CV dibaca dari DB; klien hanya mengirim format tampilan
 * (masih di localStorage) yang divalidasi zod. HTML dirender di server
 * dengan renderer yang sama dengan pratinjau.
 */
export const POST = apiHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("AUTH_REQUIRED", "Harus login untuk mengunduh PDF", 401);
  }
  const userId = session.user.id;
  const { id } = await params;

  for (const l of LIMITS) {
    const rl = checkRateLimit({ key: `cv-pdf:${l.suffix}:${userId}`, maxRequests: l.maxRequests, windowSeconds: l.windowSeconds });
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);
  }

  let raw: unknown = {};
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", "Format tampilan CV tidak valid. Section kustom maksimal 10, judul 100 karakter, isi 5.000 karakter.", 400);
  }

  const [doc] = await db
    .select()
    .from(cvDocuments)
    .where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, userId)))
    .limit(1);
  if (!doc) {
    return errorResponse("CV_NOT_FOUND", "Dokumen CV tidak ditemukan atau bukan milik Anda", 404);
  }

  const { expectedUpdatedAt, format } = parsed.data;
  if (expectedUpdatedAt && doc.updatedAt && new Date(doc.updatedAt).getTime() > new Date(expectedUpdatedAt).getTime()) {
    return errorResponse("CV_STALE", "CV sudah diubah di tempat lain. Muat ulang halaman lalu unduh lagi.", 409);
  }

  const { marginMm, ...props } = cvRenderProps(normalizeCvDocument(doc), format, doc.templateId ?? undefined);

  try {
    const html = await buildCvPdfHtml(props, marginMm);
    const pdf = await printStandaloneHtml(html);
    const fileName = `${(props.data.fullName || "CV").replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "CV"}.pdf`;
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[cv-pdf] render error:", error instanceof Error ? error.message : error);
    return errorResponse("PDF_SERVER_ERROR", "Gagal membuat PDF di server. Coba lagi sebentar lagi.", 500);
  }
});
