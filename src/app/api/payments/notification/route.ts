import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMidtransConfig, verifyNotificationSignature } from "@/lib/midtrans";
import { createConversionForPayment } from "@/lib/affiliate.server";

/**
 * Handle Midtrans payment notification (webhook).
 * Midtrans sends POST to this endpoint after payment status changes.
 * Docs: https://docs.midtrans.com/reference/after-payment-webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, transaction_status, transaction_id, payment_type, gross_amount, signature_key, status_code } = body;

    if (!order_id || !transaction_status) {
      return NextResponse.json({ error: "INVALID_NOTIFICATION" }, { status: 400 });
    }

    // ── 1. Verifikasi signature ─────────────────────────────────────
    const config = getMidtransConfig();

    if (
      !verifyNotificationSignature(
        order_id,
        status_code,
        gross_amount,
        signature_key,
        config.serverKey,
      )
    ) {
      console.error("Midtrans: Invalid signature for order", order_id);
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 403 });
    }

    // ── 2. Cari payment record ──────────────────────────────────────
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order_id))
      .limit(1);

    if (!payment) {
      console.error("Midtrans: Order not found", order_id);
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    // ── 3. Idempotency guard ─────────────────────────────────────────
    // Midtrans bisa kirim notifikasi ganda / tidak berurutan. Order yang sudah
    // success TIDAK boleh ditimpa status lain (mis. notifikasi "expire" yang
    // datang terlambat setelah "settlement").
    if (payment.paymentStatus === "success") {
      console.log(
        `Midtrans: Order ${order_id} already success — ignoring duplicate notification (${transaction_status})`,
      );
      return NextResponse.json({ status: "OK", ignored: true });
    }

    // ── 4. Update status berdasarkan transaction_status ─────────────
    let newStatus: string;
    const successStatuses = ["settlement", "capture"];
    const pendingStatuses = ["pending", "authorize", "challenge"];
    const failedStatuses = ["deny", "cancel", "expire", "failure"];

    if (successStatuses.includes(transaction_status)) {
      newStatus = "success";
    } else if (pendingStatuses.includes(transaction_status)) {
      newStatus = "pending";
    } else if (failedStatuses.includes(transaction_status)) {
      newStatus = "failed";
    } else {
      newStatus = "unknown";
    }

    // ── 5. Update DB ────────────────────────────────────────────────
    await db
      .update(payments)
      .set({
        transactionId: transaction_id ?? payment.transactionId,
        paymentMethod: payment_type ?? payment.paymentMethod,
        paymentStatus: newStatus,
        paidAt: newStatus === "success" ? new Date() : payment.paidAt,
        rawNotification: body,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // ── 6. Atribusi affiliate (hanya saat sukses, idempotent) ───────
    if (newStatus === "success") {
      try {
        await createConversionForPayment({
          id: payment.id,
          userId: payment.userId,
          amount: payment.amount,
          referralCode: payment.referralCode ?? null,
        });
      } catch (err) {
        // Kegagalan atribusi tidak boleh menggagalkan webhook pembayaran.
        console.error("Affiliate conversion error:", err);
      }
    }

    console.log(
      `Midtrans: Order ${order_id} updated to ${newStatus} (transaction: ${transaction_status})`,
    );

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("Midtrans notification error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}