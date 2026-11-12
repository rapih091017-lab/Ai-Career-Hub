import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const inserted: Record<string, unknown>[] = [];

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(async (row: Record<string, unknown>) => { inserted.push(row); }) })),
    select: vi.fn(),
  },
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { CLIENT_EVENTS, FUNNEL_EVENTS, SERVER_ONLY_EVENTS, eventActionType, eventBodySchema, eventFromActionType } from "@/lib/events";
import { QUOTA_PERIOD } from "@/lib/api-utils";

const src = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function post(body: string, ip = "10.0.0.1", anonId = "anon-test-0001") {
  return new Request("http://localhost/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip, "x-anon-id": anonId },
    body,
  });
}

describe("event funnel tidak memengaruhi kuota", () => {
  it("actionType event selalu berawalan evt_ dan tidak sama dengan aksi kuota", () => {
    // Semua hitungan kuota (checkQuota, reserveQuota, /api/usage, fair-use,
    // checker tamu) memakai eq(actionType, <aksi>). Selama nama event tidak
    // pernah sama dengan aksi itu, baris event tidak ikut terhitung.
    const quotaActions = [...Object.keys(QUOTA_PERIOD), "checker_check_pro", "checker_check_light", "linkedin_optimizer", "pdf_builder"];
    for (const name of FUNNEL_EVENTS) {
      const action = eventActionType(name);
      expect(action.startsWith("evt_")).toBe(true);
      expect(action.length).toBeLessThanOrEqual(50); // varchar(50)
      expect(quotaActions).not.toContain(action);
      expect(eventFromActionType(action)).toBe(name);
    }
    expect(eventFromActionType("pdf_builder")).toBeNull();
  });

  it("statistik admin mengecualikan baris evt_*", () => {
    expect(src("src/app/api/admin/insights/route.ts")).toContain("notLike(usageLogs.actionType, EVENT_ACTION_LIKE)");
    expect(src("src/app/api/admin/stats/route.ts")).toContain("notLike(usageLogs.actionType, EVENT_ACTION_LIKE)");
  });

  it("purchase dicatat server saat pembayaran sukses, bukan dari browser", () => {
    for (const path of [
      "src/app/api/payments/kasera/webhook/route.ts",
      "src/app/api/payments/kasera/status/route.ts",
      "src/app/api/payments/notification/route.ts",
    ]) {
      const code = src(path);
      const line = code.split("\n").find((l) => l.includes('recordEvent({ name: "purchase"'));
      expect(line, path).toContain("oncePerResource: true");
    }
    for (const name of SERVER_ONLY_EVENTS) expect(CLIENT_EVENTS as readonly string[]).not.toContain(name);
  });
});

describe("validasi body event", () => {
  it("menerima event klien dengan properti kecil", () => {
    expect(eventBodySchema.safeParse({ name: "hero_cta_click", props: { target: "checker" } }).success).toBe(true);
    expect(eventBodySchema.safeParse({ name: "landing_view" }).success).toBe(true);
  });

  it("menolak event server, nama asing, properti besar, dan field tambahan", () => {
    expect(eventBodySchema.safeParse({ name: "purchase" }).success).toBe(false);
    expect(eventBodySchema.safeParse({ name: "signup" }).success).toBe(false);
    expect(eventBodySchema.safeParse({ name: "checker_check" }).success).toBe(false);
    expect(eventBodySchema.safeParse({ name: "landing_view", props: { target: "x".repeat(65) } }).success).toBe(false);
    expect(eventBodySchema.safeParse({ name: "landing_view", props: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 } }).success).toBe(false);
    expect(eventBodySchema.safeParse({ name: "landing_view", props: { Bad: 1 } }).success).toBe(false);
    expect(eventBodySchema.safeParse({ name: "landing_view", userId: "x" }).success).toBe(false);
  });
});

describe("POST /api/events", () => {
  beforeEach(() => {
    inserted.length = 0;
  });

  it("mencatat event ke usage_logs dengan actionType evt_ tanpa IP", async () => {
    const { POST } = await import("@/app/api/events/route");
    const res = await POST(post(JSON.stringify({ name: "hero_cta_click", props: { target: "checker" } })) as never, undefined as never);
    expect(res.status).toBe(204);
    expect(inserted).toHaveLength(1);
    expect(inserted[0].actionType).toBe("evt_hero_cta_click");
    expect(inserted[0].userId).toBeNull();
    expect(inserted[0].anonymousFingerprint).toEqual({ ip: "", cookieHash: "", anonId: "anon-test-0001", props: { target: "checker" } });
  });

  it("menolak body terlalu besar dan event tak dikenal", async () => {
    const { POST } = await import("@/app/api/events/route");
    const big = JSON.stringify({ name: "landing_view", pad: "x".repeat(2000) });
    expect((await POST(post(big, "10.0.0.2") as never, undefined as never)).status).toBe(413);
    expect((await POST(post(JSON.stringify({ name: "purchase" }), "10.0.0.2") as never, undefined as never)).status).toBe(400);
    expect((await POST(post("bukan json", "10.0.0.2") as never, undefined as never)).status).toBe(400);
    expect(inserted).toHaveLength(0);
  });

  it("membatasi laju per anon id", async () => {
    const { POST } = await import("@/app/api/events/route");
    const statuses: number[] = [];
    for (let i = 0; i < 45; i++) {
      const res = await POST(post(JSON.stringify({ name: "landing_view" }), `10.1.0.${i}`, "anon-burst-0001") as never, undefined as never);
      statuses.push(res.status);
    }
    expect(statuses.filter((s) => s === 204)).toHaveLength(40);
    expect(statuses.at(-1)).toBe(429);
  });
});
