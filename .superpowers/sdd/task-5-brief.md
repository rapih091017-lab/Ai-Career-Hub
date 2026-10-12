### Task 5: Print stylesheet + tombol Simpan PDF

**Files:**
- Create: `src/app/portfolio/print.css`
- Modify: `src/app/portfolio/preview/page.tsx`
- Modify: `src/app/p/[slug]/page.tsx`
- Modify: `src/components/portfolio/sections/HeroSection.tsx` (kelas `pf-atmosphere`)
- Test: `src/__tests__/portfolio-print.test.ts`

**Interfaces:**
- Consumes: kelas `pf-section` dari `PortfolioDocument`
- Produces: `?print=1` yang memaksa `mode="static"` dan menyalakan gaya cetak

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-print.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/app/portfolio/print.css"), "utf8");

describe("print stylesheet", () => {
  it("menyembunyikan lapisan atmosfer saat print", () => {
    expect(css).toMatch(/@media print/);
    expect(css).toMatch(/\.pf-atmosphere/);
    expect(css).toContain("display: none");
  });

  it("memaksa cetak warna", () => {
    expect(css).toContain("print-color-adjust: exact");
  });

  it("menghapus shadow dan blur yang tidak tercetak", () => {
    expect(css).toMatch(/box-shadow:\s*none/);
    expect(css).toMatch(/backdrop-filter:\s*none/);
  });

  it("mencegah kartu terbelah antar halaman", () => {
    expect(css).toMatch(/break-inside:\s*avoid/);
  });

  it("mengatur ukuran dan margin halaman A4", () => {
    expect(css).toMatch(/@page/);
    expect(css).toMatch(/size:\s*A4/);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-print.test.ts`
Expected: FAIL — file tidak ada

- [ ] **Step 3: Buat `src/app/portfolio/print.css`**

```css
/* Gaya cetak portfolio. Dimuat hanya ketika ?print=1 aktif.
   Prinsip: atmosphere (grain, orb, particle) adalah dekorasi layar dan
   tidak pernah menjadi bagian dari dokumen cetak. */

@media print {
  @page {
    size: A4;
    margin: 12mm;
  }

  html,
  body {
    background: #ffffff !important;
  }

  .pf-atmosphere,
  .pf-chrome,
  [data-pf-print-hidden="true"] {
    display: none !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .pf-card,
  .pf-section > * {
    box-shadow: none !important;
    backdrop-filter: none !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  h1,
  h2,
  h3,
  h4 {
    break-after: avoid;
    page-break-after: avoid;
  }

  a {
    text-decoration: underline;
  }

  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.75em;
    word-break: break-all;
  }
}
```

- [ ] **Step 4: Tandai lapisan atmosfer**

Run:
```
rg -n 'feTurbulence|fixed inset-0|position: ?fixed' src/components/portfolio/sections/
```

Untuk setiap hasil, tambahkan kelas `pf-atmosphere` pada elemen dekoratif terluar tersebut. Contoh:

```tsx
<div className="pf-atmosphere pointer-events-none fixed inset-0 z-0 opacity-[0.03]" aria-hidden />
```

- [ ] **Step 5: Selesaikan `?print=1` di halaman publik**

Di `src/app/p/[slug]/page.tsx`:

```tsx
const printMode = searchParams?.print === "1";

if (printMode) {
  await import("../portfolio/print.css");
}
```

Sematkan `data-pf-print-hidden="true"` pada elemen chrome builder dan tombol navigasi.

- [ ] **Step 6: Tambahkan tombol Simpan PDF di preview**

```tsx
<button
  type="button"
  onClick={() => {
    const target = publishedSlug
      ? `/p/${publishedSlug}?print=1`
      : `/portfolio/preview?print=1`;
    window.open(target, "_blank", "noopener");
  }}
  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold"
>
  <span className="material-symbols-outlined text-lg" aria-hidden>picture_as_pdf</span>
  Simpan PDF
</button>
```

`publishedSlug` diambil dari status publish yang sudah ada di halaman ini.

- [ ] **Step 7: Jalankan test, typecheck, commit**

```bash
npx vitest run src/__tests__/portfolio-print.test.ts
npm test
npx tsc --noEmit
git add src/app/portfolio/print.css src/app/portfolio/preview/page.tsx "src/app/p/[slug]/page.tsx" src/components/portfolio/sections src/__tests__/portfolio-print.test.ts
git commit -m "feat(portfolio): tampilan cetak dan tombol Simpan PDF"
```

---
