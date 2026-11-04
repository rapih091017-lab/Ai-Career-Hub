import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useFetchCvData } from "@/hooks/useFetchCvData";
import { buildCvSaveBody } from "@/lib/builder-save";
import type { CvData } from "@/components/cv-templates";

describe("templateId tidak diganti diam-diam", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("id tak dikenal dari DB disimpan apa adanya", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ templateId: "legacy-x", tailoredContent: {} }) })));
    const { result } = renderHook(() => useFetchCvData("cv1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.selectedTemplateId).toBe("legacy-x");
  });

  it("autosave tanpa templateId sampai user memilih template", () => {
    expect(JSON.parse(buildCvSaveBody({ fullName: "A" } as CvData, undefined))).not.toHaveProperty("templateId");
    const page = readFileSync(join(process.cwd(), "src/app/builder/[id]/page.tsx"), "utf8");
    expect(page).toContain("templateTouched ? selectedTemplateId : undefined");
  });

  it("create route memvalidasi templateId", () => {
    const src = readFileSync(join(process.cwd(), "src/app/api/cv-documents/create/route.ts"), "utf8");
    expect(src).toContain("Template tidak dikenal");
  });
});
