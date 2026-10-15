"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/nav/SiteHeader";
import AppFooter from "@/components/AppFooter";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  JOB_SORTS,
  JOB_SORT_LABELS,
  JOB_TYPES,
  JOB_TYPE_BADGE_CLASS,
  JOB_TYPE_LABELS,
  deadlineStatus,
  isJobSort,
  isJobType,
  isEmploymentType,
  type JobSort,
} from "@/lib/job-classification";
import { useTranslation } from "@/lib/i18n";

const EXTERNAL_PORTALS = [
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/jobs/",
    descriptionKey: "karir.portal-linkedin",
    icon: "⬡",
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    label: "linkedin.com/jobs",
  },
  {
    name: "Glints",
    url: "https://glints.com/id/opportunities/jobs",
    descriptionKey: "karir.portal-glints",
    icon: "✦",
    color: "bg-amber-50 border-amber-200",
    textColor: "text-amber-700",
    label: "glints.com",
  },
  {
    name: "Jobstreet",
    url: "https://www.jobstreet.co.id/",
    descriptionKey: "karir.portal-jobstreet",
    icon: "◆",
    color: "bg-red-50 border-red-200",
    textColor: "text-red-700",
    label: "jobstreet.co.id",
  },
  {
    name: "Karir.com",
    url: "https://www.karir.com/",
    descriptionKey: "karir.portal-karircom",
    icon: "●",
    color: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    label: "karir.com",
  },
  {
    name: "Indeed",
    url: "https://id.indeed.com/",
    descriptionKey: "karir.portal-indeed",
    icon: "⬢",
    color: "bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-700",
    label: "id.indeed.com",
  },
  {
    name: "TechInAsia",
    url: "https://www.techinasia.com/jobs",
    descriptionKey: "karir.portal-techinasia",
    icon: "▲",
    color: "bg-emerald-50 border-emerald-200",
    textColor: "text-emerald-700",
    label: "techinasia.com/jobs",
  },
];

interface JobPost {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  description: string | null;
  applyUrl: string;
  imageUrl: string | null;
  jobType: string | null;
  employmentType: string | null;
  deadline: string | null;
  createdAt: string | null;
}

