"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface AdminRow {
  id: string;
  email: string;
  note: string | null;
  createdAt: string | null;
}

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

/** Admin: kelola daftar admin tambahan (tanpa perlu ubah env dan deploy). */
export default function AdminAdminsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [envEmails, setEnvEmails] = useState<string[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/admins");
      if (response.status === 401 || response.status === 403) {
        setError("Akses ditolak. Halaman ini hanya untuk admin.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("load failed");
      const data = await response.json();
      setEnvEmails(data.envEmails ?? []);
      setAdmins(data.admins ?? []);
      setError(null);
    } catch {
      setError("Gagal memuat daftar admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const value = email.trim();
    if (!value) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, note }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Gagal menambah admin.");
      addToast({ type: "success", message: `${value} sekarang admin.` });
      setEmail("");
      setNote("");
      await load();
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Gagal menambah admin." });
    } finally {
      setSaving(false);
    }
  };

  const requestRemove = (row: AdminRow) => {
    setConfirm({
      title: "Cabut akses admin?",
      message: `${row.email} tidak lagi bisa membuka panel admin.`,
      confirmLabel: "Cabut akses",
      cancelLabel: "Batal",
      variant: "danger",
      onConfirm: async () => {
        setConfirm(null);
        try {
          const response = await fetch(`/api/admin/admins?email=${encodeURIComponent(row.email)}`, {
            method: "DELETE",
          });
          const data = await response.json().catch(() => null);
          if (!response.ok) throw new Error(data?.message || "Gagal mencabut akses.");
          addToast({ type: "success", message: `Akses admin ${row.email} dicabut.` });
          await load();
        } catch (err) {
          addToast({ type: "error", message: err instanceof Error ? err.message : "Gagal mencabut akses." });
        }
      },
      onCancel: () => setConfirm(null),
    });
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

        <h1 className="font-headline-lg text-headline-lg text-on-background">Kelola Admin</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Tambah atau cabut akses admin langsung dari sini. Tidak perlu mengubah environment variable
          dan deploy ulang.
        </p>

        <section className="mt-8 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6">
          <h2 className="text-label-bold text-on-surface">Tambah admin baru</h2>
          <div className="mt-3 space-y-3">
            <input
              className={inputClass}
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={200}
            />
            <input
              className={inputClass}
              placeholder="Catatan (opsional), mis. admin konten"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={200}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !email.trim()}
                className="h-11 rounded-xl bg-primary px-5 text-label-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Tambah Admin"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-label-sm text-on-surface-variant">
            Admin baru bisa langsung login memakai akun Google dengan email tersebut.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-label-bold text-on-surface">Admin aktif</h2>

          {envEmails.length > 0 ? (
            <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low p-4">
              <p className="text-label-sm text-on-surface-variant">
                Dari environment variable (ADMIN_EMAILS), tidak dapat dihapus dari halaman ini:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {envEmails.map((value) => (
                  <span
                    key={value}
                    className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm text-on-surface"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
          ) : error ? (
            <p className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
              {error}
            </p>
          ) : admins.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-outline-variant p-8 text-center text-body-md text-on-surface-variant">
              Belum ada admin tambahan. Tambahkan lewat form di atas.
            </p>
          ) : (
            admins.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-body-md font-semibold text-on-surface">{row.email}</p>
                  <p className="truncate text-label-sm text-on-surface-variant">
                    {row.note || "Tanpa catatan"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => requestRemove(row)}
                  className="h-10 rounded-lg px-3 text-label-bold text-error transition-colors hover:bg-error-container/40"
                >
                  Cabut akses
                </button>
              </div>
            ))
          )}
        </section>

        <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
      </main>
    </div>
  );
}
