import { describe, it, expect } from "vitest";
import {
  normalizeBulletLines,
  bulletList,
  splitAiBullets,
  appendBullets,
  applyAiBullets,
} from "@/lib/bullet-lines";

describe("normalizeBulletLines", () => {
  it("kriteria issue 05: tempel '• a\\n- b' tersimpan 'a\\nb'", () => {
    expect(normalizeBulletLines("• a\n- b")).toBe("a\nb");
  });

  it("menghapus semua jenis penanda di awal baris", () => {
    const input = ["• satu", "· dua", "- tiga", "* empat", "– lima", "— enam", "▪ tujuh", "► delapan", "● sembilan", "+ sepuluh", "•sebelas"].join("\n");
    expect(normalizeBulletLines(input).split("\n")).toEqual([
      "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas",
    ]);
  });

  it("penomoran dibuang bila terlihat sebagai daftar (≥2 baris berurutan)", () => {
    expect(normalizeBulletLines("1. satu\n2) dua\n(3) tiga")).toBe("satu\ndua\ntiga");
    expect(normalizeBulletLines("a) satu\nb) dua")).toBe("satu\ndua");
    expect(normalizeBulletLines("a. satu\nb. dua")).toBe("satu\ndua");
    expect(normalizeBulletLines("- 1. satu\n- 2. dua")).toBe("satu\ndua");
  });

  it("nomor/huruf tunggal yang bukan daftar tidak rusak", () => {
    expect(normalizeBulletLines("s. d. 2023 di PT A")).toBe("s. d. 2023 di PT A");
    expect(normalizeBulletLines("5) tahun pengalaman")).toBe("5) tahun pengalaman");
    expect(normalizeBulletLines("12. Juni 2023 diangkat jadi supervisor")).toBe("12. Juni 2023 diangkat jadi supervisor");
    expect(normalizeBulletLines("Mengelola gudang\n12. Juni 2023 promosi")).toBe("Mengelola gudang\n12. Juni 2023 promosi");
  });

  it("simbol berulang (rating) tidak dipecah atau dibuang", () => {
    expect(normalizeBulletLines("Excel ●●●○")).toBe("Excel ●●●○");
    expect(normalizeBulletLines("●●●○ Excel")).toBe("●●●○ Excel");
    expect(normalizeBulletLines("Bahasa Inggris ●●○○ • Excel ●●●○")).toBe("Bahasa Inggris ●●○○\nExcel ●●●○");
  });

  it("memecah bullet inline", () => {
    expect(normalizeBulletLines("• a • b • c")).toBe("a\nb\nc");
    expect(normalizeBulletLines("Memimpin tim ▪ Menyusun laporan")).toBe("Memimpin tim\nMenyusun laporan");
  });

  it("teks tanpa penanda tetap utuh", () => {
    expect(normalizeBulletLines("Mengelola gudang\nMembuat SOP baru")).toBe("Mengelola gudang\nMembuat SOP baru");
  });

  it("trim, buang baris kosong, dukung CRLF", () => {
    expect(normalizeBulletLines("  a  \r\n\r\n   \n- \nb")).toBe("a\nb");
    expect(normalizeBulletLines("")).toBe("");
    expect(normalizeBulletLines(null)).toBe("");
    expect(normalizeBulletLines(undefined)).toBe("");
  });

  it("URL, angka desimal, dan persen tidak rusak", () => {
    expect(normalizeBulletLines("https://github.com/a-b/c-d")).toBe("https://github.com/a-b/c-d");
    expect(normalizeBulletLines("3.5 tahun pengalaman")).toBe("3.5 tahun pengalaman");
    expect(normalizeBulletLines("- Naik 12.5% dalam 3 bulan")).toBe("Naik 12.5% dalam 3 bulan");
    expect(normalizeBulletLines("-5% biaya operasional")).toBe("-5% biaya operasional");
    expect(normalizeBulletLines("2024 meluncurkan produk")).toBe("2024 meluncurkan produk");
  });

  it("tanda '-' dan '·' di tengah kalimat tidak dipecah", () => {
    expect(normalizeBulletLines("Front-end - React dan Next.js")).toBe("Front-end - React dan Next.js");
    expect(normalizeBulletLines("Python · SQL · Excel")).toBe("Python · SQL · Excel");
    expect(normalizeBulletLines("Jakarta – Bandung")).toBe("Jakarta – Bandung");
  });

  it("penanda bertumpuk dibersihkan", () => {
    expect(normalizeBulletLines("1. • Mengelola stok\n2. • Audit")).toBe("Mengelola stok\nAudit");
    expect(splitAiBullets("1. • Mengelola stok")).toBe("Mengelola stok");
  });

  it("idempoten", () => {
    const once = normalizeBulletLines("• a\n2. b\n- c");
    expect(normalizeBulletLines(once)).toBe(once);
  });

  it("bulletList mengembalikan array", () => {
    expect(bulletList("- a\n- b")).toEqual(["a", "b"]);
  });
});

