"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  mergePackageSelection,
  suggestBundle,
  applyBundle,
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
import { MARKETED_PACKAGE_KEYS, formatRupiah, packageGroup } from "@/lib/pricing-catalog";
import { PackageCard } from "@/components/checkout/PackageCard";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "@/lib/i18n";
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
  const { t } = useTranslation();
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

/**
   * Hasil penggabungan pilihan paket.
   *
   * Kalau Throw, errornya ikut dibawa supaya keranjang bisa menyebut paket mana
   * yang bermasalah, bukan hanya "kombinasi ini tidak bisa dibeli". Tidak ada
   * setState di sini: state di dalam useMemo bisa membuat render berulang.
   */
  const selectionResult = useMemo(() => {
    if (!catalog || selected.length === 0) {
      return { selection: null, error: null } as const;
    }
    try {
      return {
        selection: mergePackageSelection(selected, catalog as unknown as Record<string, PackageDef>),
        error: null,
      } as const;
    } catch (err) {
      return {
        selection: null,
        error: err instanceof PackageSelectionError ? err.message : "Kombinasi paket ini tidak bisa dibeli.",
      } as const;
    }
  }, [catalog, selected]);

  const selection = selectionResult.selection;
  const selectionError = selectionResult.error;

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

  /**
   * Total kalau paket yang dipilih dibeli satuan-satu, bukan sebagai paket
   * gabungan. Dipakai untuk menghitung penghematan yang sebenarnya.
   */
  const separateTotal = useMemo(() => {
    if (!catalog || selected.length === 0) return 0;
    // Satu paket digabung = hasil satu lamaran; bandingkan dengan tiga
    // paket satuan pembentuknya.
    const bundle = selection;
    if (bundle && selected.includes("paket_lamaran")) {
      const parts = ["bikin_cv", "cek_cv", "surat_lamaran"]
        .map((key) => catalog[key]?.price ?? 0)
        .reduce((sum, price) => sum + price, 0);
      return parts;
    }
    return selected.reduce((sum, key) => sum + (catalog[key]?.price ?? 0), 0);
  }, [catalog, selected, selection]);

