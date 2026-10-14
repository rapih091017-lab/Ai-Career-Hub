import type { PackageDef } from "@/lib/access";

export type FeatureLimits = Record<string, number | "unlimited" | false>;

export interface PackageSelection {
  /** Kunci paket, urut sesuai pilihan pengguna. */
  keys: string[];
  total: number;
  /** Nama paket digabung untuk disimpan di satu baris payment. */
  joinedType: string;
  joinedName: string;
  periodDays: number;
  maxActivePortfolios: number;
  limits: FeatureLimits;
}

/**
 * Penggabungan kuota untuk paket yang dibeli bersamaan.
 *
 * Aturannya sama dengan yang dipakai `getUserAccess` saat menggabungkan
 * pembayaran aktif: nilai tertinggi menang, `unlimited` selalu menang,
 * dan `false` kalah dari nilai apa pun. Paket gratis tidak boleh ikut
 * dibeli.
 */
export function mergeLimits(a: FeatureLimits, b: FeatureLimits): FeatureLimits {
  const out: FeatureLimits = { ...a };
  for (const [feature, incoming] of Object.entries(b)) {
    const current = out[feature];
    if (incoming === "unlimited") {
      out[feature] = "unlimited";
    } else if (current === "unlimited") {
      // tetap unlimited
    } else if (typeof incoming === "number" && typeof current === "number") {
      out[feature] = Math.max(current, incoming);
    } else if (typeof incoming === "number") {
      out[feature] = incoming;
    } else if (current === false || current === undefined) {
      out[feature] = incoming;
    }
  }
  return out;
}

/**
 * Apakah seluruh hak `child` sudah tercakup oleh `parent`.
 *
 * `false` pada `child` berarti fitur itu tidak termasuk di paket anak, jadi
 * tidak ada yang perlu dicakup dan ikut diabaikan. Kalau ikut dihitung, satu
 * paket gabungan akan selalu terbaca "tidak mencakup" paket satuan karena
 * keduanya sama-sama tidak punya fitur portfolio.
 */
export function limitsCover(parent: FeatureLimits, child: FeatureLimits): boolean {
  return Object.entries(child).every(([feature, value]) => {
    if (value === false) return true;
    const current = parent[feature];
    if (current === "unlimited") return true;
    if (typeof value === "number") {
      return typeof current === "number" && current >= value;
    }
    return typeof current === "number";
  });
}

export class PackageSelectionError extends Error {
  constructor(
    message: string,
    readonly code:
      | "EMPTY"
      | "UNKNOWN_PACKAGE"
      | "FREE_NOT_PURCHASABLE"
      | "DUPLICATE"
      | "OVERLAPPING_BUNDLE",
  ) {
    super(message);
    this.name = "PackageSelectionError";
  }
}

/**
 * Rakit satu pesanan dari beberapa paket sekaligus.
 *
 * Satu pesanan menghasilkan satu QR, bukan satu QR per paket, jadi pengguna
 * membayar sekali dan semua haknya aktif setelah pembayaran masuk.
 */
