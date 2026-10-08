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
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface CareerLevel {
  level: string;
  years: string;
  salaryRange: string;
  focus: string;
}

interface CareerPathRow {
  id: string;
  slug: string;
  role: string;
  category: string;
  summary: string | null;
  levels: CareerLevel[] | null;
  skills: string[] | null;
  steps: string[] | null;
  isPublished: boolean;
  sortOrder: number;
}

interface FormState {
  role: string;
  category: string;
  summary: string;
  levels: CareerLevel[];
  skillsText: string;
  stepsText: string;
  isPublished: boolean;
}

const EMPTY_FORM: FormState = {
  role: "",
  category: "",
  summary: "",
  levels: [{ level: "", years: "", salaryRange: "", focus: "" }],
  skillsText: "",
  stepsText: "",
  isPublished: true,
};

/** Admin: kelola jalur karier. Editor sengaja sederhana: skill dipisah koma,
 * langkah satu per baris, jenjang diisi sebagai baris terstruktur. */
export default function AdminCareerPathPage() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<CareerPathRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<CareerPathRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/career-paths");
      if (response.status === 401 || response.status === 403) {
        setError("Akses ditolak. Halaman ini hanya untuk admin.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("load failed");
      const data = await response.json();
      setRows(data.careerPaths ?? []);
      setError(null);
    } catch {
      setError("Gagal memuat jalur karier.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditRow(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: CareerPathRow) => {
    setEditRow(row);
    setForm({
      role: row.role,
      category: row.category,
      summary: row.summary ?? "",
      levels: row.levels && row.levels.length > 0 ? row.levels : EMPTY_FORM.levels,
      skillsText: (row.skills ?? []).join(", "),
      stepsText: (row.steps ?? []).join("\n"),
      isPublished: row.isPublished,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const updateLevel = (index: number, patch: Partial<CareerLevel>) => {
    setForm((prev) => ({
      ...prev,
      levels: prev.levels.map((level, i) => (i === index ? { ...level, ...patch } : level)),
    }));
  };

  const addLevel = () => {
    setForm((prev) => ({
      ...prev,
      levels: [...prev.levels, { level: "", years: "", salaryRange: "", focus: "" }],
    }));
  };

  const removeLevel = (index: number) => {
    setForm((prev) => ({ ...prev, levels: prev.levels.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    const role = form.role.trim();
    const category = form.category.trim();
    if (!role || !category) {
      setFormError("Nama posisi dan kategori wajib diisi.");
      return;
    }
    const levels = form.levels
      .map((level) => ({
        level: level.level.trim(),
        years: level.years.trim(),
        salaryRange: level.salaryRange.trim(),
        focus: level.focus.trim(),
      }))
      .filter((level) => level.level.length > 0);
    const skills = form.skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const steps = form.stepsText
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean);

    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch(
        editRow ? `/api/admin/career-paths/${editRow.id}` : "/api/admin/career-paths",
        {
          method: editRow ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            category,
            summary: form.summary,
            levels,
            skills,
            steps,
            isPublished: form.isPublished,
          }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Gagal menyimpan.");
      addToast({ type: "success", message: editRow ? "Jalur karier diperbarui." : "Posisi baru ditambahkan." });
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (row: CareerPathRow) => {
    setBusyId(row.id);
    try {
      const response = await fetch(`/api/admin/career-paths/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !row.isPublished }),
      });
      if (!response.ok) throw new Error("toggle failed");
      await load();
    } catch {
      addToast({ type: "error", message: "Gagal mengubah status. Coba lagi." });
    } finally {
      setBusyId(null);
    }
  };

  const requestDelete = (row: CareerPathRow) => {
    setConfirm({
      title: "Hapus jalur karier ini?",
      message: row.role,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      variant: "danger",
      onConfirm: async () => {
        setConfirm(null);
        try {
          const response = await fetch(`/api/admin/career-paths/${row.id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("delete failed");
          setRows((prev) => prev.filter((item) => item.id !== row.id));
          addToast({ type: "success", message: "Jalur karier dihapus." });
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
        icon="route"
        title="Jalur Karier"
        description="Isi jenjang, skill, dan langkah tiap posisi. Yang dipublikasikan tampil di /career-path."
        actions={
          <button type="button" onClick={openCreate} className={adminBtnPrimary}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              add
            </span>
            Tambah Posisi
          </button>
        }
      />

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
      ) : error ? (
        <p className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant p-8 text-center text-body-md text-on-surface-variant">
          Belum ada jalur karier. Klik “Tambah Posisi” untuk memulai.
        </p>
      ) : (
        <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-body-md font-semibold text-on-surface">{row.role}</p>
                  <p className="truncate text-label-sm text-on-surface-variant">
                    {row.category} <span className="mx-1">·</span> /career-path/{row.slug}
                  </p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    {(row.levels ?? []).length} jenjang, {(row.skills ?? []).length} skill, {(row.steps ?? []).length} langkah
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-label-sm ${
                      row.isPublished ? "bg-emerald-500/10 text-emerald-700" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {row.isPublished ? "Terbit" : "Draf"}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePublish(row)}
                    disabled={busyId === row.id}
                    className={adminBtnSmall}
                  >
                    {row.isPublished ? "Jadikan Draf" : "Publikasikan"}
                  </button>
                  <button type="button" onClick={() => openEdit(row)} className={adminBtnSmall}>
                    Edit
                  </button>
                  <button type="button" onClick={() => requestDelete(row)} className={adminBtnDanger}>
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
          title={editRow ? `Edit Jalur Karier: ${editRow.role}` : "Tambah Jalur Karier"}
          size="max-w-3xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <AdminField label="Nama posisi" required hint="Tampil sebagai judul di /career-path.">
                <input
                  className={adminInputClass}
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  placeholder="mis. Data Analyst"
                  maxLength={120}
                />
              </AdminField>
              <AdminField label="Kategori" required hint="Dipakai untuk mengelompokkan posisi.">
                <input
                  className={adminInputClass}
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="mis. Data & Analitik"
                  maxLength={80}
                />
              </AdminField>
            </div>

            <AdminField label="Ringkasan" hint="Satu paragraf singkat tentang posisi ini.">
              <textarea
                className={`${adminTextareaClass} min-h-[96px]`}
                value={form.summary}
                onChange={(event) => setForm({ ...form, summary: event.target.value })}
                rows={3}
                maxLength={1000}
              />
            </AdminField>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-label-bold text-on-surface">Jenjang karier</p>
                  <p className="text-label-sm text-on-surface-variant">
                    Setiap jenjang diberi label sendiri supaya tetap jelas setelah field terisi.
                  </p>
                </div>
                <button type="button" onClick={addLevel} className={adminBtnSecondary}>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    add
                  </span>
                  Tambah jenjang
                </button>
              </div>

              <div className="space-y-3">
                {form.levels.map((level, index) => (
                  <div key={index} className="rounded-xl border border-outline-variant/70 bg-surface-container-low p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-label-bold text-on-surface">Jenjang {index + 1}</p>
                      {form.levels.length > 1 ? (
                        <button type="button" onClick={() => removeLevel(index)} className={adminBtnDanger}>
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                            delete
                          </span>
                          Hapus jenjang
                        </button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <AdminField label="Nama jenjang">
                        <input
                          className={adminInputClass}
                          value={level.level}
                          onChange={(event) => updateLevel(index, { level: event.target.value })}
                          placeholder="Junior"
                          maxLength={60}
                        />
                      </AdminField>
                      <AdminField label="Pengalaman">
                        <input
                          className={adminInputClass}
                          value={level.years}
                          onChange={(event) => updateLevel(index, { years: event.target.value })}
                          placeholder="0-2 tahun"
                          maxLength={40}
                        />
                      </AdminField>
                      <AdminField label="Kisaran gaji">
                        <input
                          className={adminInputClass}
                          value={level.salaryRange}
                          onChange={(event) => updateLevel(index, { salaryRange: event.target.value })}
                          placeholder="Rp5-8 juta"
                          maxLength={60}
                        />
                      </AdminField>
                    </div>

                    <AdminField label="Fokus pekerjaan" className="mt-4" hint="Apa yang dikerjakan di jenjang ini.">
                      <textarea
                        className={`${adminTextareaClass} min-h-[72px]`}
                        value={level.focus}
                        onChange={(event) => updateLevel(index, { focus: event.target.value })}
                        rows={2}
                        maxLength={400}
                      />
                    </AdminField>
                  </div>
                ))}
              </div>
            </div>

            <AdminField label="Skill kunci" hint="Pisahkan dengan koma.">
              <input
                className={adminInputClass}
                value={form.skillsText}
                onChange={(event) => setForm({ ...form, skillsText: event.target.value })}
                placeholder="SQL, Excel, Tableau"
              />
            </AdminField>

            <AdminField label="Langkah praktis" hint="Satu langkah per baris.">
              <textarea
                className={`${adminTextareaClass} min-h-[112px]`}
                value={form.stepsText}
                onChange={(event) => setForm({ ...form, stepsText: event.target.value })}
                placeholder={"Kuasai SQL dan dasar statistik\nBangun 3 portofolio analisis"}
                rows={4}
                maxLength={4000}
              />
            </AdminField>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/70 bg-surface-container-low px-4 py-3">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                className={adminCheckboxClass}
              />
              <span className="text-label-bold text-on-surface">Publikasikan sekarang</span>
              <span className="ml-auto text-label-sm text-on-surface-variant">Tampil di /career-path</span>
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
