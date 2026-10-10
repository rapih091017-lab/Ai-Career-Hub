import { describe, it, expect } from "vitest";
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
