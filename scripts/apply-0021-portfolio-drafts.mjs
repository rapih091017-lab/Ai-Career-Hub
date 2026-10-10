/**
 * Jalankan migrasi 0021 (portfolio_drafts) di luar drizzle-kit.
 * Pemakaian: node --env-file=.env scripts/apply-0021-portfolio-drafts.mjs
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });
try {
  await sql.unsafe(readFileSync("drizzle/0021_portfolio_drafts.sql", "utf8"));
  console.log("OK: drizzle/0021_portfolio_drafts.sql");
  const [{ n }] = await sql`select count(*)::int as n from "portfolio_drafts"`;
  console.log("0021 selesai. Baris portfolio_drafts:", n);
} finally {
  await sql.end();
}
