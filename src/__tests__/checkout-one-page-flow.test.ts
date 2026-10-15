import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const checkoutSrc = readFileSync(join(process.cwd(), "src/app/checkout/page.tsx"), "utf8");
const navItemsSrc = readFileSync(join(process.cwd(), "src/lib/nav-items.ts"), "utf8");
const landingSrc = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
const pricingSrc = readFileSync(join(process.cwd(), "src/components/PricingSection.tsx"), "utf8");

/**
 * Alur yang pernah membingungkan: pilih paket di landing -> diarahkan ke
 * halaman tagihan -> baru diarahkan lagi ke checkout. Dua langkah untuk satu
 * pembelian, dan di tengah jalan muncul halaman yang bukan tempat membeli.
 */
describe("checkout adalah satu halaman untuk pembelian", () => {
  it("halaman checkout punya katalog dan keranjang di satu layar", () => {
    expect(checkoutSrc).toContain("<PackageCard");
    expect(checkoutSrc).toContain("Keranjang");
    expect(checkoutSrc).toContain("lg:sticky");
  });

  it("memilih paket tidak memindahkan halaman", () => {
    // Kartu memakai toggle keranjang, bukan navigasi ke halaman lain.
    expect(checkoutSrc).toContain("onBuy={() => toggle(pkg.key)}");
    expect(checkoutSrc).not.toContain("router.push");
  });

  it("kartu paket menandai yang sudah ada di keranjang", () => {
    expect(checkoutSrc).toContain("selected={selected.includes(pkg.key)}");
  });

  it("Checkout ada di grup Akun, bukan di navbar landing", () => {
    // Navbar satu sumber untuk landing dan dashboard (src/lib/nav-items.ts).
    expect(navItemsSrc).toContain('href: "/checkout"');
    // Dari halaman depan orang belum punya alasan untuk langsung membayar,
    // jadi navbar mengarah ke section landing, bukan ke /checkout.
    expect(navItemsSrc).toContain('href: "/#pricing"');
    expect(navItemsSrc).toContain('href: "/#journey"');
    expect(landingSrc).not.toContain('href="/checkout"');
  });

  it("tombol Beli di landing langsung ke checkout, tidak lewat halaman tagihan", () => {
    expect(pricingSrc).not.toContain('href="/settings/billing"');
    expect(pricingSrc).toContain("paket_lamaran");
  });
});