// Bukti: kolom career_hub_posts dan nilai baris yang ada di database.
//
// Jalankan: node scripts/inspect-career-hub-rows.mjs
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    // BOM dibuang dulu: .env.local disimpan dengan UTF-8 BOM, dan tanpa itu
    // nama variabel baris pertama jadi "\uFEFFDATABASE_URL" sehingga tidak
    // dikenali dan koneksi jatuh ke localhost.
    const text = readFileSync(join(root, ".env.local"), "utf8").replace(/^\uFEFF/, "");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      // String kosong di environment tetap dianggap belum diisi. Kalau tidak,
      // loader melewatkan baris .env.local dan koneksi jatuh ke localhost.
      if (match && !process.env[match[1]]?.trim()) {
        process.env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
      }
    }
  } catch {
    // .env.local tidak ada;_andalkan DATABASE_URL dari environment.
  }
}

loadEnv();

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

const columns = await sql`
  select column_name, is_nullable, data_type
  from information_schema.columns
  where table_name = 'career_hub_posts'
  order by ordinal_position
`;

console.log("KOLOM career_hub_posts:");
for (const column of columns) {
  const nullable = column.is_nullable === "YES" ? "boleh NULL" : "TIDAK boleh NULL";
  console.log(`  ${column.column_name.padEnd(22)} ${String(column.data_type).padEnd(18)} ${nullable}`);
}

const rows = await sql`
  select id, slug, excerpt, content, category, tags, cover_image_url, status
  from career_hub_posts
  order by created_at
`;

console.log(`\nBARIS: ${rows.length}`);
for (const row of rows) {
  const show = (value) => (value === null || value === undefined ? "NULL" : `"${String(value).slice(0, 24)}"`);
  const length = row.content === null ? "NULL" : `${row.content.length} karakter`;
  console.log(`  ${row.slug} [${row.status}]`);
  console.log(`    excerpt=${show(row.excerpt)}  content=${length}`);
  console.log(`    category=${show(row.category)}  tags=${JSON.stringify(row.tags)}  cover=${show(row.cover_image_url)}`);
}

await sql.end({ timeout: 5 });