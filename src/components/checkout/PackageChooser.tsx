"use client";

import { formatRupiah } from "@/lib/pricing-catalog";

export interface ChoosablePackage {
  key: string;
  name: string;
  price: number;
  periodDays: number;
  monthly: boolean;
}

/**
 * Daftar paket yang bisa dipilih. Dipakai dua kali di halaman checkout: sebagai
 * satu-satunya isian halaman saat keranjang kosong, dan sebagai "tambah paket
 * lagi" saat keranjang sudah berisi.
 */
export function PackageChooser({
  options,
  selected,
  onToggle,
  heading = "Pilih paket",
  headingId,
}: {
  options: ChoosablePackage[];
  selected: string[];
  onToggle: (key: string) => void;
  heading?: string;
  headingId?: string;
}) {
  const available = options.filter((p) => !selected.includes(p.key));

  return (
    <section className="space-y-3">
      <h2 id={headingId} className="font-label-bold text-on-surface">
        {heading}
      </h2>
      {available.length === 0 ? null : (
        <div className="grid gap-2 sm:grid-cols-2">
          {available.map((pkg) => (
            <button
              key={pkg.key}
              type="button"
              onClick={() => onToggle(pkg.key)}
              className="flex min-h-11 items-center justify-between gap-3 p-3 rounded-xl border border-outline-variant/30 text-left hover:border-primary/40"
            >
              <span>
                <span className="block text-sm font-semibold text-on-surface">{pkg.name}</span>
                <span className="block text-xs text-on-surface-variant">
                  {pkg.monthly ? "per bulan" : `${pkg.periodDays} hari`}
                </span>
              </span>
              <span className="text-sm font-bold text-primary">{formatRupiah(pkg.price)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}