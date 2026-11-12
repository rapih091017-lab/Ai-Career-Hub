import { describe, it, expect } from "vitest";
import {
  OutputLangSchema,
  detectLang,
  outputLangInstruction,
  parseOutputLangField,
  resolveOutputLang,
  withOutputLang,
} from "@/lib/ai/output-lang";
import { parseAutoFixRequest } from "@/lib/auto-fix";

describe("outputLang: skema", () => {
  it("menerima id/en dan menolak nilai lain", () => {
    expect(OutputLangSchema.safeParse("id").success).toBe(true);
    expect(OutputLangSchema.safeParse("en").success).toBe(true);
    expect(OutputLangSchema.safeParse("fr").success).toBe(false);
    expect(OutputLangSchema.safeParse("EN").success).toBe(false);
    expect(OutputLangSchema.safeParse(1).success).toBe(false);
  });

  it("field opsional: kosong boleh, nilai asing ditolak", () => {
    expect(parseOutputLangField(undefined)).toEqual({ ok: true });
    expect(parseOutputLangField("en")).toEqual({ ok: true, lang: "en" });
    expect(parseOutputLangField("jp")).toEqual({ ok: false });
  });

  it("body auto-fix menerima outputLang valid dan menolak yang invalid", () => {
    expect(parseAutoFixRequest(JSON.stringify({ outputLang: "en" }))?.outputLang).toBe("en");
    expect(parseAutoFixRequest(JSON.stringify({ outputLang: "de" }))).toBeNull();
  });
});

describe("outputLang: default", () => {
  it("pilihan eksplisit menang atas cvLang", () => {
    expect(resolveOutputLang({ requested: "en", cvLang: "id" })).toBe("en");
  });
  it("tanpa pilihan, ikut cvLang", () => {
    expect(resolveOutputLang({ cvLang: "en", text: "membantu tim dan mengelola data" })).toBe("en");
    expect(resolveOutputLang({ requested: "xx", cvLang: "id" })).toBe("id");
  });
  it("tanpa cvLang, deteksi dari teks lalu id", () => {
    expect(resolveOutputLang({ text: "Managed the team and improved the process" })).toBe("en");
    expect(resolveOutputLang({ text: "Mengelola tim dan meningkatkan proses" })).toBe("id");
    expect(resolveOutputLang({ text: "SQL" })).toBe("id");
    expect(detectLang("")).toBeNull();
  });
});

describe("outputLang: instruksi prompt", () => {
  it("id: Bahasa Indonesia + placeholder Indonesia", () => {
    const s = outputLangInstruction("id");
    expect(s).toContain("Tulis seluruh output dalam Bahasa Indonesia; jangan campur bahasa.");
    expect(s).toContain("[angka]");
    expect(s).not.toContain("[number]");
  });
  it("en: English + placeholder Inggris", () => {
    const s = outputLangInstruction("en");
    expect(s).toContain("Tulis seluruh output dalam English; jangan campur bahasa.");
    expect(s).toContain("[number]");
    expect(s).toContain("kecuali nama tool, teknologi, dan perusahaan");
  });
  it("withOutputLang menaruh instruksi di akhir prompt", () => {
    const p = withOutputLang("PROMPT", "en");
    expect(p.startsWith("PROMPT")).toBe(true);
    expect(p.trim().endsWith("Nama field/kunci JSON tetap seperti skema.")).toBe(true);
  });
});

describe("checker: bahasa teks tempel", async () => {
  const { checkerCopyLangInstruction } = await import("@/lib/ai/output-lang");
  const { readFileSync } = await import("node:fs");
  it("instruksi en/id menyebut copy_text dan placeholder sesuai bahasa, bukti tidak diterjemahkan", () => {
    const en = checkerCopyLangInstruction("en");
    expect(en).toContain("ditulis seluruhnya dalam English");
    expect(en).toContain("copy_text");
    expect(en).toContain("[number]");
    expect(en).toContain("tidak diterjemahkan");
    expect(checkerCopyLangInstruction("id")).toContain("[angka]");
  });
  it("route menambah instruksi hanya bila outputLang dipilih (tanpa pilihan prompt tetap)", () => {
    const route = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");
    expect(route).toContain('(copyLangField.lang ? checkerCopyLangInstruction(copyLangField.lang) : "")');
    expect(route).toContain("parseOutputLangField(body?.outputLang)");
  });
});
