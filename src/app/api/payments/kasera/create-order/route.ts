import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPaymentRequest } from "@/lib/kasera";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPackagesDb, PACKAGES as HARDCODED_PACKAGES } from "@/lib/access";
import { REFERRAL_COOKIE, isValidAffiliateCode } from "@/lib/affiliate";

export const runtime = "nodejs";

/** Lama QRIS tetap hidup di sisi Kasera (default platform 60 menit). */
const QRIS_WINDOW_MINUTES = 60;

function readKaseraConfig() {
  const apiKey = process.env.KASERA_API_KEY;
  if (!apiKey) {
    throw new Error("KASERA_API_KEY belum diset");
  }
  return { apiKey, baseUrl: process.env.KASERA_API_BASE };
}

/** Order pending Kasera yang masih hidup: payment.paid belum masuk dan belum kedaluwarsa. */
async function findLivePending(userId: string, packageType: string, cvDocumentId?: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.packageType, packageType),
        eq(payments.paymentMethod, "qris"),
        eq(payments.paymentStatus, "pending"),
        gte(payments.expiresAt, now),
        cvDocumentId ? eq(payments.cvDocumentId, cvDocumentId) : undefined,
      ),
    )
    .limit(1);
  return rows[0];
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login" },
      { status: 401 },
    );
  }

  let apiKey: string;
  let baseUrl: string | undefined;
  try {
    const cfg = readKaseraConfig();
    apiKey = cfg.apiKey;
    baseUrl = cfg.baseUrl;
  } catch {
    return NextResponse.json(
      { error: "PAYMENT_NOT_CONFIGURED", message: "Pembayaran Kasera belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { packageType, cvDocumentId } = body ?? {};

  const rawReferral = request.cookies.get(REFERRAL_COOKIE)?.value?.trim().toLowerCase() ?? null;
  const referralCode = rawReferral && isValidAffiliateCode(rawReferral) ? rawReferral : null;

  const dbPackages = await getPackagesDb();
  const pkgDef = dbPackages[packageType] || HARDCODED_PACKAGES[packageType];
  if (!pkgDef) {
    return NextResponse.json(
      { error: "INVALID_PACKAGE", message: "Paket tidak valid" },
      { status: 400 },
    );
  }
  if (packageType === "single_cv" && !cvDocumentId) {
    return NextResponse.json(
      { error: "CV_REQUIRED", message: "Pilih CV terlebih dahulu" },
      { status: 400 },
    );
  }

  // Anti double-klik: pakai lagi order pending yang QR-nya masih hidup.
  const existing = await findLivePending(session.user.id, packageType, cvDocumentId);
  if (existing?.transactionId) {
    const retrieved = await fetch(
      `${baseUrl ?? "https://pay.kasera.id/v1"}/transactions/${existing.transactionId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
    ).catch(() => null);

    if (retrieved?.ok) {
      const trx = (await retrieved.json()) as {
        status?: string;
        payment?: { qr_string?: string };
        expires_at?: string;
      };
      if (trx.status === "pending" && trx.payment?.qr_string) {
        return NextResponse.json({
          paymentId: existing.id,
          orderId: existing.orderId,
          qr_string: trx.payment.qr_string,
          expires_at: trx.expires_at ?? existing.expiresAt.toISOString(),
          amount: existing.amount,
          existing: true,
        });
      }
    }
    // QR-nya sudah tidak hidup: tandai kedaluwarsa supaya tidak dipakai lagi.
    await db
      .update(payments)
      .set({ paymentStatus: "expired" })
      .where(eq(payments.id, existing.id));
  }

  const orderId = `ACH-${nanoid(12).toUpperCase()}`;

  const qrExpiresAt = new Date(Date.now() + QRIS_WINDOW_MINUTES * 60 * 1000);

  const [payment] = await db
    .insert(payments)
    .values({
      userId: session.user.id,
      cvDocumentId: cvDocumentId ?? null,
      orderId,
      packageType,
      packageName: pkgDef.name,
      amount: pkgDef.price,
      limits: pkgDef.limits,
      referralCode,
      paymentMethod: "qris",
      paymentStatus: "pending",
      // Kolom expiresAt dipakai untuk Detect pending order. Kasera punya
      // jendela QR sendiri, jadi yang lebih pendek yang disimpan di sini.
      expiresAt: qrExpiresAt,
    })
    .returning();

  try {
    const created = await createPaymentRequest({
      amount: pkgDef.price,
      externalId: orderId,
      description: pkgDef.name,
      paymentMethods: ["qris"],
      idempotencyKey: orderId,
      apiKey,
      baseUrl,
    });

    const qrString = created.payment?.qr_string;
    if (!qrString) {
      throw new Error("Kasera tidak mengembalikan qr_string");
    }

    await db
      .update(payments)
      .set({ transactionId: created.id })
      .where(eq(payments.id, payment.id));

    return NextResponse.json({
      paymentId: payment.id,
      orderId,
      paymentRequestId: created.id,
      qr_string: qrString,
      amount: pkgDef.price,
      packageName: pkgDef.name,
      expires_at: created.expires_at ?? qrExpiresAt.toISOString(),
      // Dipakai halaman QR untuk menampilkan instruksi milik Kasera.
      instructions: created.instructions ?? null,
      existing: false,
    });
  } catch (error) {
    console.error("Kasera create-order error:", error);
    await db.delete(payments).where(eq(payments.id, payment.id));
    return NextResponse.json(
      {
        error: "PAYMENT_SERVICE_ERROR",
        message: "Gagal terhubung ke layanan pembayaran. Silakan coba lagi.",
      },
      { status: 502 },
    );
  }
}