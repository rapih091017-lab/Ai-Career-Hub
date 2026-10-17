import { describe, expect, it } from "vitest";
import {
  articleFingerprint,
  describeSaveState,
  describeSavedToast,
} from "@/lib/career-hub-form-state";

const FORM = {
  title: "CV Kamu Tidak Dibuang Robot",
  slug: "cv-ats-yang-sebenarnya",
  excerpt: "Ringkasan.",
  content: "Isi artikel.",
  category: "cv-ats",
  tags: ["ATS", "CV"],
  coverImageUrl: null,
  status: "draft",
};

describe("sidik jari isian form", () => {
  it("isian yang sama menghasilkan sidik jari yang sama", () => {
    expect(articleFingerprint(FORM)).toBe(articleFingerprint({ ...FORM }));
  });

  it("urutan kunci tidak memengaruhi hasil", () => {
    const lain = {
      coverImageUrl: null,
      content: "Isi artikel.",
      tags: ["ATS", "CV"],
      category: "cv-ats",
      excerpt: "Ringkasan.",
      slug: "cv-ats-yang-sebenarnya",
      title: "CV Kamu Tidak Dibuang Robot",
    };
    expect(articleFingerprint(lain)).toBe(articleFingerprint(FORM));
  });

  it("status tidak ikut dihitung", () => {
    // Status berasal dari tombol yang ditekan, bukan dari isian form.
    expect(articleFingerprint({ ...FORM, status: "published" })).toBe(articleFingerprint(FORM));
  });

  it("perubahan di field mana pun terdeteksi", () => {
    for (const field of ["title", "slug", "excerpt", "content", "category", "coverImageUrl"]) {
      expect(articleFingerprint({ ...FORM, [field]: "berbeda" })).not.toBe(articleFingerprint(FORM));
    }
    expect(articleFingerprint({ ...FORM, tags: ["ATS"] })).not.toBe(articleFingerprint(FORM));
  });

  it("urutan tag tidak dianggap sebagai perubahan", () => {
    expect(articleFingerprint({ ...FORM, tags: ["CV", "ATS"] })).toBe(articleFingerprint(FORM));
  });
});

describe("status simpan yang tampil di form", () => {
  const tersimpan = articleFingerprint(FORM);

  it("artikel yang belum pernah disimpan disebut begitu", () => {
    const state = describeSaveState(null, tersimpan, "draft");
    expect(state.saved).toBe(false);
    expect(state.dirty).toBe(true);
    expect(state.message).toBe(
      "Artikel ini belum disimpan. Tekan Terbitkan saat sudah siap dibaca.",
    );
  });

  it("setelah simpan, form menyatakan semua perubahan tersimpan", () => {
    const state = describeSaveState(tersimpan, tersimpan, "published");
    expect(state).toEqual({
      dirty: false,
      saved: true,
      message: "Semua perubahan tersimpan. Artikel tayang di Career Hub.",
    });
  });

  it("draf yang tersimpan disebut sebagai draf", () => {
    expect(describeSaveState(tersimpan, tersimpan, "draft").message).toBe(
      "Semua perubahan tersimpan sebagai draf.",
    );
  });

  it("ketik lagi langsung terlihat belum tersimpan", () => {
    const state = describeSaveState(tersimpan, articleFingerprint({ ...FORM, title: "Judul baru" }), "published");
    expect(state.dirty).toBe(true);
    expect(state.saved).toBe(true);
    expect(state.message).toBe("Ada perubahan yang belum disimpan.");
  });

  it("kembali ke isian tersimpan membuat status kembali bersih", () => {
    const berubah = articleFingerprint({ ...FORM, title: "Judul baru" });
    expect(describeSaveState(tersimpan, berubah, "published").dirty).toBe(true);
    expect(describeSaveState(tersimpan, tersimpan, "published").dirty).toBe(false);
  });
});

describe("pesan toast setelah simpan", () => {
  it("menyebut draf saat disimpan sebagai draf", () => {
    expect(describeSavedToast("draft", false)).toBe("Draf disimpan.");
    expect(describeSavedToast("draft", true)).toBe("Draf disimpan.");
  });

  it("menyatakan status tayang saat artikel pertama kali tayang", () => {
    expect(describeSavedToast("published", false)).toBe("Artikel diterbitkan.");
  });

  it("menyatakan perubahan saat artikel sudah tayang lalu diedit", () => {
    expect(describeSavedToast("published", true)).toBe("Perubahan disimpan.");
  });
});
