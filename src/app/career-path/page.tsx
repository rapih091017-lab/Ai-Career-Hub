import { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { db } from "@/db";
import { careerPaths } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Jalur Karier per Posisi | AI Career Hub",
  description:
    "Peta jenjang karier untuk posisi paling banyak dibuka di Indonesia: level junior sampai senior, kisaran gaji, skill kunci, dan langkah yang perlu ditempuh.",
  alternates: { canonical: "https://aicareerhub.com/career-path" },
};

export default async function CareerPathPage() {
  const paths = await db
    .select()
    .from(careerPaths)
    .where(eq(careerPaths.isPublished, true))
    .orderBy(asc(careerPaths.sortOrder), asc(careerPaths.role));

  const categories = Array.from(new Set(paths.map((path) => path.category)));

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <AppHeader />

      <main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter">
        <div className="mx-auto max-w-[1000px]">
          <section className="mb-10 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-wider text-primary">
              <span className="material-symbols-outlined text-sm">route</span>
              Jalur Karier
            </span>
            <h1 className="mb-3 font-headline-lg text-headline-lg text-on-background">
              Peta Karier per Posisi
            </h1>
            <p className="mx-auto max-w-[620px] text-body-md text-on-surface-variant">
              Lihat jenjang dari level awal sampai senior untuk tiap posisi: kisaran gaji, fokus
              pekerjaan, skill yang perlu dikuasai, dan langkah praktis untuk naik tingkat. Daftar ini
              terus bertambah seiring waktu.
            </p>
            {categories.length > 0 ? (
              <p className="mt-3 text-label-sm text-on-surface-variant/80">
                {paths.length} posisi dalam {categories.length} bidang
              </p>
            ) : null}
          </section>

          {paths.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-outline-variant px-4 py-10 text-center text-body-md text-on-surface-variant">
              Belum ada jalur karier yang dipublikasikan. Cek lagi nanti.
            </p>
          ) : (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paths.map((path) => (
                <Link
                  key={path.id}
                  href={`/career-path/${path.slug}`}
                  className="group flex flex-col rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="mb-2 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-label-sm text-primary">
                    {path.category}
                  </span>
                  <h2 className="font-label-bold text-on-surface transition-colors group-hover:text-primary">
                    {path.role}
                  </h2>
                  <p className="mt-1 flex-1 text-body-md text-on-surface-variant">{path.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(path.levels ?? []).slice(0, 3).map((level) => (
                      <span
                        key={level.level}
                        className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm text-on-surface-variant"
                      >
                        {level.level}
                      </span>
                    ))}
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-label-bold text-primary">
                    Lihat jalur karier
                    <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
                      arrow_forward
                    </span>
                  </span>
                </Link>
              ))}
            </section>
          )}

          <section className="mt-12 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">Siap mulai dari posisi ini?</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-body-md text-on-surface-variant">
              Bangun CV dengan kata kunci yang tepat, lalu cek skornya sebelum melamar.
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
                href="/career-hub"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-surface-container-lowest px-6 py-3 font-bold text-primary transition-all hover:bg-primary/5 active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-lg">hub</span>
                Career Hub
              </Link>
            </div>
          </section>
        </div>
      </main>

      <AppFooter bordered />
    </div>
  );
}
