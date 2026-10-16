import { describe, it, expect } from "vitest";
import { parseArticleBlocks, parseInline } from "@/lib/article-format";

/**
 * Konten yang ditulis lewat editor memakai Enter untuk baris baru, dan
 * penomoran otomatis juga memakai Enter — bukan baris kosong.
 *
 * Parser sebelumnya memecah artikel hanya berdasarkan baris kosong, jadi
 * seluruh isi artikel yang ditulis dengan Enter biasa menyatu jadi satu blok.
 */

describe("isi artikel ditulis dengan Enter, bukan baris kosong", () => {
  it("dua paragraf berurutan dipisahkan", () => {
    const blocks = parseArticleBlocks("Paragraf pertama.\nParagraf kedua.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].text).toBe("Paragraf pertama.");
    expect(blocks[1].text).toBe("Paragraf kedua.");
  });

  it("judul tidak menelan paragraf setelahnya", () => {
    const blocks = parseArticleBlocks("## Kenapa penting\nPenjelasan singkat.");
    expect(blocks[0].kind).toBe("heading");
    expect(blocks[0].text).toBe("Kenapa penting");
    expect(blocks[1].kind).toBe("paragraph");
    expect(blocks[1].text).toBe("Penjelasan singkat.");
  });

  it("daftar bernomor tetap jadi daftar saat judul langsung di bawahnya", () => {
    const blocks = parseArticleBlocks("## Border\n1. Cek format\n2. Kirim");
    expect(blocks.map((b) => b.kind)).toEqual(["heading", "list"]);
    expect(blocks[1].items?.map((i) => i.text)).toEqual(["Cek format", "Kirim"]);
  });

  it("judul setelah daftar tetap muncul setelah daftar", () => {
    const blocks = parseArticleBlocks("1. Satu\n2. Dua\n## Berikutnya");
    expect(blocks.map((b) => b.kind)).toEqual(["list", "heading"]);
  });

  it("baris kosong di tengah daftar tidak mengulang dari satu", () => {
    // Penomoran otomatis tidak pernah menyisipkan baris kosong, jadi daftar
    // yang terputus baris kosong tetap harus dibaca sebagai satu daftar.
    const blocks = parseArticleBlocks("1. Satu\n2. Dua\n\n3. Tiga\n4. Empat");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("list");
    expect(blocks[0].items?.map((i) => i.text)).toEqual(["Satu", "Dua", "Tiga", "Empat"]);
  });

  it("daftar yang dimulai dari angka lain tetap memakai angka itu", () => {
    const blocks = parseArticleBlocks("3. Tiga\n4. Empat");
    expect(blocks[0].start).toBe(3);
  });

  it("daftar bullet tidak mengarang nomor", () => {
    const blocks = parseArticleBlocks("- Satu\n- Dua");
    expect(blocks[0].kind).toBe("list");
    expect(blocks[0].items?.map((i) => i.kind)).toEqual(["bullet", "bullet"]);
  });

  it("baris kosong diabaikan", () => {
    const blocks = parseArticleBlocks("\n\nSatu\n\n\nDua\n\n");
    expect(blocks.map((b) => b.text)).toEqual(["Satu", "Dua"]);
  });

  it("baris rata tengah pada barisnya sendiri", () => {
    const blocks = parseArticleBlocks("@center Di tengah\nTeks biasa");
    expect(blocks[0].align).toBe("center");
    expect(blocks[1].align).toBeUndefined();
  });

  it("penanda rata tidak menempel ke paragraf berikutnya", () => {
    const blocks = parseArticleBlocks("@center Baris pertama\nBaris kedua");
    expect(blocks[0].text).toBe("Baris pertama");
    expect(blocks[1].text).toBe("Baris kedua");
  });

  it("kutipan per baris", () => {
    const blocks = parseArticleBlocks("> Kutipan satu\n> Kutipan dua");
    expect(blocks.every((b) => b.kind === "quote")).toBe(true);
  });

  it("daftar bernomor yang mulai dari angka lain tetap dengan benar", () => {
    const blocks = parseArticleBlocks("5. Lima\n6. Enam");
    expect(blocks[0].items?.map((i) => i.text)).toEqual(["Lima", "Enam"]);
    expect(blocks[0].start).toBe(5);
  });

  it("teks tebal tetap terpecah", () => {
    expect(parseInline("sebelum **tebal** sesudah")).toHaveLength(3);
  });

  it("isi panjang tetap terpecah per baris", () => {
    const content = Array.from({ length: 5 }, (_, i) => `Kalimat nomor ${i + 1}.`).join("\n");
    expect(parseArticleBlocks(content)).toHaveLength(5);
  });
});
