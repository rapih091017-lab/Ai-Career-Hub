import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

const authMock = vi.fn();
const rows: { current: unknown[] } = { current: [] };
const printMock = vi.fn(async (_html: string) => new Uint8Array([37, 80, 68, 70]));

vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/db", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ limit: async () => rows.current }) }) }) },
}));
vi.mock("@/lib/pdf/chromium", () => ({ printStandaloneHtml: (html: string) => printMock(html) }));

import { CV_FONTS, CV_FONT_VARIANTS, cvFontFile, resolveCvFont } from "@/lib/cv-fonts";
import { CvPrintFormatSchema, cvRenderProps } from "@/lib/cv-print-format";
import { normalizeCvDocument } from "@/lib/cv-normalize";
import { buildCvPdfHtml } from "@/lib/pdf/cv-html";
import { POST } from "@/app/api/cv-documents/[id]/pdf/route";
import { sampleCv } from "./cv-pdf.fixture";

describe("font CV", () => {
  it("semua berkas font & lisensi ada di public/fonts/cv", () => {
    for (const f of CV_FONTS) {
      for (const v of CV_FONT_VARIANTS) expect(existsSync(join(process.cwd(), "public/fonts/cv", cvFontFile(f, v)))).toBe(true);
      expect(existsSync(join(process.cwd(), "public/fonts/cv", `${f.id}-LICENSE.txt`))).toBe(true);
    }
  });

  it("nilai font lama tersimpan dipetakan ke font CV", () => {
    expect(resolveCvFont("Arial, sans-serif").id).toBe("arimo");
    expect(resolveCvFont("'Times New Roman', serif").id).toBe("tinos");
    expect(resolveCvFont("'Calibri', 'Arial', 'Helvetica', sans-serif").id).toBe("carlito");
    expect(resolveCvFont("system-ui, 'Segoe UI', sans-serif").id).toBe("inter");
    expect(resolveCvFont("'Plus Jakarta Sans', sans-serif").id).toBe("plus-jakarta-sans");
    expect(resolveCvFont("Roboto, sans-serif").id).toBe("roboto");
  });
});

describe("HTML cetak", () => {
  it("ukuran dalam pt, font disematkan, tanpa URL jaringan", async () => {
    const { marginMm, ...props } = cvRenderProps(sampleCv, { fontFamily: "Arial, sans-serif", fontSize: 11, marginMode: "tight" });
    const html = await buildCvPdfHtml(props, marginMm);
    expect(html).toContain("@page{size:A4;margin:10mm;}");
    expect(html).toContain("font-size:11pt");
    expect(html).toContain("'CV Arimo'");
    expect(html).toContain("data:font/woff2;base64,");
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("cv-section-hover");
  });

  it("format invalid ditolak", () => {
    expect(CvPrintFormatSchema.safeParse({ customPrimaryColor: "red;background:url(x)" }).success).toBe(false);
    expect(CvPrintFormatSchema.safeParse({ fontSize: 99 }).success).toBe(false);
    const sec = (i: number, content = "x") => ({ id: `s${i}`, title: "T", content });
    expect(CvPrintFormatSchema.safeParse({ customSections: Array.from({ length: 11 }, (_, i) => sec(i)) }).success).toBe(false);
    expect(CvPrintFormatSchema.safeParse({ customSections: [sec(1, "a".repeat(5001))] }).success).toBe(false);
    expect(CvPrintFormatSchema.safeParse({ customSections: [{ ...sec(1), title: "t".repeat(101) }] }).success).toBe(false);
  });
});

function req(body: unknown) {
  return new NextRequest("http://localhost/api/cv-documents/cv1/pdf", { method: "POST", body: JSON.stringify(body) });
}
const ctx = { params: Promise.resolve({ id: "cv1" }) };

describe("POST /api/cv-documents/[id]/pdf", () => {
  beforeEach(() => {
    authMock.mockReset();
    printMock.mockClear();
    rows.current = [];
  });

  it("wajib login", async () => {
    authMock.mockResolvedValue(null);
    expect((await POST(req({}), ctx)).status).toBe(401);
  });

  it("CV milik orang lain / tidak ada → 404", async () => {
    authMock.mockResolvedValue({ user: { id: "u-404" } });
    expect((await POST(req({}), ctx)).status).toBe(404);
  });

  it("format invalid → 400", async () => {
    authMock.mockResolvedValue({ user: { id: "u-400" } });
    expect((await POST(req({ format: { marginMode: "lebar" } }), ctx)).status).toBe(400);
  });

  it("CV di DB lebih baru dari yang dilihat klien → 409", async () => {
    authMock.mockResolvedValue({ user: { id: "u-409" } });
    rows.current = [{ id: "cv1", tailoredContent: sampleCv, templateId: null, updatedAt: new Date("2026-10-31T10:00:00Z") }];
    const res = await POST(req({ expectedUpdatedAt: "2026-10-31T09:00:00Z" }), ctx);
    expect(res.status).toBe(409);
  });

  it("render kedua user yang sama saat render pertama berjalan → 429", async () => {
    authMock.mockResolvedValue({ user: { id: "u-busy" } });
    rows.current = [{ id: "cv1", tailoredContent: sampleCv, templateId: null, updatedAt: new Date() }];
    let release!: () => void;
    printMock.mockImplementationOnce(() => new Promise((r) => (release = () => r(new Uint8Array([1]))))) ;
    const first = POST(req({}), ctx);
    await vi.waitFor(() => expect(printMock).toHaveBeenCalled());
    const second = await POST(req({}), ctx);
    expect(second.status).toBe(429);
    release();
    expect((await first).status).toBe(200);
  });

  it("mencetak dari data DB tanpa kuota, lalu dibatasi rate limit", async () => {
    authMock.mockResolvedValue({ user: { id: "u-ok" } });
    rows.current = [{ id: "cv1", tailoredContent: sampleCv, templateId: "executive-serif", updatedAt: new Date() }];
    const res = await POST(req({ format: { fontFamily: "'Times New Roman', serif" } }), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    const html = printMock.mock.calls[0][0];
    expect(html).toContain(normalizeCvDocument({ tailoredContent: sampleCv }).fullName);
    expect(html).toContain("'CV Tinos'");
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await POST(req({}), ctx)).status);
    expect(statuses).toContain(429);
  });
});
