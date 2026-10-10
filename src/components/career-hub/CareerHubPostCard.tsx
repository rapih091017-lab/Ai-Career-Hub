import Link from "next/link";
import { careerHubCategoryLabel } from "@/lib/career-hub-schemas";

export interface CareerHubPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string;
  tags: string[];
  publishedAt: string | Date | null;
}

export default function CareerHubPostCard({ post }: { post: CareerHubPostSummary }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest transition-shadow hover:shadow-premium-md">
      {post.coverImageUrl ? (
        <img src={post.coverImageUrl} alt="" className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-20 items-end bg-primary/5 px-5 pb-4">
          <span className="text-label-sm font-semibold uppercase tracking-wide text-primary">{post.category}</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
        <span>{careerHubCategoryLabel(post.category)}</span>
          {post.publishedAt ? <><span aria-hidden>·</span><time>{new Date(post.publishedAt).toLocaleDateString("id-ID")}</time></> : null}
        </div>
        <h2 className="mt-3 font-headline-md text-headline-md text-on-surface group-hover:text-primary">{post.title}</h2>
        <p className="mt-2 line-clamp-3 text-body-md text-on-surface-variant">{post.excerpt}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">#{tag}</span>)}
        </div>
        <Link href={`/career-hub/${post.slug}`} className="mt-5 inline-flex min-h-11 items-center text-label-bold text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
          Baca panduan
          <span className="material-symbols-outlined ml-1 text-[18px]" aria-hidden>arrow_forward</span>
        </Link>
      </div>
    </article>
  );
}
