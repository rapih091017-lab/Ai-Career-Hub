import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canPublish,
  quotaMessage,
  PORTFOLIO_STATUS,
} from "@/lib/portfolio/publish-gate";

describe("gate publish", () => {
  it("membolehkan publish pertama untuk user gratis", () => {
    expect(canPublish({ maxActive: 1, activeCount: 0, alreadyOwns: false }).ok).toBe(true);
  });

  it("memblokir publish kedua untuk user gratis", () => {
    const r = canPublish({ maxActive: 1, activeCount: 1, alreadyOwns: false });
    expect(r.ok).toBe(false);
    expect(r).toEqual({ ok: false, code: "QUOTA_EXCEEDED" });
  });

  it("tidak menghitung kuota saat user sudah memiliki portfolio itu", () => {
    expect(canPublish({ maxActive: 1, activeCount: 1, alreadyOwns: true }).ok).toBe(true);
  });

  it("menghasilkan pesan yang menyebut batas dan paket", () => {
    const msg = quotaMessage(1, 1);
    expect(msg).toContain("1");
    expect(msg).toContain("Portfolio Web");
  });

  it("mendefinisikan tiga status", () => {
    expect(PORTFOLIO_STATUS).toEqual(["draft", "published", "archived"]);
  });
});

/* ─── Dialog publish: payload, kuota jujur, satu sumber slug ─── */

describe("PublishDialog", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/portfolio/PublishDialog.tsx"),
    "utf8",
  );

  it("meneruskan sectionOrder & sectionVisibility dari data draft sebagai fallback", () => {
    // Regresi: extras tidak pernah dikirim penulis manapun, jadi tanpa fallback
    // keduanya jatuh undefined → JSON.stringify membuangnya → halaman publik
    // kembali ke urutan bawaan dan meng-unhide section yang disembunyikan.
    expect(src).toContain("extras?.sectionOrder ?? data.sectionOrder");
    expect(src).toContain("extras?.sectionVisibility ?? data.sectionVisibility");
  });

  it("gagal memeriksa kuota membuat rencana null, bukan menganggap entitled", () => {
    // Regresi: refresh() pernah set entitled:true pada kegagalan → tombol
    // Publish aktif padahal status kuota tidak diketahui.
    expect(src).not.toMatch(/setPlan\(\{\s*maxActive: 1[\s\S]{0,120}entitled: true/);
    expect(src.match(/setPlan\(null\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(src).toContain("disabled={publishing || !checked}");
  });

  it("slug divalidasi lewat isValidSlug dari portfolio-safety, bukan regex lokal", () => {
    expect(src).not.toContain("SLUG_REGEX");
    expect(src).toContain("isValidSlug(s)");
  });
});
