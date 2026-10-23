"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { CAREER_HUB_CATEGORIES } from "@/lib/career-hub-schemas";

/**
 * Satu artikel Career Hub sebagai pemancing.
 *
 * Artikelnya dipatok lewat slug, bukan "yang terbaru", supaya hook-nya bisa
 * dipilih: artikel interview adalah yang paling sering jadi titik masuk.
 * Kalau artikel ini di-unpublish atau slug-nya berganti, section tidak
 * dirender sama sekali, bukan menampilkan kartu kosong.
 */
const FEATURED_SLUG = "pertanyaan-wawancara-kerja-star-method";

interface FeaturedPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
}

export default function FeaturedArticle() {
  const { t, lang } = useTranslation();
  const [post, setPost] = useState<FeaturedPost | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/career-hub/${FEATURED_SLUG}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.post) setPost(data.post);
      })
      .catch(() => {
        /* biarkan null, section disembunyikan */
      });
    return () => {
      active = false;
    };
  }, []);

  if (!post) return null;

  const category = CAREER_HUB_CATEGORIES.find((item) => item.key === post.category);
  const categoryLabel = category ? (lang === "en" ? category.en : category.id) : post.category;

  return (
    <section id="bacaan" className="section section-rule bg-desk">
      <div className="shell">
        <div
          data-reveal
          className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-x-16"
        >
          <div>
            <p className="kicker">{t("lp.article.kicker")}</p>
            <h2 className="max-w-[22ch] font-display text-headline-lg font-bold text-ink">
              {t("lp.article.title")}
            </h2>
          </div>
          <p className="max-w-[40ch] text-body-md leading-relaxed text-ink-soft md:pb-2">
            {t("lp.article.lede")}
          </p>
        </div>

        <article data-reveal className="card-hard mt-10 grid gap-6 bg-stage p-6 text-on-dark md:mt-12 md:p-9">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-lime">
            <span>{categoryLabel}</span>
            {post.publishedAt ? (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </>
            ) : null}
          </div>

          <h3 className="max-w-[26ch] font-display text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.1] tracking-[-0.025em] text-on-dark">
            {post.title}
          </h3>

          <p className="line-clamp-3 max-w-[62ch] text-[15px] leading-relaxed text-on-dark/80">
            {post.excerpt}
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-on-dark/25 px-2 py-1 text-[12px] font-semibold text-on-dark/75"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href={`/career-hub/${post.slug}`}
                className="inline-flex min-h-[44px] items-center gap-2 text-[14px] font-bold text-lime underline decoration-lime decoration-[3px] underline-offset-4 transition-colors hover:text-on-dark"
              >
                {t("lp.article.cta")}
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/career-hub"
                className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-on-dark/75 underline underline-offset-4 transition-colors hover:text-on-dark"
              >
                {t("lp.article.all")}
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
