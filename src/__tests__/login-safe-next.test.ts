import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-next";

const ORIGIN = "https://app.example.com";

describe("safeNextPath", () => {
  it("menerima path internal beserta query", () => {
    expect(safeNextPath("/builder/new?from=checker", ORIGIN)).toBe("/builder/new?from=checker");
    expect(safeNextPath("/dashboard", ORIGIN)).toBe("/dashboard");
  });

  it("menolak pengalihan ke host lain", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "/\\/evil.com", "https://evil.com", "evil.com", "javascript:alert(1)", "", null]) {
      expect(safeNextPath(bad as string | null, ORIGIN), String(bad)).toBeNull();
    }
  });
});
