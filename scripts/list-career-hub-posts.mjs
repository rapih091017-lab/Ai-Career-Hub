// Lihat artikel Career Hub beserta statusnya.
//
// Jalankan: node scripts/list-career-hub-posts.mjs

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
  SELECT slug, title, status, category,
         length(content) AS content_len,
         length(coalesce(cover_image_url, '')) AS cover_len,
         created_at
  FROM career_hub_posts
  ORDER BY created_at DESC`;

for (const row of rows) {
  const flags = [];
  if (!row.content_len) flags.push("ISI KOSONG");
  if (!row.excerpt) flags.push("RINGKASAN KOSONG");
  console.log(
    `[${row.status}] ${row.title}\n` +
      `   slug: ${row.slug} | kategori: ${row.category} | isi: ${row.content_len} | sampul: ${row.cover_len}` +
      (flags.length ? `\n   PERLU DICEK: ${flags.join(", ")}` : ""),
  );
}
console.log(`\nTotal ${rows.length} artikel`);

await sql.end();