import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiHandler, errorResponse, logUsage, noCache } from "@/lib/api-utils";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { testimonialSubmissionSchema } from "@/lib/testimonial-schemas";

/**
 * POST /api/testimonials
 *
 * Menerima testimoni dari pengguna sendiri setelah mereka memakai produk.
 *
 * BUKAN langsung diterbitkan: `isPublished` selalu false, jadi setiap testimoni
 * ditinjau admin dulu. Testimoni yang stormy dan tidak riil adalah risiko
 * terbesar bagi pembeli yang teliti — lebih baik tidak ada testimoni daripada
 * testimoni yang dibuat-buat.
 *
 * Satu pengguna hanya bisa mengirim satu testimoni, jadi form tidak bisa
 * dipakai menumpuk.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("AUTH_REQUIRED", "Masuk dulu untuk mengirim testimoni.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = testimonialSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message ?? "Testimoni tidak valid.",
      400,
    );
  }

  // Satu testimoni per akun.
  const existing = await db
    .select({ id: testimonials.id })
    .from(testimonials)
    .where(eq(testimonials.userId, session.user.id))
    .limit(1);
  if (existing.length > 0) {
    return errorResponse("ALREADY_SUBMITTED", "Testimoni kamu sudah pernah dikirim.", 409);
  }

  const [created] = await db
    .insert(testimonials)
    .values({
      // Nama diambil dari akun, bukan dari ketikan bebas: ini supaya testimoni
      // bisa ditelusuri ke akun pengirimnya.
      userId: session.user.id,
      name: parsed.data.displayName.slice(0, 100),
      role: parsed.data.role.slice(0, 100),
      text: parsed.data.text.slice(0, 600),
      avatarUrl: null,
      // Tidak pernah terbit langsung. Admin yang memutuskan.
      isPublished: false,
      sortOrder: 0,
    })
    .returning({ id: testimonials.id, isPublished: testimonials.isPublished });

  await logUsage(session.user.id, "testimonial_submit").catch(() => {});

  return NextResponse.json(
    {
      ok: true,
      message:
        "Terima kasih. Testimoni kamu akan tampil setelah ditinjau tim kami, biasanya dalam 1-2 hari kerja.",
      testimonial: created,
    },
    { status: 201, headers: noCache() },
  );
});