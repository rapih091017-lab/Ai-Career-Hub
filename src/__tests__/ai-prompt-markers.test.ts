import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";
import { splitCvJd } from "@/lib/ai/adapter";

// adapter membangun klien OpenAI saat modul diimpor dan SDK itu melempar
// error kalau API key tidak ada di environment test. Test ini cuma memakai
// splitCvJd yang fungsi murni tanpa jaringan, jadi kliennya cukup dummy.
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: async () => ({ choices: [] }) } };
  },
}));

describe("penanda blok CV dan JD", () => {
  it("adapter dan route memakai penanda yang sama", () => {
    // Sumber-drift ini pernah terjadi: adapter cari "=== JOB DESCRIPTION ==="
    // sementara route nulis "=== JOB DESCRIPTION TARGET ===", sehingga
    // {{JD_TEXT}} terkirim kosong ke model.
    const adapter = readFileSync("src/lib/ai/adapter.ts", "utf8");
    const route = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");

    expect(adapter).toContain("PROMPT_MARKERS");
    expect(route).toContain("PROMPT_MARKERS");
    // Tidak boleh ada penanda yang ditulis manual di kedua file.
    expect(adapter).not.toContain('"=== JOB DESCRIPTION ==="');
    expect(route).not.toContain('"=== JOB DESCRIPTION TARGET ==="');
  });

  it("penanda JD yang dipakai route persis sama dengan yang dicari adapter", () => {
    const route = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");
    expect(route).toContain("PROMPT_MARKERS.jd");
    expect(PROMPT_MARKERS.jd).toBe("=== JOB DESCRIPTION TARGET ===");
    expect(PROMPT_MARKERS.cv).toBe("=== CV KANDIDAT ===");
  });
});

describe("pemisahan CV dan JD di prompt", () => {
  // Menguji kode asli, bukan salinan logika di dalam test. Kalau logikanya
  // dicopy ke sini, testnya tetap hijau walau fungsi aslinya rusak.
  it("deskripsi lowongan tidak ikut masuk ke bagian CV", () => {
    const data = [
      "=== ROLE CATEGORY: tech ===",
      "",
      PROMPT_MARKERS.cv,
      "Python, SQL, 3 tahun",
      "",
      PROMPT_MARKERS.jd,
      "Butuh engineer yang paham AWS",
    ].join("\n");
    const { cv, jd } = splitCvJd(data);
    expect(cv).toBe("Python, SQL, 3 tahun");
    expect(jd).toBe("Butuh engineer yang paham AWS");
  });

  it("prompt lama dengan penanda lawas tetap terpisah", () => {
    const data = ["Python, SQL", "", "=== JOB DESCRIPTION ===", "Butuh AWS"].join("\n");
    const { cv, jd } = splitCvJd(data);
    expect(cv).toBe("Python, SQL");
    expect(jd).toBe("Butuh AWS");
  });

  it("data tanpa penanda apa pun tidak dihapus", () => {
    const { cv, jd } = splitCvJd("hanya teks bebas");
    expect(cv).toBe("hanya teks bebas");
    expect(jd).toBe("");
  });
});
