import { describe, it, expect } from "vitest";
import { parseAutoFixRequest, AUTO_FIX_MAX_BODY_BYTES } from "@/lib/auto-fix";

// B5: body auto-fix tidak dipercaya mentah.
describe("parseAutoFixRequest", () => {
  it("menerima draf CV wajar dan membuang field lain", () => {
    const r = parseAutoFixRequest(
      JSON.stringify({
        cv: { summary: "Ringkas", workHistory: [{ position: "QA", description: "Uji", id: "x", isPresent: true }], skills: [{ name: "SQL", level: "" }], fullName: "A", cvLang: "id" },
        jobDescription: "JD",
      }),
    );
    expect(r?.cv?.summary).toBe("Ringkas");
    expect(r?.cv?.workHistory?.[0]).toEqual({ position: "QA", description: "Uji" });
    expect(r?.cv).not.toHaveProperty("fullName");
  });

  it("body kosong berarti pakai data DB", () => {
    expect(parseAutoFixRequest("")).toEqual({});
  });

  it("menolak body bukan JSON, tipe salah, atau terlalu besar", () => {
    expect(parseAutoFixRequest("{bukan json")).toBeNull();
    expect(parseAutoFixRequest(JSON.stringify({ cv: { summary: 123 } }))).toBeNull();
    expect(parseAutoFixRequest(JSON.stringify({ cv: { workHistory: Array(41).fill({}) } }))).toBeNull();
    expect(parseAutoFixRequest(JSON.stringify({ jobDescription: "x".repeat(AUTO_FIX_MAX_BODY_BYTES) }))).toBeNull();
  });
});
