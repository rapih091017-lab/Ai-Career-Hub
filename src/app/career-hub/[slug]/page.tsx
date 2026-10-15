import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyLinkButton from "@/components/career-hub/CopyLinkButton";
import SiteHeader from "@/components/nav/SiteHeader";
import AppFooter from "@/components/AppFooter";
import ArticleContent from "@/components/career-hub/ArticleContent";
import { db } from "@/db";
import { careerHubPosts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { SITE_URL } from "@/lib/site-url";
import { careerHubCategoryLabel } from "@/lib/career-hub-schemas";

async function getPost(slug: string) {
  const [post] = await db.select().from(careerHubPosts).where(and(eq(careerHubPosts.slug, slug), eq(careerHubPosts.status, "published"))).limit(1);
  return post;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return post ? { title: `${post.title} | Career Hub`, description: post.excerpt, alternates: { canonical: `${SITE_URL}/career-hub/${post.slug}` }, openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.publishedAt?.toISOString() } } : { title: "Panduan tidak ditemukan | Career Hub", robots: { index: false, follow: false } };
}

export default async function CareerHubArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return <div className="flex min-h-screen flex-col bg-background text-on-background"><SiteHeader variant="pill" /><main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter"><article className="mx-auto max-w-[760px]"><Link href="/career-hub" className="inline-flex min-h-11 items-center text-label-bold text-primary focus-visible:outline-2 focus-visible:outline-primary"><span className="material-symbols-outlined mr-1 text-[18px]" aria-hidden>arrow_back</span>Semua panduan</Link><header className="mt-8 border-b border-outline-variant/50 pb-8"><p className="text-label-sm font-semibold uppercase tracking-wide text-primary">{careerHubCategoryLabel(post.category)}</p><h1 className="mt-3 font-headline-lg text-4xl text-on-background">{post.title}</h1><p className="mt-4 text-body-lg text-on-surface-variant">{post.excerpt}</p><time className="mt-5 block text-label-sm text-on-surface-variant">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : ""}</time>{post.coverImageUrl ? <img src={post.coverImageUrl} alt="" className="mt-8 max-h-[420px] w-full rounded-2xl object-cover" /> : null}</header><div className="py-10"><ArticleContent content={post.content} /></div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/50 pt-6"><div className="flex flex-wrap gap-2">{post.tags.map((tag) => <Link key={tag} href={`/career-hub?tag=${encodeURIComponent(tag)}`} className="rounded-md bg-surface-container px-3 py-1.5 text-label-sm text-on-surface-variant hover:text-primary">#{tag}</Link>)}</div><CopyLinkButton /></div></article></main><AppFooter bordered /></div>;
}
