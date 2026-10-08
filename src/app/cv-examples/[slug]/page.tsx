import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { CV_EXAMPLES_EN, getCvExampleEn } from "@/data/cv-examples-en";

export function generateStaticParams() {
  return CV_EXAMPLES_EN.map((example) => ({ slug: example.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const example = getCvExampleEn(slug);
  if (!example) return {};
  return {
    title: `${example.title} CV Example | AI Career Hub`,
    description: `${example.tagline} See a sample summary, key skills, achievement bullets, and ATS keywords for the ${example.title} role.`,
    alternates: {
      languages: {
        id: `https://aicareerhub.com/contoh-cv/${example.slug}`,
        en: `https://aicareerhub.com/cv-examples/${example.slug}`,
      },
    },
    openGraph: {
      title: `${example.title} CV Example`,
      description: example.tagline,
      type: "article",
    },
  };
}

export default async function CvExampleEnDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const example = getCvExampleEn(slug);
  if (!example) notFound();

  const others = CV_EXAMPLES_EN.filter((item) => item.slug !== example.slug).slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <AppHeader />

      <main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter">
        <div className="mx-auto max-w-[820px]">
          <Link
            href="/cv-examples"
            className="group mb-6 inline-flex items-center gap-1.5 text-label-bold text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-0.5">
              arrow_back
            </span>
            All CV examples
          </Link>

          <section className="mb-8">
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-label-sm text-primary">
              {example.category}
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-background">
              {example.title} CV Example
            </h1>
            <p className="mt-2 max-w-[620px] text-body-md text-on-surface-variant">{example.intro}</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">Professional Summary</h2>
            <div className="rounded-2xl border-l-4 border-primary bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-body-md leading-relaxed text-on-surface">{example.summaryExample}</p>
            </div>
            <p className="mt-2 text-label-sm text-on-surface-variant">
              Replace numbers and names with your real data. An ideal summary is 2-3 lines and mentions one key achievement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">Key Skills</h2>
            <div className="flex flex-wrap gap-2">
              {example.keySkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 py-1.5 text-label-bold text-on-surface"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">
              Experience & Achievement Examples
            </h2>
            <div className="space-y-4">
              {example.experienceExamples.map((exp) => (
                <div
                  key={`${exp.position}-${exp.company}`}
                  className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5"
                >
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-label-bold text-on-surface">{exp.position}</p>
                      <p className="text-label-sm text-on-surface-variant">{exp.company}</p>
                    </div>
                    <span className="text-label-sm text-on-surface-variant">{exp.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {exp.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2 text-body-md text-on-surface-variant">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-2 text-label-sm text-on-surface-variant">
              Notice the pattern: action verb + what was done + number or impact.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">ATS Keywords</h2>
            <p className="mb-3 text-body-md text-on-surface-variant">
              ATS systems match your CV against the job description. Make sure these keywords appear
              naturally in your CV when they are relevant.
            </p>
            <div className="flex flex-wrap gap-2">
              {example.atsKeywords.map((keyword) => (
                <span key={keyword} className="rounded-lg bg-primary/5 px-3 py-1.5 text-label-sm text-primary">
                  {keyword}
                </span>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">
              Tips for {example.title}
            </h2>
            <ul className="space-y-2">
              {example.tips.map((tip) => (
                <li key={tip} className="flex gap-3 rounded-xl bg-surface-container-low p-4">
                  <span className="material-symbols-outlined text-primary" aria-hidden>
                    lightbulb
                  </span>
                  <span className="text-body-md text-on-surface">{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Apply this example to your CV
            </h2>
            <p className="mx-auto mt-2 max-w-[520px] text-body-md text-on-surface-variant">
              Fill your data once, use it for every application. AI helps polish the language and
              tailor it to the target job.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/builder/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary transition-all hover:brightness-110 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Build a {example.title} CV
              </Link>
              <Link
                href="/checker"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-surface-container-lowest px-6 py-3 font-bold text-primary transition-all hover:bg-primary/5 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">analytics</span>
                Check CV Score
              </Link>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-headline-md text-headline-md text-on-surface">More examples</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={`/cv-examples/${other.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 transition-all hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-label-bold text-on-surface group-hover:text-primary">
                      {other.title}
                    </p>
                    <p className="truncate text-label-sm text-on-surface-variant">{other.category}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant" aria-hidden>
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <AppFooter bordered />
    </div>
  );
}
