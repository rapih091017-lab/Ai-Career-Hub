/**
 * Pesan saat analisis AI gagal selesai.
 *
 * Dulu route mengembalikan 200 dengan skor hasil rumus cadangan, jadi
 * pengguna melihat angka yang bukan hasil AI padahal tidak ada hasil AI
 * sama sekali. Sekarang kegagalan dihentikan di sini: pesan jujur, tanpa
 * skor, dan tidak ada hasil yang disimpan ke database.
 */
export function analyzeFailureMessage(lang: "id" | "en"): string {
  return lang === "en"
    ? "We couldn't finish reading your CV, so nothing was saved. Please try again."
    : "Analisisnya belum selesai, jadi hasilnya tidak disimpan. Silakan coba lagi.";
}