import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/access", () => ({ getUserAccess: vi.fn() }));
const callAIMock = vi.fn();
vi.mock("@/lib/ai/adapter", () => ({
  callAI: (...a: unknown[]) => callAIMock(...a),
  MODELS: { CHAT: "chat" },
}));

import { POST as polishPOST } from "@/app/api/ai/polish/route";
import { POST as grammarPOST } from "@/app/api/ai/grammar/route";
import { aiErrorMessage } from "@/components/ai/ai-error-message";

let n = 0;
function req(url: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  // Akun berbeda per test supaya rate limit tidak saling memengaruhi.
  n += 1;
  authMock.mockResolvedValue({ user: { id: `user-${n}` } });
  callAIMock.mockReset();
});

describe("/api/ai/polish (R2)", () => {
  it("tanpa login → 401", async () => {
    authMock.mockResolvedValue(null);
    const res = await polishPOST(req("/api/ai/polish", { content: "halo dunia ini" }));
    expect(res.status).toBe(401);
    expect(callAIMock).not.toHaveBeenCalled();
  });

  it("skills bukan array → 400, bukan 500", async () => {
    const res = await polishPOST(req("/api/ai/polish", { content: "membuat website", skills: "react" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("INVALID_BODY");
  });

  it("content kosong atau terlalu panjang → 400", async () => {
    expect((await polishPOST(req("/api/ai/polish", { content: "   " }))).status).toBe(400);
    expect((await polishPOST(req("/api/ai/polish", { content: "a".repeat(5001) }))).status).toBe(400);
    expect((await polishPOST(req("/api/ai/polish", "bukan json"))).status).toBe(400);
  });

  it("skills lebih dari 50 → 400", async () => {
    const skills = Array.from({ length: 51 }, (_, i) => `s${i}`);
    expect((await polishPOST(req("/api/ai/polish", { content: "abc", skills }))).status).toBe(400);
  });

  it("format deskripsi diteruskan ke prompt; format invalid → 400", async () => {
    callAIMock.mockResolvedValue("Menyusun laporan");
    const ok = await polishPOST(req("/api/ai/polish", { content: "menyusun laporan stok", field: "deskripsi", format: "paragraph" }));
    expect(ok.status).toBe(200);
    expect(callAIMock.mock.calls[0][0].userPrompt).toContain("Format Output: paragraph");
    expect((await polishPOST(req("/api/ai/polish", { content: "menyusun laporan", format: "tabel" }))).status).toBe(400);
  });

  it("body valid memanggil AI", async () => {
    callAIMock.mockResolvedValue(" Membangun situs perusahaan ");
    const res = await polishPOST(req("/api/ai/polish", { content: "membuat website", skills: ["React"] }));
    expect(res.status).toBe(200);
    expect((await res.json()).polished).toBe("Membangun situs perusahaan");
  });

  it("rate limit per akun → 429", async () => {
    callAIMock.mockResolvedValue("ok");
    let last = 0;
    for (let i = 0; i < 11; i++) {
      last = (await polishPOST(req("/api/ai/polish", { content: "membuat website" }))).status;
    }
    expect(last).toBe(429);
  });
});

describe("/api/ai/grammar (R2)", () => {
  it("tanpa login → 401", async () => {
    authMock.mockResolvedValue(null);
    expect((await grammarPOST(req("/api/ai/grammar", { content: "teks" }))).status).toBe(401);
  });

  it("body tidak valid → 400", async () => {
    expect((await grammarPOST(req("/api/ai/grammar", { content: 123 }))).status).toBe(400);
    expect((await grammarPOST(req("/api/ai/grammar", { content: "a", language: "fr" }))).status).toBe(400);
    expect((await grammarPOST(req("/api/ai/grammar", { content: "a".repeat(10001) }))).status).toBe(400);
  });

  it("body valid memanggil AI", async () => {
    callAIMock.mockResolvedValue({ errors: [], totalErrors: 0, summary: "bersih" });
    const res = await grammarPOST(req("/api/ai/grammar", { content: "Saya bekerja" }));
    expect(res.status).toBe(200);
  });
});

describe("pesan error di klien", () => {
  const r = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  it("401 meminta login ulang", async () => {
    expect(await aiErrorMessage(r(401, { error: "AUTH_REQUIRED" }), "x")).toMatch(/Masuk lagi/);
  });
  it("400 dan 429 memakai pesan server", async () => {
    expect(await aiErrorMessage(r(400, { error: "INVALID_BODY", message: "Teks kosong." }), "x")).toBe("Teks kosong.");
    expect(await aiErrorMessage(r(429, { error: "RATE_LIMITED", message: "Tunggu 30 detik." }), "x")).toBe("Tunggu 30 detik.");
  });
  it("body bukan JSON memakai fallback", async () => {
    expect(await aiErrorMessage(new Response("oops", { status: 500 }), "Gagal")).toBe("Gagal");
  });
});
