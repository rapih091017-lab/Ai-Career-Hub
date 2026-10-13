/**
 * Terjemahan kode error dari Auth.js/Google ke bahasa yang bisa dibaca pengguna.
 *
 * Tanpa ini, penolakan Google membuat pengguna kembali ke halaman login tanpa
 * penjelasan apa pun, sehingga sulit 여기UTHOR apa yang salah.
 */
const MESSAGES: Record<string, string> = {
  AccessDenied:
    "Google menolak akses untuk akun ini. Aplikasi masih dalam mode uji, jadi hanya akun yang terdaftar sebagai penguji yang bisa masuk.",
  OAuthAccountNotLinked:
    "Akun Google ini belum terhubung. Masuk dulu dengan email yang sama seperti saat kamu memakai aplikasi.",
  OAuthSignin: "Gagal memulai proses masuk dengan Google. Coba lagi beberapa saat.",
  OAuthCallback: "Google tidak mengembalikan data masuk dengan benar. Coba lagi.",
  Callback: "Alamat kembali tidak cocok dengan yang terdaftar di Google Cloud Console.",
  Configuration: "Konfigurasi masuk belum lengkap. Hubungi kami.",
  Verification: "Verifikasi Google gagal. Coba lagi.",
  AccessDeniedAccount:
    "Akun ini tidak diizinkan masuk ke AI Career Hub. Hubungi kami bila ini keliru.",
  default: "Masuk gagal. Coba lagi atau hubungi kami bila masalahnya berlanjut.",
};

export function describeAuthError(code: string | null | undefined): string {
  if (!code) return "";
  return MESSAGES[code] ?? MESSAGES.default;
}

/** True kalau errornya perlu penjelasan panjang (bukan sekadar "coba lagi"). */
export function isActionableAuthError(code: string | null | undefined): boolean {
  if (!code) return false;
  return code === "AccessDenied" || code === "OAuthAccountNotLinked" || code === "Callback";
}