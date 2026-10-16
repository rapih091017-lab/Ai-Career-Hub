// Reproduksi: payload apa yang ditolak skema Career Hub.
//
// Jalankan: node scripts/check-career-hub-payload.mjs

import { z } from "zod";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Skema ada di file TS; di sini kita salin bentuk validasinya supaya bisa
// dijalankan tanpa loader TypeScript.
const slugSchema = z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const coverSchema = z.string().trim().max(2048).url().nullable().optional();
const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(12)
  .refine(
    (tags) => new Set(tags.map((tag) => tag.toLocaleLowerCase())).size === tags.length,
    "Tag tidak boleh duplikat.",
  );

const cases = [
  { name: "artikel normal", payload: { title: "Panduan CV ATS", slug: "panduan-cv-ats", excerpt: "Ringkasan singkat.", content: "Isi artikel.", category: "cv-ats", tags: ["ats", "cv"], status: "draft", coverImageUrl: null } },
  { name: "coverImageUrl string kosong", payload: { title: "Panduan CV ATS", slug: "panduan-cv-ats", excerpt: "Ringkasan.", content: "Isi.", category: "cv-ats", tags: [], status: "draft", coverImageUrl: "" } },
  { name: "slug kosong (judul tanpa karakter valid)", payload: { title: "!!!", slug: "", excerpt: "Ringkasan.", content: "Isi.", category: "cv-ats", tags: [], status: "draft" } },
  { name: "slug dengan huruf besar/spasi", payload: { title: "Panduan CV", slug: "Panduan CV", excerpt: "Ringkasan.", content: "Isi.", category: "cv-ats", tags: [], status: "draft" } },
  { name: "tag beda huruf besar", payload: { title: "Panduan CV", slug: "panduan-cv", excerpt: "Ringkasan.", content: "Isi.", category: "cv-ats", tags: ["cv", "CV"], status: "draft" } },
  { name: "excerpt kosong (simpan draf)", payload: { title: "Panduan CV", slug: "panduan-cv", excerpt: "", content: "Isi.", category: "cv-ats", tags: [], status: "draft" } },
  { name: "kategori tidak dikenal", payload: { title: "Panduan CV", slug: "panduan-cv", excerpt: "Ringkasan.", content: "Isi.", category: "lain", tags: [], status: "draft" } },
];

for (const testCase of cases) {
  const result = slugSchema.safeParse(testCase.payload.slug);
  const cover = coverSchema.safeParse(testCase.payload.coverImageUrl);
  const tags = tagsSchema.safeParse(testCase.payload.tags);
  const problems = [];
  if (!result.success) problems.push(`slug: ${result.error.issues[0].message}`);
  if (!cover.success) problems.push(`coverImageUrl: ${cover.error.issues[0].message}`);
  if (!tags.success) problems.push(`tags: ${tags.error.issues[0].message}`);
  if (testCase.payload.excerpt.trim().length < 1) problems.push("excerpt: Ringkasan wajib diisi.");
  console.log(`${problems.length ? "DITOLAK " : "LOLOS   "} ${testCase.name}${problems.length ? ` -> ${problems.join(" | ")}` : ""}`);
}