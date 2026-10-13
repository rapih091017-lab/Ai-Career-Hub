import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { retrieveTransaction } from "@/lib/kasera";
import { createConversionForPayment } from "@/lib/affiliate.server";

export const runtime = "nodejs";

/**
 * Polling status pembayaran Kasera.
 *
 * Webhook adalah sumber kebenaran. Endpoint ini hanya cadangan untuk kasus
 * buyer yang sudah bayar tapi webhook belum sampai — Kasera mengirim ulang
 * sendiri, tapi polling membuat halaman tidak terjebak di spinner.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "MISSING_ORDER_ID" }, { status: 400 });
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .limit(1);

  // Hanya pemilik order yang boleh menanyakan statusnya.
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (payment.paymentStatus === "success") {
    return NextResponse.json({ status: "success", paidAt: payment.paidAt });
  }

  const apiKey = process.env.KASERA_API_KEY;
  const transactionId = payment.transactionId;
  if (!apiKey || !transactionId) {
    return NextResponse.json({ status: payment.paymentStatus });
  }

  try {
    const trx = await retrieveTransaction(transactionId, {
      apiKey,
      baseUrl: process.env.KASERA_API_BASE,
    });

    const nowSucceeded = trx.status === "succeeded";
    const nextStatus = nowSucceeded
      ? "success"
      : trx.status === "expired"
        ? "failed"
        : trx.status === "failed"
          ? "failed"
          : payment.paymentStatus;

    if (nextStatus !== payment.paymentStatus) {
      await db
        .update(payments)
        .set({
          paymentStatus: nextStatus,
          paidAt: nextStatus === "success" ? new Date() : payment.paidAt,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      if (nextStatus === "success") {
        try {
          await createConversionForPayment({
            id: payment.id,
            userId: payment.userId,
            amount: payment.amount,
            referralCode: payment.referralCode ?? null,
          });
        } catch (err) {
          console.error("Kasera: affiliate conversion error (polling):", err);
        }
      }
    }

    return NextResponse.json({
      status: nextStatus,
      providerStatus: trx.status,
      qrExpiresAt: trx.expires_at ?? null,
    });
  } catch (error) {
    console.error("Kasera status error:", error);
    // Gagal menghubungi Kasera tidak boleh membuat halaman error;
    // status terakhir dari database yang ditampilkan.
    return NextResponse.json({ status: payment.paymentStatus });
  }
}