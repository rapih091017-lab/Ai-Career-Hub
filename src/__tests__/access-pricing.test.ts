import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURRENT_PACKAGES,
  FREE_LIMITS,
  LEGACY_EQUIVALENTS,
  LEGACY_PACKAGES,
  PORTFOLIO_TRIAL_DAYS,
  currentEquivalentPackage,
} from "@/lib/package-catalog-static";
import { MARKETED_PACKAGE_KEYS } from "@/lib/pricing-catalog";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/** Potong blok di antara dua penanda urut dalam file sumber. */
function block(src: string, from: string, to: string): string {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a + 1);
  expect(a).toBeGreaterThanOrEqual(0);
  expect(b).toBeGreaterThan(a);
  return src.slice(a, b);
}

const access = read("src/lib/access.ts");
const pricing = read("src/components/PricingSection.tsx");
const staticCatalog = read("src/lib/package-catalog-static.ts");

describe("portfolio web bukan lagi produk satuan", () => {
  it("dihapus dari daftar yang dipasarkan, tapi definisinya tetap ada", () => {
    // Portfolio dihapus dari daftar harga: sebagai produk Rp29.000 ia terbaca
    // seperti aset sekali beli, padahal fiturnya milik paket bulanan.
    const catalog = read("src/lib/pricing-catalog.ts");
    const marked = catalog.slice(
      catalog.indexOf("MARKETED_PACKAGE_KEYS"),
      catalog.indexOf("export function formatRupiah"),
    );
    expect(marked).not.toMatch(/"portfolio_web"/);
    // Definisi paketnya tetap ada supaya pembayaran lama tidak kehilangan hak.
    expect(CURRENT_PACKAGES.portfolio_web.limits.portfolio_web).toBe(1);
    expect(read("src/lib/package-catalog-static.ts")).toContain("UNMARKETED_PACKAGE_KEYS");
  });

  it("percobaan gratisnya berbatas waktu, bukan kuota bulanan", () => {
    expect(PORTFOLIO_TRIAL_DAYS).toBe(2);
    const route = read("src/app/api/portfolio/suggest/route.ts");
    expect(route).toContain("PORTFOLIO_TRIAL_DAYS");
    // Pengguna yang sudah pernah membuat portfolio sebelum aturan ini tetap
    // boleh, jadi route harus mengecek generate terdahulu sebelum menolak.
    expect(route).toContain("if (!firstEver)");
  });
});

describe("gratis harus jadi cicipan, bukan pengganti paket satuan", () => {
  // Regression: gratis pernah 2x cek dan 3x surat, sementara Cek CV dijual
  // Rp9.000 untuk 1x cek dan Surat Lamaran Rp9.000 untuk 1x. Produk yang lebih
  // murah dari gratis tidak pernah dibeli.
  it("setiap paket satuan memberi lebih dari jatah gratis", () => {
    const pairs: [string, string][] = [
      ["cek_cv", "cv_analyzer"],
      ["surat_lamaran", "cover_letter"],
      ["bikin_cv", "ai_cv_generate"],
      ["paket_lamaran", "cv_analyzer"],
    ];
    for (const [pkgKey, feature] of pairs) {
      const free = FREE_LIMITS[feature] as number;
      const sold = CURRENT_PACKAGES[pkgKey].limits[feature];
      expect(typeof sold, `${pkgKey} tidak punya ${feature}`).toBe("number");
      expect(sold as number, `${pkgKey} tidak lebih dari gratis`).toBeGreaterThan(free);
    }
  });

  it("jatah gratisnya satu per fitur", () => {
    for (const feature of ["ai_cv_generate", "cv_analyzer", "ai_revision", "ai_suggestion", "cover_letter", "pdf_export"]) {
      expect(FREE_LIMITS[feature]).toBe(1);
    }
  });
});

