import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const i18nSrc = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");
const pricingSrc = readFileSync(join(process.cwd(), "src/components/PricingSection.tsx"), "utf8");
const loginSrc = readFileSync(join(process.cwd(), "src/app/login/page.tsx"), "utf8");
const checkoutSrc = readFileSync(join(process.cwd(), "src/app/checkout/page.tsx"), "utf8");

/**
 * Khotbah: ada diskon "30%" dan harga coret yang tidak pernah pernah
 * ditagihkan, dan teks "Cancel kapan saja" padahal tidak ada langganan yang
 * bisa dibatalkan. Pembeli teliti akan menemukan ini.
 */
describe("halaman harga tidak menjanjikan sesuatu yang tidak ada", () => {
  it("tidak ada diskon percentages fiktif", () => {
    expect(i18nSrc).not.toContain("Hemat 30%");
    expect(i18nSrc).not.toContain("Save 30%");
  });

  it("harga coret dihapus karena tidak pernah ditagihkan", () => {
    expect(pricingSrc).not.toContain("originalPrice");
  });

  it("tidak ada janji batal untuk produk yang tidak punya langganan", () => {
    expect(i18nSrc).not.toMatch(/Cancel kapan saja/);
    expect(i18nSrc).toContain("Sekali bayar, berlaku 30 hari. Tidak ada tagihan berikutnya.");
  });

  it("penjelasan harga bulanan menyebut masa berlakunya", () => {
    expect(i18nSrc).toContain("Paket Bulanan (30 hari)");
  });
});

describe("pengguna tidak kehilangan pilihan paket saat login", () => {
  it("login menghormati tujuan yang diminta", () => {
    expect(loginSrc).toContain("nextPath");
    expect(loginSrc).toContain("get(\"next\")");
  });

  it("tujuan dari query hanya boleh path internal", () => {
    // Nilai mentah dari query dipakai apa adanya bisa menjadi open redirect
    // tepat setelah login.
    expect(loginSrc).toContain('!rawNext.startsWith("//")');
  });

  it("checkout mengembalikan pengguna ke login sambil membawa keranjang", () => {
    expect(checkoutSrc).toContain("/login?next=");
    expect(checkoutSrc).toContain("packages=");
  });
});