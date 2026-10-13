/**
 * Klien Kasera Pay (Direct API).
 * Docs: https://pay.kasera.id/en/docs/api
 *
 * Hanya dipakai dari server. API key tidak boleh masuk kode frontend
 * maupun repository; hanya lewat environment variable.
 */
import crypto from "node:crypto";

export const KASERA_API_BASE = "https://pay.kasera.id/v1";

/** Selisih waktu tolerable untuk tanda tangan webhook (detik). Default Kasera 5 menit. */
const WEBHOOK_TOLERANCE_SECONDS = 300;

export type KaseraPaymentMethod = "qris" | "va_bca" | "va_bri" | "va_bni" | "va_mandiri";

export type KaseraTransactionStatus =
  | "pending"
  | "succeeded"
  | "expired"
  | "failed"
  | string;

export interface KaseraPaymentRequest {
  id: string;
  status: KaseraTransactionStatus;
  payment_method?: string;
  payment?: {
    type: "qr" | "payment_code" | "redirect";
    qr_string?: string;
    payment_code?: string;
    redirect_url?: string;
  };
  checkout_url?: string;
  instructions?: { title?: string; steps?: string[] };
  expires_at?: string;
}

export interface CreatePaymentRequestInput {
  amount: number;
  externalId: string;
  description?: string;
  paymentMethods?: KaseraPaymentMethod[];
  customer?: { name?: string; email?: string; phone?: string };
  /** Kunci idempotensi. Punya meaning: create dengan kunci sama tidak bikin transaksi ganda. */
  idempotencyKey: string;
  apiKey: string;
  /** Base URL lain untuk sandbox. Default ke produksi. */
  baseUrl?: string;
}

export function assertKaseraAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Kasera: amount harus bilangan bulat rupiah > 0");
  }
  // QRIS minimum Rp1.000 menurut dokumentasi Kasera.
  if (amount < 1000) {
    throw new Error("Kasera: amount minimal Rp1.000");
  }
}

export async function createPaymentRequest(
  input: CreatePaymentRequestInput,
  fetchImpl: typeof fetch = fetch,
): Promise<KaseraPaymentRequest> {
  assertKaseraAmount(input.amount);

  const base = input.baseUrl ?? KASERA_API_BASE;
  const body: Record<string, unknown> = {
    amount: input.amount,
    external_id: input.externalId,
  };
  if (input.description) body.description = input.description;
  if (input.paymentMethods?.length) body.payment_methods = input.paymentMethods;
  if (input.customer) body.customer = input.customer;

  const res = await fetchImpl(`${base}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Kasera create gagal (${res.status}): ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as KaseraPaymentRequest;
}

export async function retrieveTransaction(
  id: string,
  opts: { apiKey: string; baseUrl?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<KaseraPaymentRequest> {
  const base = opts.baseUrl ?? KASERA_API_BASE;
  const res = await fetchImpl(`${base}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${opts.apiKey}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Kasera retrieve gagal (${res.status}): ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as KaseraPaymentRequest;
}

/** Status Kasera yang berarti uang sudah masuk. */
export const KASERA_PAID_STATUSES: readonly string[] = ["succeeded"];

/**
 * Verifikasi `Kasera-Signature-V1: t=<unix>,v1=<hex>`.
 *
 * HMAC-SHA256 atas `t + "." + rawBody`, toleransi 5 menit supaya tangkapan
 * delivery tidak bisa diputar ulang. Header bisa memuat dua entri v1 selama
 * masa rotasi secret, jadi cukup salah satu yang cocok.
 */
export function verifyWebhookSignature(args: {
  rawBody: string;
  header: string | null | undefined;
  secret: string;
  nowMs?: number;
  toleranceSeconds?: number;
}): boolean {
  const { rawBody, header, secret } = args;
  if (!header || !secret) return false;

  const parts = header.split(",");
  const tPart = parts[0]?.trim() ?? "";
  if (!tPart.startsWith("t=")) return false;
  const t = Number(tPart.slice(2));
  if (!Number.isFinite(t)) return false;

  const tolerance = args.toleranceSeconds ?? WEBHOOK_TOLERANCE_SECONDS;
  const nowSeconds = Math.floor((args.nowMs ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - t) > tolerance) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected);

  return parts
    .map((p) => p.trim())
    .filter((p) => p.startsWith("v1="))
    .some((p) => {
      const candidate = Buffer.from(p.slice(3));
      return (
        candidate.length === expectedBuf.length && crypto.timingSafeEqual(candidate, expectedBuf)
      );
    });
}

/** Menghitung signature; dipakai tes dan saat menelusuri trafik. */
export function signWebhookBody(rawBody: string, secret: string, unixSeconds: number): string {
  const v1 = crypto.createHmac("sha256", secret).update(`${unixSeconds}.${rawBody}`).digest("hex");
  return `t=${unixSeconds},v1=${v1}`;
}