import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
const rows: { current: unknown[] } = { current: [] };
const setMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => rows.current }) }) }),
    update: () => ({
      set: (data: unknown) => {
        setMock(data);
        return { where: () => ({ returning: async () => [{ id: "cv1", ...(data as object) }] }) };
      },
    }),
  },
}));

import { PUT } from "@/app/api/cv-documents/[id]/route";

const ctx = { params: Promise.resolve({ id: "cv1" }) };
const put = (body: string) => PUT(new NextRequest("http://localhost/api/cv-documents/cv1", { method: "PUT", body }), ctx);

describe("PUT /api/cv-documents/[id]", () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: "u1" } });
    rows.current = [{ id: "cv1" }];
    setMock.mockClear();
  });

  it("JSON rusak → 400", async () => {
    expect((await put("{rusak")).status).toBe(400);
  });

  it("templateId di luar daftar → 400", async () => {
    expect((await put(JSON.stringify({ templateId: "hacker" }))).status).toBe(400);
  });

  it("tailoredContent bukan objek → 400", async () => {
    expect((await put(JSON.stringify({ tailoredContent: "x" }))).status).toBe(400);
  });

  it("body > 200KB → 413", async () => {
    const big = JSON.stringify({ tailoredContent: { summary: "a".repeat(210 * 1024) } });
    expect((await put(big)).status).toBe(413);
  });

  it("menyimpan layout & field tak dikenal apa adanya", async () => {
    const res = await put(JSON.stringify({ tailoredContent: { fullName: "A", layout: { fontSize: 12 }, extra: 1 }, templateId: "clean-slate" }));
    expect(res.status).toBe(200);
    const data = setMock.mock.calls[0][0];
    expect(data.tailoredContent).toEqual({ fullName: "A", layout: { fontSize: 12 }, extra: 1 });
    expect(data.templateId).toBe("clean-slate");
  });

  it("CV bukan milik user → 404", async () => {
    rows.current = [];
    expect((await put(JSON.stringify({ templateId: "clean-slate" }))).status).toBe(404);
  });

  it("expectedUpdatedAt lebih lama dari DB → 409; sama → 200; tanpa field → 200", async () => {
    rows.current = [{ id: "cv1", updatedAt: new Date("2026-11-01T10:00:00.000Z") }];
    expect((await put(JSON.stringify({ templateId: "clean-slate", expectedUpdatedAt: "2026-11-01T09:00:00.000Z" }))).status).toBe(409);
    expect((await put(JSON.stringify({ templateId: "clean-slate", expectedUpdatedAt: "2026-11-01T10:00:00.000Z" }))).status).toBe(200);
    expect((await put(JSON.stringify({ templateId: "clean-slate" }))).status).toBe(200);
  });
});
