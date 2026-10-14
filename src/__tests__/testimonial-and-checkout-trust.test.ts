import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const submitRouteSrc = readFileSync(
  join(process.cwd(), "src/app/api/testimonials/submit/route.ts"),
  "utf8",
);
const schemasSrc = readFileSync(join(process.cwd(), "src/lib/testimonial-schemas.ts"), "utf8");
const billingSrc = readFileSync(join(process.cwd(), "src/app/settings/billing/page.tsx"), "utf8");
const formSrc = readFileSync(join(process.cwd(), "src/components/billing/TestimonialRequest.tsx"), "utf8");
const checkoutSrc = readFileSync(join(process.cwd(), "src/app/checkout/page.tsx"), "utf8");

describe("testimoni tidak pernah terbit tanpa ditinjau", () => {
  it("kiriman pengguna selalu disimpan sebagai belum terbit", () => {
    expect(submitRouteSrc).toContain("isPublished: false");
  });

  it("pengguna tidak bisa mengarang status terbit lewat input", () => {
    // Skema pengiriman sengaja tidak punya isPublished.
    expect(schemasSrc).toContain("testimonialSubmissionSchema");
    const submission = schemasSrc.slice(schemasSrc.indexOf("testimonialSubmissionSchema"));
    expect(submission).not.toContain("isPublished");
  });

  it("satu akun hanya bisa mengirim satu kali", () => {
    expect(submitRouteSrc).toContain("testimonials.userId");
    expect(submitRouteSrc).toContain("ALREADY_SUBMITTED");
  });

  it("formnya ada di halaman tagihan, setelah pembayaran masuk", () => {
    expect(billingSrc).toContain("<TestimonialRequest");
    expect(formSrc).toContain("/api/testimonials/submit");
    // Ditampilkan alurnya, bukan auto-terbit.
    expect(formSrc).toContain("testimonial.review-note");
  });
});

describe("checkout menampilkan hal yang bisa diperiksa sendiri", () => {
  it("penghematan dihitung dari harga katalog", () => {
    expect(checkoutSrc).toContain("separateTotal");
    expect(checkoutSrc).toContain("paket_lamaran");
  });

  it("tiga hal yang bisa diperiksa sendiri ditulis apa adanya", () => {
    expect(checkoutSrc).toContain("PDF-nya berbasis teks");
    expect(checkoutSrc).toContain("Sekali bayar");
    expect(checkoutSrc).toContain("Data CV-mu bisa kamu hapus sendiri");
    expect(checkoutSrc).toContain("/terms");
  });
});