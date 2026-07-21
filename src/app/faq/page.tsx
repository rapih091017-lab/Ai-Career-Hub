import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | AI Career Hub",
  description: "Pertanyaan yang sering diajukan tentang AI Career Hub.",
};

export default function FaqPage() {
  const faqs = [
    { q: "Apa itu AI Career Hub?", a: "AI Career Hub adalah platform berbasis AI yang membantu Anda menganalisis, membuat, dan mengoptimalkan CV serta portofolio profesional." },
    { q: "Apakah AI Career Hub gratis?", a: "Ya, kami menawarkan paket gratis dengan fitur terbatas. Untuk fitur premium, Anda dapat memilih paket berbayar yang sesuai dengan kebutuhan." },
    { q: "Bagaimana cara AI menganalisis CV saya?", a: "AI kami membandingkan CV Anda dengan deskripsi pekerjaan yang Anda targetkan, menganalisis keyword gap, relevansi pengalaman, dan kepatuhan ATS." },
    { q: "Apakah data saya aman?", a: "Kami menerapkan enkripsi dan protokol keamanan terbaik untuk melindungi data Anda. Lihat Kebijakan Privasi kami untuk informasi lebih lanjut." },
    { q: "Bagaimana cara upgrade ke premium?", a: "Anda dapat memilih paket premium melalui halaman Pricing atau Settings > Billing setelah login." },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">FAQ</h1>
          <p className="text-white/80 text-lg">Pertanyaan yang sering diajukan</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        {faqs.map((faq, i) => (
          <details key={i} className="group bg-white rounded-2xl border border-outline-variant/30 overflow-hidden">
            <summary className="px-6 py-4 font-label-bold text-on-surface cursor-pointer hover:bg-surface-container-low transition-colors list-none flex items-center justify-between">
              {faq.q}
              <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="px-6 pb-4">
              <p className="text-body-md text-on-surface-variant leading-relaxed">{faq.a}</p>
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
