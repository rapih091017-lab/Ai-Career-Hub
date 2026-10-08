"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Modal from "@/components/Modal";
import PhotoUpload from "@/components/portfolio/PhotoUpload";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface Job {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  description: string | null;
  applyUrl: string;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string | null;
}

interface JobForm {
  title: string;
  company: string;
  location: string;
  applyUrl: string;
  description: string;
  imageUrl: string;
  isPublished: boolean;
}

const EMPTY_FORM: JobForm = {
  title: "",
  company: "",
  location: "",
  applyUrl: "",
  description: "",
  imageUrl: "",
  isPublished: false,
};

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

/** Admin: kelola loker yang tampil di halaman publik /karir. */
export default function AdminJobsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [form, setForm] = useState<JobForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/jobs");
      if (response.status === 401 || response.status === 403) {
        setError("Akses ditolak. Halaman ini hanya untuk admin.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("load failed");
      const data = await response.json();
      setJobs(data.jobs ?? []);
      setError(null);
    } catch {
      setError("Gagal memuat daftar loker.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditJob(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditJob(job);
    setForm({
      title: job.title,
      company: job.company ?? "",
      location: job.location ?? "",
      applyUrl: job.applyUrl,
      description: job.description ?? "",
      imageUrl: job.imageUrl ?? "",
      isPublished: job.isPublished,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const applyUrl = form.applyUrl.trim();
    if (!title) {
      setFormError("Judul wajib diisi.");
      return;
    }
    if (!/^https?:\/\//i.test(applyUrl)) {
      setFormError("Link lamar harus diawali http:// atau https://");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch(editJob ? `/api/admin/jobs/${editJob.id}` : "/api/admin/jobs", {
        method: editJob ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          company: form.company,
          location: form.location,
          applyUrl,
          description: form.description,
          imageUrl: form.imageUrl || null,
          isPublished: form.isPublished,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Gagal menyimpan.");
      }
      addToast({ type: "success", message: editJob ? "Loker diperbarui." : "Loker dibuat." });
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setFormError(err?.message || "Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (job: Job) => {
    setBusyId(job.id);
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !job.isPublished }),
      });
      if (!response.ok) throw new Error("toggle failed");
      await load();
    } catch {
      addToast({ type: "error", message: "Gagal mengubah status. Coba lagi." });
    } finally {
      setBusyId(null);
    }
  };

  const requestDelete = (job: Job) => {
    setConfirm({
      title: "Hapus loker ini?",
      message: job.title,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      variant: "danger",
      onConfirm: async () => {
        setConfirm(null);
        try {
          const response = await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("delete failed");
          setJobs((prev) => prev.filter((item) => item.id !== job.id));
          addToast({ type: "success", message: "Loker dihapus." });
        } catch {
          addToast({ type: "error", message: "Gagal menghapus. Coba lagi." });
        }
      },
      onCancel: () => setConfirm(null),
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-margin-mobile pb-24 pt-24 md:px-gutter">
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 inline-flex items-center gap-1.5 text-label-bold text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Admin
        </button>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-background">Kelola Loker</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Tambah judul, deskripsi, link pendaftaran, dan foto. Yang dipublikasikan tampil di halaman /karir.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="h-11 rounded-xl bg-primary px-4 text-label-bold text-on-primary transition-opacity hover:opacity-90"
          >
            Tambah Loker
          </button>
        </div>

        {loading ? (
          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
        ) : error ? (
          <p className="mt-8 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
            {error}
          </p>
        ) : jobs.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-outline-variant p-8 text-center text-body-md text-on-surface-variant">
            Belum ada loker. Klik "Tambah Loker" untuk membuat yang pertama.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 md:flex-row md:items-center"
              >
                {job.imageUrl ? (
                  <img
                    src={job.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl border border-outline-variant/50 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <span className="material-symbols-outlined text-primary">work</span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md font-semibold text-on-surface">{job.title}</p>
                  <p className="truncate text-label-sm text-on-surface-variant">
                    {[job.company, job.location].filter(Boolean).join(" · ") || "Tanpa perusahaan/lokasi"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-label-sm ${
                      job.isPublished ? "bg-emerald-500/10 text-emerald-700" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {job.isPublished ? "Terbit" : "Draf"}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePublish(job)}
                    disabled={busyId === job.id}
                    className="h-10 rounded-lg border border-outline-variant px-3 text-label-bold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
                  >
                    {job.isPublished ? "Jadikan Draf" : "Publikasikan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(job)}
                    className="h-10 rounded-lg border border-outline-variant px-3 text-label-bold text-on-surface transition-colors hover:bg-surface-container"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(job)}
                    className="h-10 rounded-lg px-3 text-label-bold text-error transition-colors hover:bg-error-container/40"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editJob ? "Edit Loker" : "Tambah Loker"}
          size="max-w-2xl"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-label-bold text-on-surface">Judul posisi</span>
              <input
                className={inputClass}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="mis. Frontend Developer"
                maxLength={200}
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-label-bold text-on-surface">Perusahaan</span>
                <input
                  className={inputClass}
                  value={form.company}
                  onChange={(event) => setForm({ ...form, company: event.target.value })}
                  maxLength={200}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-label-bold text-on-surface">Lokasi</span>
                <input
                  className={inputClass}
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  placeholder="mis. Jakarta / Remote"
                  maxLength={200}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-label-bold text-on-surface">Link pendaftaran (eksternal)</span>
              <input
                className={inputClass}
                value={form.applyUrl}
                onChange={(event) => setForm({ ...form, applyUrl: event.target.value })}
                placeholder="https://perusahaan.com/lamar"
                maxLength={2000}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-label-bold text-on-surface">Deskripsi / requirement</span>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={5}
                maxLength={10000}
              />
            </label>

            <PhotoUpload
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              label="Foto / logo (opsional)"
            />

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                className="h-5 w-5 rounded border-outline-variant accent-[#0d7377]"
              />
              <span className="text-label-bold text-on-surface">Publikasikan sekarang</span>
            </label>

            {formError ? (
              <p className="rounded-lg bg-error-container/50 px-3 py-2 text-label-bold text-on-error-container">
                {formError}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2.5 text-label-bold text-on-surface-variant hover:bg-surface-container"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2.5 text-label-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
      </main>
    </div>
  );
}
