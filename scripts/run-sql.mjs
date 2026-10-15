// Jalankan migrasi SQL mentah ke database.
//
// Jalankan: node scripts/run-sql.mjs drizzle/0025_job_post_classification.sql
//
// Pemisah `--> statement-breakpoint` diganti titik koma supaya Postgres bisa
// membaca banyak statement sekaligus. Aman diulang karena file migrasinya
// memakai IF NOT EXISTS.

import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const file = process.argv[2];
if (!file) {
  console.error("pemakaian: node scripts/run-sql.mjs <path-sql>");
  process.exit(1);
}

const envContent = readFileSync(join(root, ".env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const i = trimmed.indexOf("=");
  if (i > 0) envVars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
});

const sql = postgres(envVars.DATABASE_URL, { ssl: "require" });
const text = readFileSync(join(root, file), "utf8")
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean)
  .join(";\n");

await sql.unsafe(text);
console.log(`OK: ${file}`);

const cols = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'job_posts' ORDER BY ordinal_position`;
console.log("kolom job_posts:", cols.map((c) => c.column_name).join(", "));

await sql.end();