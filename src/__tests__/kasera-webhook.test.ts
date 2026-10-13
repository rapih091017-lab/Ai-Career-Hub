import { describe, it, expect } from "vitest";
import {
  mapEventToPaymentUpdate,
  shouldIgnoreUpdate,
  isKnownEvent,
} from "@/lib/kasera-webhook";

describe("webhook Kasera: pemetaan status", () => {
  it("payment.paid jadi success dengan paid_at dari Kasera", () => {
    const update = mapEventToPaymentUpdate({
      id: "evt_1",
      type: "payment.paid",
      data: {
        payment_request_id: "payreq_abc",
        amount: 35000,
        status: "succeeded",
        paid_at: "2026-10-13T12:04:58+07:00",
      },
    });

    expect(update).not.toBeNull();
    expect(update!.paymentStatus).toBe("success");
    expect(update!.paidAt?.toISOString()).toBe(new Date("2026-10-13T12:04:58+07:00").toISOString());
    expect(update!.transactionId).toBe("payreq_abc");
  });

  it("status succeeded tanpa paid_at tetap success", () => {
    const update = mapEventToPaymentUpdate({ type: "payment.paid", data: { status: "succeeded" } });
    expect(update!.paymentStatus).toBe("success");
    expect(update!.paidAt).toBeInstanceOf(Date);
  });

  it("expired dan failed dipetakan ke failed, bukan success", () => {
    expect(mapEventToPaymentUpdate({ type: "payment.expired", data: { status: "expired" } })!.paymentStatus).toBe("failed");
    expect(mapEventToPaymentUpdate({ type: "payment.failed", data: { status: "failed" } })!.paymentStatus).toBe("failed");
  });

  it("abaikan event tak dikenal atau tanpa type", () => {
    expect(mapEventToPaymentUpdate({ type: "payment.refunded" })).toBeNull();
    expect(mapEventToPaymentUpdate({})).toBeNull();
  });

  it("kenali tiga event resmi", () => {
    expect(isKnownEvent("payment.paid")).toBe(true);
    expect(isKnownEvent("payment.expired")).toBe(true);
    expect(isKnownEvent("payment.failed")).toBe(true);
    expect(isKnownEvent("payment.refunded")).toBe(false);
  });
});

describe("webhook Kasera: pengaman status", () => {
  it("payment yang sudah success tidak ditimpa status lain", () => {
    const expired = mapEventToPaymentUpdate({ type: "payment.expired" })!;
    expect(shouldIgnoreUpdate("success", expired)).toBe(true);
  });

  it("event paid tetap diterima walau sebelumnya failed", () => {
    const paid = mapEventToPaymentUpdate({ type: "payment.paid", data: { status: "succeeded" } })!;
    expect(shouldIgnoreUpdate("failed", paid)).toBe(false);
  });

  it("status failed tidak mengunci update success berikutnya", () => {
    const paid = mapEventToPaymentUpdate({ type: "payment.paid" })!;
    expect(shouldIgnoreUpdate("failed", paid)).toBe(false);
  });
});