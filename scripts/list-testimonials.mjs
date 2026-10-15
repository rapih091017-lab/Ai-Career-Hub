// Lihat antrean testimoni: mana yang sudah terbit dan mana yang menunggu.
//
// Jalankan: node scripts/list-testimonials.mjs

import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const envContent = readFileSync(join(root, ".env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const i = trimmed.indexOf("=");
  if (i > 0) envVars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
});

const sql = postgres(envVars.DATABASE_URL, { ssl: "require" });

const rows = await sql`
  SELECT id, name, role, text, is_published, sort_order, created_at
  FROM testimonials ORDER BY is_published DESC, created_at DESC`;

for (const row of rows) {
  const status = row.is_published ? "TERBIT" : "menunggu";
  console.log(`\n[${status}] ${row.name} — ${row.role}`);
  console.log(`  id: ${row.id}`);
  console.log(`  tanggal: ${new Date(row.created_at).toISOString().slice(0, 10)}`);
  console.log(`  teks: ${row.text}`);
}

const published = rows.filter((r) => r.is_published).length;
console.log(`\nTotal ${rows.length} | terbit ${published} | menunggu ${rows.length - published}`);

await sql.end();