"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminCardClass,
  adminInputClass,
  adminSectionTitleClass,
} from "@/components/admin/ui";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface PackageItem {
  id: string;
  key: string;
  name: string;
  price: number;
  periodDays: number;
  monthly: boolean;
  badge: string | null;
  description: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

type EditValue = { price: number; name: string; active: boolean };

const formatPrice = (price: number) => "Rp " + price.toLocaleString("id-ID");

/**
 * Admin: kelola harga, nama, dan status paket.
 *
 * Sebelumnya ini berupa tab di dalam /admin dengan tabel yang sempit dan
 * input tanpa border sama sekali (sulit terlihat sebagai field). Sekarang
 * jadi halaman sendiri dengan kontrol yang lebih besar dan jelas.
 */
export default function AdminPackagesPage() {
  const { addToast } = useToast();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [editValues, setEditValues] = useState<Record<string, EditValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/packages");
      if (!response.ok) {
        setError(
          response.status === 403 ? "Akses ditolak. Hanya admin." : "Gagal memuat data paket.",
        );
        return;
      }
      const data: PackageItem[] = await response.json();
      setPackages(data);
      const next: Record<string, EditValue> = {};
      data.forEach((pkg) => {
        next[pkg.key] = { price: pkg.price, name: pkg.name, active: pkg.active };
      });
      setEditValues(next);
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    if (packages.length === 0) return null;
    const prices = packages.map((pkg) => pkg.price);
    return {
      total: packages.length,
      active: packages.filter((pkg) => pkg.active).length,
      cheapest: Math.min(...prices),
      priciest: Math.max(...prices),
    };
  }, [packages]);

  const isDirty = (pkg: PackageItem) => {
    const value = editValues[pkg.key];
    if (!value) return false;
    return value.price !== pkg.price || value.name !== pkg.name || value.active !== pkg.active;
  };

  const handleSave = async (pkg: PackageItem) => {
    const value = editValues[pkg.key];
    if (!value) return;
    setSavingId(pkg.key);
    try {
      const response = await fetch("/api/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: pkg.key,
          updates: { price: value.price, name: value.name, active: value.active },
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Gagal menyimpan.");
      }
      addToast({ type: "success", message: `Paket “${value.name}” disimpan.` });
      await load();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyimpan paket.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleSeed = () => {
    setConfirmAction({
      title: "Seed data paket?",
      message:
        "Seed data paket dari konfigurasi awal. Paket yang sudah ada tidak akan ditimpa.",
      variant: "default",
      confirmLabel: "Seed",
      onConfirm: async () => {
        setConfirmAction(null);
        setSeedLoading(true);
        try {
          const response = await fetch("/api/admin/packages?action=seed", { method: "POST" });
          const data = await response.json().catch(() => null);
          addToast({ type: "success", message: data?.message || "Seed berhasil." });
          await load();
        } catch {
          addToast({ type: "error", message: "Gagal seed data." });
        } finally {
          setSeedLoading(false);
        }
      },
      onCancel: () => setConfirmAction(null),
    });
  };

  return (
    <div>
      <AdminPageHeader
        icon="inventory_2"
        title="Paket"
        description="Ubah nama, harga, dan status paket. Perubahan langsung berlaku untuk semua user tanpa deploy ulang."
        actions={
          <button type="button" onClick={handleSeed} disabled={seedLoading} className={adminBtnSecondary}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {seedLoading ? "sync" : "database"}
            </span>
            Seed Data
          </button>
        }
      />

      {stats ? (
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={adminCardClass}>
            <p className="text-label-sm text-on-surface-variant">Total paket</p>
            <p className="mt-1 font-headline-md text-[22px] text-on-surface">{stats.total}</p>
            <p className="text-label-sm text-on-surface-variant">{stats.active} aktif</p>
          </div>
          <div className={adminCardClass}>
            <p className="text-label-sm text-on-surface-variant">Harga terendah</p>
            <p className="mt-1 font-headline-md text-[22px] text-on-surface">{formatPrice(stats.cheapest)}</p>
          </div>
          <div className={adminCardClass}>
            <p className="text-label-sm text-on-surface-variant">Harga tertinggi</p>
            <p className="mt-1 font-headline-md text-[22px] text-on-surface">{formatPrice(stats.priciest)}</p>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
      ) : error ? (
        <p className={`${adminCardClass} text-center text-body-md text-on-surface-variant`}>{error}</p>
      ) : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-soft">
            <div className="border-b border-outline-variant/50 px-5 py-4">
              <h2 className={adminSectionTitleClass}>Daftar paket</h2>
              <p className="mt-1 text-label-sm text-on-surface-variant">
                Edit langsung di baris, lalu klik Simpan pada baris tersebut.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-outline-variant/50 bg-surface-container-low">
                    {["Status", "Key", "Nama paket", "Harga", "Durasi", "Badge", "Aksi"].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-3 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => {
                    const value = editValues[pkg.key];
                    const dirty = isDirty(pkg);
                    const saving = savingId === pkg.key;

                    return (
                      <tr
                        key={pkg.id}
                        className={`border-b border-outline-variant/30 transition-colors last:border-b-0 ${
                          dirty ? "bg-amber-500/5" : "hover:bg-surface-container-low/60"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-pressed={value?.active ?? false}
                            aria-label={`${value?.active ? "Nonaktifkan" : "Aktifkan"} paket ${value?.name ?? pkg.name}`}
                            onClick={() =>
                              setEditValues((prev) => ({
                                ...prev,
                                [pkg.key]: { ...prev[pkg.key], active: !prev[pkg.key].active },
                              }))
                            }
                            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200 ${
                              value?.active
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                                : "border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                          >
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              aria-hidden="true"
                            >
                              {value?.active ? "check" : "close"}
                            </span>
                          </button>
                        </td>

                        <td className="px-4 py-3">
                          <code className="rounded bg-surface-container-high px-2 py-1 font-mono text-label-sm text-on-surface-variant">
                            {pkg.key}
                          </code>
                        </td>

                        <td className="px-4 py-3">
                          <label className="sr-only" htmlFor={`name-${pkg.key}`}>
                            Nama paket untuk {pkg.key}
                          </label>
                          <input
                            id={`name-${pkg.key}`}
                            value={value?.name ?? pkg.name}
                            onChange={(event) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [pkg.key]: { ...prev[pkg.key], name: event.target.value },
                              }))
                            }
                            className={`${adminInputClass} min-w-[180px] border-outline-variant/60 py-2`}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <label className="sr-only" htmlFor={`price-${pkg.key}`}>
                            Harga paket untuk {pkg.key}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-label-sm text-on-surface-variant">Rp</span>
                            <input
                              id={`price-${pkg.key}`}
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={1000}
                              value={value?.price ?? pkg.price}
                              onChange={(event) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  [pkg.key]: {
                                    ...prev[pkg.key],
                                    price: parseInt(event.target.value, 10) || 0,
                                  },
                                }))
                              }
                              className={`${adminInputClass} min-w-[130px] border-outline-variant/60 py-2 text-right font-semibold`}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3 text-body-md text-on-surface-variant">
                          {pkg.periodDays} hari{pkg.monthly ? " · bulanan" : ""}
                        </td>

                        <td className="px-4 py-3">
                          {pkg.badge ? (
                            <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-label-sm font-semibold text-amber-700">
                              {pkg.badge}
                            </span>
                          ) : (
                            <span className="text-body-md text-on-surface-variant/60">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSave(pkg)}
                            disabled={!dirty || saving}
                            className={`${dirty ? adminBtnPrimary : adminBtnSecondary} h-10 px-4`}
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                              {saving ? "sync" : "save"}
                            </span>
                            {saving ? "Menyimpan..." : "Simpan"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {packages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-[32px] text-on-surface-variant/60" aria-hidden="true">
                            inventory_2
                          </span>
                          <p className="text-body-md font-semibold text-on-surface">Belum ada data paket.</p>
                          <p className="text-label-sm text-on-surface-variant">
                            Klik “Seed Data” untuk mengisi dari konfigurasi awal.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="text-label-bold text-amber-800">Cara kerja</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-label-sm text-amber-700">
              <li>Baris yang belum disimpan ditandai kuning; tombol Simpan aktif hanya bila ada perubahan.</li>
              <li>Ikon status di kolom pertama untuk mengaktifkan/menonaktifkan paket.</li>
              <li>Perubahan langsung berlaku untuk semua user setelah disimpan.</li>
              <li>Seed Data hanya mengisi paket yang belum ada, tidak menimpa yang sudah diubah.</li>
            </ul>
          </section>
        </div>
      )}

      <ConfirmModal confirm={confirmAction} onClose={() => setConfirmAction(null)} />
    </div>
  );
}
