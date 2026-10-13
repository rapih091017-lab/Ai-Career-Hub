import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { packageGroup, singleProductOf, SINGLE_PRODUCT_ORDER } from "@/lib/pricing-catalog";

const billingSrc = readFileSync(join(process.cwd(), "src/app/settings/billing/page.tsx"), "utf8");
const checkoutSrc = readFileSync(join(process.cwd(), "src/app/checkout/page.tsx"), "utf8");
const landingSrc = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
const i18nSrc = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");
const accountMenuSrc = readFileSync(join(process.cwd(), "src/components/AccountMenu.tsx"), "utf8");

describe("daftar paket dikelompokkan", () => {
  it("paket bulanan dan satuan terpisah", () => {
    expect(packageGroup({ key: "pro_monthly", monthly: true })).toBe("monthly");
    expect(packageGroup({ key: "cv_starter", monthly: false })).toBe("single");
    expect(packageGroup({ key: "single_cv" })).toBe("single");
  });

  it("paket satuan dikelompokkan per produk", () => {
    expect(singleProductOf("cv_starter")).toBe("cv");
    expect(singleProductOf("cv_ai_generate")).toBe("cv");
    expect(singleProductOf("single_cv")).toBe("cv");
    expect(singleProductOf("cv_analyzer")).toBe("checker");
    expect(singleProductOf("portfolio_web")).toBe("portfolio");
    expect(singleProductOf("bundle_hemat")).toBe("writing");
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
  it("landing memakai dropdown yang sama dengan dashboard", () => {
    expect(landingSrc).toContain("<AccountMenu />");
    // Avatar versi lama yang langsung melempar ke /profile harus hilang.
    expect(landingSrc).not.toContain('aria-label={t("nav.profile")}');
  });

  it("dropdown punya pilihan profil, pengaturan, afiliasi, dan keluar", () => {
    expect(accountMenuSrc).toContain('href: "/settings/profile"');
    expect(accountMenuSrc).toContain('href: "/dashboard"');
    expect(accountMenuSrc).toContain('href: "/settings/security"');
    expect(accountMenuSrc).toContain('href: "/affiliate"');
    expect(accountMenuSrc).toContain("signOut");
  });
});