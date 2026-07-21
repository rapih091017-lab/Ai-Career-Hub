// Midtrans Snap Configuration
// Docs: https://docs.midtrans.com/reference/snap-api

import { createHash } from "crypto";

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
}

export function getMidtransConfig(): MidtransConfig {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey || !clientKey) {
    throw new Error(
      "MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY must be set in environment variables",
    );
  }

  return {
    serverKey,
    clientKey,
    isProduction,
  };
}

export interface SnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  expiryMinutes?: number;
}

/**
 * Create Snap transaction using Core API (direct HTTP request to Midtrans).
 * Returns the redirect_url for Snap popup.
 */
export async function createSnapTransaction(params: SnapTransactionParams): Promise<{
  token: string;
  redirect_url: string;
}> {
  const config = getMidtransConfig();
  const baseUrl = config.isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const auth = Buffer.from(config.serverKey + ":").toString("base64");

  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    credit_card: {
      secure: true,
    },
    customer_details: {
      first_name: params.customerDetails.firstName ?? "",
      last_name: params.customerDetails.lastName ?? "",
      email: params.customerDetails.email ?? "",
      phone: params.customerDetails.phone ?? "",
    },
    item_details: params.items,
    expiry: {
      duration: params.expiryMinutes ?? 60,
      unit: "minute",
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/settings/billing?payment=success`,
      error: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/settings/billing?payment=error`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/settings/billing?payment=pending`,
    },
  };

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Midtrans Snap error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    token: data.token,
    redirect_url: data.redirect_url,
  };
}

/**
 * Verify Midtrans notification signature.
 * Midtrans sends POST notification with `order_id`, `status_code`, `gross_amount`, and `signature_key`.
 * signature_key = sha512(order_id + status_code + gross_amount + server_key)
 * Returns true if the signature matches.
 */
export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKey: string,
): boolean {
  const expected = createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");
  return signatureKey === expected;
}

/**
 * Midtrans transaction status codes mapping.
 */
export const MIDTRANS_STATUS = {
  SUCCESS: ["settlement", "capture"],
  PENDING: ["pending", "authorize"],
  DENY: ["deny", "cancel", "expire", "failure"],
} as const;