const toggle = (key: string) => {
    setError(null);
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  /**
   * Paket gabungan menggantikan paket satuan yang haknya sudah tercakup.
   * Dulu hanya ditambahkan, jadi pengguna membayar dua kali (Rp37.000 +
   * Rp34.000) untuk hak yang sama.
   */
  const useBundle = () => {
    if (!bundleAdvice || !catalog) return;
    setError(null);
    setSelected(
      applyBundle(selected, bundleAdvice.bundleKey, catalog as unknown as Record<string, PackageDef>),
    );
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
      if (res.status === 401) {
        // Bayar butuh sesi. Kembalikan ke login sambil membawa tujuan supaya
        // pilihan paket tidak hilang.
        window.location.href = `/login?next=${encodeURIComponent(
          `/checkout?packages=${selected.join(",")}`,
        )}`;
        return;
      }
      if (!res.ok) {
        throw new Error(
          result.message ||
            (res.status === 401
              ? "Masuk dulu supaya pembayaran bisa diproses. Pilihan paketmu sudah tersimpan."
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
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />
        <main className="pt-24 flex items-center justify-center">
          <p className="text-on-surface-variant">Memuat katalog paket…</p>
        </main>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader />
      <main className="pt-24 pb-32 px-margin-mobile md:px-gutter">
        <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">Checkout</h1>
          <p className="text-on-surface-variant mt-1 max-w-2xl">
            Pilih paket di kiri, lihat di keranjang kanan. Tetap di halaman ini sampai kamu menekan
            tombol bayar.
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Katalog: pilih paket tanpa pindah halaman */}
          <div ref={chooserRef} tabIndex={-1} className="scroll-mt-24 space-y-8 outline-none">
            {(["single", "monthly"] as const).map((group) => {
              const inGroup = options.filter((pkg) => packageGroup(pkg) === group);
              if (inGroup.length === 0) return null;
              return (
                <section key={group} className="space-y-4">
                  <div>
                    <h2 className="font-headline-lg text-lg font-bold text-on-surface">
                      {t(group === "monthly" ? "billing.group.monthly" : "billing.group.single")}
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      {t(group === "monthly" ? "billing.group.monthly-hint" : "billing.group.single-hint")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inGroup.map((pkg) => (
                      <PackageCard
                        key={pkg.key}
                        pkg={pkg}
                        t={t}
                        highlighted={pkg.monthly}
                        selected={selected.includes(pkg.key)}
                        onBuy={() => toggle(pkg.key)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Keranjang: ringkasan singkat yang selalu terlihat */}
          <aside className="lg:sticky lg:top-8 rounded-[14px] border-2 border-ink bg-paper shadow-hard-sm p-5 space-y-4">
            <h2 className="font-headline-lg text-base font-bold text-on-surface">
              Keranjang
              {selected.length > 0 ? (
                <span className="ml-2 text-xs font-normal text-on-surface-variant">
                  {selected.length} paket
                </span>
              ) : null}
            </h2>

            {selected.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Belum ada paket di keranjang. Pilih dari daftar di samping.
              </p>
            ) : (
              <ul className="space-y-2">
                {selected.map((key) => {
                  const pkg = catalog[key];
                  if (!pkg) return null;
                  return (
                    <li
                      key={key}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl border border-outline-variant/50"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-on-surface">{pkg.name}</span>
                        <span className="block text-xs text-on-surface-variant">
                          {pkg.monthly ? "per bulan" : `${pkg.periodDays} hari`}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface">
                          {formatRupiah(pkg.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          aria-label={`Hapus ${pkg.name}`}
                          title={`Hapus ${pkg.name}`}
                          className="material-symbols-outlined text-lg text-on-surface-variant hover:text-error"
                        >
                          close
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

{/*
              * Penghematan dihitung dari harga katalog: kalau pengguna memilih
              * paket lengkap, jumlah yang dihemat adalah selisih nyata antara
              * paket itu dan pembelian satuan pembentuknya. Tidak ada angka
              * diskon yang diketik tangan.
              */}
            {separateTotal > (selection?.total ?? 0) && selection ? (
              <div className="rounded-xl border border-green-600/25 bg-green-600/5 px-3 py-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    {selected.length > 1
                      ? "Beli terpisah lebih mahal"
                      : "Paket ini lebih murah daripada beli terpisah"}
                  </span>
                  <span className="font-bold text-green-700">
                    −{formatRupiah(separateTotal - selection.total)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {formatRupiah(selection.total)} dari {formatRupiah(separateTotal)} kalau dibeli
                  terpisah.
                </p>
              </div>
            ) : null}

            {selection ? (
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50">
                <span className="font-semibold text-on-surface">Total</span>
                <span className="font-display text-lg font-bold text-green-deep">
                  {formatRupiah(selection.total)}
                </span>
              </div>
            ) : null}

{bundleAdvice ? (
              <div className="rounded-xl border-2 border-ink bg-lime/15 p-3">
                <p className="text-sm text-on-surface">
                  <span className="font-semibold">Catatan:</span> {bundleAdvice.missingCount} hak belum
                  terakup paket pilihanmu.{" "}
                  {catalog[bundleAdvice.bundleKey]?.name} (
                  {formatRupiah(bundleAdvice.price)}){" "}
                  {bundleAdvice.cheaper ? "lebih murah daripada sisanya." : "menambah hak yang belum kamu punya."}
                </p>
                <button
                  type="button"
                  onClick={useBundle}
                  className="mt-2 text-sm font-bold text-green-deep underline decoration-lime decoration-[3px] underline-offset-4"
                >
                  Pakai {catalog[bundleAdvice.bundleKey]?.name} ({formatRupiah(bundleAdvice.price)})
                </button>
              </div>
            ) : null}

            {error ? <p className="text-sm text-error">{error}</p> : null}
            {selection === null && selected.length > 0 ? (
              <p className="text-sm text-error">
                {selectionError ?? "Kombinasi paket ini tidak bisa dibeli. Coba pilih satu paket saja."}
              </p>
            ) : null}

            <button
              type="button"
              onClick={pay}
              disabled={!selection || submitting}
              className="w-full py-3 rounded-full border-[2.5px] border-ink bg-lime text-on-light font-bold shadow-[0_3px_0_rgb(var(--c-ink))] hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none"
            >
              {submitting
                ? "Menyiapkan pembayaran…"
                : selection
                  ? `Bayar ${formatRupiah(selection.total)}`
                  : "Pilih paket dulu"}
            </button>

<p className="text-xs text-on-surface-variant">
              Pembayaran hanya dibuat setelah kamu menekan tombol bayar. Butuh bantuan?{" "}
              <Link href="/contact" className="font-bold text-green-deep underline decoration-lime decoration-[3px] underline-offset-4">
                Hubungi kami
              </Link>
              .
            </p>

            {/* Tiga hal yang paling sering ditanyakan sebelum bayar. Semuanya
                bisa diperiksa sendiri, jadi ditulis apa adanya. */}
            <ul className="space-y-1.5 border-t border-outline-variant/50 pt-3">
              <li className="flex items-start gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-green-deep shrink-0">
                  picture_as_pdf
                </span>
                PDF-nya berbasis teks, bukan gambar, jadi bisa dibaca mesin ATS.
              </li>
              <li className="flex items-start gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-green-deep shrink-0">
                  event_available
                </span>
                Sekali bayar. Masa berlaku tertera di tiap paket, tidak ada tagihan berikutnya.
              </li>
              <li className="flex items-start gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-green-deep shrink-0">
                  delete
                </span>
                Data CV-mu bisa kamu hapus sendiri kapan saja dari halaman Pengaturan.
              </li>
            </ul>
            <Link
              href="/terms"
              className="text-xs text-ink-soft underline hover:text-green-deep"
            >
              Syarat &amp; Ketentuan
            </Link>
          </aside>
        </div>
        </div>
      </main>
    </div>
  );
}
