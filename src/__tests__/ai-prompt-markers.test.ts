import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";
import { splitCvJd, injectInputData } from "@/lib/ai/adapter";

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

  it("CV yang memuat penanda di tengah teks tidak ikut terpotong", () => {
    // Kandidat sering menyalin prompt sebelumnya ke kolom CV. Penanda yang
    // muncul di tengah teksnya bukan header blok, jadi seluruh isi CV
    // termasuk bagian sebelum penanda itu harus tetap masuk.
    const data = [
      "=== ROLE CATEGORY: tech ===",
      "",
      PROMPT_MARKERS.cv,
      "Riwayat: pernah pakai prompt lama",
      PROMPT_MARKERS.cv,
      "Python, SQL, 3 tahun",
      "",
      PROMPT_MARKERS.jd,
      "Butuh AWS",
    ].join("\n");
    const { cv, jd } = splitCvJd(data);
    expect(cv).toBe(
      ["Riwayat: pernah pakai prompt lama", PROMPT_MARKERS.cv, "Python, SQL, 3 tahun"].join("\n"),
    );
    expect(jd).toBe("Butuh AWS");
  });

  it("penanda JD yang muncul paling awal dipakai sebagai batas", () => {
    const legacyFirst = ["Python, SQL", "", "=== JOB DESCRIPTION ===", "Butuh GCP", "", PROMPT_MARKERS.jd, "Butuh AWS"].join("\n");
    expect(splitCvJd(legacyFirst).jd).toBe(["Butuh GCP", "", PROMPT_MARKERS.jd, "Butuh AWS"].join("\n"));

    const currentFirst = ["Python, SQL", "", PROMPT_MARKERS.jd, "Butuh AWS", "", "=== JOB DESCRIPTION ===", "Butuh GCP"].join("\n");
    expect(splitCvJd(currentFirst).jd).toBe(["Butuh AWS", "", "=== JOB DESCRIPTION ===", "Butuh GCP"].join("\n"));

    // Yang diuji di sini adalah batas potongnya: isi CV tetap utuh di kedua
    // urutan, jadi penanda yang lain tidak ikut terpotong.
    expect(splitCvJd(legacyFirst).cv).toBe("Python, SQL");
    expect(splitCvJd(currentFirst).cv).toBe("Python, SQL");
  });

  it("data kosong menghasilkan kedua bagian kosong", () => {
    expect(splitCvJd("")).toEqual({ cv: "", jd: "" });
  });
});

describe("penyuntikan data ke prompt", () => {
  // String.prototype.replace dengan string pengganti menafsirkan $&, $`, dan $'
  // sebagai bagian dari pola. CV yang memuat "$&" — wajar terjadi pada teks
  // tentang regex atau shell — akan merusak isi {{CV_TEXT}} di prompt.
  it("CV yang memuat pola pengganti regex tetap masuk utuh", () => {
    const cv = "Regex: ganti pakai $&, lalu $`, lalu $' sebelum koma";
    const data = [PROMPT_MARKERS.cv, cv, "", PROMPT_MARKERS.jd, "Butuh AWS"].join("\n");

    const prompt = injectInputData("CV:\n{{CV_TEXT}}\nJD:\n{{JD_TEXT}}", data);

    expect(prompt).toBe(`CV:\n${cv}\nJD:\nButuh AWS`);
  });

  it("data mentah yang memuat pola pengganti juga tetap utuh", () => {
    // Data mentah pun bisa memuat $&, jadi {{INPUT_DATA}} dan {{PROFILE_DATA}}
    // perlu perlakuan yang sama. Placeholder ini menerima data apa adanya,
    // termasuk penanda bloknya.
    const data = ["$& seluruh data mentah", "", PROMPT_MARKERS.jd, "Butuh AWS"].join("\n");

    expect(injectInputData("{{INPUT_DATA}}", data)).toBe(data);
    expect(injectInputData("{{PROFILE_DATA}}", data)).toBe(data);
    expect(injectInputData("{{CV_TEXT}}", data)).toBe("$& seluruh data mentah");
  });
});
