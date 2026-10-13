import { describe, it, expect } from "vitest";
import { activePaymentProvider, checkoutDestination } from "@/lib/payment-client";

describe("pilih provider pembayaran di sisi klien", () => {
  it("default ke midtrans ketika env belum diisi", () => {
    delete process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;
    expect(activePaymentProvider()).toBe("midtrans");
  });

  it("kasera hanya aktif bila env menyatakannya", () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "kasera";
    expect(activePaymentProvider()).toBe("kasera");
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "midtrans";
    expect(activePaymentProvider()).toBe("midtrans");
    delete process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;
  });
});

describe("tujuan checkout setelah order dibuat", () => {
  it("midtrans tetap memakai redirect_url SNAP", () => {
    const dest = checkoutDestination(
      "midtrans",
      { orderId: "ACH-1", paymentId: "p1", redirect_url: "https://app.midtrans.com/snap/v2/1" },
      "https://aicareerhub.my.id",
    );
    expect(dest.url).toBe("https://app.midtrans.com/snap/v2/1");
    expect(dest.provider).toBe("midtrans");
  });

  it("kasera membuka halaman QR dengan payload yang bisa dibaca ulang", () => {
    const dest = checkoutDestination(
      "kasera",
      {
        orderId: "ACH-2",
        paymentId: "p2",
        qr_string: "00020101021226QR",
      },
      "https://aicareerhub.my.id",
    );

    expect(dest.url).toContain("/checkout/qris/ACH-2");
    const encoded = dest.url.split("?qr=")[1];
    const parsed = JSON.parse(decodeURIComponent(encoded));
    expect(parsed.qr_string).toBe("00020101021226QR");
    expect(parsed.orderId).toBe("ACH-2");
  });

  it("orderId yang berisi karakter khusus tetap aman di URL", () => {
    const dest = checkoutDestination(
      "kasera",
      { orderId: "ACH/ABC 12", paymentId: "p3", qr_string: "Q" },
      "https://aicareerhub.my.id",
    );
    expect(dest.url).toContain("ACH%2FABC%2012");
  });
});