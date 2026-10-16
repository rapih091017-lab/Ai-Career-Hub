"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/components/portfolio/PhotoUpload";
import AdminField from "@/components/admin/AdminField";
import { adminBtnPrimary, adminBtnSecondary, adminInputClass, adminTextareaClass } from "@/components/admin/ui";
import { CAREER_HUB_CATEGORIES, slugifyCareerHubTitle } from "@/lib/career-hub-schemas";
import ArticleContent from "./ArticleContent";
import ArticleEditor from "./ArticleEditor";

export interface CareerHubPostFormValue {
  id?: string; title: string; slug: string; excerpt: string; content: string; category: string;
  tags: string[]; coverImageUrl: string | null; status: "draft" | "published";
}

const EMPTY: CareerHubPostFormValue = { title: "", slug: "", excerpt: "", content: "", category: "cv-ats", tags: [], coverImageUrl: null, status: "draft" };

export default function CareerHubPostForm({ postId }: { postId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!postId) return;
    fetch("/api/admin/career-hub").then(async (response) => {
      if (!response.ok) throw new Error("Gagal memuat artikel.");
      const data = await response.json();
      const post = (data.posts ?? []).find((row: CareerHubPostFormValue) => row.id === postId);
      if (!post) throw new Error("Artikel tidak ditemukan.");
      setForm(post); setSlugEdited(true);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [postId]);

  const set = <K extends keyof CareerHubPostFormValue>(key: K, value: CareerHubPostFormValue[K]) => setForm((current) => ({ ...current, [key]: value }));
  const addTag = () => {
    const value = tagInput.trim().replace(/^#/, "");
    // Sama seperti 서버, perbandingan tidak membedakan huruf besar-kecil,
    // supaya "CV" dan "cv" tidak menghasilkan tag ganda.
    const exists = form.tags.some((tag) => tag.toLowerCase() === value.toLowerCase());
    if (value && !exists && form.tags.length < 12) set("tags", [...form.tags, value]);
    setTagInput("");
  };

  const save = async (status: "draft" | "published") => {
    setSaving(true); setError("");
    try {
      const payload = { ...form, slug: form.slug || slugifyCareerHubTitle(form.title), status };
      const response = await fetch(postId ? `/api/admin/career-hub/${postId}` : "/api/admin/career-hub", {
        method: postId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Artikel gagal disimpan.");
      if (!postId) router.push(`/admin/career-hub/${data.post.id}`);
      else setForm(data.post);
    } catch (err) { setError(err instanceof Error ? err.message : "Artikel gagal disimpan."); }
    finally { setSaving(false); }
  };

  if (loading) return <p role="status" className="py-12 text-center text-body-md text-on-surface-variant">Memuat artikel...</p>;
  if (preview) return <div className="space-y-5"><button type="button" className={adminBtnSecondary} onClick={() => setPreview(false)}>Kembali ke editor</button><article className="max-w-3xl rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6"><p className="text-label-sm text-primary">{form.category}</p><h1 className="mt-2 font-headline-lg text-3xl">{form.title || "Judul artikel"}</h1><p className="mt-2 text-body-md text-on-surface-variant">{form.excerpt}</p>{form.coverImageUrl ? <img src={form.coverImageUrl} alt="" className="mt-6 max-h-[360px] w-full rounded-xl object-cover" /> : null}<div className="mt-6"><ArticleContent content={form.content} /></div><div className="mt-6 flex flex-wrap gap-2">{form.tags.map((tag) => <span key={tag} className="rounded-md bg-surface-container px-2 py-1 text-label-sm">#{tag}</span>)}</div></article></div>;

  return <div className="max-w-3xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/career-hub" className="min-h-11 inline-flex items-center text-label-bold text-primary">← Semua artikel</Link><button type="button" className={adminBtnSecondary} onClick={() => setPreview(true)}>Pratinjau</button></div>
    <AdminField label="Judul" required><input className={adminInputClass} maxLength={180} value={form.title} onChange={(event) => { const title = event.target.value; set("title", title); if (!slugEdited) set("slug", slugifyCareerHubTitle(title)); }} /></AdminField>
    <AdminField label="Slug" required hint="Dipakai pada alamat artikel."><input className={adminInputClass} maxLength={180} value={form.slug} onChange={(event) => { setSlugEdited(true); set("slug", slugifyCareerHubTitle(event.target.value)); }} /></AdminField>
    <AdminField label="Ringkasan" required><textarea className={`${adminTextareaClass} min-h-[88px]`} maxLength={500} value={form.excerpt} onChange={(event) => set("excerpt", event.target.value)} /></AdminField>
    <AdminField label="Kategori" required><select className={adminInputClass} value={form.category} onChange={(event) => set("category", event.target.value)}>{CAREER_HUB_CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.id}</option>)}</select></AdminField>
    <AdminField label="Isi artikel" required hint="Pakai toolbar di atas kolom ini untuk tebal, judul, daftar, dan rata paragraf.">
      <ArticleEditor className={`${adminTextareaClass} min-h-[320px] font-mono text-sm`} value={form.content} onChange={(value) => set("content", value)} rows={16} maxLength={50000} />
    </AdminField>
    <AdminField label="Tag" hint="Tekan Enter untuk menambahkan tag, maksimal 12."><div className="flex gap-2"><input className={adminInputClass} value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} /><button type="button" onClick={addTag} className={adminBtnSecondary}>Tambah</button></div><div className="mt-2 flex flex-wrap gap-2">{form.tags.map((tag) => <button type="button" key={tag} onClick={() => set("tags", form.tags.filter((item) => item !== tag))} className="rounded-md bg-surface-container px-2 py-1 text-label-sm">#{tag} ×</button>)}</div></AdminField>
    <PhotoUpload value={form.coverImageUrl ?? ""} onChange={(url) => set("coverImageUrl", url || null)} label="Gambar sampul (opsional)" />
    {error ? <p role="alert" className="rounded-xl bg-error-container px-4 py-3 text-label-bold text-on-error-container">{error}</p> : null}
    <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/50 pt-4"><button type="button" disabled={saving} onClick={() => save("draft")} className={adminBtnSecondary}>Simpan draf</button><button type="button" disabled={saving} onClick={() => save("published")} className={adminBtnPrimary}>{saving ? "Menyimpan..." : "Terbitkan"}</button></div>
  </div>;
}
