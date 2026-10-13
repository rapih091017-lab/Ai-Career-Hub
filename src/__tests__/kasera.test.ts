import { describe, it, expect, vi } from "vitest";
import {
  createPaymentRequest,
  retrieveTransaction,
  verifyWebhookSignature,
  signWebhookBody,
  assertKaseraAmount,
  KASERA_API_BASE,
} from "@/lib/kasera";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("Kasera: buat payment request", () => {
  it("kirim bearer key, idempotency key, dan payload yang benar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "payreq_abc",
        status: "pending",
        payment: { type: "qr", qr_string: "00020101021226..." },
        expires_at: "2026-10-13T12:30:00+07:00",
      }),
    );

    const result = await createPaymentRequest(
      {
        amount: 35000,
        externalId: "ORD-1234",
        description: "Portfolio Web",
        paymentMethods: ["qris"],
        idempotencyKey: "ORD-1234",
        apiKey: "kp_test_x",
      },
      fetchMock as unknown as typeof fetch,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${KASERA_API_BASE}/transactions`);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer kp_test_x");
    expect(headers["Idempotency-Key"]).toBe("ORD-1234");
    expect(JSON.parse(init.body as string)).toEqual({
      amount: 35000,
      external_id: "ORD-1234",
      description: "Portfolio Web",
      payment_methods: ["qris"],
    });
    expect(result.payment?.qr_string).toBe("00020101021226...");
    expect(result.id).toBe("payreq_abc");
  });

  it("tolak amount di bawah minimum dan bukan bilangan bulat", () => {
    expect(() => assertKaseraAmount(500)).toThrow(/minimal/i);
    expect(() => assertKaseraAmount(1500.5)).toThrow(/bulat/i);
    expect(() => assertKaseraAmount(0)).toThrow();
  });

  it("lempar error jelas saat Kasera menolak (422)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ error: { message: "amount too small" } }),
    });

    await expect(
      createPaymentRequest(
        { amount: 2000, externalId: "ORD-2", idempotencyKey: "ORD-2", apiKey: "k" },
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toThrow(/422/);
  });
});

describe("Kasera: ambil status transaksi", () => {
  it("pakai GET pada id dari path dan bearer key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "payreq_abc", status: "succeeded" }));

    const res = await retrieveTransaction(
      "payreq_abc",
      { apiKey: "kp_test_x" },
      fetchMock as unknown as typeof fetch,
    );

    expect(res.status).toBe("succeeded");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${KASERA_API_BASE}/transactions/payreq_abc`);
    expect(init.method).toBeUndefined();
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer kp_test_x");
  });
});

describe("Kasera: verifikasi tanda tangan webhook", () => {
  const secret = "whsec_test";
  const rawBody = JSON.stringify({ type: "payment.paid", data: { amount: 35000 } });
  const nowMs = 1_760_000_000_000;
  const nowSeconds = Math.floor(nowMs / 1000);

  it("terima signature yang benar", () => {
    const header = signWebhookBody(rawBody, secret, nowSeconds);
    expect(verifyWebhookSignature({ rawBody, header, secret, nowMs })).toBe(true);
  });

  it("tolak kalau body dimodifikasi sedikit saja", () => {
    const header = signWebhookBody(rawBody, secret, nowSeconds);
    expect(
      verifyWebhookSignature({ rawBody: rawBody.replace("35000", "35001"), header, secret, nowMs }),
    ).toBe(false);
  });

  it("tolak kalau secret salah", () => {
    const header = signWebhookBody(rawBody, "whsec_lain", nowSeconds);
    expect(verifyWebhookSignature({ rawBody, header, secret, nowMs })).toBe(false);
  });

  it("tolak timestamp yang lebih dari 5 menit (anti replay)", () => {
    const stale = nowSeconds - 301;
    const header = signWebhookBody(rawBody, secret, stale);
    expect(verifyWebhookSignature({ rawBody, header, secret, nowMs })).toBe(false);
  });

  it("terima dua entri v1 saat rotasi secret", () => {
    const lama = signWebhookBody(rawBody, "whsec_lama", nowSeconds).split(",v1=")[1];
    const baru = signWebhookBody(rawBody, secret, nowSeconds).split(",v1=")[1];
    const header = `t=${nowSeconds},v1=${lama},v1=${baru}`;
    expect(verifyWebhookSignature({ rawBody, header, secret, nowMs })).toBe(true);
  });

  it("tolak header yang rusak atau kosong", () => {
    expect(verifyWebhookSignature({ rawBody, header: null, secret, nowMs })).toBe(false);
    expect(verifyWebhookSignature({ rawBody, header: "", secret, nowMs })).toBe(false);
    expect(verifyWebhookSignature({ rawBody, header: "v1=abc", secret, nowMs })).toBe(false);
    expect(verifyWebhookSignature({ rawBody, header: "t=abc,v1=abc", secret, nowMs })).toBe(false);
  });
});