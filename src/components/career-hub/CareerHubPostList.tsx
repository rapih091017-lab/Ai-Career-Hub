"use client";

import { useEffect, useRef, useState } from "react";
import CareerHubPostCard, { type CareerHubPostSummary } from "./CareerHubPostCard";

interface Props { initialPosts: CareerHubPostSummary[]; initialTotal: number; }

export default function CareerHubPostList({ initialPosts, initialTotal }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const restoredFromUrl = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") ?? ""); setCategory(params.get("category") ?? "");
    setTag(params.get("tag") ?? ""); setPage(Math.max(1, Number(params.get("page") ?? 1)));
    restoredFromUrl.current = true;
  }, []);

  useEffect(() => {
    if (!restoredFromUrl.current) return;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [q, category, tag, page]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!q && !category && !tag && page === 1) { setPosts(initialPosts); setTotal(initialTotal); setTotalPages(Math.max(1, Math.ceil(initialTotal / 12))); setLoading(false); setError(false); return; }
      setLoading(true); setError(false);
      try {
        const query = new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}), ...(tag ? { tag } : {}), page: String(page), pageSize: "12" });
        const response = await fetch(`/api/career-hub?${query}`);
        if (!response.ok) throw new Error("request failed");
        const data = await response.json();
        setPosts(data.posts ?? []); setTotal(data.pagination?.total ?? 0); setTotalPages(data.pagination?.totalPages ?? 1);
      } catch { setError(true); }
      finally { setLoading(false); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q, category, tag, page, retry, initialPosts, initialTotal]);

  const clear = () => { setQ(""); setCategory(""); setTag(""); setPage(1); };
  return (
    <>
      <form className="mb-8 grid gap-3 md:grid-cols-[1fr_220px_180px_auto]" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="career-search">Cari panduan</label>
        <input id="career-search" value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Cari judul atau topik" className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-primary" />
        <label className="sr-only" htmlFor="career-category">Kategori</label>
        <select id="career-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface focus-visible:outline-2 focus-visible:outline-primary">
          <option value="">Semua kategori</option>
          <option value="cv-ats">CV dan ATS</option><option value="interview">Interview</option><option value="job-search">Strategi Mencari Kerja</option><option value="skills-learning">Skill dan Pembelajaran</option><option value="ai-career">AI untuk Karier</option><option value="workplace">Dunia Kerja</option>
        </select>
        <label className="sr-only" htmlFor="career-tag">Tag</label>
        <input id="career-tag" value={tag} onChange={(event) => { setTag(event.target.value); setPage(1); }} placeholder="Filter tag" className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-primary" />
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-primary/30 px-4 text-label-bold text-primary hover:bg-primary/5">Reset</button>
      </form>
      {loading ? <p className="py-12 text-center text-body-md text-on-surface-variant" role="status">Memuat panduan...</p> : error ? <p className="py-12 text-center text-body-md text-error" role="alert">Panduan gagal dimuat. <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>Coba lagi</button></p> : posts.length === 0 ? <p className="rounded-2xl border border-dashed border-outline-variant p-12 text-center text-body-md text-on-surface-variant">Belum ada panduan yang cocok. Coba kata kunci atau kategori lain.</p> : <><p className="mb-4 text-label-sm text-on-surface-variant">{total} panduan tersedia</p><div className="grid gap-5 md:grid-cols-2">{posts.map((post) => <CareerHubPostCard key={post.id} post={post} />)}</div>{totalPages > 1 ? <nav aria-label="Halaman panduan" className="mt-8 flex items-center justify-center gap-4"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="min-h-11 rounded-lg border border-outline-variant px-4 text-label-bold disabled:opacity-50">Sebelumnya</button><span className="text-label-sm text-on-surface-variant">{page} / {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="min-h-11 rounded-lg border border-outline-variant px-4 text-label-bold disabled:opacity-50">Berikutnya</button></nav> : null}</>}
    </>
  );
}
