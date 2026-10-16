import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  NAV_GROUPS,
  ACCOUNT_MENU,
  LANDING_LINKS,
  allNavItems,
  isNavActive,
  type NavItem,
} from "@/lib/nav-items";
import { listContinuation, backspaceClearsListMarker } from "@/lib/list-continuation";
import {
  JOB_TYPES,
  EMPLOYMENT_TYPES,
  isJobType,
  isEmploymentType,
  isJobSort,
  deadlineStatus,
} from "@/lib/job-classification";

/** Halaman ada kalau `page.tsx` atau direktori dengan page/ ada di sana. */
function routeExists(href: string): boolean {
  const clean = href.split(/[?#]/)[0];
  if (!clean.startsWith("/")) return false;
  const target = join(process.cwd(), "src/app", clean);
  return existsSync(join(target, "page.tsx")) || existsSync(target);
}

/** Semua sumber yang bisa memuat section id milik halaman depan. */
function landingSources(): string {
  const files: string[] = [join(process.cwd(), "src/app/page.tsx")];
  const componentsDir = join(process.cwd(), "src/components");
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx$/.test(entry.name)) files.push(full);
    }
  };
  walk(componentsDir);
  return files
    .filter((f) => existsSync(f))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
}

describe("isi navigasi", () => {
  it("setiap href punya route yang benar-benar ada", () => {
    // Link mati pernah lolos: navbar menunjuk ke halaman yang tidak pernah
    // dibuat, dan tidak ada yang berubah dari kode. Sekarang setiap href dicek
    // ke filesystem, jadi halaman yang dihapus akan menggagalkan test.
    for (const item of allNavItems()) {
      expect(routeExists(item.href), `href tidak ada: ${item.href}`).toBe(true);
    }
  });

  it("prefix halaman anak juga punya route", () => {
    for (const item of allNavItems()) {
      for (const prefix of item.activePrefixes ?? []) {
        expect(routeExists(prefix), `prefix tidak ada: ${prefix}`).toBe(true);
      }
    }
  });

  it("link menuju section landing punya section-nya", () => {
    const source = landingSources();
    for (const item of LANDING_LINKS) {
      const anchor = item.href.split("#")[1];
      if (!anchor) continue;
      expect(source, `section #${anchor} tidak ada`).toContain(`id="${anchor}"`);
    }
  });

  it("tidak ada href yang terduplikasi", () => {
    const hrefs = allNavItems().map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("semua fitur utama ada di navbar", () => {
    // Diisi dari inventaris route yang ada. Fitur baru yang lupa masuk navbar
    // akan terlihat di sini.
    const expected = [
      "/dashboard",
      "/builder/new",
      "/my-resumes",
      "/surat-lamaran",
      "/checker",
      "/interview",
      "/portfolio",
      "/portfolio/build",
      "/portfolio/preview",
      "/karir",
      "/tracker",
      "/career-path",
      "/career-hub",
      "/contoh-cv",
      "/sinonim",
      "/faq",
      "/checkout",
      "/settings/billing",
      "/settings/payment-history",
      "/settings/profile",
      "/settings/security",
      "/affiliate",
    ];
    const hrefs = new Set(allNavItems().map((i) => i.href));
    for (const href of expected) {
      expect(hrefs, `fitur belum masuk navbar: ${href}`).toContain(href);
    }
  });

  it("navbar tidak menunjuk langsung ke checkout dari halaman depan", () => {
    for (const item of LANDING_LINKS) {
      expect(item.href).not.toBe("/checkout");
    }
  });

  it("grup navbar tidak kosong dan tidak terlalu besar", () => {
    for (const group of NAV_GROUPS) {
      expect(group.items.length, `grup ${group.label} kosong`).toBeGreaterThan(0);
      expect(group.items.length, `grup ${group.label} terlalu padat`).toBeLessThanOrEqual(8);
    }
  });

  it("akun disembunyikan di menu avatar, bukan di navbar", () => {
    // Navbar harus tetap lapang: profil, tagihan, dan afiliasi jarang dibuka,
    // jadi tidak perlu menempati satu grup tersendiri.
    const groupHrefs = new Set(NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href)));
    for (const item of ACCOUNT_MENU.flatMap((s) => s.items)) {
      expect(groupHrefs, `${item.href} masih di navbar`).not.toContain(item.href);
    }
    // Tapi tetap harus lengkap: semua akun ada di menu avatar.
    const accountHrefs = new Set(ACCOUNT_MENU.flatMap((s) => s.items.map((i) => i.href)));
    for (const href of [
      "/checkout",
      "/settings/billing",
      "/settings/payment-history",
      "/settings/profile",
      "/settings/security",
      "/affiliate",
    ]) {
      expect(accountHrefs, `menu akun kehilangan ${href}`).toContain(href);
    }
  });

  it("menu akun punya pemisah bagian", () => {
    const sections = ACCOUNT_MENU.map((s) => s.items.length);
    expect(sections.every((n) => n > 0)).toBe(true);
    // Tagihan diletakkan lebih dulu supaya jalur perpanjangan paket mudah
    // dijangkau, dan setelah bagian profil yang paling sering dibuka.
    expect(ACCOUNT_MENU[1].labelKey).toBe("nav.section.tagihan");
  });
});

