### Task 7: Migrasi 0022 - tabel `portfolio_assets`

**Files:**
- Create: `drizzle/0022_portfolio_assets.sql`
- Create: `scripts/apply-0022-portfolio-assets.mjs`
- Modify: `src/db/schema/index.ts`

**Interfaces:**
- Produces: `portfolioAssets` diekspor dari `@/db/schema`

- [ ] **Step 1: Tambah tabel ke `src/db/schema/index.ts`**

```ts
/** Aset gambar portfolio. Disimpan sebagai bytea agar draft JSON tetap kecil
 *  dan file HTML export bisa meng-inline gambar tanpa kehilangan. */
export const portfolioAssets = pgTable(
  "portfolio_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mime: varchar("mime", { length: 32 }).notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    userHashIdx: uniqueIndex("portfolio_assets_user_sha_idx").on(t.userId, t.sha256),
    userIdx: index("portfolio_assets_user_idx").on(t.userId),
  }),
);
```

Pastikan `uniqueIndex`, `integer`, dan `bytea` sudah di-import.

- [ ] **Step 2: Buat `drizzle/0022_portfolio_assets.sql`**

```sql
-- 0022_portfolio_assets.sql
-- Aset gambar portfolio pindah dari base64 di dalam JSON ke tabel sendiri.
CREATE TABLE IF NOT EXISTS "portfolio_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "mime" varchar(32) NOT NULL,
  "bytes" integer NOT NULL,
  "width" integer,
  "height" integer,
  "sha256" varchar(64) NOT NULL,
  "data" bytea NOT NULL,
  "created_at" timestamp DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_assets_user_sha_idx') THEN
    CREATE UNIQUE INDEX "portfolio_assets_user_sha_idx" ON "portfolio_assets" USING btree ("user_id","sha256");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_assets_user_idx') THEN
    CREATE INDEX "portfolio_assets_user_idx" ON "portfolio_assets" USING btree ("user_id");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_assets_user_id_users_fk'
  ) THEN
    ALTER TABLE "portfolio_assets"
      ADD CONSTRAINT "portfolio_assets_user_id_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
```

- [ ] **Step 3: Buat `scripts/apply-0022-portfolio-assets.mjs`**

Sama seperti script 0021, hanya nama file dan query verifikasi yang berbeda:

```js
const sqlPath = join(here, "..", "drizzle", "0022_portfolio_assets.sql");
```

```js
const { rows } = await client.query("SELECT count(*)::int AS n FROM portfolio_assets");
console.log("0022 selesai. Baris portfolio_assets:", rows[0].n);
```

- [ ] **Step 4: Jalankan migrasi lokal**

Run: `node scripts/apply-0022-portfolio-assets.mjs`
Expected: `0022 selesai. Baris portfolio_assets: 0`

- [ ] **Step 5: Typecheck dan commit**

```bash
npx tsc --noEmit
git add drizzle/0022_portfolio_assets.sql scripts/apply-0022-portfolio-assets.mjs src/db/schema/index.ts
git commit -m "feat(db): tabel portfolio_assets"
```

---
