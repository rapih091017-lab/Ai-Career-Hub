import { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/nav/SiteHeader";
import AppFooter from "@/components/AppFooter";
import { CV_EXAMPLES_EN } from "@/data/cv-examples-en";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "CV Examples for 12 In-Demand Roles | AI Career Hub",
  description:
    "CV examples for roles most in demand in Indonesia: software engineer, data analyst, digital marketing, UI/UX designer, sales, pharmacist, mechanical engineer, and more. Includes summaries, key skills, achievements, and ATS keywords.",
  keywords: [
    "cv examples",
    "resume examples",
    "software engineer CV example",
    "data analyst CV example",
    "ATS friendly CV",
    "CV examples Indonesia",
  ],
  alternates: {
    languages: {
      id: `${SITE_URL}/contoh-cv`,
      en: `${SITE_URL}/cv-examples`,
    },
  },
  openGraph: {
    title: "CV Examples for 12 In-Demand Roles",
    description:
      "Ready-to-adapt summaries, key skills, achievements, and ATS keywords for the most in-demand roles.",
    type: "website",
  },
};

export default function CvExamplesEnPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <SiteHeader variant="pill" />

      <main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter">
        <div className="mx-auto max-w-[1000px]">
          <section className="mb-10 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-wider text-primary">
              <span className="material-symbols-outlined text-sm">description</span>
              Free Guide
            </span>
            <h1 className="mb-3 font-headline-lg text-headline-lg text-on-background">
              CV Examples for 12 In-Demand Roles
            </h1>
            <p className="mx-auto max-w-[620px] text-body-md text-on-surface-variant">
              Sample professional summaries, key skills, achievement bullets with numbers, and ATS
              keywords for the roles companies hire for most. All numbers in the examples are
              placeholders to replace with your real data.
            </p>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CV_EXAMPLES_EN.map((example) => (
              <Link
                key={example.slug}
                href={`/cv-examples/${example.slug}`}
                className="group flex flex-col rounded-[14px] border-2 border-ink/15 bg-paper p-5 transition-all hover:-translate-y-0.5 hover:shadow-hard-sm"
              >
                <span className="mb-2 w-fit rounded-full border border-ink/25 bg-lime/25 px-2.5 py-1 text-label-sm font-bold text-ink">
                  {example.category}
                </span>
                <h2 className="font-display text-ink transition-colors group-hover:text-green-deep">
                  {example.title}
                </h2>
                <p className="mt-1 flex-1 text-body-md text-ink-soft">{example.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-label-bold text-green-deep">
                  View example
                  <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </span>
              </Link>
            ))}
          </section>

          <section className="mt-12 rounded-[14px] border-[2.5px] border-ink bg-lime/15 shadow-hard p-8 text-center">
            <h2 className="font-display text-headline-md text-ink">Build your own CV now</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-body-md text-ink-soft">
              Use these examples as a reference, then build an ATS-friendly CV with AI and check its score.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/builder/new"
                className="inline-flex min-h-[54px] items-center gap-2 rounded-full border-[2.5px] border-ink bg-lime px-6 py-3 font-bold text-on-light shadow-[0_4px_0_rgb(var(--c-ink))] transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Create a CV
              </Link>
              <Link
                href="/checker"
                className="inline-flex min-h-[54px] items-center gap-2 rounded-full border-2 border-ink/60 bg-paper px-6 py-3 font-bold text-ink transition-all hover:border-ink active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">analytics</span>
                Check CV Score
              </Link>
            </div>
          </section>

          <p className="mt-8 text-center text-label-sm text-on-surface-variant">
            Versi Bahasa Indonesia: <Link href="/contoh-cv" className="text-primary hover:underline">Contoh CV untuk 12 posisi</Link>
          </p>
        </div>
      </main>

      <AppFooter bordered />
    </div>
  );
}
