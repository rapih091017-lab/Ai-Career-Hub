# Task 6 Report — Migrasi 0021: tabel `portfolio_drafts`

## What changed

- `src/db/schema/index.ts`: added `portfolioDrafts` export after `portfolioTrialUses` (uuid pk, userId FK cascade, name varchar(120) default "Portfolio saya", data jsonb notNull default {}, createdAt/updatedAt, index `portfolio_drafts_user_idx`).
- `drizzle/0021_portfolio_drafts.sql`: CREATE TABLE IF NOT EXISTS + index + FK DO-block.
- `scripts/apply-0021-portfolio-drafts.mjs`: apply script with env check, run, count verify, connection close.

## Commands & output

```
> node --env-file=.env scripts/apply-0021-portfolio-drafts.mjs
OK: drizzle/0021_portfolio_drafts.sql
0021 selesai. Baris portfolio_drafts: 0

> npx tsc --noEmit
(exit 0)

> git commit -m "feat(db): tabel portfolio_drafts"
[feature/portfolio-trust a9f8665] feat(db): tabel portfolio_drafts
 3 files changed, 60 insertions(+)
```

DB verification (separate introspection query):
- Columns: id uuid NOT NULL gen_random_uuid(), user_id uuid NOT NULL, name varchar NOT NULL 'Portfolio saya', data jsonb NOT NULL '{}', created_at/updated_at timestamp now().
- FK: `portfolio_drafts_user_id_users_id_fk`, ON DELETE CASCADE (confdeltype=c).
- Indexes: `portfolio_drafts_pkey`, `portfolio_drafts_user_idx`.

## Deviations from brief

1. **`pg` not used — `postgres` instead.** Brief said `pg` Client "already a dependency"; it is not (`package.json` only has `postgres` ^3.4.9). All 20 existing apply scripts use `postgres`. Matched repo convention.
2. **Index callback style:** brief's object-return `(t) => ({...})` does not match this repo's drizzle version; file uses array-return `(table) => [...]`. Adapted.
3. **FK constraint name:** brief used `portfolio_drafts_user_id_users_fk`; Drizzle's convention is `..._users_id_fk` (as in schema FK naming). Fixed in SQL so a future drizzle-kit generate produces no spurious diff.
4. **`.env` not present in worktree** (untracked files don't propagate); copied from main checkout for the run. It is gitignored. Script documents `--env-file=.env` per repo convention (brief's script read process.env only and would have failed without it).
5. Note: `created_at`/`updated_at` are nullable in SQL (matching brief and other tables in this repo, e.g. `users`).

## Concerns

- `updated_at` has no auto-update trigger; consumers must set it explicitly on write (Task 7's API layer presumably).
- Worktree `.env` is a copy of main checkout's — drift possible later; scripts read worktree-local `.env`.