export function mergePackageSelection(
  requestedKeys: string[],
  catalog: Record<string, PackageDef>,
): PackageSelection {
  // Kunci yang bukan teks kosong diabaikan. Kiriman yang salah bentuk harus
  // berakhir sebagai 400 dengan pesan jelas, bukan 500 karena `.trim()`.
  const keys = requestedKeys
    .filter((k): k is string => typeof k === "string")
    .map((k) => k.trim())
    .filter(Boolean);
  if (keys.length === 0) throw new PackageSelectionError("Pilih minimal satu paket", "EMPTY");

  const unique = [...new Set(keys)];
  if (unique.length !== keys.length) {
    throw new PackageSelectionError("Paket yang sama dipilih lebih dari sekali", "DUPLICATE");
  }

  const picked: PackageDef[] = [];
  for (const key of unique) {
    const pkg = catalog[key];
    if (!pkg) {
      throw new PackageSelectionError(`Paket tidak dikenal: ${key}`, "UNKNOWN_PACKAGE");
    }
    if (pkg.price <= 0) {
      throw new PackageSelectionError("Paket gratis tidak perlu dibeli", "FREE_NOT_PURCHASABLE");
    }
    picked.push(pkg);
  }

  // Bundle dan paket penyusunnya tidak boleh dibeli bareng: haknya sama,
  // jadi pengguna akan membayar dua kali untuk kemampuan yang sama.
  for (const a of picked) {
    for (const b of picked) {
      if (a.id === b.id) continue;
      if (
        limitsCover(a.limits as FeatureLimits, b.limits as FeatureLimits) &&
        a.periodDays > b.periodDays
      ) {
        throw new PackageSelectionError(
          `"${a.name}" sudah mencakup "${b.name}", tidak perlu dibeli dua kali`,
          "OVERLAPPING_BUNDLE",
        );
      }
    }
  }

  let limits: FeatureLimits = {};
  for (const pkg of picked) limits = mergeLimits(limits, pkg.limits as FeatureLimits);

  return {
    keys: picked.map((p) => p.id),
    total: picked.reduce((sum, p) => sum + p.price, 0),
    joinedType: picked.map((p) => p.id).join("+"),
    joinedName: picked.map((p) => p.name).join(" + "),
    periodDays: Math.max(...picked.map((p) => p.periodDays)),
    maxActivePortfolios: Math.max(...picked.map((p) => p.maxActivePortfolios ?? 0)),
    limits,
  };
}

/**
 * Saran bundle: kalau dari paket terpilih masih ada hak yang belum terjangkau
 * oleh paket gabungan, tawarkan paket itu karena lebih murah daripada membeli
 * sisanya satu per satu.
 *
 * Kunci default adalah paket gabungan yang memang dijual sekarang. Sebelumnya
 * `bundle_hemat` yang sudah tidak aktif: karena tidak dikirim `/api/packages`,
 * sarannya tidak pernah muncul sama sekali.
 */
export function suggestBundle(
  selectedKeys: string[],
  catalog: Record<string, PackageDef>,
  bundleKey = "paket_lamaran",
): { bundleKey: string; missingCount: number; price: number; cheaper: boolean } | null {
  const bundle = catalog[bundleKey];
  if (!bundle) return null;

  let selection: PackageSelection;
  try {
    selection = mergePackageSelection(selectedKeys, catalog);
  } catch {
    return null;
  }

  const bundleLimits = bundle.limits as FeatureLimits;
  const missing = Object.entries(bundleLimits).filter(([feature, value]) => {
    const current = selection.limits[feature];
    if (value === "unlimited") return current !== "unlimited";
    if (typeof value === "number") return typeof current !== "number" || current < value;
    return false;
  });

  if (missing.length === 0) return null;

  // Perkiraan harga paket yang belum terbeli, dipakai untuk membandingkan
  // apakah bundle lebih murah daripada membeli sisanya satu per satu.
  const missingPrice = missing.reduce((sum, [feature]) => {
    const prices = Object.values(catalog)
      .map((p) => (p.limits as FeatureLimits)[feature])
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => a - b);
    return sum + (prices[0] ?? 0);
  }, 0);

  return {
    bundleKey,
    missingCount: missing.length,
    price: bundle.price,
    cheaper: bundle.price < missingPrice,
  };
}

/**
 * Terapkan paket gabungan: buang paket satuan yang haknya sudah tercakup, lalu
 * masukkan paketnya.
 *
 * Tanpa ini, menekan "pakai paket gabungan" hanya menambahkan paket di samping
 * pilihan yang ada, sehingga pengguna membayar dua kali untuk kemampuan yang
 * sama (misal tiga paket satuan Rp37.000 plus paket gabungan Rp34.000).
 */
export function applyBundle(
  selectedKeys: string[],
  bundleKey: string,
  catalog: Record<string, PackageDef>,
): string[] {
  const bundle = catalog[bundleKey];
  if (!bundle) return selectedKeys;

  const bundleLimits = bundle.limits as FeatureLimits;
  const kept = selectedKeys.filter((key) => {
    if (key === bundleKey) return false;
    const pkg = catalog[key];
    if (!pkg) return true;
    return !limitsCover(bundleLimits, pkg.limits as FeatureLimits);
  });

  return [bundleKey, ...kept];
}