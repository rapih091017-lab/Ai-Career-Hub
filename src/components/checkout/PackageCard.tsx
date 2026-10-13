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
  t,
}: {
  pkg: CatalogPackage;
  onBuy: () => void;
  busy?: boolean;
  highlighted?: boolean;
  t: (key: string) => string;
}) {
  const benefits = packageBenefits(pkg);
  const accent = highlighted ? "text-primary" : "text-secondary";

  return (
    <div
      className={`relative p-5 rounded-xl transition-all overflow-hidden ${
        highlighted
          ? "border-2 border-primary/30 bg-primary-fixed/5 group hover:border-primary/60"
          : "border border-outline-variant/30 hover:border-secondary/40 group"
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
                <span className="material-symbols-outlined text-green-600 text-[16px]">check</span>
                {benefitLabel(benefit, t)}
              </li>
            ))}
            {pkg.maxActivePortfolios > 0 && (
              <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-green-600 text-[16px]">check</span>
                {pkg.maxActivePortfolios} {t("billing.period.portfolio")}
              </li>
            )}
          </ul>
        )}

        <button
          onClick={onBuy}
          disabled={busy}
          className={`w-full py-3 font-label-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
            highlighted ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary"
          }`}
        >
          {busy ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              {t("billing.processing")}
            </>
          ) : (
            t("billing.buy-now")
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