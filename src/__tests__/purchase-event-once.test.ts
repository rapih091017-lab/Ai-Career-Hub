import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recordEvent = vi.fn(async () => {});
let updatedRows: { id: string }[] = [];

vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "user-1" } })) }));
vi.mock("@/lib/events.server", () => ({ recordEvent: (...a: unknown[]) => recordEvent(...(a as [])) }));
vi.mock("@/lib/affiliate.server", () => ({ createConversionForPayment: vi.fn(async () => {}) }));
vi.mock("@/lib/kasera", () => ({ retrieveTransaction: vi.fn(async () => ({ status: "succeeded" })) }));
vi.mock("@/db", () => {
  const payment = { id: "pay-1", orderId: "ORD-1", userId: "user-1", paymentStatus: "pending", transactionId: "trx-1", packageType: "cek_cv", paidAt: null };
  return {
    db: {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [payment] }) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: async () => updatedRows }) }) }),
    },
  };
});

async function poll() {
  process.env.KASERA_API_KEY = "test-key";
  const { GET } = await import("@/app/api/payments/kasera/status/route");
  const url = new URL("http://localhost/api/payments/kasera/status?orderId=ORD-1");
  return GET({ nextUrl: url } as never);
}

describe("event purchase hanya sekali per pembayaran", () => {
  beforeEach(() => recordEvent.mockClear());

  it("polling yang benar-benar mengubah status mencatat purchase", async () => {
    updatedRows = [{ id: "pay-1" }];
    await poll();
    expect(recordEvent).toHaveBeenCalledTimes(1);
    expect(recordEvent).toHaveBeenCalledWith(expect.objectContaining({ name: "purchase", resourceId: "pay-1" }));
  });

  it("baris sudah success lebih dulu (webhook menang balapan): tidak dicatat lagi", async () => {
    updatedRows = [];
    await poll();
    expect(recordEvent).not.toHaveBeenCalled();
  });

  it("semua jalur sukses memakai UPDATE bersyarat dan hanya mencatat bila ada baris", () => {
    for (const path of [
      "src/app/api/payments/kasera/webhook/route.ts",
      "src/app/api/payments/kasera/status/route.ts",
      "src/app/api/payments/notification/route.ts",
    ]) {
      const src = readFileSync(join(process.cwd(), path), "utf8");
      expect(src, path).toContain("ne(payments.paymentStatus, PAYMENT_SUCCESS_STATUS)");
      expect(src, path).toContain(".returning({ id: payments.id })");
      expect(src, path).toContain('if (changed.length > 0) await recordEvent({ name: "purchase"');
    }
  });
});
