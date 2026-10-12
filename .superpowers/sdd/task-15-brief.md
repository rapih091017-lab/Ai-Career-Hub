### Task 15: Hapus kode mati dan perbaiki copy tema yang basi

**Files:**
- Delete: `src/components/portfolio-templates/html-generators.ts`
- Delete: `src/lib/portfolioTemplates.ts`
- Modify: `src/components/portfolio-types.ts` (buang `heroBgUrl`, `heroCreativeTitle`)
- Modify: `src/components/portfolio/build/page.tsx` (atau `[draftId]/page.tsx`)
- Modify: `src/components/FeatureTabs.tsx`
- Modify: `src/components/PortfolioSpotlight.tsx`
- Test: `src/__tests__/portfolio-dead-code.test.ts`

**Interfaces:**
- Menghasilkan: tidak ada import ke berkas yang dihapus; nama tema di copy sama dengan `THEMES`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-dead-code.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const p = (f: string) => join(process.cwd(), f);

describe("kode mati dan copy basi", () => {
  it("html-generators.ts sudah dihapus", () => {
    expect(existsSync(p("src/components/portfolio-templates/html-generators.ts"))).toBe(false);
  });

  it("portfolioTemplates.ts sudah dihapus", () => {
    expect(existsSync(p("src/lib/portfolioTemplates.ts"))).toBe(false);
  });

  it("tidak ada berkas yang mengimpor portfolio-templates/html-generators", () => {
    const files = [
      "src/components/FeatureTabs.tsx",
      "src/components/PortfolioSpotlight.tsx",
      "src/app/portfolio/page.tsx",
    ];
    for (const f of files) {
      expect(read(f)).not.toContain("html-generators");
      expect(read(f)).not.toContain("PORTFOLIO_TEMPLATES");
    }
  });

  it("field mati heroBgUrl dan heroCreativeTitle sudah hilang", () => {
    const types = read("src/components/portfolio-templates/types.ts");
    expect(types).not.toContain("heroBgUrl");
    expect(types).not.toContain("heroCreativeTitle");
    expect(read("src/lib/portfolio/schema.ts")).not.toContain("heroBgUrl");
  });

  it("copy tema di landing memakai nama tema yang nyata", () => {
    for (const f of ["src/components/FeatureTabs.tsx", "src/components/PortfolioSpotlight.tsx"]) {
      const src = read(f);
      expect(src).not.toContain("Modern Slate");
      expect(src).not.toContain("Minimal Dark");
      expect(src).not.toContain("Modern Blue");
    }
  });

  it("copy portfolio memakai bahasa Indonesia, bukan hardcoded Inggris di form", () => {
    const src = read("src/components/portfolio-templates/types.ts");
    expect(src).not.toContain("Sertifikat & Penghargaan");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-dead-code.test.ts`
Expected: FAIL

- [ ] **Step 3: Hapus berkas mati**

```bash
git rm src/components/portfolio-templates/html-generators.ts src/lib/portfolioTemplates.ts
```

Jalankan `rg -n "portfolioTemplates|html-generators|PORTFOLIO_TEMPLATES|getTemplateStyle" src/` dan bersihkan semua sisa referensinya.

- [ ] **Step 4: Buang field mati**

Dari `src/components/portfolio-templates/types.ts`, hapus `heroBgUrl` dan `heroCreativeTitle` dari `PortfolioFormData`. Dari `src/lib/portfolio/schema.ts`, hapus keduanya dari `portfolioFormDataSchema` bila masih ada. Bersihkan juga input form-nya di builder.

- [ ] **Step 5: Perbaiki copy nama tema**

Di `src/components/FeatureTabs.tsx` dan `src/components/PortfolioSpotlight.tsx`, ganti tiga nama tema fiktif dengan nama yang benar:

| Lama | Baru |
|---|---|
| Modern Slate | Glassmorphism |
| Minimal Dark | Neo Brutal |
| Modern Blue | Editorial Luxe |

Deskripsi singkat yang jujur:

- Glassmorphism - "Kaca buram, Bento asimetris, dan cahaya lembut."
- Neo Brutal - "Kotak tajam, bayangan keras, tanpa garis melengkung."
- Editorial Luxe - "Serif besar, ruang kosong lega, tata letak majalah."

- [ ] **Step 6: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add -A
git commit -m "chore(portfolio): hapus 835 baris kode mati, perbaiki copy nama tema"
```

---
