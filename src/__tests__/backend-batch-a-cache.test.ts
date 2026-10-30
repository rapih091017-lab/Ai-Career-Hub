import { describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/access", () => ({ getUserAccess: vi.fn() }));

import { noCache } from "@/lib/api-utils";

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return routeFiles(p);
    return name === "route.ts" ? [p] : [];
  });
}

describe("cache header data pribadi (R4)", () => {
  it("noCache bersifat private dan no-store", () => {
    const cc = noCache()["Cache-Control"];
    expect(cc).toContain("private");
    expect(cc).toContain("no-store");
  });

  it("route yang memanggil auth() tidak memakai cache publik", () => {
    const offenders = routeFiles(join(process.cwd(), "src/app/api")).filter((f) => {
      const src = readFileSync(f, "utf8");
      return src.includes("auth()") && src.includes("staleWhileRevalidate(");
    });
    expect(offenders).toEqual([]);
  });
});