describe("splitAiBullets", () => {
  it("kriteria issue 06: '1. foo\\n2. bar' dan '• foo • bar' jadi 'foo\\nbar'", () => {
    expect(splitAiBullets("1. foo\n2. bar")).toBe("foo\nbar");
    expect(splitAiBullets("• foo • bar")).toBe("foo\nbar");
  });

  it("teks bernomor dalam satu baris dipecah", () => {
    expect(splitAiBullets("1. Menyusun laporan 2. Melatih 3 staf 3) Audit stok")).toBe("Menyusun laporan\nMelatih 3 staf\nAudit stok");
  });

  it("baris yang tidak diawali '1.' tidak dipecah di angka", () => {
    expect(splitAiBullets("Melatih 2. tim baru")).toBe("Melatih 2. tim baru");
  });

  it("array string diratakan, non-string dibuang", () => {
    expect(splitAiBullets(["- a", "• b • c", 5, null])).toBe("a\nb\nc");
  });

  it("input bukan string/array menjadi kosong", () => {
    expect(splitAiBullets(undefined)).toBe("");
    expect(splitAiBullets({ a: 1 })).toBe("");
  });
});

describe("appendBullets / applyAiBullets", () => {
  it("menambah poin tanpa menggandakan", () => {
    expect(appendBullets("a\nb", "• b\n• c")).toBe("a\nb\nc");
  });

  it("deskripsi lama yang kosong", () => {
    expect(appendBullets("", ["1. x", "2. y"])).toBe("x\ny");
  });

  it("deskripsi lama ikut dinormalisasi", () => {
    expect(appendBullets("- a\n\n", "b")).toBe("a\nb");
  });

  it("mode replace mengganti seluruh deskripsi", () => {
    expect(applyAiBullets("lama", "1. baru\n2. lagi", "replace")).toBe("baru\nlagi");
    expect(applyAiBullets("lama", "• baru", "append")).toBe("lama\nbaru");
    expect(applyAiBullets("lama", "baru")).toBe("baru");
  });
});

describe("aiTextForField", () => {
  it("mode poin memecah respons AI, mode paragraf dibiarkan", async () => {
    const { aiTextForField } = await import("@/lib/bullet-lines");
    expect(aiTextForField("1. foo\n2. bar", undefined)).toBe("foo\nbar");
    expect(aiTextForField("• foo • bar", "bullets")).toBe("foo\nbar");
    expect(aiTextForField("  Satu paragraf - utuh.  ", "paragraph")).toBe("Satu paragraf - utuh.");
    expect(aiTextForField("Kalimat satu.\nKalimat dua", "paragraph")).toBe("Kalimat satu. Kalimat dua.");
  });
});

describe("joinAsParagraph / splitSentences", () => {
  it("gabung poin jadi paragraf dengan titik", async () => {
    const { joinAsParagraph } = await import("@/lib/bullet-lines");
    expect(joinAsParagraph("Menyusun laporan\nMelatih staf!\nAudit stok:")).toBe("Menyusun laporan. Melatih staf! Audit stok:");
    expect(joinAsParagraph("- a\n\n- b.")).toBe("a. b.");
  });

  it("pecah per kalimat tanpa kehilangan teks", async () => {
    const { splitSentences } = await import("@/lib/bullet-lines");
    expect(splitSentences("Menyusun laporan. Melatih 3 staf! Naik 2.5 poin s. d. 2023.")).toEqual(["Menyusun laporan.", "Melatih 3 staf!", "Naik 2.5 poin s. d. 2023."]);
    expect(splitSentences("Langkah 3. Tempel tiga. Dibimbing A. Rahman.")).toEqual(["Langkah 3. Tempel tiga.", "Dibimbing A. Rahman."]);
    const para = "Satu. Dua? Tiga";
    expect(splitSentences(para).join(" ")).toBe(para);
  });

  it("bolak-balik poin → paragraf → poin tidak kehilangan teks", async () => {
    const { joinAsParagraph, splitSentences } = await import("@/lib/bullet-lines");
    const bullets = "Menyusun laporan stok\nMelatih [jumlah orang] staf baru.\nAudit gudang tiap bulan";
    const back = splitSentences(joinAsParagraph(bullets));
    expect(back.map((l) => l.replace(/\.$/, ""))).toEqual(bullets.split("\n").map((l) => l.replace(/\.$/, "")));
  });
});
