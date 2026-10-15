import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { packageGroup, singleProductOf, SINGLE_PRODUCT_ORDER } from "@/lib/pricing-catalog";

const billingSrc = readFileSync(join(process.cwd(), "src/app/settings/billing/page.tsx"), "utf8");
const checkoutSrc = readFileSync(join(process.cwd(), "src/app/checkout/page.tsx"), "utf8");
const landingSrc = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
const i18nSrc = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");
const navItemsSrc = readFileSync(join(process.cwd(), "src/lib/nav-items.ts"), "utf8");

describe("daftar paket dikelompokkan", () => {
  it("paket bulanan dan satuan terpisah", () => {
    expect(packageGroup({ key: "pro_monthly", monthly: true })).toBe("monthly");
    expect(packageGroup({ key: "cv_starter", monthly: false })).toBe("single");
    expect(packageGroup({ key: "single_cv" })).toBe("single");
  });

  it("paket satuan dikelompokkan per produk", () => {
    expect(singleProductOf("cek_cv")).toBe("checker");
    expect(singleProductOf("bikin_cv")).toBe("cv");
    expect(singleProductOf("paket_lamaran")).toBe("cv");
    expect(singleProductOf("surat_lamaran")).toBe("writing");
    expect(singleProductOf("portfolio_web")).toBe("portfolio");
    expect(singleProductOf("portfolio_web")).toBe("portfolio");
    expect(SINGLE_PRODUCT_ORDER[0]).toBe("cv");
  });

  it("pengelompokan dipakai di halaman checkout, bukan diulang di halaman tagihan", () => {
    // Halaman tagihan sengaja menampilkan satu daftar polos. Penjelasan
    // satuan vs bulanan hanya perlu satu kali, di halaman checkout.
    expect(billingSrc).not.toContain("billing.group.single");
    expect(billingSrc).not.toContain("billing.group.monthly");
    expect(checkoutSrc).toContain("packageGroup(pkg) === group");
    expect(checkoutSrc).toContain("billing.group.single");
  });
});

describe("section Beli Paket bisa difokuskan", () => {
  it("ada tombol pintas dari bagian pemakaian", () => {
    expect(billingSrc).toContain("jumpToPackages");
    expect(billingSrc).toContain('id="beli-paket"');
    expect(billingSrc).toContain("scrollIntoView");
  });

  it("section beli paket disorot saat dipanggil", () => {
    expect(billingSrc).toContain("highlightBuy");
  });
});

describe("teks rusak dan kalimat provider lama hilang", () => {
  it("tanda tanpa batas ditulis sebagai kode, bukan karakter rusak", () => {
    // Sebelumnya `∞` tersimpan sebagai byte rusak sehingga tampil "Ã¢Ë†Å¾".
    expect(billingSrc).toContain("\\u221E");
    expect(billingSrc).not.toMatch(/Ã/);
  });

  it("tidak ada lagi kalimat Midtrans di teks yang dilihat pengguna", () => {
    expect(i18nSrc.toLowerCase()).not.toContain("midtrans");
    expect(billingSrc.toLowerCase()).not.toContain("midtrans");
  });
});

describe("konfirmasi top-up sukses", () => {
  it("popup muncul dari pembayaran sukses terbaru, sekali per pembayaran", () => {
    expect(billingSrc).toContain("maybeCelebrateTopup");
    expect(billingSrc).toContain("TOPUP_SUCCESS_WINDOW_MS");
    expect(billingSrc).toContain("sessionStorage");
    expect(billingSrc).toContain("topupDone");
  });
});

describe("menu akun di landing", () => {
  it("landing memakai navbar yang sama dengan dashboard", () => {
    // Dulu landing punya nav sendiri plus AccountMenu terpisah. Sekarang
    // keduanya memakai satu komponen, jadi tidak bisa melenceng lagi.
    expect(landingSrc).toContain('<SiteHeader variant="pill"');
    expect(landingSrc).not.toContain("<AccountMenu />");
    expect(landingSrc).not.toContain("NavDropdown");
  });

  it("dropdown akun punya profil, pengaturan, afiliasi, dan keluar", () => {
    const headerSrc = readFileSync(
      join(process.cwd(), "src/components/nav/SiteHeader.tsx"),
      "utf8",
    );
    // Profil, keamanan, dan afiliasi kini jadi item grup "Akun".
    expect(navItemsSrc).toContain('href: "/settings/profile"');
    expect(navItemsSrc).toContain('href: "/settings/security"');
    expect(navItemsSrc).toContain('href: "/affiliate"');
    expect(headerSrc).toContain("LogoutConfirmModal");
    expect(headerSrc).toContain("AdminMenuItem");
  });
});