import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "src/lib/auth.ts"), "utf8");

describe("tautan akun Google", () => {
  it("provider Google menautkan akun berdasarkan email terverifikasi Google", () => {
    // Tanpa baris ini, user lama yang sudah punya baris `users` tapi belum
    // punya baris `accounts` terkunci di error OAuthAccountNotLinked.
    expect(src).toContain("allowDangerousEmailAccountLinking: true");
  });

  it("tetap memakai kredensial dari environment", () => {
    expect(src).toContain("process.env.AUTH_GOOGLE_ID");
    expect(src).toContain("process.env.AUTH_GOOGLE_SECRET");
  });

  it("user pending dari Google tetap diaktifkan otomatis", () => {
    expect(src).toContain('status: "active"');
  });
});