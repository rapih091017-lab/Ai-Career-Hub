import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/lib/i18n";
import { CheckerResultView } from "@/components/checker/CheckerResultView";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";
import { FULL_RESULT, STORED_ROW } from "./checker-result.fixture";

vi.mock("motion/react", async () => (await import("./motion-stub.helpers")).motionStub());
afterEach(cleanup);

function renderWith(source?: string) {
  const kw = { ...(FULL_RESULT.keywordAnalysis as object), ...(source ? { source } : {}) };
  const result = analysisFromFullResult("g1", { ...STORED_ROW, fullResult: { ...FULL_RESULT, keywordAnalysis: kw } });
  return render(
    <LanguageProvider>
      <CheckerResultView result={result} variant="stored" />
    </LanguageProvider>,
  );
}

describe("kata kunci tanpa lowongan", () => {
  it("role_generic: tanpa persen kecocokan, kicker umum, dan ajakan isi lowongan", () => {
    const { container } = renderWith("role_generic");
    const kw = container.querySelector("#section-keyword")!;
    expect(kw.textContent).toContain("Kata kunci umum untuk peran ini");
    expect(kw.textContent).toContain("Isi lowongan untuk melihat kecocokan.");
    expect(kw.textContent).not.toContain("Kecocokan lowongan");
    expect(kw.textContent).not.toContain("60%");
  });

  it("source job_description dan baris lama tanpa source tetap menampilkan persen", () => {
    for (const source of ["job_description", undefined]) {
      const { container } = renderWith(source);
      const kw = container.querySelector("#section-keyword")!;
      expect(kw.textContent).toContain("Kecocokan lowongan");
      expect(kw.textContent).toContain("60%");
      expect(screen.queryByText("Isi lowongan untuk melihat kecocokan.")).toBeNull();
      cleanup();
    }
  });
});
