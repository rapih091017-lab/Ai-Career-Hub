import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db: transaksi dengan hitungan baris dalam satu jam terakhir.
const state = { count: 0, oldest: null as Date | null, inserted: 0 };
const tx = {
  execute: async () => undefined,
  select: () => ({ from: () => ({ where: async () => [{ value: state.count, oldest: state.oldest }] }) }),
  insert: () => ({ values: () => ({ returning: async () => { state.inserted++; return [{ id: "log-1" }]; } }) }),
};
vi.mock("@/db", () => ({ db: { transaction: (fn: (t: typeof tx) => unknown) => fn(tx) } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/access", () => ({ getUserAccess: vi.fn() }));

import { consumeHourlyLimit } from "@/lib/api-utils";

beforeEach(() => Object.assign(state, { count: 0, oldest: null, inserted: 0 }));

describe("consumeHourlyLimit (PDF builder lintas instance)", () => {
  it("di bawah batas: lolos dan mencatat log", async () => {
    state.count = 59;
    expect(await consumeHourlyLimit("u1", "pdf_builder", 60)).toEqual({ allowed: true, logId: "log-1" });
    expect(state.inserted).toBe(1);
  });

  it("batas tercapai: ditolak tanpa mencatat, reset dari baris tertua", async () => {
    state.count = 60;
    state.oldest = new Date(Date.now() - 3000_000);
    const r = await consumeHourlyLimit("u1", "pdf_builder", 60);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.resetInSeconds).toBeGreaterThan(500);
    expect(state.inserted).toBe(0);
  });
});
