### Task 14: Builder ke `/portfolio/build/[draftId]`

Menghapus split-brain: `/portfolio/live` jadi pengalihan, satu kunci cache, satu entry point.

**Files:**
- Create: `src/app/portfolio/build/[draftId]/page.tsx`
- Modify: `src/app/portfolio/build/page.tsx`
- Create: `src/app/portfolio/live/page.tsx` (menjadi redirect)
- Modify: `src/app/portfolio/page.tsx` (hapus tombol Live Builder)
- Modify: `src/components/PortfolioSpotlight.tsx`
- Test: `src/__tests__/portfolio-entry-points.test.ts`

**Interfaces:**
- Produces: `/portfolio/build` membuat draft lalu mengarahkan ke `/portfolio/build/[draftId]`; `/portfolio/live` selalu mengarahkan ke builder

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-entry-points.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("entry point builder", () => {
  it("halaman build/[draftId] ada", () => {
    expect(existsSync(join(process.cwd(), "src/app/portfolio/build/[draftId]/page.tsx"))).toBe(true);
  });

  it("live builder menjadi pengalihan, bukan editor kedua", () => {
    const src = read("src/app/portfolio/live/page.tsx");
    expect(src).toContain("router.replace");
    expect(src).not.toContain("portfolio_live_data");
  });

  it("tidak ada lagi kunci localStorage lama", () => {
    const files = [
      "src/app/portfolio/build/page.tsx",
      "src/app/portfolio/live/page.tsx",
      "src/app/portfolio/preview/page.tsx",
    ];
    for (const f of files) {
      const src = read(f);
      expect(src).not.toContain('"portfolio_draft"');
      expect(src).not.toContain('"portfolio_live_data"');
    }
  });

  it("halaman portfolio tidak lagi menawarkan tombol Live Builder", () => {
    expect(read("src/app/portfolio/page.tsx")).not.toContain("/portfolio/live");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-entry-points.test.ts`
Expected: FAIL

- [ ] **Step 3: Ubah `/portfolio/live` menjadi pengalihan**

Ganti seluruh isi `src/app/portfolio/live/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortfolioSkeleton } from "@/components/portfolio/PortfolioSkeleton";

export default function LiveRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const draftId = params.get("draftId");
    router.replace(draftId ? `/portfolio/build/${draftId}` : "/portfolio/build");
  }, [router, params]);

  return <PortfolioSkeleton message="Membuka editor portfolio" />;
}
```

Buat `src/components/portfolio/PortfolioSkeleton.tsx`:

```tsx
type Props = { message?: string };

export default function PortfolioSkeleton({ message }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin" aria-hidden>
          progress_activity
        </span>
        <span className="text-sm">{message ?? "Memuat"}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Buat `/portfolio/build/[draftId]/page.tsx`**

Pindahkan isi builder yang ada ke sini, lalu ambil `draftId` dari params dan pakai `usePortfolioDraft`:

```tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { usePortfolioDraft } from "@/lib/portfolio/usePortfolioDraft";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";

export default function BuilderPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = use(params);
  const router = useRouter();
  const draft = usePortfolioDraft(draftId);

  if (draft.loading) return <PortfolioSkeleton message="Memuat draft" />;
  if (!draft.data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-on-surface-variant">Draft tidak ditemukan.</p>
        <button
          type="button"
          onClick={() => router.replace("/portfolio/build")}
          className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"
        >
          Mulai draft baru
        </button>
      </div>
    );
  }

  return (
    <AuthGuard>
      <BuilderEditor draft={draft} />
    </AuthGuard>
  );
}
```

`BuilderEditor` adalah isi builder yang sekarang, dengan semua `localStorage` diganti oleh `draft.setData`.

- [ ] **Step 5: Ubah `/portfolio/build` menjadi halaman pembuat draft**

Halaman ini hanya membuat draft lalu mengarahkan:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";
import { portfolioDataSchema } from "@/lib/portfolio/schema";

export default function NewBuildPage() {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    (async () => {
      const res = await fetch("/api/portfolio/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: portfolioDataSchema.parse(emptyFormData()) }),
      });
      const json = await res.json();
      router.replace(`/portfolio/build/${json.draftId}`);
    })();
  }, [router]);

  return (
    <AuthGuard>
      <PortfolioSkeleton message="Menyiapkan draft baru" />
    </AuthGuard>
  );
}

function emptyFormData() {
  return {
    formData: {
      heroPhotoUrl: "", heroHeadline: "", heroSubHeadline: "",
      heroFirstName: "", heroLastName: "", heroBio: "",
      aboutText: "", aboutYearsExp: "", aboutProjectsDone: "", aboutClientsHappy: "",
      skillsMain: "", skillsTools: "", skillsLanguages: "",
      contactEmail: "", contactPhone: "", contactLinkedin: "", contactGithub: "",
    },
    projects: [], experiences: [], educations: [], certifications: [],
    organizations: [], hobbies: [], testimonials: [], extraLinks: [],
  };
}
```

Segarkan komentar di dalam blok kode di atas menjadi bahasa Indonesia biasa sebelum menyimpan file.

- [ ] **Step 6: Bersihkan navigasi**

Di `src/app/portfolio/page.tsx`, hapus tombol "Live Builder" dan arahkan CTA ke `/portfolio/build`. Ubah juga `src/components/PortfolioSpotlight.tsx`.

- [ ] **Step 7: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/app/portfolio/live/page.tsx "src/app/portfolio/build/[draftId]/page.tsx" src/app/portfolio/build/page.tsx src/app/portfolio/page.tsx src/components/PortfolioSpotlight.tsx src/components/portfolio/PortfolioSkeleton.tsx src/__tests__/portfolio-entry-points.test.ts
git commit -m "refactor(portfolio): satu builder, satu draft, satu entry point"
```

---
