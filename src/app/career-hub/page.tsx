import { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "Career Hub | AI Career Hub",
  description:
    "Kunjungi blog untuk strategi mencari kerja, tips CV, taktik surat lamaran, dan wawasan karier lainnya. Semua panduan dan alat kami dikumpulkan di satu tempat.",
  alternates: { canonical: "https://aicareerhub.com/career-hub" },
};

const CATEGORIES = [
  {
    icon: "travel_explore",
    title: "Strategi Mencari Kerja",
    description: "Cara memilih lowongan yang tepat, melacak lamaran, dan menjaga proses tetap rapi.",
    links: [
      { label: "Lowongan pilihan", href: "/karir" },
      { label: "Pelacak lamaran", href: "/tracker" },
    ],
  },
  {
    icon: "description",
    title: "Tips CV dan Resume",
    description: "Contoh nyata, kata kunci ATS, dan cara memastikan CV lolos pembacaan sistem.",
    links: [
      { label: "Contoh CV 12 posisi", href: "/contoh-cv" },
      { label: "Cek skor CV", href: "/checker" },
    ],
  },
  {
    icon: "mail",
    title: "Taktik Surat Lamaran",
    description: "Menulis surat yang spesifik ke perusahaan, bukan salinan template, plus pilihan kata yang lebih kuat.",
    links: [
      { label: "Buat surat lamaran", href: "/surat-lamaran" },
      { label: "Sinonim CV", href: "/sinonim" },
    ],
  },
  {
    icon: "school",
    title: "Wawasan dan Latihan",
    description: "Bank soal per posisi, latihan jawaban metode STAR, dan jalur karier tiap profesi.",
    links: [
      { label: "Latihan interview", href: "/interview/practice" },
      { label: "Jalur karier", href: "/career-path" },
    ],
  },
];

export default function CareerHubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <AppHeader />

      <main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter">
        <div className="mx-auto max-w-[1000px]">
          <section className="mb-10 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-wider text-primary">
              <span className="material-symbols-outlined text-sm">hub</span>
              Career Hub
            </span>
            <h1 className="mb-3 font-headline-lg text-headline-lg text-on-background">Pusat Panduan Karier</h1>
            <p className="mx-auto max-w-[620px] text-body-md text-on-surface-variant">
              Kunjungi blog untuk strategi mencari kerja, tips CV, taktik surat lamaran, dan wawasan
              lainnya. Semua panduan dan alat kami dikumpulkan di satu tempat supaya kamu tidak perlu
              berpindah-pindah.
            </p>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CATEGORIES.map((category) => (
              <article
                key={category.title}
                className="flex flex-col rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <span className="material-symbols-outlined text-primary" aria-hidden>
                    {category.icon}
                  </span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface">{category.title}</h2>
                <p className="mt-2 flex-1 text-body-md text-on-surface-variant">{category.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {category.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-label-bold text-primary transition-colors hover:bg-primary/10"
                    >
                      {link.label}
                      <span className="material-symbols-outlined text-[14px]" aria-hidden>
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="mt-8 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-6 md:flex md:items-center md:justify-between">
            <div>
              <h2 className="font-label-bold text-on-surface">Blog dan artikel mendalam</h2>
              <p className="mt-1 max-w-[520px] text-body-md text-on-surface-variant">
                Artikel panjang seputar strategi lamaran, wawancara, dan pertumbuhan karier sedang
                disiapkan. Pantau halaman blog untuk rilis berikutnya.
              </p>
            </div>
            <Link
              href="/blog"
              className="mt-4 inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-label-bold text-on-primary transition-opacity hover:opacity-90 md:mt-0"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                auto_stories
              </span>
              Buka Blog
            </Link>
          </section>

          <section className="mt-12 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">Mulai dari CV-mu</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-body-md text-on-surface-variant">
              Panduan paling cepat terasa hasilnya lewat CV. Bangun, cek skornya, lalu lanjut ke surat
              lamaran dan latihan interview.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/builder/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary transition-all hover:brightness-110 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Buat CV
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