describe("penandaan halaman aktif", () => {
  const item = (href: string, prefixes?: string[]): NavItem => ({
    labelKey: "x",
    href,
    icon: "x",
    activePrefixes: prefixes,
  });

  it("halaman persis dicocokkan", () => {
    expect(isNavActive(item("/tracker"), "/tracker")).toBe(true);
    expect(isNavActive(item("/tracker"), "/tracker/detail")).toBe(false);
  });

  it("halaman anak ikut aktif lewat prefix", () => {
    const cv = item("/my-resumes", ["/builder/", "/cv/"]);
    expect(isNavActive(cv, "/builder/abc")).toBe(true);
    expect(isNavActive(cv, "/cv/abc")).toBe(true);
    expect(isNavActive(cv, "/settings/profile")).toBe(false);
  });
});

describe("daftar otomatis di kolom deskripsi", () => {
  it("nomor berjalan ke baris berikutnya", () => {
    const result = listContinuation("1. ska");
    expect(result.insert).toBe("\n2. ");
    expect(result.caretOffset).toBe(3);
    expect(result.endsList).toBe(false);
  });

  it("baris biasa tidak diapa-apakan", () => {
    const result = listContinuation("Regular text here");
    expect(result.insert).toBe("");
    expect(result.endsList).toBe(false);
  });

  it("bullet Estimation lanjutan", () => {
    expect(listContinuation("- bullet one").insert).toBe("\n- ");
    expect(listContinuation("- ").endsList).toBe(true);
  });

  it("penanda kosong mengakhiri daftar", () => {
    expect(listContinuation("1.").endsList).toBe(true);
    expect(listContinuation("a)").endsList).toBe(true);
    expect(listContinuation("(3)").endsList).toBe(true);
  });

  it("daftar huruf berlanjut", () => {
    expect(listContinuation("a. alpha").insert).toBe("\nb. ");
  });

  it("angka dalam kurung berlanjut", () => {
    expect(listContinuation("(1) alpha").insert).toBe("\n(2) ");
  });

  it("indentasi dipertahankan", () => {
    expect(listContinuation("  1. alpha").insert).toBe("\n  2. ");
  });

  it("hanya baris terakhir yang dihitung", () => {
    expect(listContinuation("1. satu\n2. dua").insert).toBe("\n3. ");
  });

  it("backspace menghapus penanda daftar", () => {
    expect(backspaceClearsListMarker("1.")).toBe(true);
    expect(backspaceClearsListMarker("- ")).toBe(true);
    expect(backspaceClearsListMarker("1. teks")).toBe(false);
  });
});

describe("klasifikasi lowongan", () => {
  it("kategori yang dipakai admin sama dengan yang bisa difilter", () => {
    for (const type of JOB_TYPES) {
      expect(isJobType(type)).toBe(true);
    }
    expect(isJobType("fresh_graduate")).toBe(false);
    expect(isJobType("")).toBe(false);
  });

  it("tipe kerja terbatas pada tiga nilai", () => {
    expect(EMPLOYMENT_TYPES).toEqual(["full_time", "part_time", "internship"]);
    expect(isEmploymentType("full_time")).toBe(true);
    expect(isEmploymentType("contract")).toBe(false);
  });

  it("urutan tidak dikenal ditolak", () => {
    expect(isJobSort("newest")).toBe(true);
    expect(isJobSort("hacker")).toBe(false);
  });

  it("deadline kosong tidak pernah tampil sebagai ditutup", () => {
    expect(deadlineStatus(null).state).toBe("none");
  });

  it("deadline lewat ditandai sudah ditutup", () => {
    expect(deadlineStatus("2026-10-01", new Date("2026-10-15T00:00:00")).state).toBe("closed");
  });

  it("deadline hari ini belum ditutup dan ditandai mendesak", () => {
    const status = deadlineStatus("2026-10-15", new Date("2026-10-15T10:00:00"));
    expect(status.state).not.toBe("closed");
    expect(status.state).toBe("closing");
  });

  it("tiga hari terakhir ditandai mendekati tenggat", () => {
    const now = new Date("2026-10-10T00:00:00");
    expect(deadlineStatus("2026-10-12", now).state).toBe("closing");
    expect(deadlineStatus("2026-10-30", now).state).toBe("open");
  });
});