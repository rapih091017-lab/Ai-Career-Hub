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
    amount?: number | string;
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

export type PaymentMatch<T extends { id: string }> =
  | { kind: "found"; payment: T }
  | { kind: "not_found" }
  | { kind: "conflict"; byExternalId: T; byTransactionId: T };

/**
 * Pilih baris payment untuk sebuah event. external_id (= orderId kita) jadi
 * acuan utama; payment_request_id hanya cadangan. Kalau keduanya menunjuk
 * baris berbeda, event ditolak supaya tidak mengubah order milik orang lain.
 */
export function resolvePaymentMatch<T extends { id: string }>(
  byExternalId: T | undefined,
  byTransactionId: T | undefined,
): PaymentMatch<T> {
  if (byExternalId && byTransactionId && byExternalId.id !== byTransactionId.id) {
    return { kind: "conflict", byExternalId, byTransactionId };
  }
  const payment = byExternalId ?? byTransactionId;
  return payment ? { kind: "found", payment } : { kind: "not_found" };
}

/**
 * Nominal pada event `success` wajib sama persis dengan payments.amount.
 * Nominal yang tidak dikirim juga dianggap tidak cocok.
 */
export function isAmountMismatch(
  next: PaymentUpdate,
  payloadAmount: number | string | undefined,
  expectedAmount: number,
): boolean {
  if (next.paymentStatus !== PAYMENT_SUCCESS_STATUS) return false;
  const paid = parsePayloadAmount(payloadAmount);
  return paid === null || paid !== expectedAmount;
}

/**
 * Nominal dari payload bisa datang sebagai angka atau teks ("50000", "50000.00").
 * "50.000" ditolak karena ambigu dengan pemisah ribuan. Teks lain yang bukan angka rupiah utuh dianggap tidak terbaca (null), bukan nol.
 */
export function parsePayloadAmount(value: number | string | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d+(\.00)?$/.test(trimmed)) return null;
  return Number(trimmed.split(".")[0]);
}