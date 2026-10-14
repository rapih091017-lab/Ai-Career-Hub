// Cek tabel career_hub_posts di database.
// Jalankan: node scripts/check-career-hub-tables.mjs

import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "..", ".env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const i = trimmed.indexOf("=");
  if (i > 0) envVars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
});

const sql = postgres(envVars.DATABASE_URL, { ssl: "require" });

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE 'career%' ORDER BY table_name`;
console.log("tabel career*:", tables.map((t) => t.table_name));

const cols = await sql`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'career_hub_posts' ORDER BY ordinal_position`;
console.log("kolom career_hub_posts:", cols.length);
for (const c of cols) console.log(`  ${c.column_name} ${c.data_type}`);

await sql.end();