import { describe, it, expect } from "vitest";
import {
  mergeLimits,
  mergePackageSelection,
  suggestBundle,
  applyBundle,
  PackageSelectionError,
} from "@/lib/package-selection";
/**
 * Katalog fixture. Nilainya dicerminkan dari src/lib/access.ts supaya test
 * ini tetap murni dan tidak menarik koneksi database.
 */
function pkg(
  id: string,
  name: string,
  price: number,
  periodDays: number,
  maxActivePortfolios: number,
  limits: Record<string, number | "unlimited" | false>,
) {
  return { id, name, price, periodDays, maxActivePortfolios, limits };
}

const catalog = {
  cv_starter: pkg("cv_starter", "Coba Pro 3 Hari", 7000, 3, 0, {
    ai_cv_generate: 10,
    cv_analyzer: 3,
    cover_letter: "unlimited",
    portfolio_web: false,
  }),
  cv_analyzer: pkg("cv_analyzer", "CV Analyzer", 9000, 30, 0, {
    cv_analyzer: 1,
    cover_letter: false,
    portfolio_web: false,
  }),
  portfolio_web: pkg("portfolio_web", "Portfolio Web", 35000, 30, 5, {
    portfolio_web: "unlimited",
    pdf_export: "unlimited",
    cover_letter: false,
    cv_analyzer: false,
  }),
  bundle_hemat: pkg("bundle_hemat", "Paket Lamaran", 49000, 60, 5, {
    cv_analyzer: 1,
    portfolio_web: "unlimited",
    cover_letter: "unlimited",
    pdf_export: "unlimited",
  }),
  // Paket yang dijual hari ini.
  cek_cv: pkg("cek_cv", "Cek CV", 9000, 30, 0, {
    cv_analyzer: 3,
    cover_letter: false,
    portfolio_web: false,
  }),
  bikin_cv: pkg("bikin_cv", "Bikin CV", 19000, 30, 0, {
    ai_cv_generate: 3,
    ai_revision: 5,
    ai_suggestion: 5,
    pdf_export: "unlimited",
    portfolio_web: false,
  }),
  surat_lamaran: pkg("surat_lamaran", "Surat Lamaran", 9000, 30, 0, {
    cover_letter: 2,
    portfolio_web: false,
  }),
  paket_lamaran: pkg("paket_lamaran", "Paket Lengkap 1 Lamaran", 34000, 30, 0, {
    ai_cv_generate: 3,
    cv_analyzer: 3,
    ai_revision: 5,
    ai_suggestion: 5,
    cover_letter: 2,
    pdf_export: "unlimited",
    portfolio_web: false,
  }),
} as unknown as Record<string, never>;

describe("penggabungan kuota", () => {
  it("nilai tertinggi menang untuk angka", () => {
    expect(mergeLimits({ ai_cv_generate: 2 }, { ai_cv_generate: 10 })).toEqual({ ai_cv_generate: 10 });
    expect(mergeLimits({ ai_cv_generate: 10 }, { ai_cv_generate: 2 })).toEqual({ ai_cv_generate: 10 });
  });

  it("unlimited selalu menang", () => {
    expect(mergeLimits({ ai_revision: "unlimited" }, { ai_revision: 3 }).ai_revision).toBe("unlimited");
    expect(mergeLimits({ ai_revision: 3 }, { ai_revision: "unlimited" }).ai_revision).toBe("unlimited");
  });

  it("false kalah dari nilai apa pun", () => {
    expect(mergeLimits({ cover_letter: false }, { cover_letter: 3 }).cover_letter).toBe(3);
    expect(mergeLimits({ cover_letter: 3 }, { cover_letter: false }).cover_letter).toBe(3);
  });
});

describe("satu pesanan dari beberapa paket", () => {
  it("menjumlahkan harga dan menggabungkan kuota", () => {
    const selection = mergePackageSelection(["cv_starter", "portfolio_web"], catalog);
    expect(selection.total).toBe(7000 + 35000);
    expect(selection.keys).toEqual(["cv_starter", "portfolio_web"]);
    expect(selection.joinedType).toBe("cv_starter+portfolio_web");
    expect(selection.joinedName).toContain("Coba Pro 3 Hari");
    // portfolio_web unlimited + starter 10 AI generate
    expect(selection.limits.portfolio_web).toBe("unlimited");
    expect(selection.limits.ai_cv_generate).toBe(10);
    expect(selection.maxActivePortfolios).toBe(5);
  });

  it("satu paket saja tetap behaves seperti sebelumnya", () => {
    const selection = mergePackageSelection(["portfolio_web"], catalog);
    expect(selection.total).toBe(35000);
    expect(selection.joinedType).toBe("portfolio_web");
  });

  it("tolak paket tidak dikenal, duplikat, dan paket gratis", () => {
    expect(() => mergePackageSelection([], catalog)).toThrow(PackageSelectionError);
    expect(() => mergePackageSelection(["ngawur"], catalog)).toThrow(/tidak dikenal/);
    expect(() => mergePackageSelection(["portfolio_web", "portfolio_web"], catalog)).toThrow(/lebih dari sekali/);
  });

  it("tolak bundle yang sudah mencakup paket lain", () => {
    expect(() => mergePackageSelection(["bundle_hemat", "portfolio_web"], catalog)).toThrow(
      /sudah mencakup/,
    );
  });

  it("dua paket yang tidak tumpang tindih tetap boleh", () => {
    const selection = mergePackageSelection(["cv_analyzer", "portfolio_web"], catalog);
    expect(selection.total).toBe(9000 + 35000);
  });
});

describe("saran bundle", () => {
  it("tawarkan bundle saat paket terpilih belum mencakup semuanya", () => {
    const advice = suggestBundle(["cv_analyzer"], catalog);
    expect(advice).not.toBeNull();
    expect(advice!.bundleKey).toBe("paket_lamaran");
    expect(advice!.missingCount).toBeGreaterThan(0);
  });

  it("diam saat paket terpilih sudah mencakup bundle", () => {
    expect(suggestBundle(["paket_lamaran"], catalog)).toBeNull();
  });

  it("diam saat input tidak valid", () => {
    expect(suggestBundle(["ngawur"], catalog)).toBeNull();
    expect(suggestBundle([], catalog)).toBeNull();
  });
});

describe("menerapkan paket gabungan", () => {
  it("mengganti paket satuan yang haknya sudah tercakup", () => {
    // Regression: tombol "pakai paket" dulu hanya menambah, jadi pengguna
    // membayar dua kali untuk hak yang sama.
    const next = applyBundle(["bikin_cv", "cek_cv", "surat_lamaran"], "paket_lamaran", catalog);
    expect(next).toEqual(["paket_lamaran"]);
  });

  it("menyisakan paket yang tidak tercakup", () => {
    const next = applyBundle(["paket_lamaran", "portfolio_web"], "paket_lamaran", catalog);
    expect(next).toContain("paket_lamaran");
    expect(next).toContain("portfolio_web");
  });

  it("tidak berubah kalau paketnya tidak ada di katalog", () => {
    expect(applyBundle(["bikin_cv"], "tidak_ada", catalog)).toEqual(["bikin_cv"]);
  });
});