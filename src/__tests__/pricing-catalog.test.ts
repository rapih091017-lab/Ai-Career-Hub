import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PLAN_ID_TO_PACKAGE_KEY,
  MARKETED_PACKAGE_KEYS,
  formatRupiah,
} from "@/lib/pricing-catalog";

const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

describe("katalog harga", () => {
  it("setiap plan di PricingSection punya pasangan key paket", () => {
    const src = read("src/components/PricingSection.tsx");
    const planIds = [...src.matchAll(/id:\s*"([a-z0-9-]+)",\s*price:/g)].map((m) => m[1]);
    expect(planIds.length).toBeGreaterThan(5);
    for (const id of planIds) {
      if (id === "free") continue; // paket gratis tidak ada di tabel packages
      expect(PLAN_ID_TO_PACKAGE_KEY[id], `plan "${id}" belum dipetakan ke key paket`).toBeTruthy();
    }
  });

  it("key paket yang dipetakan semuanya ada di daftar dipasarkan", () => {
    for (const key of Object.values(PLAN_ID_TO_PACKAGE_KEY)) {
      expect(MARKETED_PACKAGE_KEYS, `key ${key} tidak ada di MARKETED_PACKAGE_KEYS`).toContain(key);
    }
  });

  it("format rupiah tanpa desimal dan pakai titik ribuan", () => {
    expect(formatRupiah(7000)).toBe("Rp7.000");
    expect(formatRupiah(119000)).toBe("Rp119.000");
    expect(formatRupiah(0)).toBe("Rp0");
  });

  it("tidak ada harga yang ditulis manual di halaman tagihan", () => {
    const billing = read("src/app/settings/billing/page.tsx");
    // Harga harus datang dari katalog. Angka Rp119.000 dan Rp25.000 pernah
    // ditulis manual, sehingga tampilan bisa berbeda dari yang ditagih.
    expect(billing).not.toMatch(/Rp\s*\{?\s*119\.000/);
    expect(billing).not.toMatch(/Rp\s*\{?\s*25\.000/);
  });

  it("landing tidak lagi menulis harga paket secara manual", () => {
    const src = read("src/components/PricingSection.tsx");
    expect(src).not.toContain("Rp49.000");
    expect(src).not.toContain("Rp56.000");
  });
});