import { describe, it, expect, beforeEach } from "vitest";
import {
  cacheKey,
  readCache,
  writeCache,
  clearCache,
  type CachedDraft,
} from "@/lib/portfolio/usePortfolioDraft";

const draft = {
  name: "Portfolio saya",
  data: { formData: {} },
  updatedAt: "2026-10-10T00:00:00.000Z",
} as unknown as CachedDraft;

describe("cache draft", () => {
  beforeEach(() => localStorage.clear());

  it("membuat kunci cache per draft", () => {
    expect(cacheKey("abc")).toBe("portfolio_cache_v1_abc");
  });

  it("menulis dan membaca cache", () => {
    writeCache("abc", draft);
    expect(readCache("abc")).toEqual(draft);
  });

  it("mengembalikan null saat cache kosong atau rusak", () => {
    expect(readCache("kosong")).toBeNull();
    localStorage.setItem(cacheKey("rusak"), "{bukan json");
    expect(readCache("rusak")).toBeNull();
  });

  it("membersihkan cache", () => {
    writeCache("abc", draft);
    clearCache("abc");
    expect(readCache("abc")).toBeNull();
  });
});
