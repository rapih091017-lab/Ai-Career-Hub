"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminField from "@/components/admin/AdminField";
import {
  adminBtnDanger,
  adminBtnPrimary,
  adminBtnSecondary,
  adminBtnSmall,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/ui";
import Modal from "@/components/Modal";
import { useToast } from "@/components/ui/toast";

interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  text: string;
  isPublished: boolean;
  sortOrder: number;
}

interface FormState {
  name: string;
  role: string;
  text: string;
  isPublished: boolean;
  sortOrder: number;
}

const EMPTY_FORM: FormState = { name: "", role: "", text: "", isPublished: false, sortOrder: 0 };

/** Admin: kelola testimoni pengguna yang tampil di landing. */
export default function AdminTestimonialsPage() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<TestimonialRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/testimonials");
      if (!response.ok) throw new Error("Gagal memuat testimoni.");
      const data = await response.json();
      setRows(data.testimonials ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat testimoni.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditRow(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row: TestimonialRow) => {
    setEditRow(row);
    setForm({ name: row.name, role: row.role, text: row.text, isPublished: row.isPublished, sortOrder: row.sortOrder });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (form.name.trim().length < 2 || form.text.trim().length < 10) {
      setFormError("Nama minimal 2 karakter dan testimoni minimal 10 karakter.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(editRow ? `/api/testimonials/${editRow.id}` : "/api/testimonials", {
        method: editRow ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Gagal menyimpan testimoni.");
      addToast({ type: "success", message: editRow ? "Testimoni diperbarui." : "Testimoni ditambahkan." });
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan testimoni.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (row: TestimonialRow) => {
    setBusyId(row.id);
    try {
      const response = await fetch(`/api/testimonials/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !row.isPublished }),
      });
      if (!response.ok) throw new Error("Gagal mengubah status.");
      await load();
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Gagal mengubah status." });
    } finally {
      setBusyId("");
    }
  };

  const remove = async (row: TestimonialRow) => {
    if (!window.confirm(`Hapus testimoni dari ${row.name}?`)) return;
    setBusyId(row.id);
    try {
      const response = await fetch(`/api/testimonials/${row.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus.");
      addToast({ type: "success", message: "Testimoni dihapus." });
      await load();
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Gagal menghapus." });
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Testimoni"
        description="Kutipan pengguna nyata yang tampil di landing page."
        actions={
          <button type="button" onClick={openCreate} className={adminBtnPrimary}>
            Tambah testimoni
          </button>
        }
      />

      {loading ? (
        <p role="status" className="py-10 text-center text-body-md text-on-surface-variant">
          Memuat testimoni...
        </p>
      ) : error ? (
        <p role="alert" className="rounded-xl bg-error-container p-4 text-on-error-container">
          {error}{" "}
          <button type="button" onClick={() => void load()} className="underline">
            Coba lagi
          </button>
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant p-10 text-center text-body-md text-on-surface-variant">
          Belum ada testimoni. Hanya kutipan dari pengguna nyata yang boleh dipublikasikan.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className="flex flex-col gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-body-md font-semibold text-on-surface">
                  {row.name} <span className="font-normal text-on-surface-variant">· {row.role}</span>
                </p>
                <p className="mt-1 line-clamp-2 text-label-sm text-on-surface-variant">{row.text}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-label-sm ${
                    row.isPublished ? "bg-green/10 text-green-deep" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {row.isPublished ? "Tampil" : "Draf"}
                </span>
                <button type="button" onClick={() => openEdit(row)} className={adminBtnSmall}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void togglePublish(row)}
                  disabled={busyId === row.id}
                  className={adminBtnSmall}
                >
                  {row.isPublished ? "Sembunyikan" : "Tampilkan"}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(row)}
                  disabled={busyId === row.id}
                  className={adminBtnDanger}
                >
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRow ? "Edit Testimoni" : "Tambah Testimoni"} size="max-w-xl">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AdminField label="Nama" required>
              <input
                className={adminInputClass}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={100}
              />
            </AdminField>
            <AdminField label="Peran" required hint="mis. Fresh Graduate Teknik Informatika">
              <input
                className={adminInputClass}
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                maxLength={100}
              />
            </AdminField>
          </div>
          <AdminField label="Kutipan" required hint="Maksimal 600 karakter. Tulis apa adanya, tanpa dibumbui.">
            <textarea
              className={`${adminTextareaClass} min-h-[120px]`}
              value={form.text}
              onChange={(event) => setForm({ ...form, text: event.target.value })}
              maxLength={600}
            />
          </AdminField>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AdminField label="Urutan tampil">
              <input
                type="number"
                className={adminInputClass}
                value={form.sortOrder}
                onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) || 0 })}
              />
            </AdminField>
            <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-outline-variant/70 bg-surface-container-low px-4 py-3">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                className="h-4 w-4 accent-green-deep"
              />
              <span className="text-label-bold text-on-surface">Tampilkan di landing</span>
            </label>
          </div>
          {formError ? (
            <p role="alert" className="rounded-xl bg-error-container/50 px-4 py-3 text-label-bold text-on-error-container">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/50 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className={adminBtnSecondary}>
              Batal
            </button>
            <button type="button" onClick={() => void handleSave()} disabled={saving} className={adminBtnPrimary}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
