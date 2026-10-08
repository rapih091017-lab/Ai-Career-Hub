"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/components/ui/toast";

const FIELDS: { key: string; label: string; hint?: string; placeholder?: string }[] = [
  { key: "site_name", label: "Nama Situs" },
  { key: "contact_email", label: "Email Kontak", hint: "Ditampilkan di halaman /contact dan footer.", placeholder: "support@aicareerhub.com" },
  { key: "contact_whatsapp", label: "Nomor WhatsApp (opsional)", hint: "Format bebas; ditampilkan sebagai tautan wa.me.", placeholder: "0812xxxxxxx" },
  { key: "social_handle", label: "Handle Media Sosial" },
  { key: "social_instagram", label: "Link Instagram (opsional)", placeholder: "https://instagram.com/..." },
  { key: "social_linkedin", label: "Link LinkedIn (opsional)", placeholder: "https://linkedin.com/company/..." },
  { key: "footer_note", label: "Catatan Footer (opsional)", hint: "Baris kecil di bawah footer.", placeholder: "" },
];

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

/** Admin: pengaturan situs (kontak & sosial media) tanpa deploy ulang. */
export default function AdminSettingsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
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
    } catch {
      addToast({ type: "error", message: "Gagal menyimpan pengaturan." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-margin-mobile pb-24 pt-24 md:px-gutter">
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 inline-flex items-center gap-1.5 text-label-bold text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Admin
        </button>

        <h1 className="font-headline-lg text-headline-lg text-on-background">Pengaturan Situs</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Data kontak dan tautan sosial yang tampil di halaman publik. Perubahan langsung aktif tanpa deploy.
        </p>

        {loading ? (
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
        ) : error ? (
          <p className="mt-8 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
            {error}
          </p>
        ) : (
          <section className="mt-8 space-y-4 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6">
            {FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-label-bold text-on-surface">{field.label}</span>
                <input
                  className={inputClass}
                  value={form[field.key] ?? ""}
                  placeholder={field.placeholder}
                  maxLength={2000}
                  onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                />
                {field.hint ? (
                  <span className="mt-1 block text-label-sm text-on-surface-variant">{field.hint}</span>
                ) : null}
              </label>
            ))}

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-11 rounded-xl bg-primary px-5 text-label-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
