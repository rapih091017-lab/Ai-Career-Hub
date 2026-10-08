"use client";

import { useCallback, useEffect, useState } from "react";
import AdminField from "@/components/admin/AdminField";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  adminBtnDanger,
  adminBtnPrimary,
  adminBtnSecondary,
  adminBtnSmall,
  adminCheckboxClass,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/ui";
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

/** Admin: kelola loker yang tampil di halaman publik /karir. */
export default function AdminJobsPage() {
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
    <div>
      <AdminPageHeader
        icon="work"
        title="Kelola Loker"
        description="Tambah judul, deskripsi, link pendaftaran, dan foto. Yang dipublikasikan tampil di halaman /karir."
        actions={
          <button type="button" onClick={openCreate} className={adminBtnPrimary}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              add
            </span>
            Tambah Loker
          </button>
        }
      />

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
      ) : error ? (
        <p className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
          {error}
        </p>
      ) : jobs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant p-8 text-center text-body-md text-on-surface-variant">
          Belum ada loker. Klik “Tambah Loker” untuk membuat yang pertama.
        </p>
      ) : (
        <div className="space-y-3">
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
                    className={adminBtnSmall}
                  >
                    {job.isPublished ? "Jadikan Draf" : "Publikasikan"}
                  </button>
                  <button type="button" onClick={() => openEdit(job)} className={adminBtnSmall}>
                    Edit
                  </button>
                  <button type="button" onClick={() => requestDelete(job)} className={adminBtnDanger}>
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
          <div className="space-y-5">
            <AdminField label="Judul posisi" required hint="Nama posisi yang dicari pelamar, mis. “Frontend Developer”.">
              <input
                className={adminInputClass}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="mis. Frontend Developer"
                maxLength={200}
              />
            </AdminField>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <AdminField label="Perusahaan" hint="Kosongkan bila dirahasiakan.">
                <input
                  className={adminInputClass}
                  value={form.company}
                  onChange={(event) => setForm({ ...form, company: event.target.value })}
                  maxLength={200}
                />
              </AdminField>
              <AdminField label="Lokasi" hint="Bisa diisi “Remote” atau nama kota.">
                <input
                  className={adminInputClass}
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  placeholder="mis. Jakarta / Remote"
                  maxLength={200}
                />
              </AdminField>
            </div>

            <AdminField
              label="Link pendaftaran (eksternal)"
              hint="Pelamar diarahkan ke tautan ini saat mengklik Lamar."
            >
              <input
                className={adminInputClass}
                value={form.applyUrl}
                onChange={(event) => setForm({ ...form, applyUrl: event.target.value })}
                placeholder="https://perusahaan.com/lamar"
                inputMode="url"
                maxLength={2000}
              />
            </AdminField>

            <AdminField label="Deskripsi / requirement" hint="Satu poin per baris lebih mudah dibaca pelamar.">
              <textarea
                className={`${adminTextareaClass} min-h-[140px]`}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={5}
                maxLength={10000}
              />
            </AdminField>

            <PhotoUpload
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              label="Foto / logo (opsional)"
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/70 bg-surface-container-low px-4 py-3">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                className={adminCheckboxClass}
              />
              <span className="text-label-bold text-on-surface">Publikasikan sekarang</span>
              <span className="ml-auto text-label-sm text-on-surface-variant">Tampil di /karir</span>
            </label>

            {formError ? (
              <p className="rounded-xl bg-error-container/50 px-4 py-3 text-label-bold text-on-error-container" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/50 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className={adminBtnSecondary}>
                Batal
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className={adminBtnPrimary}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </Modal>

      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