export default function KarirPage() {
  const { t, lang } = useTranslation();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [employment, setEmployment] = useState("");
  const [sort, setSort] = useState<JobSort>("newest");
  const [loadingList, setLoadingList] = useState(false);

  // Dicari di server, jadi daftar yang tampil benar-benar
  // sudah tersaring di database, bukan hanya dipotong 60 baris lalu disaring.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingList(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      if (employment) params.set("employment", employment);
      params.set("sort", sort);
      try {
        const response = await fetch(`/api/jobs?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setJobs(Array.isArray(data.jobs) ? data.jobs : []);
        }
      } catch {
        // Diamkan: daftar lama tetap tampil.
      } finally {
        setJobsLoaded(true);
        setLoadingList(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, category, employment, sort]);

  const hasJobs = jobs.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <SiteHeader variant="pill" />
      <main className="flex-1">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary text-white">
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {t("karir.back-home")}
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-container-lowest/15 rounded-full text-xs font-bold tracking-wider mb-6">
            <span className={`w-2 h-2 rounded-full ${hasJobs ? "bg-emerald-400" : "bg-emerald-400 animate-pulse"}`} />
            {hasJobs ? t("karir.badge-open") : t("karir.soon")}
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">{t("karir.title")}</h1>
          <p className="text-white/80 text-lg max-w-xl">
            {t("karir.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/builder/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-lowest text-primary font-bold rounded-xl hover:bg-surface-container-lowest/90 active:scale-[0.97] transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              {t("karir.prepare-cv")}
            </Link>
            <Link
              href="/interview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-lowest/15 text-white font-bold rounded-xl hover:bg-surface-container-lowest/25 active:scale-[0.97] transition-all border border-white/20"
            >
              <span className="material-symbols-outlined text-lg">record_voice_over</span>
              {t("karir.interview-practice")}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        {/* ── Loker pilihan (dikelola admin) ── */}
        {hasJobs ? (
          <section className="mb-16">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary text-xs font-bold tracking-wider rounded-full mb-4">
                <span className="material-symbols-outlined text-sm">work</span>
                {t("karir.jobs-title")}
              </span>
              <p className="text-body-md text-on-surface-variant">{t("karir.jobs-desc")}</p>
            </div>

            {/* Filter: kategori, tipe kerja, pencarian, dan urutan. Semua ikut
                dikirim ke server supaya tidak ada lowongan yang terpotong. */}
            <div className="mb-6 space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative flex-1">
                  <span className="sr-only">{t("karir.search-label")}</span>
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden="true">
                    search
                  </span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("karir.search-placeholder")}
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
                  />
                </label>

                <label className="flex items-center gap-2">
                  <span className="sr-only">{t("karir.sort-label")}</span>
                  <span className="text-xs font-bold text-on-surface-variant">{t("karir.sort-label")}</span>
                  <select
                    value={sort}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (isJobSort(next)) setSort(next);
                    }}
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm font-bold text-on-surface focus:border-primary focus:outline-none"
                  >
                    {JOB_SORTS.map((option) => (
                      <option key={option} value={option}>
                        {lang === "en" ? JOB_SORT_LABELS[option].en : JOB_SORT_LABELS[option].id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCategory("")}
                  aria-pressed={category === ""}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    category === ""
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {t("karir.filter-all")}
                </button>
                {JOB_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setCategory(category === type ? "" : type)}
                    aria-pressed={category === type}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      category === type
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {lang === "en" ? JOB_TYPE_LABELS[type].en : JOB_TYPE_LABELS[type].id}
                  </button>
                ))}

                <span className="mx-1 hidden h-5 w-px bg-outline-variant/40 sm:block" aria-hidden="true" />

                {EMPLOYMENT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setEmployment(employment === type ? "" : type)}
                    aria-pressed={employment === type}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      employment === type
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {lang === "en" ? EMPLOYMENT_TYPE_LABELS[type].en : EMPLOYMENT_TYPE_LABELS[type].id}
                  </button>
                ))}
              </div>

              {jobsLoaded && !loadingList && jobs.length > 0 && (
                <p className="text-xs text-on-surface-variant">{t("karir.result-count").replace("{n}", String(jobs.length))}</p>
              )}
            </div>

            {/* Ajakan layanan: ruang kosong di atas daftar dipakai untuk membuat
                CV, bukan menambah halaman baru. */}
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-label-bold text-on-surface">{t("karir.promo-title")}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{t("karir.promo-desc")}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href="/builder/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">auto_awesome</span>
                  {t("karir.promo-cta-cv")}
                </Link>
                <Link
                  href="/checker"
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">fact_check</span>
                  {t("karir.promo-cta-check")}
                </Link>
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${loadingList ? "opacity-60" : ""}`}>
              {jobs.map((job) => {
                const jobType = job.jobType && isJobType(job.jobType) ? job.jobType : null;
                const employmentType =
                  job.employmentType && isEmploymentType(job.employmentType) ? job.employmentType : null;
                const deadline = deadlineStatus(job.deadline);
                const closed = deadline.state === "closed";
                return (
                <article
                  key={job.id}
                  className="flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    {job.imageUrl ? (
                      <img
                        src={job.imageUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl border border-outline-variant/50 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <span className="material-symbols-outlined text-primary">work</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-label-bold text-on-surface line-clamp-2">{job.title}</h3>
                      <p className="mt-0.5 text-xs text-on-surface-variant truncate">
                        {[job.company, job.location].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {jobType && (
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${JOB_TYPE_BADGE_CLASS[jobType]}`}>
                            {lang === "en" ? JOB_TYPE_LABELS[jobType].en : JOB_TYPE_LABELS[jobType].id}
                          </span>
                        )}
                        {employmentType && (
                          <span className="rounded-full border border-outline-variant/40 px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                            {lang === "en" ? EMPLOYMENT_TYPE_LABELS[employmentType].en : EMPLOYMENT_TYPE_LABELS[employmentType].id}
                          </span>
                        )}
                        {deadline.state !== "none" && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                              closed
                                ? "border-red-200 bg-red-100 text-red-700"
                                : deadline.state === "closing"
                                  ? "border-amber-200 bg-amber-100 text-amber-700"
                                  : "border-outline-variant/40 text-on-surface-variant"
                            }`}
                          >
                            {t(deadline.labelId).replace("{n}", String(deadline.days ?? 0))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {job.description ? (
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 whitespace-pre-line">
                      {job.description}
                    </p>
                  ) : null}

                  {closed ? (
                    <span className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/40 px-5 py-2.5 text-sm font-bold text-on-surface-variant">
                      <span className="material-symbols-outlined text-base" aria-hidden="true">lock</span>
                      {t("karir.closed-cta")}
                    </span>
                  ) : (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:brightness-110 active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden="true">open_in_new</span>
                      {t("karir.apply")}
                    </a>
                  )}
                </article>
                );
              })}
            </div>
          </section>
        ) : jobsLoaded ? (
          /* ── Coming soon (hanya saat belum ada loker) ── */
          <section className="mb-16">
            <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-xl text-on-surface mb-2">{t("karir.coming-title")}</h2>
                  <p className="text-body-md text-on-surface-variant leading-relaxed mb-4">
                    {t("karir.coming-desc")}
                  </p>
                  <ul className="space-y-3">
                    {[
                      { icon: "search", text: t("karir.coming-1") },
                      { icon: "notifications", text: t("karir.coming-2") },
                      { icon: "bolt", text: t("karir.coming-3") },
                      { icon: "auto_awesome", text: t("karir.coming-4") },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                        <span className="text-sm text-on-surface">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="mb-16 h-48 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
        )}

        {/* ── External Job Portals ── */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary text-xs font-bold tracking-wider rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">link</span>
              {t("karir.trusted-source")}
            </span>
            <h2 className="font-headline-md text-xl text-on-surface mb-2">{t("karir.portals-title")}</h2>
            <p className="text-body-md text-on-surface-variant">
              {t("karir.portals-desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXTERNAL_PORTALS.map((portal) => (
              <a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-2xl p-5 border ${portal.color} ${portal.textColor} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{portal.icon}</span>
                  <h3 className="font-label-bold text-on-surface group-hover:text-primary transition-colors">{portal.name}</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{t(portal.descriptionKey)}</p>
                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  {portal.label}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-gradient-to-br from-primary/5 via-primary/[0.02] to-secondary/5 rounded-2xl p-8 md:p-10 border border-primary/10 text-center">
          <div className="max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <h2 className="font-headline-md text-xl text-on-surface mb-2">{t("karir.cta-title")}</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              {t("karir.cta-desc")}
            </p>
            <Link
              href="/builder/new"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {t("karir.cta-btn")}
            </Link>
          </div>
        </section>
      </div>
      </main>
      <AppFooter bordered />
    </div>
  );
}
