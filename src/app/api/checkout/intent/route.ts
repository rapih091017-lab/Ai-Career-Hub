import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { checkoutIntents, payments } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getPackagesDb } from "@/lib/access";

export const runtime = "nodejs";

/**
 * Catat niat checkout: pengguna sudah punya paket di keranjang tapi belum bayar.
 *
 * Dipakai untuk dua hal:
 * 1. Memulihkan pilihan paket ketika pengguna kembali ke halaman checkout.
 * 2. Menyimpan keranjang yang ditinggalkan supaya bisa dipicu follow-up.
 *
 * Satu baris terbuka per user. Niat yang sudah jadi order pembayaran berubah
 * statusnya, jadi tidak pernah counted ganda sebagai "belum bayar".
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED", message: "Anda harus login" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { packageKeys, amount, action, paymentId } = body ?? {};

  const existingOpen = await db
    .select({ id: checkoutIntents.id })
    .from(checkoutIntents)
    .where(and(eq(checkoutIntents.userId, session.user.id), eq(checkoutIntents.status, "open")))
    .orderBy(desc(checkoutIntents.lastSeenAt))
    .limit(1);

  const openId = existingOpen[0]?.id ?? null;

  // Niat sudah jadi order: tandai supaya tidak lagi dihitung sebagai menggantung.
  if (action === "started" || action === "converted") {
    if (!openId) return NextResponse.json({ ok: true, skipped: true });
    const patch: { status: string; paymentId?: string; updatedAt: Date } = {
      status: action === "converted" ? "converted" : "started",
      updatedAt: new Date(),
    };
    if (typeof paymentId === "string" && paymentId) {
      const paid = await db
        .select({ id: payments.id })
        .from(payments)
        .where(and(eq(payments.id, paymentId), eq(payments.userId, session.user.id)))
        .limit(1);
      // Hanya payment milik user sendiri yang boleh disambung.
      if (paid[0]) patch.paymentId = paid[0].id;
    }
    await db.update(checkoutIntents).set(patch).where(eq(checkoutIntents.id, openId));
    return NextResponse.json({ ok: true });
  }

  const keys: string[] = Array.isArray(packageKeys)
    ? packageKeys.filter((k): k is string => typeof k === "string" && k.length > 0)
    : [];

  if (keys.length === 0) {
    // Keranjang dikosongkan: tutup niat yang masih terbuka.
    if (openId) {
      await db
        .update(checkoutIntents)
        .set({ status: "closed", packageKeys: [], amount: 0, updatedAt: new Date() })
        .where(eq(checkoutIntents.id, openId));
    }
    return NextResponse.json({ ok: true });
  }

  const catalog = await getPackagesDb();
  const total = keys.reduce((sum, key) => sum + (catalog[key]?.price ?? 0), 0);

  const values = {
    packageKeys: keys,
    amount: typeof amount === "number" && Number.isFinite(amount) && amount > 0 ? Math.round(amount) : total,
    lastSeenAt: new Date(),
    updatedAt: new Date(),
  };

  if (openId) {
    await db.update(checkoutIntents).set(values).where(eq(checkoutIntents.id, openId));
    return NextResponse.json({ ok: true, id: openId });
  }

  const [inserted] = await db
    .insert(checkoutIntents)
    .values({ userId: session.user.id, ...values })
    .returning({ id: checkoutIntents.id });

  return NextResponse.json({ ok: true, id: inserted.id });
}