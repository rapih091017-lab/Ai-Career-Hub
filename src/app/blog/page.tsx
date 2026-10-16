import { redirect } from "next/navigation";

/**
 * Halaman Blog dipindah ke Career Hub.
 *
 * Keduanya pada dasarnya satu hal: daftar artikel panduan karier. Yang ini
 * sebelumnya hanya menampilkan "Konten Segera Hadir" padahal artikelnya sudah
 * ada, sehingga pengunjung dari tautan lama diarahkan ke halaman yang benar.
 */
export default function BlogPage() {
  redirect("/career-hub");
}