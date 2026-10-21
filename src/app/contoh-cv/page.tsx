import { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/nav/SiteHeader";
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
      <SiteHeader variant="pill" />

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
                className="group flex flex-col rounded-[14px] border-2 border-ink bg-paper p-5 transition-all hover:-translate-y-0.5 hover:shadow-hard-sm"
              >
                <span className="mb-2 w-fit rounded-full border border-ink/25 bg-lime/25 px-2.5 py-1 text-label-sm font-bold text-ink">
                  {example.category}
                </span>
                <h2 className="font-display text-ink transition-colors group-hover:text-green-deep">
                  {example.title}
                </h2>
                <p className="mt-1 flex-1 text-body-md text-ink-soft">{example.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-label-bold text-green-deep">
                  Lihat contoh
                  <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </span>
              </Link>
            ))}
          </section>

          <section className="mt-12 rounded-[14px] border-[2.5px] border-ink bg-lime/15 shadow-hard p-8 text-center">
            <h2 className="font-display text-headline-md text-ink">Siap bikin CV-mu sendiri?</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-body-md text-ink-soft">
              Pakai contoh ini sebagai acuan, lalu bangun CV ATS-friendly dengan AI dan cek skornya.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/builder/new"
                className="inline-flex min-h-[54px] items-center gap-2 rounded-full border-[2.5px] border-ink bg-lime px-6 py-3 font-bold text-on-light shadow-[0_4px_0_rgb(var(--c-ink))] transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Buat CV Sekarang
              </Link>
              <Link
                href="/checker"
                className="inline-flex min-h-[54px] items-center gap-2 rounded-full border-2 border-ink/60 bg-paper px-6 py-3 font-bold text-ink transition-all hover:border-ink active:scale-[0.97]"
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
