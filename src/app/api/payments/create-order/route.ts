import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSnapTransaction } from "@/lib/midtrans";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPackagesDb, PACKAGES as HARDCODED_PACKAGES } from "@/lib/access";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const { packageType, cvDocumentId } = body;

  // Try packages from DB first, then fallback to hardcoded
  const dbPackages = await getPackagesDb();
  const pkgDef = dbPackages[packageType] || HARDCODED_PACKAGES[packageType];

  if (!pkgDef) {
    return NextResponse.json(
      { error: "INVALID_PACKAGE", message: "Paket tidak valid" },
      { status: 400 },
    );
  }

  // Untuk single_cv dan cv-specific packages, cvDocumentId wajib
  if ((packageType === "single_cv") && !cvDocumentId) {
    return NextResponse.json(
      { error: "CV_REQUIRED", message: "Pilih CV terlebih dahulu" },
      { status: 400 },
    );
  }

  // Generate order ID unik
  const orderId = `ACH-${nanoid(12).toUpperCase()}`;

  // Hitung expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkgDef.periodDays);

  // Simpan pending payment ke DB
  const [payment] = await db
    .insert(payments)
    .values({
      userId: session.user.id,
      cvDocumentId: cvDocumentId ?? null,
      orderId,
      packageType,
      amount: pkgDef.price,
      paymentStatus: "pending",
      expiresAt,
    })
    .returning();

  // Buat Snap transaction
  try {
    const snapResult = await createSnapTransaction({
      orderId,
      grossAmount: pkgDef.price,
      customerDetails: {
        firstName: session.user.name,
        email: session.user.email,
      },
      items: [
        {
          id: packageType,
          name: pkgDef.name,
          price: pkgDef.price,
          quantity: 1,
        },
      ],
      expiryMinutes: 60,
    });

    return NextResponse.json({
      paymentId: payment.id,
      orderId,
      token: snapResult.token,
      redirect_url: snapResult.redirect_url,
    });
  } catch (error) {
    console.error("Midtrans create-order error:", error);

    // Hapus payment record jika gagal
    await db.delete(payments).where(eq(payments.id, payment.id));

    return NextResponse.json(
      { error: "PAYMENT_SERVICE_ERROR", message: "Gagal terhubung ke layanan pembayaran. Silakan coba lagi." },
      { status: 502 },
    );
  }
}
