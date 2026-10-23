// Impor 15 artikel karir dari artikel/artikel_karir_15_tips_pencari_kerja.md.
// Sampul dikosongkan sesuai permintaan (cover_image_url = NULL).
// Idempotent: on conflict (slug) -> update isi + paksa cover NULL.
// Jalankan: node --env-file=.env scripts/seed-career-hub-15.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

// Kategori file sumber bebas; skema hanya menerima 6 key ini.
const CATEGORY_BY_SLUG = {
  "cara-membuat-cv-ats-friendly": "cv-ats",
  "cold-outreach-linkedin-template": "job-search",
  "pertanyaan-wawancara-kerja-star-method": "interview",
  "cover-letter-yang-membuat-hrd-berhenti-scroll": "cv-ats",
  "personal-branding-linkedin-2026": "skills-learning",
  "negosiasi-gaji-pertama-tanpa-ngeri": "workplace",
  "career-switch-di-usia-30-an": "job-search",
  "job-search-anxiety-cara-bertahan-mental": "workplace",
  "skill-digital-paling-diminta-2026": "skills-learning",
  "kesalahan-fatal-fresh-graduate-job-search": "job-search",
  "kerja-remote-internasional-dari-indonesia": "workplace",
  "one-way-video-interview-tips": "interview",
  "gap-year-di-cv-jadi-keunggulan": "cv-ats",
  "freelance-vs-full-time-mana-yang-cocok": "workplace",
  "career-fair-2026-strategi-efektif": "job-search",
};

const raw = readFileSync("artikel/artikel_karir_15_tips_pencari_kerja.md", "utf8");

// Pecah per artikel bernomor: "## 1. Judul ..."
const parts = raw.split(/^## \d+\. /m);
parts.shift(); // buang prolog + daftar isi

if (parts.length !== 15) {
  console.error(`Ditemukan ${parts.length} artikel, bukan 15. Parser perlu dicek.`);
  process.exit(1);
}

// Ubah URL telanjang jadi tautan markdown supaya ArticleContent merendernya.
function linkify(text) {
  return text.replace(/(https?:\/\/[^\s)"']+)/g, (m) => `[${m}](${m})`);
}

const posts = parts.map((part, i) => {
  const title = part.split("\n")[0].trim();
  const slug = part.match(/\*\*Slug:\*\*\s*`(.+?)`/)?.[1]?.trim();
  const excerpt = part.match(/\*\*Ringkasan:\*\*\s*(.+)/)?.[1]?.trim();
  const tagLine = part.match(/\*\*Tag:\*\*\s*(.+)/)?.[1]?.trim() ?? "";
  const isi = part.match(/### Isi Artikel\s*\n([\s\S]*?)(?:### Prompt Gambar Sampul|$)/)?.[1] ?? "";
  if (!slug || !excerpt || !isi.trim()) throw new Error(`Artikel "${title}" tidak lengkap (slug/ringkasan/isi).`);
  const category = CATEGORY_BY_SLUG[slug];
  if (!category) throw new Error(`Slug ${slug} belum dipetakan ke kategori skema.`);
  const tags = [...new Set(
    tagLine.split(/\s+/).map((t) => t.replace(/^#/, "").trim().toLowerCase()).filter(Boolean),
  )].slice(0, 12);
  const content = linkify(
    isi
      .split("\n")
      .filter((line) => !/^\s*---\s*$/.test(line)) // buang pemisah markdown
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
  if (title.length < 3 || title.length > 180) throw new Error(`Judul di luar batas: ${title}`);
  if (excerpt.length > 500) throw new Error(`Ringkasan > 500 karakter: ${slug}`);
  if (content.length > 50000) throw new Error(`Isi > 50.000 karakter: ${slug}`);
  // Artikel 1 paling baru supaya urutan tampil 1..15.
  const publishedAt = new Date(Date.now() - i * 24 * 3600 * 1000);
  return { title, slug, excerpt, content, category, tags, publishedAt };
});

const sql = postgres(url, { max: 1 });
try {
  let inserted = 0;
  let updated = 0;
  for (const p of posts) {
    const result = await sql`
      insert into career_hub_posts (slug, title, excerpt, content, cover_image_url, category, tags, status, published_at)
      values (${p.slug}, ${p.title}, ${p.excerpt}, ${p.content}, null, ${p.category}, ${JSON.stringify(p.tags)}::jsonb, 'published', ${p.publishedAt})
      on conflict (slug) do update set
        title = excluded.title,
        excerpt = excluded.excerpt,
        content = excluded.content,
        cover_image_url = null,
        category = excluded.category,
        tags = excluded.tags,
        status = 'published',
        updated_at = now()
      returning (xmax = 0) as was_inserted
    `;
    if (result[0].was_inserted) { inserted++; console.log("+", p.slug); }
    else { updated++; console.log("= sudah ada, diperbarui:", p.slug); }
  }
  const rows = await sql`select slug, category, cover_image_url from career_hub_posts where slug = any(${posts.map((p) => p.slug)}) order by published_at desc`;
  console.log(`Selesai. Baru: ${inserted}, diperbarui: ${updated}.`);
  for (const r of rows) console.log(`- ${r.slug} [${r.category}] sampul=${r.cover_image_url ?? "kosong"}`);
} catch (err) {
  console.error("GAGAL:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
