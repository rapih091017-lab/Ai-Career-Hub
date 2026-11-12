import { beforeEach, describe, expect, it, vi } from "vitest";

const inserts: { table: unknown; row: Record<string, unknown> }[] = [];
const refund = vi.fn(async () => {});
const callAI = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "user-1" } })) }));
vi.mock("@/lib/ai/adapter", () => ({ callAI: (...a: unknown[]) => callAI(...a), MODELS: { CHAT: "chat" } }));
vi.mock("@/lib/api-utils", () => ({
  reserveQuota: vi.fn(async () => ({ attach: vi.fn(async () => {}), refund })),
}));
vi.mock("@/db", () => {
  const select = () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) });
  const insert = (table: unknown) => ({
    values: (row: Record<string, unknown>) => {
      inserts.push({ table, row });
      return { returning: async () => [{ id: `row-${inserts.length}`, ...row }] };
    },
  });
  return { db: { select, insert } };
});

import { masterProfiles, cvDocuments } from "@/db/schema";

const RAW = "Budi Santoso\nStaf Administrasi PT Contoh 2021-2024\nMengelola arsip dan jadwal rapat direksi.";

async function create() {
  const { POST } = await import("@/app/api/cv-documents/create/route");
  const req = new Request("http://localhost/api/cv-documents/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobTitle: null, jobDescription: "", useProfile: false, rawText: RAW, source: "checker" }),
  });
  return POST(req as never);
}

describe("buat CV dari hasil cek untuk user tanpa profil", () => {
  beforeEach(() => {
    inserts.length = 0;
    refund.mockClear();
    callAI.mockReset();
  });

  it("AI gagal: tidak ada profil maupun CV yang disimpan, kuota dikembalikan", async () => {
    callAI.mockRejectedValue(new Error("AI down"));
    const res = await create();
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("CV_PARSE_FAILED");
    expect(inserts).toHaveLength(0);
    expect(refund).toHaveBeenCalled();
  });

  it("AI sukses: profil diisi dari hasil parse, lalu CV dibuat", async () => {
    callAI.mockResolvedValue({
      personal: { name: "Budi Santoso", email: "budi@example.com" },
      experience: [{ position: "Staf Administrasi", company: "PT Contoh", start_date: "2021", end_date: "2024", bullets: ["Mengelola arsip"] }],
      skills: [{ name: "Excel", level: "jago" }],
    });
    const res = await create();
    expect(res.status).toBe(201);
    const profile = inserts.find((i) => i.table === masterProfiles)!.row;
    expect(profile.userId).toBe("user-1");
    expect((profile.personalInfo as Record<string, unknown>).fullName).toBe("Budi Santoso");
    expect((profile.workHistory as Record<string, unknown>[])[0]).toMatchObject({ position: "Staf Administrasi", company: "PT Contoh" });
    // Level tidak valid dibuang, bukan diganti default.
    expect((profile.skills as Record<string, unknown>[])[0]).not.toHaveProperty("level");
    expect(inserts.some((i) => i.table === cvDocuments)).toBe(true);
  });
});
