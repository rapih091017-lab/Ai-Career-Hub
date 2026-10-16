import { describe, it, expect } from "vitest";
import { parseArticleBlocks, parseInline } from "@/lib/article-format";
import {
  careerHubPostCreateSchema,
  careerHubPostUpdateSchema,
  slugifyCareerHubTitle,
} from "@/lib/career-hub-schemas";

const base = {
  title: "Panduan CV ATS",
  excerpt: "Ringkasan singkat.",
  content: "Isi artikel.",
  category: "cv-ats",
  tags: ["ats"],
};

describe("penanda format artikel", () => {
  it("paragraf biasa jadi satu blok", () => {
    const blocks = parseArticleBlocks("Paragraf pertama.\nBaris kedua.\n\nParagraf kedua.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].kind).toBe("paragraph");
    expect(blocks[0].text).toBe("Paragraf pertama. Baris kedua.");
  });

  it("judul dibaca sebagai judul, bukan paragraf", () => {
    const blocks = parseArticleBlocks("## Tips ATS\n\nIsi bagian.");
    expect(blocks[0].kind).toBe("heading");
    expect(blocks[0].text).toBe("Tips ATS");
    expect(blocks[1].kind).toBe("paragraph");
  });

  it("daftar bernomor dikumpulkan jadi satu blok", () => {
    const blocks = parseArticleBlocks("1. Cek format\n2. IsiExperience\n3. Kirim");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("list");
    expect(blocks[0].items?.map((item) => item.text)).toEqual([
      " Cek format".trim(),
      "IsiExperience",
      "Kirim",
    ]);
  });

  it("daftar bullet dikumpulkan jadi satu blok", () => {
    const blocks = parseArticleBlocks("- Satu\n- Dua");
    expect(blocks[0].kind).toBe("list");
    expect(blocks[0].items?.[0].kind).toBe("bullet");
  });

  it("berhenti jadi daftar begitu baris biasa muncul", () => {
    const blocks = parseArticleBlocks("1. Satu\n\nParagraf biasa");
    expect(blocks.map((block) => block.kind)).toEqual(["list", "paragraph"]);
  });

  it("kutipan dibaca sebagai kutipan", () => {
    const blocks = parseArticleBlocks("> HRD memang menolak 80% CV.");
    expect(blocks[0].kind).toBe("quote");
    expect(blocks[0].text).toBe("HRD memang menolak 80% CV.");
  });

  it("penanda rata tengah dan kanan diambil dari awal baris", () => {
    expect(parseArticleBlocks("@center Di tengah")[0].align).toBe("center");
    expect(parseArticleBlocks("@right Di kanan")[0].align).toBe("right");
    expect(parseArticleBlocks("Di tengah")[0].align).toBeUndefined();
  });

  it("penanda rata tidak ikut terbaca sebagai isi paragraf", () => {
    expect(parseArticleBlocks("@center Di tengah")[0].text).toBe("Di tengah");
  });

  it("teks tebal dipecah jadi potongan", () => {
    expect(parseInline("tebal **ini** biasa")).toEqual([
      { bold: false, value: "tebal " },
      { bold: true, value: "ini" },
      { bold: false, value: " biasa" },
    ]);
  });

  it("tanda bintang yang tidak berpasangan tidak merusak isi", () => {
    expect(parseInline("2 * 3 = 6")).toEqual([{ bold: false, value: "2 * 3 = 6" }]);
  });

  it("isi kosong tidak menghasilkan blok", () => {
    expect(parseArticleBlocks("")).toEqual([]);
    expect(parseArticleBlocks("   \n\n  ")).toEqual([]);
  });
});

describe("skema artikel Career Hub", () => {
  it("menerima gambar sampul kosong", () => {
    // Regresi: string kosong ditolak z.string().url() dengan pesan
    // "Invalid URL", dan form mengirim "" saat sampul dikosongkan.
    const result = careerHubPostCreateSchema.safeParse({ ...base, coverImageUrl: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.coverImageUrl).toBeNull();
  });

  it("menerima gambar sampul null", () => {
    expect(careerHubPostCreateSchema.safeParse({ ...base, coverImageUrl: null }).success).toBe(true);
  });

  it("tetap menolak URL yang rusak", () => {
    expect(careerHubPostCreateSchema.safeParse({ ...base, coverImageUrl: "bukan-url" }).success).toBe(false);
  });

  it("slug kosong dibiarkan ke server untuk dibuat dari judul", () => {
    const result = careerHubPostCreateSchema.safeParse({ ...base, slug: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it("slug huruf besar dinormalkan", () => {
    const result = careerHubPostCreateSchema.safeParse({ ...base, slug: "Panduan-CV" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBe("panduan-cv");
  });

  it("slug dengan karakter terlarang ditolak dengan pesan jelas", () => {
    const result = careerHubPostCreateSchema.safeParse({ ...base, slug: "panduan!!" });
    expect(result.success).toBe(false);
  });

  it("tag yang hanya berbeda huruf besar tidak menggagalkan artikel", () => {
    // Regresi: "CV" dan "cv" pernah ditolak sebagai duplikat sehingga seluruh
    // artikel gagal disimpan dengan pesan "Invalid input".
    const result = careerHubPostCreateSchema.safeParse({ ...base, tags: ["cv", "CV", "ATS"] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual(["cv", "ATS"]);
  });

  it("draf boleh disimpan tanpa ringkasan dan isi", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      excerpt: "",
      content: "",
      status: "draft",
    });
    expect(result.success).toBe(true);
  });

  it("terbitkan tetap mewajibkan ringkasan dan isi", () => {
    const kosong = careerHubPostCreateSchema.safeParse({
      ...base,
      excerpt: "",
      content: "",
      status: "published",
    });
    expect(kosong.success).toBe(false);

    const isiKosong = careerHubPostCreateSchema.safeParse({
      ...base,
      content: "",
      status: "published",
    });
    expect(isiKosong.success).toBe(false);
  });

  it("pesan kesalahan menyebut field yang salah", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      content: "",
      status: "published",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["content"]);
      expect(result.error.issues[0].message).toMatch(/diterbitkan/);
    }
  });

  it("judul tetap wajib meski artikel draf", () => {
    expect(careerHubPostCreateSchema.safeParse({ ...base, title: "ab", status: "draft" }).success).toBe(false);
  });

  it("perubahan status draf tetap bisa dikirim", () => {
    expect(careerHubPostUpdateSchema.safeParse({ status: "published" }).success).toBe(true);
    expect(careerHubPostUpdateSchema.safeParse({ status: "draft" }).success).toBe(true);
  });

  it("slug dari judul Indonesia tetap valid", () => {
    const slug = slugifyCareerHubTitle("Panduan CV ATS: 5 Tips Meloloskan");
    expect(slug).toBe("panduan-cv-ats-5-tips-meloloskan");
    expect(careerHubPostCreateSchema.safeParse({ ...base, slug }).success).toBe(true);
  });
});