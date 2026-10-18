// Lihat riwayat analisis checker terbaru.
// Jalankan: node scripts/list-checker-results.mjs
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const text = readFileSync(join(root, ".env.local"), "utf8").replace(/^\uFEFF/, "");
const line = text.split("\n").find((l) => l.startsWith("DATABASE_URL="));
if (!line) throw new Error("DATABASE_URL tidak ada di .env.local");
const url = line.slice(13).trim().replace(/^"|"$/g, "");

const sql = postgres(url, { ssl: "require", max: 1 });
try {
  const rows = await sql`
    select created_at,
           scores->>'overall' as skor,
           anonymous_fingerprint->>'anonId' as anon_id,
           (user_id is not null) as login,
           length(cv_text_extracted) as panjang_cv
    from checker_results
    order by created_at desc
    limit 10`;
  console.log(`total baris terakhir: ${rows.length}`);
  for (const row of rows) {
    console.log(
      `  ${row.created_at.toISOString()} | skor ${row.skor} | ` +
        `${row.anon_id ? "anon" : "login"} | cv ${row.panjang_cv} char`,
    );
  }

  const last = await sql`select count(*)::int as n from checker_results`;
  console.log(`\ntotal baris: ${last[0].n}`);

  const usage = await sql`
    select action_type, count(*)::int as n, max(created_at) as terakhir
    from usage_logs
    where action_type like 'checker_check%'
    group by action_type
    order by action_type`;
  console.log("\nusage_logs:");
  for (const row of usage) {
    console.log(
      `  ${row.action_type.padEnd(22)} ${row.n} kali | terakhir ${row.terakhir?.toISOString() ?? "-"}`,
    );
  }
} finally {
  await sql.end({ timeout: 5 });
}