### Task 10: Migrasi 0023 + siklus publish

Memperbaiki unpublish yang saat ini `DELETE` dan route-nya memanggil `delete` tanpa import (ReferenceError).

**Files:**
- Create: `drizzle/0023_portfolio_pages_lifecycle.sql`
- Create: `scripts/apply-0023-portfolio-pages-lifecycle.mjs`
- Modify: `src/db/schema/index.ts`
- Modify: `src/app/api/portfolio/publish/route.ts`
- Modify: `src/lib/access.ts`
- Modify: `src/components/portfolio/PublishDialog.tsx`
- Test: `src/__tests__/portfolio-publish-gate.test.ts`

**Interfaces:**
- Produces:
  - `src/lib/portfolio/publish-gate.ts` dengan `PORTFOLIO_STATUS`, `canPublish()`, `quotaMessage()`, `UPGRADE_URL`
  - `maxActivePortfolios` pada definisi paket di `access.ts`
  - `GET` status + kuota, `POST` publish, `PATCH` archive, `DELETE` hapus permanen

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-publish-gate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  canPublish,
  quotaMessage,
  PORTFOLIO_STATUS,
} from "@/lib/portfolio/publish-gate";

describe("gate publish", () => {
  it("membolehkan publish pertama untuk user gratis", () => {
    expect(canPublish({ maxActive: 1, activeCount: 0, alreadyOwns: false }).ok).toBe(true);
  });

  it("memblokir publish kedua untuk user gratis", () => {
    const r = canPublish({ maxActive: 1, activeCount: 1, alreadyOwns: false });
    expect(r.ok).toBe(false);
    expect(r).toEqual({ ok: false, code: "QUOTA_EXCEEDED" });
  });

  it("tidak menghitung kuota saat user sudah memiliki portfolio itu", () => {
    expect(canPublish({ maxActive: 1, activeCount: 1, alreadyOwns: true }).ok).toBe(true);
  });

  it("menghasilkan pesan yang menyebut batas dan paket", () => {
    const msg = quotaMessage(1, 1);
    expect(msg).toContain("1");
    expect(msg).toContain("Portfolio Web");
  });

  it("mendefinisikan tiga status", () => {
    expect(PORTFOLIO_STATUS).toEqual(["draft", "published", "archived"]);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-publish-gate.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/publish-gate.ts`**

```ts
export const PORTFOLIO_STATUS = ["draft", "published", "archived"] as const;
export type PortfolioStatus = (typeof PORTFOLIO_STATUS)[number];

export const UPGRADE_URL = "/settings/billing?plan=portfolio-web";

export type CanPublishInput = {
  maxActive: number;
  activeCount: number;
  alreadyOwns: boolean;
};

export type CanPublishResult = { ok: true } | { ok: false; code: "QUOTA_EXCEEDED" };

/**
 * Kuota dihitung dari jumlah portfolio berstatus published. Update portfolio
 * yang sudah dimiliki user tidak menambah hitungan, sehingga archive lalu
 * publish ulang tidak pernah memakai kuota.
 */
export function canPublish({
  maxActive,
  activeCount,
  alreadyOwns,
}: CanPublishInput): CanPublishResult {
  if (alreadyOwns) return { ok: true };
  if (activeCount < maxActive) return { ok: true };
  return { ok: false, code: "QUOTA_EXCEEDED" };
}

export function quotaMessage(maxActive: number, activeCount: number): string {
  return (
    `Kamu sudah punya ${activeCount} portfolio aktif dari batas ${maxActive} di paket gratis. ` +
    "Tutup salah satu atau aktifkan paket Portfolio Web untuk menambah slot."
  );
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-publish-gate.test.ts`
Expected: PASS — 5 test

- [ ] **Step 5: Tambah `maxActivePortfolios` di `access.ts`**

Baca struktur tipe paket di `access.ts` lebih dulu, lalu tambahkan field `maxActivePortfolios: number` ke setiap definisi paket:

| Paket | Nilai |
|---|---|
| free | 1 |
| `portfolio_web` | 5 |
| `premium_pass_30d` | 5 |
| `bundle_hemat` | 5 |
| `business_monthly` | 5 |
| paket lain | 0 |

Tambahkan helper:

```ts
export function maxActivePortfoliosFor(access: UserAccess): number {
  return access.packageDef.maxActivePortfolios ?? 0;
}
```

Sesuaikan nama field `packageDef` dengan struktur yang benar di `access.ts`.

- [ ] **Step 6: Tambah kolom `status` ke `portfolioPages`**

```ts
export const portfolioPages = pgTable(
  "portfolio_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 60 }).notNull().unique(),
    theme: varchar("theme", { length: 50 }).notNull().default("glass"),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    statusIdx: index("portfolio_pages_status_idx").on(t.status),
  }),
);
```

- [ ] **Step 7: Buat migrasi 0023**

`drizzle/0023_portfolio_pages_lifecycle.sql`:

```sql
-- 0023_portfolio_pages_lifecycle.sql
-- Archive menggantikan hapus: slug dan data tidak hilang.
ALTER TABLE "portfolio_pages"
  ADD COLUMN IF NOT EXISTS "status" varchar(16) DEFAULT 'draft' NOT NULL;

UPDATE "portfolio_pages" SET "status" = 'published' WHERE "published_at" IS NOT NULL;
UPDATE "portfolio_pages" SET "status" = 'draft'     WHERE "published_at" IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_pages_status_idx') THEN
    CREATE INDEX "portfolio_pages_status_idx" ON "portfolio_pages" USING btree ("status");
  END IF;
END $$;

DROP TABLE IF EXISTS "portfolio_trial_uses";
```

Buat `scripts/apply-0023-portfolio-pages-lifecycle.mjs` dengan pola script 0021, verifikasi:

```js
const { rows } = await client.query(
  "SELECT status, count(*)::int AS n FROM portfolio_pages GROUP BY status ORDER BY status",
);
console.log("0023 selesai. portfolio_pages per status:", rows);
```

- [ ] **Step 8: Jalankan migrasi lokal**

Run: `node scripts/apply-0023-portfolio-pages-lifecycle.mjs`
Expected: `0023 selesai. portfolio_pages per status: []` atau daftar berisi baris yang ada

- [ ] **Step 9: Tulis ulang `src/app/api/portfolio/publish/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { getUserAccess, maxActivePortfoliosFor } from "@/lib/access";
import { publishPayloadSchema, emptySectionIds } from "@/lib/portfolio/schema";
import { canPublish, quotaMessage, UPGRADE_URL } from "@/lib/portfolio/publish-gate";

export const dynamic = "force-dynamic";

async function activeCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(portfolioPages)
    .where(
      and(eq(portfolioPages.userId, userId), eq(portfolioPages.status, "published")),
    );
  return Number(row?.n ?? 0);
}

async function baseUrl(req?: NextRequest): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) return `${req.nextUrl.protocol}//${host}`;
  }
  return "http://localhost:3000";
}

