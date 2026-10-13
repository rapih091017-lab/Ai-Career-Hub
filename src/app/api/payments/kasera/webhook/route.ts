import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, or, type SQL } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/kasera";
import {
  mapEventToPaymentUpdate,
  shouldIgnoreUpdate,
  type KaseraWebhookPayload,
} from "@/lib/kasera-webhook";
import { createConversionForPayment } from "@/lib/affiliate.server";

export const runtime = "nodejs";

/**
 * Webhook Kasera Pay.
 * Docs: https://pay.kasera.id/en/docs/api/webhook
 *
 * Aturan yang dijaga di sini:
 * - Tanda tangan diverifikasi terhadap body mentah sebelum payload dibaca.
 * - Hanya `payment.paid` yang mengaktifkan paket.
 * - Eventcome ulang aman: `success` tidak pernah ditimpa status lain.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.KASERA_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("Kasera-Signature-V1");

  if (!verifyWebhookSignature({ rawBody, header: signature, secret })) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 403 });
  }

  let payload: KaseraWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as KaseraWebhookPayload;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const update = mapEventToPaymentUpdate(payload);
  if (!update) {
    // Di luar interest (mis. event refunded): tetap 200 supaya Kasera berhenti retry.
    return NextResponse.json({ status: "OK", ignored: true });
  }

  const externalId = payload.data?.external_id;
  const paymentRequestId = payload.data?.payment_request_id;
  if (!externalId && !paymentRequestId) {
    return NextResponse.json({ error: "MISSING_REFERENCE" }, { status: 400 });
  }

  const conditions: SQL[] = [];
  if (externalId) conditions.push(eq(payments.orderId, externalId));
  if (paymentRequestId) conditions.push(eq(payments.transactionId, paymentRequestId));

  const [payment] = await db
    .select()
    .from(payments)
    .where(or(...conditions))
    .limit(1);

  if (!payment) {
    console.error("Kasera: payment not found for", externalId ?? paymentRequestId);
    return NextResponse.json({ status: "OK", matched: false });
  }

  if (shouldIgnoreUpdate(payment.paymentStatus, update)) {
    console.log(
      `Kasera: order ${payment.orderId} sudah success, abaikan event ${payload.type}`,
    );
    return NextResponse.json({ status: "OK", ignored: true });
  }

  await db
    .update(payments)
    .set({
      paymentStatus: update.paymentStatus,
      paidAt: update.paymentStatus === "success" ? update.paidAt ?? new Date() : payment.paidAt,
      transactionId: update.transactionId ?? payment.transactionId,
      paymentMethod: payload.data?.payment_request_id ? "qris" : payment.paymentMethod,
      rawNotification: payload as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  if (update.paymentStatus === "success") {
    try {
      await createConversionForPayment({
        id: payment.id,
        userId: payment.userId,
        amount: payment.amount,
        referralCode: payment.referralCode ?? null,
      });
    } catch (err) {
      // Atribusi affiliate tidak boleh menggagalkan webhook pembayaran.
      console.error("Kasera: affiliate conversion error:", err);
    }
  }

  console.log(
    `Kasera: order ${payment.orderId} -> ${update.paymentStatus} (event ${payload.type})`,
  );
  return NextResponse.json({ status: "OK" });
}