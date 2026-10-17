/**
 * Status simpan untuk form artikel Career Hub.
 *
 * Formnya tidak berubah tampilan setelah disimpan, jadi admin tidak punya cara
 * tahu apakah artikelnya sudah aman atau masih ada isian yang hilang. Toast
 * saja tidak cukup karena hilang dalam beberapa detik; yang dibutuhkan adalah
 * jawaban yang tetap terlihat sepanjang form terbuka.
 */

const TRACKED_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "category",
  "tags",
  "coverImageUrl",
] as const;

/**
 * Ringkasan isian form yang tersimpan di server.
 *
 * `status` sengaja tidak ikut: status ditentukan oleh tombol yang ditekan
 * (Simpan draf atau Terbitkan), bukan oleh isian form, jadi ikut menghitungnya
 * akan membuat form selalu terlihat berubah.
 */
/** Bentuk isian form yang dipakai untuk perbandingan; field di luar ini diabaikan. */
export interface Fingerprintable {
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  content?: unknown;
  category?: unknown;
  tags?: unknown;
  coverImageUrl?: unknown;
  /** Ada di form, tapi tidak ikut dibandingkan. */
  status?: unknown;
}

export function articleFingerprint(value: Fingerprintable): string {
  const shape: Record<string, unknown> = {};
  for (const field of TRACKED_FIELDS) {
    // Tag diperlakukan sebagai himpunan: menghapus lalu menambahkan tag yang
    // sama tidak boleh dianggap sebagai perubahan, kalau tidak form akan
    // terus bilang ada perubahan padahal isinya sama saja.
    const value_ = value[field];
    shape[field] =
      field === "tags" && Array.isArray(value_) ? [...value_].sort() : value_;
  }
  return JSON.stringify(shape);
}

export interface SaveState {
  /** Isian form berbeda dari yang terakhir disimpan. */
  dirty: boolean;
  /** Pernah disimpan ke server. */
  saved: boolean;
  /** Kalimat yang menyebut keadaan sekarang dan langkah berikutnya. */
  message: string;
}

export function describeSaveState(
  savedFingerprint: string | null,
  currentFingerprint: string,
  status: "draft" | "published",
): SaveState {
  if (savedFingerprint === null) {
    return {
      dirty: true,
      saved: false,
      message: "Artikel ini belum disimpan. Tekan Terbitkan saat sudah siap dibaca.",
    };
  }
  if (savedFingerprint !== currentFingerprint) {
    return {
      dirty: true,
      saved: true,
      message: "Ada perubahan yang belum disimpan.",
    };
  }
  return {
    dirty: false,
    saved: true,
    message:
      status === "published"
        ? "Semua perubahan tersimpan. Artikel tayang di Career Hub."
        : "Semua perubahan tersimpan sebagai draf.",
  };
}

/**
 * Pesan toast setelah simpan.
 *
 * Artikel yang baru diterbitkan disebut differently dari artikel yang sudah
 * tayang lalu diedit, supaya admin tahu apakah ia baru tayang atau hanya
 * memperbarui isi yang sudah ada.
 */
export function describeSavedToast(
  action: "draft" | "published",
  wasPublished: boolean,
): string {
  if (action === "draft") return "Draf disimpan.";
  return wasPublished ? "Perubahan disimpan." : "Artikel diterbitkan.";
}