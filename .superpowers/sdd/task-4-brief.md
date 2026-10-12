### Task 4: Layer B semantik + DOM-fingerprint pasangan

**Files:**
- Modify: `src/__tests__/portfolio-theme-rules.test.ts` (blok Layer B + switch-case)
- Create: `src/__tests__/portfolio-theme-fingerprint.test.ts`

**Interfaces:**
- Consumes: `PortfolioDocument` (mode `static`, renderToStaticMarkup), `THEMES`, `THEME_IDS`.

- [ ] **Step 1: Tulis test Layer B + switch-case (gagal bila ada yang belum)**

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";

const miniData = { formData: { heroFirstName: "A", heroLastName: "B", aboutText: "x" } } as never;

function staticFor(id: string) {
  return renderToStaticMarkup(
    createElement(PortfolioDocument, { data: miniData, themeId: id as never, mode: "static" }),
  );
}

describe("Layer B: aturan semantik per tema terlihat di markup", () => {
  it("token data memegang aturan signature", () => {
    for (const id of ["card", "button", "pill", "image"] as const) {
      expect(THEMES.brutal.radii[id]).toBe("0");
    }
    expect(THEMES.glass.blur.card).not.toBe("");
    expect(THEMES.luxe.shadow.card).toBe("none");
  });

  it("markup Glass memuat backdrop blur; Brutal tanpa radius non-nol; Luxe tanpa bayangan", () => {
    const glass = staticFor("glass");
    expect(glass).toContain("backdrop-filter:blur(");
    const brutal = staticFor("brutal");
    const radii = [...brutal.matchAll(/border-radius:\s*([^;"]+)/g)].map((m) => m[1].trim());
    expect(radii.filter((r) => r !== "0" && r !== "0px" && !r.startsWith("9999"))).toEqual([]);
    const luxe = staticFor("luxe");
    const shadows = [...luxe.matchAll(/box-shadow:\s*([^;"]+)/g)].map((m) => m[1].trim());
    expect(shadows.filter((s) => s !== "none" && s !== "")).toEqual([]);
  });

  it("setiap tema punya case eksplisit di switch section (bukan default diam-diam ke glass)", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "src/components/portfolio/sections");
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), "utf8");
      for (const id of THEME_IDS) {
        expect(src, `${f} tidak menangani tema ${id}`).toMatch(new RegExp(`["']${id}["']`));
      }
    }
  });

  it("Luxe memakai serif dan berwarna (kroma > 0)", () => {
    expect(THEMES.luxe.typography.display).toMatch(/serif/i);
    // Luxe minimal punya satu warna non-netral; uji silang lengkap menutup Spec 2.5
    expect(THEMES.luxe.colors.bg).not.toBe("#FFFFFF");
  });
});
```

- [ ] **Step 2: Jalankan — perbaiki apa pun yang gagal di kode (bukan di test)**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts`
Kegagalan yang sah berarti ada section masih bawa radius/bayangan non-token (task 2/3 terlewat) atau switch-case hilang — perbaiki file section-nya. Test jangan diubah agar lolos.

- [ ] **Step 3: Tulis fingerprint test (hijau untuk 6 yang sudah beda, daftar pending untuk 6 kembar)**

`src/__tests__/portfolio-theme-fingerprint.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";

const SECTIONS = join(process.cwd(), "src/components/portfolio/sections");
const THEME_IDS = ["glass", "brutal", "luxe"] as const;

/** Kerangka = urutan struktur HTML dalam satu cabang tema; abaikan teks, warna, angka.
 *  Tiap file section memuat ketiga varian dalam satu file (switch per tema), jadi
 *  potong berkas tepat pada cabang `case "<tema>":` sebelum menyalakan fingerprint. */
function branchSlice(src: string, themeId: string): string {
  const start = src.indexOf(`case "${themeId}":`);
  if (start === -1) return "";
  const rest = src.slice(start + themeId.length + 10);
  const nextCase = rest.search(/case "|default:/);
  return nextCase === -1 ? rest : rest.slice(0, nextCase);
}
function skeleton(src: string, themeId: string): string {
  return branchSlice(src, themeId)
    .replace(/\/\/[^\n]*/g, "")
    .replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '""')
    .replace(/\s+/g, "");
}

/** Section yang kerangkanya BELUM dibedakan per tema (diisi ulang oleh Task 7). */
const PENDING_SECTIONS: string[] = []; // Task 7 memastikan tetap kosong

const files = readdirSync(SECTIONS).filter((f) => f.endsWith(".tsx"));

describe("DOM-fingerprint: kerangka berbeda antar tema", () => {
  it("tiap file section punya cabang komposisi berbeda per tema", () => {
    for (const f of files) {
      if (PENDING_SECTIONS.includes(f)) continue;
      const src = readFileSync(join(SECTIONS, f), "utf8");
      const hashes = THEME_IDS.map((t) => skeleton(src, t));
      // tiga cabang tema tidak boleh identik dalam satu file
      expect(
        new Set(hashes.filter(Boolean)).size,
        `${f}: cabang tema sama atau case tidak ditemukan`,
      ).toBeGreaterThan(1);
      expect(hashes.every(Boolean), `${f}: ada case tema yang hilang`).toBe(true);
    }
  });
});
```

Catatan wajib di laporan: fingerprint file-level adalah proksi kasar (file memuat 3 varian dalam 1 file). Bila saat penulisan test terbukti tidak diskriminatif (mis. hanya beda string warna kecil), ganti menjadi render nyata per varian via `PortfolioDocument` + ekstraksi kerangka DOM dari HTML hasil `renderToStaticMarkup` (struktur `<section>`/wrapper), dan laporkan perubahannya. Yang tidak boleh: membiarkan test yang selalu lolos.

- [ ] **Step 4: Verifikasi + commit**

```bash
npm test && npx tsc --noEmit
git add src/__tests__/portfolio-theme-rules.test.ts src/__tests__/portfolio-theme-fingerprint.test.ts
git commit -m "test(portfolio): Layer B semantik + fingerprint antar-tema"
```

---

---
