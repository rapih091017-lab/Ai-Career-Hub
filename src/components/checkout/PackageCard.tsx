"use client";

import { packageBenefits, benefitLabel, periodLabel, type CatalogPackage } from "@/lib/pricing-catalog";

/**
 * Satu kartu paket. Isinya dibaca dari katalog database: nama, harga, masa
 * berlaku, dan daftar hak. Tidak ada teks paket yang diketik tangan.
 */
export function PackageCard({
  pkg,
  onBuy,
  busy,
  highlighted,
  selected,
  t,
}: {
  pkg: CatalogPackage;
  onBuy: () => void;
  busy?: boolean;
  highlighted?: boolean;
  /** Tandai kartu yang isinya sudah ada di keranjang. */
  selected?: boolean;
  t: (key: string) => string;
}) {
  const benefits = packageBenefits(pkg);
  const accent = "text-green-deep";

  return (
    <div
      className={`relative p-5 rounded-[14px] transition-all overflow-hidden bg-paper shadow-hard-sm border-2 border-ink ${
        highlighted ? "shadow-hard" : ""
      }`}
    >
      {highlighted && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-10 -mt-10" />
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className={`material-symbols-outlined ${accent}`}>
            {pkg.monthly ? "workspace_premium" : "sell"}
          </span>
          <h4 className="font-label-bold text-on-surface">{pkg.name}</h4>
          {pkg.monthly && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
              {t("billing.badge-rutin")}
            </span>
          )}
        </div>

        <p className={`text-2xl font-bold mb-1 ${accent}`}>
          {formatPrice(pkg.price)}
          <span className="text-sm font-normal text-on-surface-variant ml-1">{periodLabel(pkg, t)}</span>
        </p>

        {benefits.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {benefits.map((benefit) => (
              <li key={benefit.key} className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-green-deep text-[16px]">check</span>
                {benefitLabel(benefit, t)}
              </li>
            ))}
            {pkg.maxActivePortfolios > 0 && (
              <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-green-deep text-[16px]">check</span>
                {pkg.maxActivePortfolios} {t("billing.period.portfolio")}
              </li>
            )}
          </ul>
        )}

        <button
          onClick={onBuy}
          disabled={busy}
          className={`w-full py-3 font-label-bold rounded-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
            selected
              ? "border-2 border-green-deep text-green-deep bg-primary/5"
              : highlighted
                ? "border-2 border-ink bg-lime text-on-light"
                : "bg-primary text-on-primary"
          }`}
        >
          {busy ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              {t("billing.processing")}
            </>
          ) : selected ? (
            t("checkout.in-cart")
          ) : (
            t("checkout.add-to-cart")
          )}
        </button>
      </div>
    </div>
  );
}

/** `Rp` tanpa spasi supaya tidak terlihat seperti 글asi acak di tengah nominal. */
function formatPrice(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}