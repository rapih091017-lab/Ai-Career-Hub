import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog | AI Career Hub",
  description: "Tips karir, panduan CV, dan wawasan industri terbaru dari AI Career Hub.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">Blog</h1>
          <p className="text-white/80 text-lg">Tips karir, panduan CV, dan wawasan industri</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="p-12 rounded-2xl bg-white border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-5xl text-primary/40 mb-4">auto_stories</span>
          <h2 className="font-headline-md text-xl text-on-surface mb-2">Konten Segera Hadir</h2>
          <p className="text-body-md text-on-surface-variant max-w-md mx-auto">
            Kami sedang menyiapkan artikel-artikel bermanfaat seputar karir, CV, dan tips lolos seleksi kerja.
          </p>
        </div>
      </div>
    </main>
  );
}
