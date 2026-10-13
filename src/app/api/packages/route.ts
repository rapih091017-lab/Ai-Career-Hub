import { NextResponse } from "next/server";
import { getPackagesDb } from "@/lib/access";

export const runtime = "nodejs";

/**
 * Katalog paket untuk tampilan (landing dan halaman tagihan).
 *
 * Harga yang ditagih selalu dari sumber yang sama dengan file ini: tabel
 * `packages`. Dulu landing dan billing menulis angka sendiri, sehingga
 * tampilan bisa berbeda dari yang ditagih.
 */
export async function GET() {
  const packages = await getPackagesDb();
  const list = Object.values(packages)
    
    .map((p) => ({
      key: p.id,
      name: p.name,
      price: p.price,
      periodDays: p.periodDays,
      monthly: p.monthly === true,
      maxActivePortfolios: p.maxActivePortfolios ?? 0,
    }))
    .sort((a, b) => a.price - b.price);

  return NextResponse.json({ packages: list });
}