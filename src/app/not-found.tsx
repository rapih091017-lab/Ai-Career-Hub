import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  description: "Halaman yang kamu cari tidak ditemukan. Mungkin sudah dipindah atau dihapus.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fbf8fe]">
      <div className="text-center space-y-6 max-w-md px-5">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            search
          </span>
        </div>
        <h1 className="text-4xl font-bold text-[#1b1b1f]">404</h1>
        <p className="text-base text-[#4a4452]">Halaman yang kamu cari tidak ditemukan. Mungkin sudah dipindah atau dihapus.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
