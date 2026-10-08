import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSnapTransaction } from "@/lib/midtrans";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPackagesDb, PACKAGES as HARDCODED_PACKAGES } from "@/lib/access";
import { REFERRAL_COOKIE, isValidAffiliateCode } from "@/lib/affiliate";

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

  // Atribusi affiliate: cookie dari link /r/<kode> (masa hidup 25 hari)
  // disimpan ke payment saat order dibuat, karena webhook Midtrans tidak
  // membawa cookie. Validasi kepemilikan kode dilakukan saat konversi.
  const rawReferral = request.cookies.get(REFERRAL_COOKIE)?.value?.trim().toLowerCase() ?? null;
  const referralCode = rawReferral && isValidAffiliateCode(rawReferral) ? rawReferral : null;

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

  // ── Anti double-click: resume order pending yang masih aktif ─────────────
  // Kalau user punya transaksi pending yang belum kedaluwarsa untuk paket yang
  // sama, kembalikan redirect_url transaksi itu, jangan bikin order baru.
  const now = new Date();
  const existingPending = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, session.user.id),
        eq(payments.packageType, packageType),
        eq(payments.paymentStatus, "pending"),
        gte(payments.expiresAt, now),
        cvDocumentId ? eq(payments.cvDocumentId, cvDocumentId) : undefined,
      ),
    )
    .limit(1);

  if (existingPending.length > 0 && existingPending[0].redirectUrl) {
    const existing = existingPending[0];
    return NextResponse.json({
      paymentId: existing.id,
      orderId: existing.orderId,
      redirect_url: existing.redirectUrl,
      existing: true,
    });
  }

  // Generate order ID unik
  const orderId = `ACH-${nanoid(12).toUpperCase()}`;

  // Hitung expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkgDef.periodDays);

  // Simpan pending payment ke DB, harga + definisi fitur di-snapshot di sini
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

    // Simpan redirect_url agar user bisa resume kalau terputus / double-click
    await db
      .update(payments)
      .set({ redirectUrl: snapResult.redirect_url })
      .where(eq(payments.id, payment.id));

    return NextResponse.json({
      paymentId: payment.id,
      orderId,
      token: snapResult.token,
      redirect_url: snapResult.redirect_url,
      existing: false,
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