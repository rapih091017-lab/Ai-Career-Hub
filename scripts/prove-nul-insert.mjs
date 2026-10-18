// Buktikan akar masalah dan perbaikannya langsung terhadap Postgres.
//
// Jalankan: node scripts/prove-nul-insert.mjs
//
// Langkah 1 memasukkan teks yang mengandung byte NUL — inilah yang membuat
// insert checker_results gagal dengan error 22021 di produksi.
// Langkah 2 memasukkan teks yang sama setelah melewati sanitizeExtractedText,
// yang diambil dari modul asli, bukan salinan.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envText = readFileSync(join(root, ".env.local"), "utf8").replace(/^\uFEFF/, "");
const line = envText.split("\n").find((l) => l.startsWith("DATABASE_URL="));
if (!line) throw new Error("DATABASE_URL tidak ada di .env.local");
const url = line.slice(13).trim().replace(/^"|"$/g, "");

const sql = postgres(url, { ssl: "require", max: 1 });
const created = [];

try {
  const kontenDenganNul = "pimpin tim\u0000membangun dashboard internal";

  console.log("--- langkah 1: teks ASLI mengandung byte NUL ---");
  try {
    await sql`
      insert into checker_results (id, cv_text_extracted, job_description, scores, ai_feedback, created_at)
      values (gen_random_uuid(), ${kontenDenganNul}, '', '{"overall":0}'::jsonb, '{}'::jsonb, now())`;
    console.log("GAGAL MEMBANGKITKAN: seharusnya ditolak");
  } catch (error) {
    console.log("ditolak seperti dugaan:");
    console.log(`  code    : ${error.code}`);
    console.log(`  message : ${error.message}`);
    console.log(error.code === "22021" ? "  → 22021 cocok dengan log produksi" : "  → BEDA dari log produksi");
  }

  // Ambil modul sanitizer yang asli, jadi bukti ini berlaku untuk kode produksi.
  const modul = await import("file://" + join(root, "src", "lib", "checker", "extracted-text.ts").replace(/\\/g, "/"));
  const hasil = modul.sanitizeExtractedText(kontenDenganNul);
  console.log(`\n--- langkah 2: setelah sanitizeExtractedText ---`);
  console.log(`  sebelum : ${JSON.stringify(kontenDenganNul)}`);
  console.log(`  sesudah : ${JSON.stringify(hasil)}`);
  console.log(`  masih ada NUL: ${hasil.includes("\u0000")}`);

  const inserted = await sql`
    insert into checker_results (id, cv_text_extracted, job_description, scores, ai_feedback, created_at)
    values (gen_random_uuid(), ${hasil}, '', '{"overall":0}'::jsonb, '{}'::jsonb, now())
    returning id`;
  created.push(inserted[0].id);
  console.log(`  insert  : BERHASIL (id ${inserted[0].id})`);
} finally {
  if (created.length > 0) {
    for (const id of created) {
      await sql`delete from checker_results where id = ${id}`;
      console.log(`  dibersihkan: ${id}`);
    }
  }
  await sql.end({ timeout: 5 });
}