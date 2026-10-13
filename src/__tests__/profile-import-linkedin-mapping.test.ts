import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const promptSrc = readFileSync(join(process.cwd(), "src/lib/ai/prompts/profile-import-v1.ts"), "utf8");
const modalSrc = readFileSync(join(process.cwd(), "src/components/profile/ImportResumeModal.tsx"), "utf8");
const profilePageSrc = readFileSync(join(process.cwd(), "src/app/settings/profile/page.tsx"), "utf8");

/**
 * Gejala yang dilaporkan: ringkasan LinkedIn sudah lengkap, tapi isinya tidak
 * masuk ke kolom yang benar. Penyebabnya tiga: prompt tidak mengenal struktur
 * LinkedIn, dan halaman profil menimpa semua kolom apa adanya.
 */
describe("impor profil mengisi kolom yang tepat", () => {
  it("promptudu struktur ringkasan LinkedIn", () => {
    expect(promptSrc).toContain("CARA MEMBACA RINGKASAN LINKEDIN");
    // Organisasi harus masuk ke kolomnya sendiri, bukan dianggap pekerjaan.
    expect(promptSrc).toMatch(/Organizations[\s\S]{0,200}organisations/);
    expect(promptSrc).toContain("Top Skills");
    expect(promptSrc).toContain("Licenses & Certifications");
  });

  it("peran dan perusahaan yang tertukar ditangani", () => {
    expect(promptSrc).toMatch(/terbalik/);
  });

  it("modal menawarkan pilihan isi-kosong dan timpa-semua", () => {
    expect(modalSrc).toContain("profile.import.mode-fill");
    expect(modalSrc).toContain("profile.import.mode-replace");
    expect(modalSrc).toContain('useState<MergeMode>("fill-empty")');
  });

  it("halaman profil memakai penggabungan, bukan penimpaan buta", () => {
    expect(profilePageSrc).toContain("mergeImportedProfile");
    expect(profilePageSrc).not.toContain("setPersonalInfo({ ...imported.personalInfo })");
  });

  it("jumlah organisasi ditampilkan di pratinjau", () => {
    // Alur LinkedIn punya bagian Organizations; kalau tidak ditampilkan,
    // pengguna mengira informasinya hilang.
    expect(modalSrc).toContain("profile.import.preview-organisations");
  });
});