"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  mergePackageSelection,
  suggestBundle,
  PackageSelectionError,
} from "@/lib/package-selection";
import { activePaymentProvider, checkoutDestination, type CreateOrderResponse } from "@/lib/payment-client";
import {
  readStoredCart,
  writeStoredCart,
  clearStoredCart,
  useCheckoutIntent,
  markCheckoutStarted,
} from "@/lib/checkout-cart";
import { MARKETED_PACKAGE_KEYS, formatRupiah } from "@/lib/pricing-catalog";
import { PackageChooser } from "@/components/checkout/PackageChooser";
import type { PackageDef } from "@/lib/access";

interface CatalogPackage {
  key: string;
  /** `PackageDef` memakai `id`; katalog mengirim keduanya supaya tidak ada slot kosong. */
  id?: string;
  name: string;
  price: number;
  periodDays: number;
  monthly: boolean;
  maxActivePortfolios: number;
  limits?: Record<string, number | "unlimited" | false>;
}

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<Record<string, CatalogPackage> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [cvId, setCvId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chooserRef = useRef<HTMLDivElement | null>(null);

  // Keranjang kosong: langsung arahkan mata ke pilihan paket. Dulu halaman ini
  // hanya menampilkan catatan kosong tanpa pilihan paket apa pun.
  useEffect(() => {
    if (!catalog || selected.length > 0) return;
    chooserRef.current?.scrollIntoView({ block: "start" });
    chooserRef.current?.focus({ preventScroll: true });
  }, [catalog, selected.length]);

  useEffect(() => {
    Promise.all([
      fetch("/api/packages", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      searchParams,
    ]).then(([data, sp]) => {
      const initial = sp.packages;
      const keys = typeof initial === "string" && initial.length
        ? initial.split(",").filter(Boolean)
        : typeof sp.package === "string" && sp.package
          ? [sp.package]
          : [];
      const spCvId = typeof sp.cvId === "string" ? sp.cvId : undefined;
      if (keys.length > 0) {
        setSelected(keys);
        setCvId(spCvId);
        return;
      }
      // Datang tanpa paket di URL: pakai keranjang yang disimpan supaya tidak
      // memintanya memilih ulang.
      const stored = readStoredCart();
      if (stored) {
        setSelected(stored.keys);
        if (stored.cvId) setCvId(stored.cvId);
      }
      if (data?.packages) {
        const map: Record<string, CatalogPackage> = {};
        // `id` diturunkan dari `key` di sisi klien supaya `PackageDef` yang
        // dipakai `mergePackageSelection` selalu punya identitas. Kalau `id`
        // kosong, kunci paket terkirim ke server sebagai `null` dan order gagal.
        for (const p of data.packages) map[p.key] = { ...p, id: p.id ?? p.key };
        setCatalog(map);
      }
    });
  }, [searchParams]);

  // Simpan keranjang setiap kali isinya berubah.
  useEffect(() => {
    if (!catalog || selected.length === 0) return;
    writeStoredCart({ keys: selected, cvId });
  }, [selected, cvId, catalog]);

  const selection = useMemo(() => {
    if (!catalog || selected.length === 0) return null;
    try {
      return mergePackageSelection(selected, catalog as unknown as Record<string, PackageDef>);
    } catch {
      return null;
    }
  }, [catalog, selected]);

  // Niat checkout: dicatat saat ada isi keranjang, ditutup saat dikosongkan.
  useCheckoutIntent(selected, selection?.total, cvId, !!catalog);

  const bundleAdvice = useMemo(() => {
    if (!catalog || selected.length === 0) return null;
    try {
      return suggestBundle(selected, catalog as unknown as Record<string, PackageDef>);
    } catch {
      return null;
    }
  }, [catalog, selected]);

  const options = useMemo(() => {
    if (!catalog) return [];
    return MARKETED_PACKAGE_KEYS.map((key) => catalog[key]).filter(Boolean);
  }, [catalog]);

  const toggle = (key: string) => {
    setError(null);
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const pay = async () => {
    if (!selection || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const isKasera = activePaymentProvider() === "kasera";
      const res = await fetch(
        isKasera ? "/api/payments/kasera/create-order" : "/api/payments/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageTypes: selection.keys, packageType: selection.keys[0], cvDocumentId: cvId }),
        },
      );
      const raw = await res
        .json()
        .catch(() => null);
      const result: Partial<CreateOrderResponse> & { message?: string } = raw ?? {};
      if (!res.ok) {
        throw new Error(
          result.message ||
            (res.status === 401
              ? "Sesi kamu habis. Masuk ulang lalu lanjutkan."
              : `Pembayaran gagal (${res.status}). Coba lagi beberapa saat.`),
        );
      }
      if (!result.redirect_url && !result.qr_string) throw new Error("Respons pembayaran tidak lengkap");
      // Niat sudah jadi order: tandai supaya tidak lagi dihitung sebagai
      // keranjang ditinggalkan, dan bersihkan keranjang di peramban.
      markCheckoutStarted(result.paymentId);
      clearStoredCart();
      const dest = checkoutDestination(activePaymentProvider(), result as CreateOrderResponse, window.location.origin);
      window.location.href = dest.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pesanan");
      setSubmitting(false);
    }
  };

  if (!catalog) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-on-surface-variant">Memuat katalog paket…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
<div className="max-w-3xl mx-auto space-y-8">
        {selected.length === 0 ? (
          <>
            <div>
              <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">
                Pilih paket dulu
              </h1>
              <p className="text-on-surface-variant mt-1">
                Keranjangmu masih kosong. Pilih satu paket di bawah, cek lagi, baru bayar.
              </p>
            </div>
            <div ref={chooserRef} className="scroll-mt-24" tabIndex={-1}>
              <PackageChooser
                options={options}
                selected={selected}
                onToggle={toggle}
                headingId="checkout-choose-heading"
              />
            </div>
            <div className="flex justify-center">
              <Link href="/settings/billing" className="text-sm font-semibold text-primary hover:underline">
                Lihat semua paket
              </Link>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">
                Ringkasan pembelian
              </h1>
              <p className="text-on-surface-variant mt-1">
                Periksa dulu apa yang mau dibeli. Pembayaran hanya dibuat setelah kamu menekan tombol bayar.
              </p>
            </div>

        <section className="space-y-3">
          <h2 className="font-label-bold text-on-surface">Paket dipilih</h2>
          {selected.map((key) => {
            const pkg = catalog[key];
            if (!pkg) return null;
            return (
              <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
                <div>
                  <p className="font-semibold text-on-surface">{pkg.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {pkg.monthly ? "per bulan" : `${pkg.periodDays} hari`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-on-surface">{formatRupiah(pkg.price)}</span>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="text-sm text-on-surface-variant hover:text-error"
                    aria-label={`Hapus ${pkg.name}`}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}

          {selection ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <span className="font-semibold text-on-surface">Total</span>
              <span className="font-bold text-lg text-primary">{formatRupiah(selection.total)}</span>
            </div>
          ) : null}
        </section>

        {bundleAdvice ? (
          <section className="p-4 rounded-xl border border-secondary/30 bg-secondary/5">
            <p className="text-sm text-on-surface">
              <span className="font-semibold">Catatan:</span> {bundleAdvice.missingCount} hak belum
              terakup paket pilihanmu. Paket Lamaran bisa lebih murah daripada beli sisanya terpisah
              ({formatRupiah(bundleAdvice.price)}).
            </p>
            <button
              type="button"
              onClick={() => toggle(bundleAdvice.bundleKey)}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              {selected.includes(bundleAdvice.bundleKey)
                ? "Lepas Paket Lamaran"
                : `Pakai Paket Lamaran (${formatRupiah(bundleAdvice.price)})`}
            </button>
          </section>
        ) : null}

        <PackageChooser
          options={options}
          selected={selected}
          onToggle={toggle}
          heading="Tambah paket lain"
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {selection === null && selected.length > 0 ? (
          <p className="text-sm text-error">Kombinasi paket ini tidak bisa dibeli. Coba pilih satu paket saja.</p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={pay}
            disabled={!selection || submitting}
            className="inline-flex min-h-11 items-center justify-center px-6 rounded-xl bg-primary text-on-primary font-bold disabled:opacity-50"
          >
            {submitting
              ? "Menyiapkan pembayaran…"
              : selection
                ? `Bayar ${formatRupiah(selection.total)}`
                : "Pilih paket dulu"}
          </button>
          <Link
            href="/settings/billing"
            className="inline-flex min-h-11 items-center justify-center px-6 rounded-xl border border-outline-variant/40 text-on-surface hover:border-primary/40"
          >
            Batal
          </Link>
        </div>

        <p className="text-xs text-on-surface-variant">
          Satu pembayaran untuk semua paket di halaman ini. Semua hak aktif setelah pembayaran
          diterima. Butuh bantuan?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Hubungi kami
          </Link>
          .
        </p>
          </>
        )}
      </div>
    </main>
  );
}