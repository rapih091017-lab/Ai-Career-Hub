// Apply migrasi manual 0010 (job tracker) ke DATABASE_URL.
// Idempotent: dilewati kalau tabel sudah ada. Dijalankan sekali lalu dihapus.
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ada di environment.");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", connect_timeout: 15 });

const [existing] = await sql`SELECT to_regclass('public.job_stages') AS t`;
if (existing?.t) {
  console.log("job_stages sudah ada, migrasi dilewati.");
  await sql.end();
  process.exit(0);
}

const file = readFileSync("drizzle/0010_add_job_tracker.sql", "utf8");
const statements = file
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0);

await sql.begin(async (tx) => {
  for (const statement of statements) {
    await tx.unsafe(statement);
  }
});

const rows = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('job_stages', 'tracked_jobs')
  ORDER BY table_name
`;
console.log("OK. Tabel baru:", rows.map((row) => row.table_name).join(", "));
await sql.end();
