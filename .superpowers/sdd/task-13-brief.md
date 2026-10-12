### Task 13: Metadata, OG image, sitemap, robots, aset publik

**Files:**
- Modify: `src/app/p/[slug]/page.tsx` (`generateMetadata`)
- Create: `src/app/api/portfolio/og/[slug]/route.tsx`
- Modify: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Modify: `src/components/TitleUpdater.tsx`
- Test: `src/__tests__/portfolio-seo.test.ts`

**Interfaces:**
- Produces: OG image 1200x630 di `/api/portfolio/og/[slug]`, `robots.txt`, entri sitemap untuk setiap portfolio published, route aset publik tanpa login

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-seo.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("SEO portfolio", () => {
  it("robots.ts ada dan mengizinkan /p/", () => {
    expect(existsSync(join(process.cwd(), "src/app/robots.ts"))).toBe(true);
    const src = read("src/app/robots.ts");
    expect(src).toMatch(/Allow: \/p\//);
    expect(src).toMatch(/Disallow: \/portfolio\/build/);
  });

  it("sitemap menyertakan portfolio published", () => {
    const src = read("src/app/sitemap.ts");
    expect(src).toContain("portfolioPages");
    expect(src).toContain('"published"');
    expect(src).toContain("/p/");
  });

  it("generateMetadata memakai seo, keywords, canonical, dan gambar OG", () => {
    const src = read("src/app/p/[slug]/page.tsx");
    expect(src).toContain("keywords");
    expect(src).toContain("canonical");
    expect(src).toMatch(/images:\s*\[/);
    expect(src).toContain("/api/portfolio/og/");
  });

  it("TitleUpdater tidak menimpa judul di /p/", () => {
    expect(read("src/components/TitleUpdater.tsx")).toMatch(/startsWith\("\/p\/"\)/);
  });

  it("route OG image ada dengan ukuran 1200x630", () => {
    const p = "src/app/api/portfolio/og/[slug]/route.tsx";
    expect(existsSync(join(process.cwd(), p))).toBe(true);
    const src = read(p);
    expect(src).toContain("1200");
    expect(src).toContain("630");
  });

  it("route aset melayani editor sekaligus halaman publik", () => {
    const src = read("src/app/api/portfolio/assets/[id]/route.ts");
    expect(src).not.toContain("withAuth()");
    expect(src).toContain("getServerSession");
    expect(src).toContain("portfolioPages");
    expect(src).toContain("published");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-seo.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/", "/career-hub/"],
        disallow: [
          "/api/",
          "/portfolio/build",
          "/portfolio/live",
          "/portfolio/preview",
          "/dashboard",
          "/settings",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Tambahkan portfolio published ke `sitemap.ts`**

```ts
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { eq } from "drizzle-orm";

const published = await db
  .select({ slug: portfolioPages.slug, updatedAt: portfolioPages.updatedAt })
  .from(portfolioPages)
  .where(eq(portfolioPages.status, "published"));

const portfolioEntries = published.map((p) => ({
  url: `${BASE_URL}/p/${p.slug}`,
  lastModified: p.updatedAt ?? new Date(),
  changeFrequency: "monthly" as const,
  priority: 0.6,
}));
```

Gabungkan `portfolioEntries` ke array hasil, dan hapus `/portfolio/build`, `/portfolio/preview`, `/portfolio/live` dari sitemap karena `robots.ts` melarangnya.

- [ ] **Step 5: Perbarui `generateMetadata` di `/p/[slug]`**

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [row] = await db
    .select()
    .from(portfolioPages)
    .where(and(eq(portfolioPages.slug, slug), eq(portfolioPages.status, "published")))
    .limit(1);

  if (!row) return { title: "Portfolio tidak ditemukan" };

  const data = row.data as {
    formData?: { heroFirstName?: string; heroLastName?: string; heroHeadline?: string; heroBio?: string };
    seo?: { pageTitle?: string; metaDescription?: string; keywords?: string[] };
  };

  const first = data.formData?.heroFirstName ?? "";
  const last = data.formData?.heroLastName ?? "";
  const name = [first, last].filter(Boolean).join(" ") || "Portfolio";
  const title = data.seo?.pageTitle?.trim() || `${name} - ${data.formData?.heroHeadline ?? "Portfolio"}`;
  const description =
    data.seo?.metaDescription?.trim() || data.formData?.heroBio?.slice(0, 160) || "";
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    title,
    description,
    keywords: data.seo?.keywords ?? [],
    alternates: { canonical: `${base}/p/${slug}` },
    openGraph: {
      title,
      description,
      type: "profile",
      locale: "id_ID",
      images: [{ url: `${base}/api/portfolio/og/${slug}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
```

- [ ] **Step 6: Buat route OG image**

`src/app/api/portfolio/og/[slug]/route.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { THEMES } from "@/components/portfolio/themes";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const [row] = await db
    .select()
    .from(portfolioPages)
    .where(and(eq(portfolioPages.slug, slug), eq(portfolioPages.status, "published")))
    .limit(1);

  if (!row) return new Response("Not found", { status: 404 });

  const data = row.data as {
    formData?: { heroFirstName?: string; heroLastName?: string; heroHeadline?: string };
  };
  const theme = THEMES[row.theme] ?? THEMES.glass;
  const name = [data.formData?.heroFirstName, data.formData?.heroLastName]
    .filter(Boolean)
    .join(" ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: theme.colors.bg,
          color: theme.colors.text,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: theme.colors.primary,
            marginBottom: 24,
          }}
        >
          Portfolio
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>
          {name || "Portfolio"}
        </div>
        <div style={{ display: "flex", fontSize: 44, color: theme.colors.textSecondary, marginTop: 24 }}>
          {data.formData?.heroHeadline ?? ""}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            height: 8,
            width: 160,
            background: theme.colors.primary,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
```

Bila `runtime = "edge"` tidak bisa mengakses `db`, jalankan sebagai Node runtime biasa dengan `export const runtime = "nodejs"`.

- [ ] **Step 7: Kecualikan `/p/` di `TitleUpdater`**

Di `src/components/TitleUpdater.tsx`, tambahkan di awal efek:

```ts
const pathname = usePathname();
if (pathname.startsWith("/p/") || pathname.startsWith("/api/")) return;
```

- [ ] **Step 8: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/app/robots.ts src/app/sitemap.ts "src/app/p/[slug]/page.tsx" "src/app/api/portfolio/og/[slug]/route.tsx" src/components/TitleUpdater.tsx src/__tests__/portfolio-seo.test.ts
git commit -m "feat(portfolio): OG image, sitemap, robots, metadata per portfolio"
```

---
