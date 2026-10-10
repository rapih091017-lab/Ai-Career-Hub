export const PORTFOLIO_STATUS = ["draft", "published", "archived"] as const;
export type PortfolioStatus = (typeof PORTFOLIO_STATUS)[number];

export const UPGRADE_URL = "/settings/billing?plan=portfolio-web";

export type CanPublishInput = {
  maxActive: number;
  activeCount: number;
  alreadyOwns: boolean;
};

export type CanPublishResult = { ok: true } | { ok: false; code: "QUOTA_EXCEEDED" };

/**
 * Kuota dihitung dari jumlah portfolio berstatus published. Update portfolio
 * yang sudah dimiliki user tidak menambah hitungan, sehingga archive lalu
 * publish ulang tidak pernah memakai kuota.
 */
export function canPublish({
  maxActive,
  activeCount,
  alreadyOwns,
}: CanPublishInput): CanPublishResult {
  if (alreadyOwns) return { ok: true };
  if (activeCount < maxActive) return { ok: true };
  return { ok: false, code: "QUOTA_EXCEEDED" };
}

export function quotaMessage(maxActive: number, activeCount: number): string {
  return (
    `Kamu sudah punya ${activeCount} portfolio aktif dari batas ${maxActive} di paket gratis. ` +
    "Tutup salah satu atau aktifkan paket Portfolio Web untuk menambah slot."
  );
}
