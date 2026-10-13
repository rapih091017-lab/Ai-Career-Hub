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
  const keys = requestedKeys.map((k) => k.trim()).filter(Boolean);
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
  const contains = (bundle: PackageDef, other: PackageDef) => {
    const b = bundle.limits as FeatureLimits;
    const o = other.limits as FeatureLimits;
    return Object.entries(o).every(([feature, value]) => {
      const current = b[feature];
      if (current === "unlimited") return true;
      if (typeof value === "number") {
        return typeof current === "number" && current >= value;
      }
      return typeof current === "number";
    });
  };
  for (const a of picked) {
    for (const b of picked) {
      if (a.id === b.id) continue;
      if (contains(a, b) && a.periodDays > b.periodDays) {
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
 * oleh `bundle_hemat`, tawarkan bundle itu karena lebih murah daripada
 * membeli sisanya satu per satu.
 */
export function suggestBundle(
  selectedKeys: string[],
  catalog: Record<string, PackageDef>,
  bundleKey = "bundle_hemat",
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