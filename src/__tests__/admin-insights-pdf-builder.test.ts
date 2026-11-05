import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("admin insights", () => {
  it("statistik fitur mengecualikan log pdf_builder", () => {
    const src = readFileSync(join(process.cwd(), "src/app/api/admin/insights/route.ts"), "utf8");
    expect(src).toContain('ne(usageLogs.actionType, "pdf_builder")');
  });
});
