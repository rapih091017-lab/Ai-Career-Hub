"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { careerHubCategoryLabel } from "@/lib/career-hub-schemas";

interface Post { id: string; slug: string; title: string; category: string; status: "draft" | "published"; updatedAt: string; }

export default function AdminCareerHubPage() {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const params = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) }); const response = await fetch(`/api/admin/career-hub?${params}`); if (!response.ok) throw new Error("Gagal memuat artikel."); const data = await response.json(); setPosts(data.posts ?? []); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat artikel."); }
    finally { setLoading(false); }
  }, [q, status]);
  useEffect(() => { void load(); }, [load]);

  const togglePublish = async (post: Post) => {
    setBusy(post.id);
    try { const response = await fetch(`/api/admin/career-hub/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: post.status === "published" ? "draft" : "published" }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Status gagal diubah."); addToast({ type: "success", message: post.status === "published" ? "Artikel dijadikan draf." : "Artikel diterbitkan." }); await load(); }
    catch (err) { addToast({ type: "error", message: err instanceof Error ? err.message : "Gagal mengubah status." }); }
    finally { setBusy(""); }
  };
  const remove = async (post: Post) => {
    setBusy(post.id);
    try { const response = await fetch(`/api/admin/career-hub/${post.id}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Artikel gagal dihapus."); addToast({ type: "success", message: "Artikel dihapus." }); await load(); }
    catch (err) { addToast({ type: "error", message: err instanceof Error ? err.message : "Gagal menghapus artikel." }); }
    finally { setBusy(""); }
  };

  return <div className="space-y-6"><AdminPageHeader title="Career Hub" description="Kelola panduan karier yang tampil untuk pengguna." actions={<Link href="/admin/career-hub/new" className={adminBtnPrimary}>Tulis artikel</Link>} />
    <div className="grid gap-3 md:grid-cols-[1fr_220px]"><label className="sr-only" htmlFor="admin-post-search">Cari artikel</label><input id="admin-post-search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Cari artikel" className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-4" /><label className="sr-only" htmlFor="admin-post-status">Status</label><select id="admin-post-status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-4"><option value="">Semua status</option><option value="draft">Draf</option><option value="published">Terbit</option></select></div>
    {loading ? <p role="status" className="py-10 text-center text-body-md text-on-surface-variant">Memuat daftar artikel...</p> : error ? <p role="alert" className="rounded-xl bg-error-container p-4 text-on-error-container">{error} <button onClick={() => void load()} className="underline">Coba lagi</button></p> : posts.length === 0 ? <p className="rounded-2xl border border-dashed border-outline-variant p-10 text-center text-body-md text-on-surface-variant">Belum ada artikel. Tulis panduan pertama untuk pengguna Career Hub.</p> : <div className="space-y-3">{posts.map((post) => <article key={post.id} className="flex flex-col gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><h2 className="truncate font-label-bold text-on-surface">{post.title}</h2><p className="mt-1 text-label-sm text-on-surface-variant">{careerHubCategoryLabel(post.category)} · Diperbarui {new Date(post.updatedAt).toLocaleDateString("id-ID")}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-surface-container px-2 py-1 text-label-sm">{post.status === "published" ? "Terbit" : "Draf"}</span><Link href={`/admin/career-hub/${post.id}`} className={adminBtnSecondary}>Edit</Link>{post.status === "published" ? <Link href={`/career-hub/${post.slug}`} target="_blank" className={adminBtnSecondary}>Lihat</Link> : null}<button disabled={busy === post.id} onClick={() => void togglePublish(post)} className={adminBtnSecondary}>{post.status === "published" ? "Jadikan draf" : "Terbitkan"}</button><button disabled={busy === post.id} onClick={() => setConfirm({ title: "Hapus artikel?", message: `Artikel “${post.title}” akan dihapus permanen.`, confirmLabel: "Hapus artikel", variant: "danger", onConfirm: () => void remove(post) })} className={adminBtnDanger}>Hapus</button></div></article>)}</div>}
    <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
  </div>;
}
