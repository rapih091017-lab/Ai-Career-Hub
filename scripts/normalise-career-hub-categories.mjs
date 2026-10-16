// Perbaiki baris Career Hub yang kategorinya tersimpan sebagai nama tampilan.
//
// Skema sudah menerima kedua bentuk, tapi baris lamanya masih berisi nilai
// lama. Nilai itu membuat artikel tidak bisa disaring per kategori.
//
// Jalankan: node scripts/normalise-career-hub-categories.mjs
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    // BOM dibuang dulu supaya baris pertama .env.local terbaca.
    const text = readFileSync(join(root, ".env.local"), "utf8").replace(/^\uFEFF/, "");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]?.trim()) {
        process.env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
      }
    }
  } catch {
    //_andalkan DATABASE_URL dari environment.
  }
}

const CATEGORIES = [
  { key: "cv-ats", id: "CV dan ATS", en: "CV & ATS" },
  { key: "interview", id: "Interview", en: "Interview" },
  { key: "job-search", id: "Strategi Mencari Kerja", en: "Job Search Strategy" },
  { key: "skills-learning", id: "Skill dan Pembelajaran", en: "Skills & Learning" },
  { key: "ai-career", id: "AI untuk Karier", en: "AI for Careers" },
  { key: "workplace", id: "Dunia Kerja", en: "Workplace" },
];

loadEnv();
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

const rows = await sql`select id, slug, category from career_hub_posts`;

let changed = 0;
for (const row of rows) {
  const match = CATEGORIES.find((c) => c.key === row.category || c.id === row.category);
  if (!match) {
    console.log(`LEWATI  ${row.slug}: kategori "${row.category}" tidak dikenal`);
    continue;
  }
  if (match.key === row.category) {
    console.log(`OK      ${row.slug}: sudah memakai key "${match.key}"`);
    continue;
  }
  await sql`update career_hub_posts set category = ${match.key} where id = ${row.id}`;
  console.log(`UBAH    ${row.slug}: "${row.category}" -> "${match.key}"`);
  changed += 1;
}

console.log(`\n${changed} baris diperbaiki dari ${rows.length}.`);

// Tag yang dulu tersimpan sebagai satu tag berisi koma dipecah jadi tag
// terpisah supaya halaman tag publik memakai nama yang benar.
const tagged = await sql`select id, slug, tags from career_hub_posts where tags is not null`;
let splitTags = 0;
for (const row of tagged) {
  const original = Array.isArray(row.tags) ? row.tags : [];
  const expanded = [];
  for (const tag of original) {
    for (const piece of String(tag).split(",")) {
      const clean = piece.trim().replace(/^#/, "").slice(0, 40);
      if (clean && !expanded.some((item) => item.toLowerCase() === clean.toLowerCase())) {
        expanded.push(clean);
      }
    }
  }
  const limited = expanded.slice(0, 12);
  if (limited.length === original.length && limited.every((tag, i) => tag === original[i])) continue;
  await sql`update career_hub_posts set tags = ${JSON.stringify(limited)}::jsonb where id = ${row.id}`;
  console.log(`TAG     ${row.slug}: ${JSON.stringify(original)} -> ${JSON.stringify(limited)}`);
  splitTags += 1;
}
console.log(`${splitTags} baris tag-nya dirapikan.`);

await sql.end({ timeout: 5 });