function suggestSlugs(first: string, last: string, taken: string): string[] {
  const base = `${first}-${last}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const out: string[] = [];
  let n = 1;
  while (out.length < 3 && n < 100) {
    const cand = n === 1 ? base : `${base}-${n}`;
    if (cand !== taken) out.push(cand);
    n += 1;
  }
  return out;
}

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const access = await getUserAccess(auth.userId);
  const max = maxActivePortfoliosFor(access);
  const used = await activeCount(auth.userId);

  const [row] = await db
    .select({
      slug: portfolioPages.slug,
      theme: portfolioPages.theme,
      status: portfolioPages.status,
      publishedAt: portfolioPages.publishedAt,
      updatedAt: portfolioPages.updatedAt,
    })
    .from(portfolioPages)
    .where(eq(portfolioPages.userId, auth.userId))
    .limit(1);

  return NextResponse.json({
    published: row?.status === "published",
    status: row?.status ?? null,
    slug: row?.slug ?? null,
    theme: row?.theme ?? null,
    url: row?.slug ? `${await baseUrl(request)}/p/${row.slug}` : null,
    publishedAt: row?.publishedAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    plan: {
      maxActive: max,
      used,
      remaining: Math.max(0, max - used),
      entitled: max > 0,
      upgradeUrl: UPGRADE_URL,
    },
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = publishPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_PAYLOAD",
      parsed.error.issues[0]?.message ?? "Data tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const { slug, themeId, data, fontSize, alignment } = parsed.data;

  const kosong = emptySectionIds(data);
  if (kosong.length >= 12) {
    return errorResponse(
      "PORTFOLIO_EMPTY",
      "Isi minimal satu bagian sebelum menerbitkan.",
      400,
      { emptySections: kosong },
    );
  }

  const access = await getUserAccess(auth.userId);
  const max = maxActivePortfoliosFor(access);
  if (max <= 0) {
    return errorResponse(
      "PORTFOLIO_PACKAGE_REQUIRED",
      "Paket Portfolio Web diperlukan untuk menerbitkan.",
      403,
      { upgradeUrl: UPGRADE_URL },
    );
  }

  const [existing] = await db
    .select({ id: portfolioPages.id, userId: portfolioPages.userId })
    .from(portfolioPages)
    .where(eq(portfolioPages.userId, auth.userId))
    .limit(1);

  const used = await activeCount(auth.userId);
  const gate = canPublish({ maxActive: max, activeCount: used, alreadyOwns: !!existing });
  if (!gate.ok) {
    return errorResponse("QUOTA_EXCEEDED", quotaMessage(max, used), 403, {
      upgradeUrl: UPGRADE_URL,
    });
  }

  const clash = await db
    .select({ userId: portfolioPages.userId })
    .from(portfolioPages)
    .where(eq(portfolioPages.slug, slug))
    .limit(1);

  if (clash.length && clash[0].userId !== auth.userId) {
    return errorResponse(
      "SLUG_TAKEN",
      "Slug ini sudah dipakai pengguna lain. Coba nama lain.",
      409,
      {
        suggestions: suggestSlugs(data.formData.heroFirstName, data.formData.heroLastName, slug),
      },
    );
  }

  const now = new Date();
  const payload = {
    ...data,
    fontSize,
    alignment,
    sectionOrder: data.sectionOrder ?? null,
    sectionVisibility: data.sectionVisibility ?? null,
    sectionColors: data.sectionColors ?? null,
  };

  try {
    if (existing) {
      await db
        .update(portfolioPages)
        .set({
          slug,
          theme: themeId,
          status: "published",
          data: payload,
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(portfolioPages.id, existing.id));
    } else {
      await db.insert(portfolioPages).values({
        userId: auth.userId,
        slug,
        theme: themeId,
        status: "published",
        data: payload,
        publishedAt: now,
        updatedAt: now,
      });
    }
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      return errorResponse("SLUG_TAKEN", "Slug sudah dipakai pengguna lain.", 409);
    }
    throw err;
  }

  return NextResponse.json({
    published: true,
    slug,
    theme: themeId,
    url: `${await baseUrl(request)}/p/${slug}`,
    publishedAt: now.toISOString(),
    emptySections: kosong,
  });
});

export const PATCH = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  await db
    .update(portfolioPages)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(portfolioPages.userId, auth.userId));

  return NextResponse.json({ status: "archived", slugRetained: true });
});

export const DELETE = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  await db.delete(portfolioPages).where(eq(portfolioPages.userId, auth.userId));

  return NextResponse.json({ status: null, slugReleased: true });
});
```

Pastikan `delete` di-import dari `drizzle-orm` - itulah bug yang membuat unpublish rusak hari ini.

- [ ] **Step 10: Perbaiki `PublishDialog.tsx`**

- "Tutup portfolio" memanggil `PATCH`, bukan `DELETE`.
- "Hapus permanen" memanggil `DELETE` dengan konfirmasi kedua yang menyebut konsekuensi: slug dilepas dan bisa diambil user lain.
- Ganti `trialUsed`/`trialAvailable` dengan `plan.remaining`.
- Tambahkan `quotaKnown: boolean`. Selama belum diketahui, tombol Publish nonaktif dengan teks "Memeriksa ketersediaan".
- Kirim `fontSize` dan `alignment` di payload POST.

- [ ] **Step 11: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add drizzle/0023_portfolio_pages_lifecycle.sql scripts/apply-0023-portfolio-pages-lifecycle.mjs src/db/schema/index.ts src/lib/access.ts src/lib/portfolio/publish-gate.ts src/app/api/portfolio/publish/route.ts src/components/portfolio/PublishDialog.tsx src/__tests__/portfolio-publish-gate.test.ts
git commit -m "feat(portfolio): arsip menggantikan hapus, kuota portfolio aktif"
```

---
