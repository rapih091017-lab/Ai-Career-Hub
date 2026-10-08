import { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { CV_EXAMPLES } from "@/data/cv-examples";

export const metadata: Metadata = {
  title: "Contoh CV 10 Posisi Paling Dicari di Indonesia | AI Career Hub",
  description:
    "Kumpulan contoh CV untuk 10 posisi yang paling banyak dibuka di Indonesia: software engineer, data analyst, digital marketing, UI/UX designer, sales, dan lainnya. Lengkap dengan ringkasan, skill kunci, pencapaian, dan kata kunci ATS.",
  keywords: [
    "contoh CV",
    "contoh resume",
    "contoh CV software engineer",
    "contoh CV data analyst",
    "contoh CV digital marketing",
    "CV ATS friendly",
    "contoh CV Indonesia",
  ],
  openGraph: {
    title: "Contoh CV 10 Posisi Paling Dicari di Indonesia",
    description:
      "Contoh ringkasan, skill kunci, pencapaian, dan kata kunci ATS untuk 10 posisi paling populer di Indonesia.",
    type: "website",
  },
};

export default function ContohCvPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <AppHeader />

      <main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter">
        <div className="mx-auto max-w-[1000px]">
          <section className="mb-10 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-wider text-primary">
              <span className="material-symbols-outlined text-sm">description</span>
              Panduan Gratis
            </span>
            <h1 className="mb-3 font-headline-lg text-headline-lg text-on-background">
              Contoh CV untuk 10 Posisi Paling Dicari
            </h1>
            <p className="mx-auto max-w-[620px] text-body-md text-on-surface-variant">
              Contoh ringkasan profesional, skill kunci, pencapaian berisi angka, dan kata kunci ATS
              untuk posisi yang paling banyak dibuka di Indonesia. Semua angka di contoh adalah
              placeholder yang bisa kamu ganti dengan data nyata.
            </p>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CV_EXAMPLES.map((example) => (
              <Link
                key={example.slug}
                href={`/contoh-cv/${example.slug}`}
                className="group flex flex-col rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="mb-2 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-label-sm text-primary">
                  {example.category}
                </span>
                <h2 className="font-label-bold text-on-surface transition-colors group-hover:text-primary">
                  {example.title}
                </h2>
                <p className="mt-1 flex-1 text-body-md text-on-surface-variant">{example.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-label-bold text-primary">
                  Lihat contoh
                  <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </span>
              </Link>
            ))}
          </section>

          <section className="mt-12 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">Siap bikin CV-mu sendiri?</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-body-md text-on-surface-variant">
              Pakai contoh ini sebagai acuan, lalu bangun CV ATS-friendly dengan AI dan cek skornya.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/builder/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary transition-all hover:brightness-110 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Buat CV Sekarang
              </Link>
              <Link
                href="/checker"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-surface-container-lowest px-6 py-3 font-bold text-primary transition-all hover:bg-primary/5 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">analytics</span>
                Cek Skor CV
              </Link>
            </div>
          </section>
        </div>
      </main>

      <AppFooter bordered />
    </div>
  );
}
