import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang Kami | AI Career Hub",
  description: "Pelajari lebih lanjut tentang AI Career Hub.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">Tentang AI Career Hub</h1>
          <p className="text-white/80 text-lg">Membangun karir impian Anda dengan kekuatan AI</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <section>
          <h2 className="font-headline-md text-xl text-on-surface mb-3">Misi Kami</h2>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            AI Career Hub hadir untuk membantu profesional Indonesia mengembangkan karir mereka melalui
            teknologi AI canggih. Kami percaya setiap orang berhak mendapatkan tools terbaik untuk
            mencapai potensi karir maksimal mereka.
          </p>
        </section>
        <section>
          <h2 className="font-headline-md text-xl text-on-surface mb-3">Layanan Kami</h2>
          <ul className="list-disc pl-6 space-y-2 text-body-md text-on-surface-variant">
            <li>Analisis CV dengan AI · Dapatkan insight mendalam tentang CV Anda</li>
            <li>CV Builder · Buat CV ATS-friendly dalam hitungan menit</li>
            <li>Portfolio Builder · Tampilkan karya terbaik Anda secara profesional</li>
            <li>Saran AI Personal · Optimalkan setiap bagian CV Anda</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
