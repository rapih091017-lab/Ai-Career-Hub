import { describe, it, expect } from "vitest";
import { describeAuthError, isActionableAuthError } from "@/lib/auth-errors";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("pesan error masuk", () => {
  it("AccessDenied menjelaskan mode uji Google", () => {
    const msg = describeAuthError("AccessDenied");
    expect(msg).toMatch(/mode uji/i);
    expect(isActionableAuthError("AccessDenied")).toBe(true);
  });

  it("redirect URI salah punya penjelasan sendiri", () => {
    expect(describeAuthError("Callback")).toMatch(/Google Cloud Console/);
  });

  it("error tak dikenal tetap dapat pesan yang berguna", () => {
    expect(describeAuthError("Entah")).toMatch(/gagal/i);
    expect(describeAuthError(undefined)).toBe("");
  });

  it("halaman login membaca parameter error dari URL", () => {
    const src = readFileSync(join(process.cwd(), "src/app/login/page.tsx"), "utf8");
    expect(src).toContain("window.location.search");
    expect(src).toContain('get("error")');
    expect(src).toContain("describeAuthError");
  });
});