"use client";

/**
 * Caller-side helper untuk memilih endpoint pembayaran.
 *
 * `NEXT_PUBLIC_PAYMENT_PROVIDER` = `kasera` mengarahkan UI ke QRIS Kasera.
 * Selain itu (atau kalau env belum ada) alur Midtrans lama tetap dipakai,
 * jadi tidak ada kode Midtrans yang dibuang.
 */
export type PaymentProvider = "midtrans" | "kasera";

export function activePaymentProvider(): PaymentProvider {
  return process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === "kasera" ? "kasera" : "midtrans";
}

export interface CreateOrderResponse {
  orderId: string;
  /** Midtrans: URL SNAP. Kasera: payload QR. */
  redirect_url?: string;
  qr_string?: string;
  paymentId: string;
  message?: string;
}

export interface CheckoutDestination {
  /** URL mana yang dibuka setelah order dibuat. */
  url: string;
  provider: PaymentProvider;
}

/**
 * Setelah order Midtrans berhasil, buka redirect_url-nya.
 * Setelah order Kasera berhasil, buka halaman QR dengan payload di query string.
 */
export function checkoutDestination(
  provider: PaymentProvider,
  result: CreateOrderResponse,
  origin: string,
): CheckoutDestination {
  if (provider === "kasera") {
    const payload = encodeURIComponent(
      JSON.stringify({
        paymentId: result.paymentId,
        orderId: result.orderId,
        qr_string: result.qr_string ?? "",
        amount: (result as unknown as { amount?: number }).amount ?? 0,
        packageName: (result as unknown as { packageName?: string }).packageName,
        expires_at: (result as unknown as { expires_at?: string }).expires_at,
        instructions: (result as unknown as { instructions?: unknown }).instructions ?? null,
        existing: (result as unknown as { existing?: boolean }).existing,
      }),
    );
    return {
      provider,
      url: `${origin}/checkout/qris/${encodeURIComponent(result.orderId)}?qr=${payload}`,
    };
  }
  return { provider, url: result.redirect_url ?? "" };
}