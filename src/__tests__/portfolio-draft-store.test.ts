import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  cacheKey,
  readCache,
  writeCache,
  clearCache,
  usePortfolioDraft,
  type CachedDraft,
} from "@/lib/portfolio/usePortfolioDraft";
import type { ValidatedPortfolioData } from "@/lib/portfolio/schema";

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

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

describe("usePortfolioDraft flush & retry", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("mengulang flush setelah gagal, lalu tersimpan saat retry sukses", async () => {
    const patchCalls: string[] = [];
    let failPatch = true;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("draftId=")) {
        return jsonResponse({
          name: "Portfolio saya",
          data: { formData: {} },
          updatedAt: "2026-10-10T09:00:00.000Z",
        });
      }
      patchCalls.push(url);
      if (failPatch) return jsonResponse({}, false);
      return jsonResponse({ updatedAt: "2026-10-10T09:30:00.000Z" });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePortfolioDraft("d1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ formData: {} });

    act(() => {
      result.current.setData({
        formData: { skill: "ts" },
      } as unknown as ValidatedPortfolioData);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(patchCalls).toHaveLength(1);
    expect(result.current.status).toBe("error");
    expect(readCache("d1")?.data).toEqual({ formData: { skill: "ts" } });

    failPatch = false;
    act(() => {
      result.current.retry();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(patchCalls).toHaveLength(2);
    expect(result.current.status).toBe("saved");
    expect(result.current.lastSavedAt).toBe("2026-10-10T09:30:00.000Z");
    expect(readCache("d1")?.updatedAt).toBe("2026-10-10T09:30:00.000Z");
  });
});
