/**
 * Pemetaan event webhook Kasera ke status `payments`.
 * Fungsi murni supaya bisa diuji tanpa database.
 *
 * Status memakai kosakata yang sudah dipakai repo: `success`, `pending`,
 * `failed`. Kasera hanyafy event `payment.paid` yang berarti uang masuk.
 * Docs: https://pay.kasera.id/en/docs/api/webhook
 */

export type KaseraEventType = "payment.paid" | "payment.expired" | "payment.failed";

/**
 * Status `payments` yang berarti uang sudah masuk.
 *
 * Webhook Kasera menulis `success`, jadi semua pembacaan harus pakai konstanta
 * ini. Sebelumnya halaman admin masih menanyakan `settlement` (kosakata era
 * Midtrans), sehingga Omzet dan penjualan di dashboard selalu kosong.
 */
export const PAYMENT_SUCCESS_STATUS = "success";

export interface KaseraWebhookPayload {
  id?: string;
  type?: string;
  livemode?: boolean;
  created_at?: string;
  data?: {
    payment_request_id?: string;
    external_id?: string;
    merchant_ref?: string | null;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
    status?: string;
    customer?: { name?: string; email?: string };
  };
}

export type PaymentUpdate = {
  paymentStatus: string;
  paidAt: Date | null;
  transactionId?: string;
};

/** Status Kasera yang berarti uang benar-benar masuk. */
const PAID_STATUSES = new Set(["succeeded"]);

export function isKnownEvent(type: string | undefined): type is KaseraEventType {
  return type === "payment.paid" || type === "payment.expired" || type === "payment.failed";
}

/**
 * Ubah payload jadi perubahan status.
 * `payment.expired` sengaja dipetakan ke `failed`, sama seperti status
 * `expire` milik Midtrans, supaya tampilan di dashboard tidak perlu cases baru.
 */
export function mapEventToPaymentUpdate(event: KaseraWebhookPayload): PaymentUpdate | null {
  const type = event.type;
  if (!type) return null;

  const paymentRequestId = event.data?.payment_request_id;
  const status = event.data?.status ?? "";

  if (type === "payment.paid" || PAID_STATUSES.has(status)) {
    return {
      paymentStatus: "success",
      paidAt: event.data?.paid_at ? new Date(event.data.paid_at) : new Date(),
      ...(paymentRequestId ? { transactionId: paymentRequestId } : {}),
    };
  }

  if (type === "payment.expired" || type === "payment.failed") {
    return { paymentStatus: "failed", paidAt: null };
  }

  return null;
}

/**
 * Kasera mengirim ulang event yang sama sampai endpoint membalas 2xx.
 * Status `success` yang sudah ada tidak boleh ditimpa apa pun — termasuk
 * `payment.expired` yang datang terlambat.
 */
export function shouldIgnoreUpdate(currentStatus: string, next: PaymentUpdate): boolean {
  return currentStatus === "success" && next.paymentStatus !== "success";
}