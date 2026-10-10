export const MAX_ASSET_BYTES = 4 * 1024 * 1024;

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export function isAllowedMime(mime: string): boolean {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

/** Dimensi maksimum agar file export tidak terlalu berat. */
export const BUDGET_PX = 2200;

export function fitsDimensionBudget(width: number, height: number): boolean {
  return Math.max(width, height) <= BUDGET_PX;
}

export function dimensionWarning(width: number, height: number): string {
  return `Gambar ${width}x${height} px melebihi ${BUDGET_PX} px. Berkas export akan berat, pertimbangkan gambar yang lebih kecil.`;
}

export function assetUrl(id: string): string {
  return `/api/portfolio/assets/${id}`;
}

/** Deteksi dimensi PNG/GIF/JPEG dari header byte tanpa library gambar. */
export function readImageSize(
  buf: Buffer,
  mime: string,
): { width: number; height: number } | null {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf as unknown as Uint8Array);
  if (mime === "image/png" && b.length >= 24 && b.readUInt32BE(12) === 0x49484452) {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (mime === "image/gif" && b.length > 10) {
    return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  }
  if (mime === "image/jpeg") {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}
