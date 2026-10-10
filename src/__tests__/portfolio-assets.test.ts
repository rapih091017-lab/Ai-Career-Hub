import { describe, it, expect } from "vitest";
import {
  MAX_ASSET_BYTES,
  ALLOWED_MIME,
  isAllowedMime,
  fitsDimensionBudget,
  dimensionWarning,
  readImageSize,
} from "@/lib/portfolio/assets";

describe("validasi aset", () => {
  it("membatasi ukuran 4 MB", () => {
    expect(MAX_ASSET_BYTES).toBe(4194304);
  });

  it("hanya menerima gambar yang didukung", () => {
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("image/webp")).toBe(true);
    expect(isAllowedMime("image/svg+xml")).toBe(false);
    expect(isAllowedMime("application/pdf")).toBe(false);
  });

  it("menandai gambar yang melebihi anggaran dimensi", () => {
    expect(fitsDimensionBudget(4000, 3000)).toBe(false);
    expect(fitsDimensionBudget(1600, 1200)).toBe(true);
    expect(dimensionWarning(4000, 3000)).toContain("4000");
  });

  it("membaca dimensi PNG dari header", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x03, 0x20, 0x00, 0x00, 0x01, 0xe0,
    ]);
    expect(readImageSize(png, "image/png")).toEqual({ width: 800, height: 480 });
  });

  it("mengembalikan null untuk format tak didukung", () => {
    expect(readImageSize(Buffer.alloc(4), "image/webp")).toBeNull();
  });

  it("menyebutkan daftar format yang diterima", () => {
    expect(ALLOWED_MIME.join(", ")).toContain("image/webp");
  });
});
