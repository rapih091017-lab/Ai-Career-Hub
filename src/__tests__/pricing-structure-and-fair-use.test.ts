import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRO_CHECK_FAIR_USE, CURRENT_PACKAGES as PACKAGES } from "@/lib/package-catalog-static";



const analyzeSrc = readFileSync(join(process.cwd(), "src/app/api/checker/analyze/route.ts"), "utf8");
const createCvSrc = readFileSync(join(process.cwd(), "src/app/api/cv-documents/create/route.ts"), "utf8");

/**
 * Simulasi margin (tarif DeepSeek puncak, asumsi token dari kode):
 * Cek CV pro ~Rp319/panggilan, flash ~Rp73, generate ~Rp47.
 * Tanpa batas, satu pengguna berat bisa menghapus untung sebulan.
 */
describe("batas wajar model mendalam", () => {
  it("batasnya longgar: jauh di atas pemakaian normal", () => {
    // Pemakaian normal 1-2 cek/hari → 60/bulan = 2 per hari.
    expect(PRO_CHECK_FAIR_USE.pro).toBe(60);
    expect(PRO_CHECK_FAIR_USE.max).toBe(120);
    expect(PRO_CHECK_FAIR_USE.lite).toBe(3);
  });

  it("pemakaian di luar batas dialihkan, bukan diblokir", () => {
    expect(analyzeSrc).toContain("checkProCheckAllowance");
    // Kalau diblokir, klaim "tanpa batas" di kartu harga jadi tidak benar.
    expect(analyzeSrc).not.toContain("QUOTA_EXCEEDED_FAIR_USE");
    expect(analyzeSrc).toContain("fairUseNote");
  });

  it("pemakaian model mendalam dicatat terpisah", () => {
    expect(analyzeSrc).toContain("checker_check_pro");
    expect(analyzeSrc).toContain("checker_check_light");
  });

  it("generate CV sekarang berbatas dan tercatat", () => {
    // Sebelumnya tanpa gate sama sekali: siapa pun bisa memakai model AI
    // tanpa jejak dan tanpa kuota.
    expect(createCvSrc).toContain('checkQuota(session.user.id, "cv_build")');
    expect(createCvSrc).toContain('logUsage(session.user.id, "cv_build")');
  });
});

describe("struktur paket baru", () => {
  it("satuan dan bulanan terpisah jelas", () => {
    const satuan = ["cek_cv", "bikin_cv", "surat_lamaran", "portfolio_web", "paket_lamaran"];
    const bulanan = ["lite_bulanan", "pro_bulanan", "max_bulanan"];
    for (const key of [...satuan, ...bulanan]) {
      expect(PACKAGES[key]).toBeDefined();
    }
    for (const key of bulanan) {
      expect(PACKAGES[key].monthly).toBe(true);
      expect(PACKAGES[key].periodDays).toBe(30);
    }
    for (const key of satuan) {
      expect(PACKAGES[key].periodDays).toBe(30);
    }
  });

  it("tidak ada paket satuan yang lebih murah tapi lebih banyak dari bulanan termurah", () => {
    // Inilah yang membuat katalog lama membingungkan: Rp7.000 memberi lebih
    // banyak dari Rp15.000.
    const cheapestMonthly = PACKAGES.lite_bulanan.price;
    const aiFeatures: (keyof typeof PACKAGES.cek_cv.limits)[] = [
      "ai_cv_generate",
      "ai_revision",
      "ai_suggestion",
    ];
    for (const key of ["cek_cv", "bikin_cv", "surat_lamaran", "paket_lamaran"]) {
      const pkg = PACKAGES[key];
      for (const feature of aiFeatures) {
        const single = pkg.limits[feature];
        if (single === false) continue;
        const monthly = PACKAGES.lite_bulanan.limits[feature];
        expect(monthly).not.toBe(false);
        if (typeof single === "number" && typeof monthly === "number") {
          expect(monthly).toBeGreaterThanOrEqual(single);
        }
        if (single === "unlimited") {
          expect(monthly).toBe("unlimited");
        }
      }
    }
    expect(PACKAGES.paket_lamaran.price).toBeGreaterThan(cheapestMonthly);
  });

  it("tidak ada paket yang menjanjikan fitur yang belum ada", () => {
    // bulk_analyzer dan white_label tidak ada route-nya, jadi tidak boleh
    // muncul di paket mana pun yang dijual.
    for (const key of ["lite_bulanan", "pro_bulanan", "max_bulanan", "paket_lamaran"]) {
      expect(PACKAGES[key].limits.bulk_analyzer).toBe(false);
      expect(PACKAGES[key].limits.white_label).toBe(false);
    }
  });

it("paket bulanan lebih tinggi selalu memberi lebih banyak", () => {
    const pro = PACKAGES.pro_bulanan.limits;
    const max = PACKAGES.max_bulanan.limits;
    for (const key of Object.keys(pro) as (keyof typeof pro)[]) {
      // Fitur yang tidak ada di keduanya (bulk_analyzer, white_label) tidak
      // perlu dibandingkan.
      if (pro[key] === false && max[key] === false) continue;
      if (key === "portfolio_web") {
        expect(max[key]).toBe("unlimited");
        continue;
      }
      if (pro[key] === "unlimited") {
        expect(max[key]).toBe("unlimited");
        continue;
      }
      if (typeof pro[key] === "number" && typeof max[key] === "number") {
        expect(max[key]).toBeGreaterThanOrEqual(pro[key]);
        continue;
      }
      expect(max[key]).not.toBe(false);
    }
  });
});