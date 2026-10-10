### Task 4: Arahkan builder, preview, dan halaman publik ke `PortfolioDocument`

Menghapus tiga WYSIWYG break sekaligus: preview mengabaikan `sectionOrder`, `sectionColors` hanya di builder, dan `fontSize` tidak terpakai.

**Files:**
- Modify: `src/components/portfolio/PortfolioCanvas.tsx`
- Modify: `src/app/portfolio/preview/page.tsx`
- Modify: `src/app/p/[slug]/page.tsx`
- Test: `src/__tests__/portfolio-consumers.test.tsx`

**Interfaces:**
- Consumes: `PortfolioDocument` dari Task 3
- Produces: ketiga konsumen memakai `sectionOrder`, `sectionVisibility`, dan `fontSize` yang sama

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-consumers.test.tsx`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("konsumen PortfolioDocument", () => {
  it("preview memakai sectionOrder, bukan daftar hardcoded", () => {
    const src = read("src/app/portfolio/preview/page.tsx");
    expect(src).toContain("PortfolioDocument");
    expect(src).toContain("sectionOrder=");
    expect(src).toContain("sectionVisibility=");
    expect(src).not.toMatch(/from "@\/components\/portfolio\/sections\//);
  });

  it("halaman publik memakai mode static", () => {
    expect(read("src/app/p/[slug]/page.tsx")).toContain('mode="static"');
  });

  it("canvas builder memakai mode editor dan meneruskan onSectionClick", () => {
    const src = read("src/components/portfolio/PortfolioCanvas.tsx");
    expect(src).toContain('mode="editor"');
    expect(src).toContain("onSectionClick=");
  });

  it("canvas builder tidak lagi mengimpor 12 section langsung", () => {
    const src = read("src/components/portfolio/PortfolioCanvas.tsx");
    expect(src.match(/portfolio\/sections\//g)?.length ?? 0).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-consumers.test.tsx`
Expected: FAIL

- [ ] **Step 3: Ubah preview**

Di `src/app/portfolio/preview/page.tsx`, ganti daftar section hardcoded dengan:

```tsx
<PortfolioDocument
  data={data}
  themeId={themeId}
  mode="editor"
  sectionOrder={data.sectionOrder}
  sectionVisibility={data.sectionVisibility}
  fontSize={fontSize}
/>
```

Tambahkan import:

```tsx
import PortfolioDocument from "@/components/portfolio/render/PortfolioDocument";
```

Hapus import ke komponen section.

- [ ] **Step 4: Ubah halaman publik**

Di `src/app/p/[slug]/page.tsx`:

```tsx
<PortfolioDocument
  data={data}
  themeId={theme as ThemeId}
  mode="static"
  sectionOrder={data.sectionOrder}
  sectionVisibility={data.sectionVisibility}
  fontSize={row.fontSize ?? "medium"}
  sectionColors={row.sectionColors ?? null}
/>
```

Tambahkan `fontSize`, `sectionColors`, dan `themeId` ke select query, atau baca dari `row.data`.

- [ ] **Step 5: Ubah canvas builder**

Di `src/components/portfolio/PortfolioCanvas.tsx`, ganti pemanggilan 12 section di dalam `<main>` dengan:

```tsx
<PortfolioDocument
  data={data}
  themeId={themeId}
  mode="editor"
  sectionOrder={sectionOrder}
  sectionVisibility={sectionVisibility}
  fontSize={fontSize}
  sectionColors={sectionColors ?? null}
  onSectionClick={onSectionClick}
/>
```

Bila `PortfolioCanvas` sudah membungkus tiap section dengan handle drag sendiri, hapus wrapper itu supaya tidak ada dua handle.

- [ ] **Step 6: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-consumers.test.tsx`
Expected: PASS — 4 test

- [ ] **Step 7: Test penuh, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/app/portfolio/preview/page.tsx "src/app/p/[slug]/page.tsx" src/components/portfolio/PortfolioCanvas.tsx src/components/portfolio/render/PortfolioDocument.tsx src/__tests__/portfolio-consumers.test.tsx
git commit -m "refactor(portfolio): builder, preview, publik pakai satu renderer"
```

---
