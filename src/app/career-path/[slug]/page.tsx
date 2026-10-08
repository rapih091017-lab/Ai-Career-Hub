import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { SITE_URL } from "@/lib/site-url";
import { db } from "@/db";
import { careerPaths } from "@/db/schema";
import { and, asc, eq, ne } from "drizzle-orm";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function getPath(slug: string) {
  const [row] = await db
    .select()
    .from(careerPaths)
    .where(and(eq(careerPaths.slug, slug), eq(careerPaths.isPublished, true)))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = await getPath(slug);
  if (!path) return {};
  return {
    title: `Jalur Karier ${path.role} | AI Career Hub`,
    description: `Jenjang karier ${path.role}: level junior sampai senior, kisaran gaji, skill kunci, dan langkah untuk naik tingkat.`,
    alternates: { canonical: `${SITE_URL}/career-path/${path.slug}` },
  };
}

export default async function CareerPathDetailPage({ params }: Props) {
  const { slug } = await params;
  const path = await getPath(slug);
  if (!path) notFound();

  const others = await db
    .select({ slug: careerPaths.slug, role: careerPaths.role, category: careerPaths.category })
    .from(careerPaths)
    .where(and(eq(careerPaths.isPublished, true), ne(careerPaths.slug, path.slug)))
    .orderBy(asc(careerPaths.sortOrder))
    .limit(4);

  const levels = path.levels ?? [];
  const skills = path.skills ?? [];
  const steps = path.steps ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <AppHeader />

      <main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter">
        <div className="mx-auto max-w-[820px]">
          <Link
            href="/career-path"
            className="group mb-6 inline-flex items-center gap-1.5 text-label-bold text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-0.5">
              arrow_back
            </span>
            Semua jalur karier
          </Link>

          <section className="mb-8">
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-label-sm text-primary">
              {path.category}
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-background">Jalur Karier {path.role}</h1>
            {path.summary ? (
              <p className="mt-2 max-w-[620px] text-body-md text-on-surface-variant">{path.summary}</p>
            ) : null}
          </section>

          {levels.length > 0 ? (
            <section className="mb-10">
              <h2 className="mb-4 font-headline-md text-headline-md text-on-surface">Jenjang Karier</h2>
              <div className="space-y-3">
                {levels.map((level, index) => (
                  <div
                    key={`${level.level}-${index}`}
                    className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5"
                  >
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-bold text-on-primary">
                          {index + 1}
                        </span>
                        <h3 className="font-label-bold text-on-surface">{level.level}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
                        {level.years ? <span>{level.years}</span> : null}
                        {level.salaryRange ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-700">
                            {level.salaryRange}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {level.focus ? (
                      <p className="ml-11 text-body-md leading-relaxed text-on-surface-variant">{level.focus}</p>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                Kisaran gaji adalah estimasi pasar Indonesia dan berbeda menurut kota, industri, dan
                ukuran perusahaan.
              </p>
            </section>
          ) : null}

          {skills.length > 0 ? (
            <section className="mb-10">
              <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">Skill Kunci</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 py-1.5 text-label-bold text-on-surface"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {steps.length > 0 ? (
            <section className="mb-10">
              <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">Langkah Praktis</h2>
              <ul className="space-y-2">
                {steps.map((step) => (
                  <li key={step} className="flex gap-3 rounded-xl bg-surface-container-low p-4">
                    <span className="material-symbols-outlined text-primary" aria-hidden>
                      check_circle
                    </span>
                    <span className="text-body-md text-on-surface">{step}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mb-12 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Siap melamar posisi {path.role}?
            </h2>
            <p className="mx-auto mt-2 max-w-[520px] text-body-md text-on-surface-variant">
              Susun CV dengan skill dan kata kunci di atas, cek skornya, lalu latih jawaban
              interviewmu.
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
              <Link
                href={`/contoh-cv/${path.slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-surface-container-lowest px-6 py-3 font-bold text-primary transition-all hover:bg-primary/5 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">description</span>
                Contoh CV
              </Link>
            </div>
          </section>

          {others.length > 0 ? (
            <section>
              <h2 className="mb-4 font-headline-md text-headline-md text-on-surface">Jalur karier lain</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {others.map((other) => (
                  <Link
                    key={other.slug}
                    href={`/career-path/${other.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 transition-all hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-label-bold text-on-surface group-hover:text-primary">{other.role}</p>
                      <p className="truncate text-label-sm text-on-surface-variant">{other.category}</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant" aria-hidden>
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <AppFooter bordered />
    </div>
  );
}
