import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

const about = read("src/app/about/page.tsx");
const privacy = read("src/app/privacy/page.tsx");
const faq = read("src/app/faq/page.tsx");

describe("halaman legal & publik: sinkron dengan produk", () => {
  it("privacy menyebut semua pihak ketiga yang benar-benar dipakai", () => {
    // Ketiganya terverifikasi dari kode: auth Google, AI DeepSeek, DB Neon,
    // pembayaran Midtrans. Menyebut satu saja berarti ada yang tidak ditutup.
    for (const party of ["Google", "DeepSeek", "Neon", "Midtrans"]) {
      expect(privacy, `privacy tidak menyebut ${party}`).toContain(party);
    }
  });

  it("privacy punya minimal 9 bagian dan tanggal pembaruan", () => {
    const sections = privacy.match(/^\s{4}title: "/gm) ?? [];
    expect(sections.length).toBeGreaterThanOrEqual(9);
    expect(privacy).toMatch(/Diperbarui|last update|terakhir diperbarui/i);
  });

  it("privacy menandai fakta yang harus diisi pemilik produk", () => {
    const marks = (privacy.match(/\[ISI:[^\]]+\]/g) ?? []).filter((m) => !m.includes("…"));
    // Sisa yang boleh terbuka hanya empat: nama badan, negara pemrosesan AI,
    // negara hosting, dan batas usia. Email serta retensi sudah diisi pemilik.
    expect(marks.length, "Expect 4 titik [ISI:...] tersisa di privacy").toBe(4);
  });

  it("email resmi dan masa retensi sudah terisi", () => {
    expect(privacy).toContain("aicareerhub@gmail.com");
    expect(privacy).toContain("30 hari setelah paket berakhir");
    expect(privacy).toContain("100 hari");
  });

  it("halaman kontak memakai email yang bisa dihubungi, bukan domain mati", () => {
    const settings = read("src/lib/site-settings.server.ts");
    expect(settings).toContain("aicareerhub@gmail.com");
    expect(settings).not.toContain("support@aicareerhub.com");
  });

  it("privacy jujur soal portofolio yang dipublikasikan", () => {
    expect(privacy.toLowerCase()).toContain("publik");
    expect(privacy).toMatch(/slug|tautan publik/i);
  });

  it("about menyebut seluruh lini produk, bukan lagi 4 layanan lama", () => {
    for (const line of ["AI Career Hub", "Portfolio", "Interview", "Surat Lamaran", "lowongan"]) {
      expect(about, `about tidak menyebut ${line}`).toContain(line);
    }
    expect(about).not.toContain("Saran AI Personal");
  });

  it("faq menutup minimal 15 pertanyaan dan mengelompokkannya", () => {
    const count = (faq.match(/^\s*q: "/gm) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(15);
    expect(faq).toMatch(/category: /);
  });

  it("faq memakai angka paket yang benar (bukan angka lama)", () => {
    // Batas free & harga harus sama dengan src/lib/access.ts.
    expect(faq).toContain("Coba Pro 3 Hari");
    expect(faq).toContain("35.000");
    expect(faq).not.toContain("3.000");
  });
});