import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db yang meniru advisory lock: transaksi berjalan bergantian.
const rows: { id: string }[] = [];
let lock: Promise<unknown> = Promise.resolve();
let nextId = 0;
const tick = () => new Promise((r) => setTimeout(r, 1));
const tx = {
  execute: async () => undefined,
  select: () => ({ from: () => ({ where: async () => { await tick(); return [{ value: rows.length }]; } }) }),
  insert: () => ({
    values: () => ({
      returning: async () => {
        const row = { id: `00000000-0000-4000-8000-${String(++nextId).padStart(12, "0")}` };
        rows.push(row);
        return [row];
      },
    }),
  }),
};
vi.mock("@/db", () => ({
  db: {
    transaction: (fn: (t: typeof tx) => Promise<unknown>) => {
      const run = lock.then(() => fn(tx));
      lock = run.catch(() => undefined);
      return run;
    },
    delete: () => ({ where: async () => { rows.pop(); } }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  },
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
const accessMock = vi.fn();
vi.mock("@/lib/access", () => ({ getUserAccess: (...a: unknown[]) => accessMock(...a) }));

import { reserveQuota } from "@/lib/api-utils";
import { NextResponse } from "next/server";

beforeEach(() => {
  rows.length = 0;
  accessMock.mockResolvedValue({ tierName: "Gratis", limits: { cover_letter: 1 }, isPremium: false });
});

describe("reserveQuota", () => {
  it("dua permintaan paralel dengan limit 1: satu ditolak", async () => {
    const [a, b] = await Promise.all([
      reserveQuota("u1", "cover_letter_generate"),
      reserveQuota("u1", "cover_letter_generate"),
    ]);
    const rejected = [a, b].filter((r) => r instanceof NextResponse);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as NextResponse).status).toBe(403);
    expect(rows).toHaveLength(1);
  });

  it("refund mengembalikan kuota bila pekerjaan gagal", async () => {
    const r = await reserveQuota("u1", "cover_letter_generate");
    expect(r instanceof NextResponse).toBe(false);
    expect(rows).toHaveLength(1);
    await (r as Exclude<typeof r, NextResponse>).refund();
    expect(rows).toHaveLength(0);
    const again = await reserveQuota("u1", "cover_letter_generate");
    expect(again instanceof NextResponse).toBe(false);
  });

  it("fitur tidak ada di paket ditolak tanpa mencatat", async () => {
    accessMock.mockResolvedValue({ tierName: "Gratis", limits: { cover_letter: false }, isPremium: false });
    const r = await reserveQuota("u1", "cover_letter_generate");
    expect((r as NextResponse).status).toBe(403);
    expect(rows).toHaveLength(0);
  });
});
