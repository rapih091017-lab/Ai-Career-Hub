import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { isPrivateUrl, isPrivateHost } from "@/lib/private-url";

const pdfRouteSrc = readFileSync(join(process.cwd(), "src/app/api/export-pdf-v2/route.ts"), "utf8");

describe("URL jaringan internal diblokir", () => {
  it("menolak loopback, jaringan privat, dan link-local", () => {
    expect(isPrivateHost("localhost")).toBe(true);
    expect(isPrivateHost("127.0.0.1")).toBe(true);
    expect(isPrivateHost("10.0.0.5")).toBe(true);
    expect(isPrivateHost("192.168.1.1")).toBe(true);
    // Alamat metadata layanan cloud: target SSRF yang paling umum.
    expect(isPrivateHost("169.254.169.254")).toBe(true);
    expect(isPrivateHost("172.16.0.1")).toBe(true);
    expect(isPrivateHost("[::1]")).toBe(true);
  });

  it("meneruskan URL publik", () => {
    expect(isPrivateUrl("https://fonts.googleapis.com/css2?family=Inter")).toBe(false);
    expect(isPrivateUrl("https://aicareerhub.my.id/logo.png")).toBe(false);
    expect(isPrivateUrl("data:image/png;base64,AAAA")).toBe(false);
  });

  it("menolak skema yang tidak perlu dan URL rusak", () => {
    expect(isPrivateUrl("file:///etc/passwd")).toBe(true);
    expect(isPrivateUrl("http://169.254.169.254/latest/meta-data/")).toBe(true);
    expect(isPrivateUrl("http://metadata.google.internal/")).toBe(true);
    expect(isPrivateUrl("bukan-url")).toBe(true);
  });
});

describe("renderer PDF menyaring permintaan jaringan", () => {
  it("interception aktif dan memakai penyaring", () => {
    // Tanpa ini, HTML dari peramban bisa mengambil alamat internal server dan
    // membocorkan isinya lewat PDF.
    expect(pdfRouteSrc).toContain("setRequestInterception(true)");
    expect(pdfRouteSrc).toContain("isPrivateUrl(url)");
    expect(pdfRouteSrc).toContain("req.abort()");
  });
});

describe("endpoint debug sudah tidak ada di produksi", () => {
  it("route dan halaman pdf-test dihapus", () => {
    // Route ini menulis base64 arbitrer ke /tmp tanpa autentikasi.
    expect(existsSync(join(process.cwd(), "src/app/api/pdf-test-save"))).toBe(false);
    expect(existsSync(join(process.cwd(), "src/app/pdf-test"))).toBe(false);
  });
});