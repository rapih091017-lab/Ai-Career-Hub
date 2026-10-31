import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolvePaymentMatch,
  isAmountMismatch,
  mapEventToPaymentUpdate,
} from "@/lib/kasera-webhook";

const a = { id: "1", orderId: "ORD-A" };
const b = { id: "2", orderId: "ORD-B" };

describe("webhook Kasera: pencocokan order (R8)", () => {
  it("external_id diutamakan", () => {
    expect(resolvePaymentMatch(a, undefined)).toEqual({ kind: "found", payment: a });
    expect(resolvePaymentMatch(a, a)).toEqual({ kind: "found", payment: a });
  });

  it("payment_request_id dipakai hanya kalau external_id tidak cocok", () => {
    expect(resolvePaymentMatch(undefined, b)).toEqual({ kind: "found", payment: b });
  });

  it("referensi silang ke baris berbeda ditolak", () => {
    expect(resolvePaymentMatch(a, b).kind).toBe("conflict");
  });

  it("tidak ada yang cocok", () => {
    expect(resolvePaymentMatch(undefined, undefined).kind).toBe("not_found");
  });
});

describe("webhook Kasera: nominal", () => {
  const paid = mapEventToPaymentUpdate({ type: "payment.paid", data: { status: "succeeded" } })!;
  const expired = mapEventToPaymentUpdate({ type: "payment.expired", data: {} })!;

  it("nominal sama lolos", () => {
    expect(isAmountMismatch(paid, 35000, 35000)).toBe(false);
  });
  it("nominal beda atau kosong ditolak untuk success", () => {
    expect(isAmountMismatch(paid, 1000, 35000)).toBe(true);
    expect(isAmountMismatch(paid, undefined, 35000)).toBe(true);
  });
  it("event non-success tidak dicek nominal", () => {
    expect(isAmountMismatch(expired, undefined, 35000)).toBe(false);
  });

  it("route membalas mismatch sebelum update status", () => {
    const src = readFileSync(join(process.cwd(), "src/app/api/payments/kasera/webhook/route.ts"), "utf8");
    expect(src).not.toContain("or(...conditions)");
    expect(src.indexOf("mismatch: true")).toBeGreaterThan(0);
    expect(src.indexOf("mismatch: true")).toBeLessThan(src.indexOf(".update(payments)"));
  });
});

describe("parsePayloadAmount", () => {
  it("membaca angka dan teks angka rupiah", async () => {
    const { parsePayloadAmount } = await import("@/lib/kasera-webhook");
    expect(parsePayloadAmount(50000)).toBe(50000);
    expect(parsePayloadAmount("50000")).toBe(50000);
    expect(parsePayloadAmount("50000.00")).toBe(50000);
  });
  it("menolak nilai yang tidak terbaca", async () => {
    const { parsePayloadAmount } = await import("@/lib/kasera-webhook");
    expect(parsePayloadAmount(undefined)).toBeNull();
    expect(parsePayloadAmount("50.000")).toBeNull();
    expect(parsePayloadAmount("50000.50")).toBeNull();
    expect(parsePayloadAmount("abc")).toBeNull();
  });
});
