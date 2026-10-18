/**
 * Pembersih untuk teks hasil ekstraksi dokumen CV.
 *
 * Pustaka pembaca PDF kadang meninggalkan byte NUL (0x00) di dalam teksnya,
 * terutama pada PDF hasil konversi atau template tertentu. Postgres menolak
 * byte itu untuk kolom `text` dengan error 22021 — "invalid byte sequence for
 * encoding UTF8: 0x00" — sehingga simpan hasil analisis gagal setelah AI
 * selesai bekerja. Yang sampai ke pengguna cuma "Terjadi kesalahan server",
 * padahal penyebabnya ada di teks yang tidak dibersihkan.
 *
 * Hanya NUL yang dibuang. Karakter kontrol lain (tab, baris baru, dan sisanya)
 * dibiarkan utuh karena menyingkirkan teks yang ditulis pengguna bisa memotong
 * isi CV tanpa terlihat.
 */
export function sanitizeExtractedText(value: string): string {
  return value.replace(/\u0000/g, "");
}