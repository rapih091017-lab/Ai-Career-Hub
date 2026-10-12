### Task 6: Migrasi 0021 - tabel `portfolio_drafts`

**Files:**
- Create: `drizzle/0021_portfolio_drafts.sql`
- Create: `scripts/apply-0021-portfolio-drafts.mjs`
- Modify: `src/db/schema/index.ts`

**Interfaces:**
- Produces: `portfolioDrafts` diekspor dari `@/db/schema`

- [ ] **Step 1: Tambah tabel ke `src/db/schema/index.ts`**

Tambahkan setelah blok `portfolioTrialUses`:

```ts
/** Draft portfolio milik user. Banyak draft per user. Data disimpan utuh
 *  sebagai JSONB dan divalidasi Zod di server sebelum ditulis. */
export const portfolioDrafts = pgTable(
  "portfolio_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull().default("Portfolio saya"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    userIdx: index("portfolio_drafts_user_idx").on(t.userId),
  }),
);
```

Pastikan `index` sudah di-import dari `drizzle-orm/pg-core`.

- [ ] **Step 2: Buat `drizzle/0021_portfolio_drafts.sql`**

```sql
-- 0021_portfolio_drafts.sql
-- Draft portfolio pindah dari localStorage ke server.
CREATE TABLE IF NOT EXISTS "portfolio_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" varchar(120) DEFAULT 'Portfolio saya' NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_drafts_user_idx') THEN
    CREATE INDEX "portfolio_drafts_user_idx" ON "portfolio_drafts" USING btree ("user_id");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_drafts_user_id_users_fk'
  ) THEN
    ALTER TABLE "portfolio_drafts"
      ADD CONSTRAINT "portfolio_drafts_user_id_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
```

- [ ] **Step 3: Buat `scripts/apply-0021-portfolio-drafts.mjs`**

```js
/**
 * Jalankan migrasi 0021 (portfolio_drafts) di luar drizzle-kit.
 * Pemakaian: node scripts/apply-0021-portfolio-drafts.mjs
 * Membaca DATABASE_URL dari environment.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(here, "..", "drizzle", "0021_portfolio_drafts.sql");
const sql = readFileSync(sqlPath, "utf8");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set.");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  const { rows } = await client.query("SELECT count(*)::int AS n FROM portfolio_drafts");
  console.log("0021 selesai. Baris portfolio_drafts:", rows[0].n);
} finally {
  await client.end();
}
```

- [ ] **Step 4: Jalankan migrasi lokal**

Run: `node scripts/apply-0021-portfolio-drafts.mjs`
Expected: `0021 selesai. Baris portfolio_drafts: 0`

- [ ] **Step 5: Typecheck dan commit**

```bash
npx tsc --noEmit
git add drizzle/0021_portfolio_drafts.sql scripts/apply-0021-portfolio-drafts.mjs src/db/schema/index.ts
git commit -m "feat(db): tabel portfolio_drafts"
```

---
