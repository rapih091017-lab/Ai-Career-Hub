import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mergePackageSelection, PackageSelectionError } from "@/lib/package-selection";
import type { PackageDef } from "@/lib/access";

const checkoutSrc = readFileSync(join(process.cwd(), "src/app/checkout/page.tsx"), "utf8");
const apiSrc = readFileSync(join(process.cwd(), "src/app/api/packages/route.ts"), "utf8");
const kaseraSrc = readFileSync(join(process.cwd(), "src/app/api/payments/kasera/create-order/route.ts"), "utf8");

/** Katalog contoh. `mergePackageSelection` hanya butuh bentuk paket, bukan database. */
const catalog = {
  pro_monthly: {
    id: "pro_monthly",
    name: "Pro Monthly",
    price: 99000,
    periodDays: 30,
    limits: { ai_cv_generate: "unlimited", ai_revision: "unlimited", cv_analyzer: 5 },
  },
  single_cv: {
    id: "single_cv",
    name: "Single CV AI Revision",
    price: 25000,
    periodDays: 365,
    limits: { ai_revision: 1, ai_suggestion: "unlimited", ai_cv_generate: false },
  },
} as unknown as Record<string, PackageDef>;

/**
 * Regresi nyata dari produksi: setiap pembayaran gagal dengan
 * `TypeError: Cannot read properties of null (reading 'trim')` karena katalog
 * mengirim `key` sementara halaman checkout membaca `id`, jadi kunci paket
 * terkirim sebagai `null`.
 */
describe("kunci paket tidak pernah null saat order dibuat", () => {
  it("katalog mengirim id dan key sekaligus", () => {
    expect(apiSrc).toContain("id: p.id");
    expect(apiSrc).toContain("key: p.id");
  });

  it("halaman checkout menurunkan id dari key", () => {
    expect(checkoutSrc).toContain("id: p.id ?? p.key");
  });

  it("entri null atau bukan teks ditolak dengan pesan jelas, bukan 500", () => {
    expect(() => mergePackageSelection([null as unknown as string], catalog)).toThrow(PackageSelectionError);
    expect(() => mergePackageSelection([""], catalog)).toThrow(PackageSelectionError);
    expect(() => mergePackageSelection([null as unknown as string, "pro_monthly"], catalog)).not.toThrow();
  });

  it("create-order memangkas kiriman rusak sebelum diproses", () => {
    expect(kaseraSrc).toContain('typeof k === "string"');
  });

  it("kegagalan server tidak lagi tampil sebagai JSON kosong di browser", () => {
    // Halaman menyiapkan pesan sendiri kalau server membalas HTML atau bodies
    // kosong, bukan melempar "Unexpected end of JSON input" ke pengguna.
    expect(checkoutSrc).toContain(".catch(() => null)");
    expect(checkoutSrc).toContain("Masuk dulu supaya pembayaran bisa diproses");
  });
});

describe("keranjang checkout bertahan dan fokus ke pilihan paket", () => {
  it("halaman memakai keranjang yang tersimpan saat datang tanpa paket", () => {
    expect(checkoutSrc).toContain("readStoredCart()");
    expect(checkoutSrc).toContain("writeStoredCart(");
    expect(checkoutSrc).toContain("clearStoredCart()");
  });

  it("keranjang kosong langsung diarahkan ke pilihan paket", () => {
    expect(checkoutSrc).toContain("chooserRef");
    expect(checkoutSrc).toContain("scrollIntoView");
    expect(checkoutSrc).toContain("PackageCard");
    expect(checkoutSrc).not.toContain("Belum ada paket yang dipilih");
  });

  it("niat checkout dicatat dan ditutup setelah order dibuat", () => {
    expect(checkoutSrc).toContain("useCheckoutIntent");
    expect(checkoutSrc).toContain("markCheckoutStarted");
  });
});