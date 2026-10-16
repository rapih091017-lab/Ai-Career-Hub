// Uji jalur tulis artikel sungguhan ke database, lalu hapus.
//
// Jalankan: node scripts/try-create-article.mjs
//
// Meniru apa yang dilakukan route POST /api/admin/career-hub: payload yang
// sama seperti form admin, divalidasi dengan skema yang sama, lalu ditulis ke
// tabel career_hub_posts. Bedanya hanya tidak lewat autentikasi admin.
//
// Isi atau gambar yang gagal diterima akan berhenti di sini, bukan di form.

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

const stamp = Date.now();
const slug = `uji-jalur-tulis-${stamp}`;

// Persis bentuk yang dikirim form admin CareerHubPostForm.
const payload = {
  title: `Uji jalur tulis artikel ${stamp}`,
  slug,
  excerpt: "Artikel uji coba untuk memastikan penyimpanan tidak ditolak.",
  content: [
    "## Kenapa artikel ini ada",
    "",
    "Artikel ini dibuat oleh skrip uji, lalu dihapus setelah dibuktikan tersimpan.",
    "",
    "1. Isi diuji zusammen",
    "2. Penomoran otomatis",
    "",
    "- Bullet pertama",
    "- Bullet kedua",
    "",
    "Teks **tebal** di tengah paragraf.",
    "",
    "@center Paragraf rata tengah.",
  ].join("\n"),
  category: "cv-ats",
  tags: ["uji", "ATS"],
  // Hasil unggahan: data URL base64, bentuk yang sebelumnya ditolak.
  coverImageUrl: `data:image/jpeg;base64,${"A".repeat(200_000)}`,
  status: "draft",
};

// Validasi dengan skema yang sama seperti route (dimuat lewat tsx tidak
// tersedia, jadi batas panjang dicek manual di sini; skema aslinya diuji
// oleh test vitest).
const checks = [
  ["judul 3-180", payload.title.length >= 3 && payload.title.length <= 180],
  ["slug pola valid", /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)],
  ["ringkasan 1-500", payload.excerpt.length >= 1 && payload.excerpt.length <= 500],
  ["isi 1-50000", payload.content.length >= 1 && payload.content.length <= 50000],
  ["sampul <= 8.000.000", payload.coverImageUrl.length <= 8_000_000],
  ["tag <= 12 dan tiap tag <= 40", payload.tags.length <= 12 && payload.tags.every((tag) => tag.length <= 40)],
];

let valid = true;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK   " : "GAGAL"} ${label}`);
  if (!ok) valid = false;
}
if (!valid) {
  console.error("\nPayload akan ditolak server. Basisnya belum benar.");
  await sql.end();
  process.exit(1);
}

console.log(`\npanjang data URL sampul: ${payload.coverImageUrl.length.toLocaleString("id-ID")} karakter`);

const inserted = await sql`
  INSERT INTO career_hub_posts (slug, title, excerpt, content, category, tags, status, cover_image_url, created_at, updated_at)
  VALUES (${payload.slug}, ${payload.title}, ${payload.excerpt}, ${payload.content}, ${payload.category},
          ${sql.json(payload.tags)}, ${payload.status}, ${payload.coverImageUrl}, now(), now())
  RETURNING id, slug, status, length(content) AS content_len, length(cover_image_url) AS cover_len`;

const row = inserted[0];
console.log(`\nTertulis: ${row.slug} (id ${row.id})`);
console.log(`isi: ${row.content_len} karakter, sampul: ${row.cover_len} karakter`);

const [readBack] = await sql`
  SELECT slug, status, category, tags FROM career_hub_posts WHERE id = ${row.id}`;
console.log(`Dibaca kembali: ${JSON.stringify(readBack)}`);

// Slug yang sama kedua kali harus ditolak, persis seperti route.
try {
  await sql`
    INSERT INTO career_hub_posts (slug, title, excerpt, content, category, tags, status)
    VALUES (${payload.slug}, 'duplikat', 'x', 'x', 'cv-ats', ${sql.json([])}, 'draft')`;
  console.log("\nPERINGATAN: slug duplikat justru diterima.");
} catch (error) {
  console.log(`\nSlug duplikat ditolak dengan kode ${error.code} (route membalas 409).`);
}

await sql`DELETE FROM career_hub_posts WHERE id = ${row.id}`;
const left = await sql`SELECT COUNT(*)::int AS n FROM career_hub_posts WHERE id = ${row.id}`;
console.log(`\nArtikel uji dihapus. Sisa baris dengan id itu: ${left[0].n}`);

await sql.end();