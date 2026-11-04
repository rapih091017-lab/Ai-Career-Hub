import { describe, it, expect, vi, afterEach } from "vitest";
import { newId } from "@/lib/id";

describe("newId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("memakai prefix dan unik walau dibuat bersamaan", () => {
    const ids = Array.from({ length: 200 }, () => newId("sk"));
    expect(new Set(ids).size).toBe(200);
    expect(ids[0]).toMatch(/^sk_/);
  });

  it("tanpa randomUUID tetap unik (fallback getRandomValues)", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: real.getRandomValues.bind(real) });
    const a = newId("x");
    const b = newId("x");
    expect(a).not.toBe(b);
  });

  it("tanpa crypto sama sekali tetap unik", () => {
    vi.stubGlobal("crypto", undefined);
    vi.spyOn(Date, "now").mockReturnValue(1);
    expect(newId()).not.toBe(newId());
    vi.restoreAllMocks();
  });
});