describe("pembeli paket lama masuk ke paket termurah yang setara", () => {
  it("setiap paket lama punya padanan yang masih dijual", () => {
    for (const key of Object.keys(LEGACY_PACKAGES)) {
      const equivalent = currentEquivalentPackage(key);
      expect(
        MARKETED_PACKAGE_KEYS,
        `paket lama "${key}" tidak punya paket pengganti yang dijual`,
      ).toContain(equivalent);
    }
  });

  it("hak pembeli lama tetap dari paket yang dia beli, bukan dari paket pengganti", () => {
    // Padanan hanya untuk nama yang tampil. Kalau kuota ikut dipetakan, pembeli
    // lama kehilangan hak diam-diam (mis. cover letter tak terbatas jadi 5).
    const source = access;
    const resolution = source.slice(source.indexOf("for (const payment of activePayments)"));
    // identitas yang dipetakan ...
    expect(resolution).toContain("currentEquivalentPackage(pkg.id)");
    // ... sementara kuota tetap diambil dari definisi paket asli / snapshot.
    expect(resolution).toContain("pkgs.map((p) => p.limits)");
    expect(resolution).not.toMatch(/limits:\s*CURRENT_PACKAGES\[/);
  });

  it("paket yang masih dijual tidak ikut dipetakan ulang", () => {
    for (const key of MARKETED_PACKAGE_KEYS) {
      expect(currentEquivalentPackage(key)).toBe(key);
    }
  });
});

describe("paket portfolio membuktikan janji kartunya", () => {
  it("mengaktifkan portfolio web dan ekspor PDF tanpa batas", () => {
    const pkg = CURRENT_PACKAGES.portfolio_web;
    expect(pkg.limits.portfolio_web).toBe(1);
    expect(pkg.limits.pdf_export).toBe("unlimited");
    expect(pkg.limits.ai_suggestion).toBe("unlimited");
    expect(pkg.price).toBe(29000);
    expect(pkg.periodDays).toBe(30);
  });
});

describe("halaman harga memakai data katalog, bukan angka yang diketik tangan", () => {
  it("harga kartu dibaca dari katalog", () => {
    // Dulu angka harga ditulis langsung di file ini, jadi bisa melenceng dari
    // yang ditagih di checkout.
    expect(pricing).toContain("useCatalogPackages()");
    expect(pricing).not.toMatch(/id: "(cv-starter|cv-ai-generate|cv-analyzer|pro)"[,}]/);
  });

  it("daftar isi kartu dibaca dari kuota paket", () => {
    expect(pricing).toContain("packageBenefits(pkg)");
    expect(pricing).toContain("benefitText(");
  });

  it("semua paket yang ditampilkan ada di katalog", () => {
    for (const key of ["cek_cv", "bikin_cv", "surat_lamaran", "portfolio_web", "paket_lamaran"]) {
      expect(pricing).toContain(`key: "${key}"`);
      expect(CURRENT_PACKAGES[key]).toBeDefined();
    }
    for (const key of ["lite_bulanan", "pro_bulanan", "max_bulanan"]) {
      expect(pricing).toContain(`key: "${key}"`);
      expect(CURRENT_PACKAGES[key]).toBeDefined();
    }
  });

  it("paket lama tetap ada sebagai definisi agar pembayaran lama tidak kehilangan hak", () => {
    for (const key of ["pro_monthly", "premium_pass_30d", "business_monthly", "cv_starter"]) {
      expect(LEGACY_PACKAGES[key]).toBeDefined();
    }
    // Tapi tidak boleh ikut dipasang di access.ts sebagai paket yang dijual.
    const current = block(staticCatalog, "CURRENT_PACKAGES", "LEGACY_PACKAGES");
    expect(current).not.toContain("premium_pass_30d");
    expect(current).not.toContain("business_monthly");
  });
});

describe("tanpa klaim yang tidak bisa dipertanggungjawabkan", () => {
  it("halaman harga tidak memakai diskon fiktif", () => {
    const i18n = read("src/lib/i18n.tsx");
    expect(i18n).not.toContain("Hemat 30%");
    expect(pricing).not.toContain("originalPrice");
  });

  it("fitur yang belum ada tidak masuk paket yang dijual", () => {
    for (const key of Object.keys(CURRENT_PACKAGES)) {
      expect(CURRENT_PACKAGES[key].limits.bulk_analyzer).toBe(false);
      expect(CURRENT_PACKAGES[key].limits.white_label).toBe(false);
    }
  });

  it("paket bulanan menyebut masa berlakunya", () => {
    for (const key of ["lite_bulanan", "pro_bulanan", "max_bulanan"]) {
      expect(CURRENT_PACKAGES[key].monthly).toBe(true);
      expect(CURRENT_PACKAGES[key].periodDays).toBe(30);
    }
  });

  it("batas wajar model mendalam ditulis di halaman harga", () => {
    const i18n = read("src/lib/i18n.tsx");
    expect(i18n).toContain("pricing.fair-use-note");
    expect(pricing).toContain('t("pricing.fair-use-note")');
  });
});

describe("katalog statis sama dengan definisi di access.ts", () => {
  it("harga paket yang dijual identik", () => {
    // Dua sumber ini harus bergerak bersama; kalau tidak, tampilan dan tagihan
    // bisa berbeda saat salah satu terlewat.
    const accessBlock = block(access, "cek_cv: {", "cv_ai_generate: {");
    for (const key of ["cek_cv", "bikin_cv", "surat_lamaran", "portfolio_web", "paket_lamaran"]) {
      expect(accessBlock).toContain(`price: ${CURRENT_PACKAGES[key].price}`);
    }
  });

  it("unit harga di landing sesuai paket", () => {
    expect(pricing).toContain("pricing.unit.one-application");
    expect(pricing).toContain("pricing.unit.per-month");
  });
});