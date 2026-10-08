"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminField from "@/components/admin/AdminField";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminCardClass,
  adminInputClass,
  adminSectionTitleClass,
} from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";

interface FieldDef {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
}

/** Dikelompokkan agar mudah dipindai; sebelumnya tujuh field berderet tanpa pengelompokan. */
const GROUPS: { title: string; description: string; fields: FieldDef[] }[] = [
  {
    title: "Identitas situs",
    description: "Nama yang tampil pada judul halaman dan footer publik.",
    fields: [{ key: "site_name", label: "Nama Situs", placeholder: "AI Career Hub" }],
  },
  {
    title: "Kontak",
    description: "Dipakai halaman /contact dan tautan di footer.",
    fields: [
      {
        key: "contact_email",
        label: "Email Kontak",
        hint: "Alamat yang dihubungi pengguna.",
        placeholder: "support@aicareerhub.com",
      },
      {
        key: "contact_whatsapp",
        label: "Nomor WhatsApp (opsional)",
        hint: "Format bebas; ditampilkan sebagai tautan wa.me.",
        placeholder: "0812xxxxxxx",
      },
    ],
  },
  {
    title: "Media sosial",
    description: "Tautan yang muncul di footer publik.",
    fields: [
      { key: "social_handle", label: "Handle Media Sosial", placeholder: "@aicareerhub" },
      {
        key: "social_instagram",
        label: "Link Instagram (opsional)",
        placeholder: "https://instagram.com/...",
      },
      {
        key: "social_linkedin",
        label: "Link LinkedIn (opsional)",
        placeholder: "https://linkedin.com/company/...",
      },
    ],
  },
  {
    title: "Footer",
    description: "Baris kecil di bawah footer.",
    fields: [{ key: "footer_note", label: "Catatan Footer (opsional)" }],
  },
];

/** Admin: pengaturan situs (kontak & sosial media) tanpa deploy ulang. */
export default function AdminSettingsPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/site-settings");
      if (response.status === 401 || response.status === 403) {
        setError("Akses ditolak. Halaman ini hanya untuk admin.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("load failed");
      const data = await response.json();
      setForm(data.settings ?? {});
      setSaved(data.settings ?? {});
      setError(null);
    } catch {
      setError("Gagal memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Simpan dinonaktifkan sampai ada perubahan, supaya tidak ada penyimpanan sia-sia. */
  const dirty = useMemo(
    () => Object.keys({ ...saved, ...form }).some((key) => (form[key] ?? "") !== (saved[key] ?? "")),
    [form, saved],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: form }),
      });
      if (!response.ok) throw new Error("save failed");
      const data = await response.json();
      addToast({ type: "success", message: `${data.saved} pengaturan disimpan.` });
      setForm(data.settings ?? form);
      setSaved(data.settings ?? form);
    } catch {
      addToast({ type: "error", message: "Gagal menyimpan pengaturan." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        icon="settings"
        title="Pengaturan Situs"
        description="Data kontak dan tautan sosial yang tampil di halaman publik. Perubahan langsung aktif tanpa deploy."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={adminBtnPrimary}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {saving ? "sync" : "save"}
            </span>
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        }
      />

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
      ) : error ? (
        <p className={`${adminCardClass} text-center text-body-md text-on-surface-variant`}>{error}</p>
      ) : (
        <div className="space-y-6">
          {!dirty ? null : (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-label-bold text-amber-700">
              Ada perubahan yang belum disimpan.
            </p>
          )}

          {GROUPS.map((group) => (
            <section key={group.title} className={adminCardClass}>
              <div className="mb-5 border-b border-outline-variant/50 pb-3">
                <h2 className={adminSectionTitleClass}>{group.title}</h2>
                <p className="mt-1 text-label-sm text-on-surface-variant">{group.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {group.fields.map((field) => (
                  <AdminField
                    key={field.key}
                    label={field.label}
                    hint={field.hint}
                    className={group.fields.length === 1 ? "md:col-span-2" : undefined}
                  >
                    <input
                      className={adminInputClass}
                      value={form[field.key] ?? ""}
                      placeholder={field.placeholder}
                      maxLength={2000}
                      onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                    />
                  </AdminField>
                ))}
              </div>
            </section>
          ))}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {dirty ? (
              <button type="button" onClick={() => setForm(saved)} disabled={saving} className={adminBtnSecondary}>
                Batalkan perubahan
              </button>
            ) : null}
            <button type="button" onClick={handleSave} disabled={saving || !dirty} className={adminBtnPrimary}>
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
