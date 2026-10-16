import { z } from "zod";

export const CAREER_HUB_CATEGORIES = [
  { key: "cv-ats", id: "CV dan ATS", en: "CV & ATS" },
  { key: "interview", id: "Interview", en: "Interview" },
  { key: "job-search", id: "Strategi Mencari Kerja", en: "Job Search Strategy" },
  { key: "skills-learning", id: "Skill dan Pembelajaran", en: "Skills & Learning" },
  { key: "ai-career", id: "AI untuk Karier", en: "AI for Careers" },
  { key: "workplace", id: "Dunia Kerja", en: "Workplace" },
] as const;

export function careerHubCategoryLabel(key: string): string {
  return CAREER_HUB_CATEGORIES.find((category) => category.key === key)?.id ?? key;
}

/**
 * Slug kosong diabaikan supaya server bisa membuatnya sendiri dari judul.
 * Dulu `""` langsung ditolak dan admin mendapat "Invalid input" tanpa tahu
 * apa yang salah, padahal form memang mengirim string kosong saat slug
 * dibiarkan kosong.
 */
const optionalSlugSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine((value) => value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
    message: "Slug hanya boleh huruf kecil, angka, dan tanda hubung.",
  })
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const categorySchema = z.enum(CAREER_HUB_CATEGORIES.map((category) => category.key) as [string, ...string[]]);
const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(12)
  .transform((tags) => {
    // Buang duplikat yang hanya berbeda huruf besar/kecil supaya "CV" dan "cv"
    // tidak membuat seluruh artikel ditolak.
    const seen = new Set<string>();
    return tags.filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

/**
 * Gambar sampul opsional.
 *
 * Dua bentuk yang sah: URL http(s), atau data URL hasil unggahan langsung.
 * PhotoUpload menyimpan gambar sebagai data URL base64, dan data URL 200 KB
 * sudah millions of karakter — dulu batasnya 2048 sehingga artikel yang
 * gambarnya sudah diunggah selalu ditolak dengan "Invalid input".
 * Batas 8 MB mengikuti pola yang sudah dipakai gambar lowongan dan portofolio.
 */
const MAX_IMAGE_URL_LENGTH = 8_000_000;

const optionalUrlSchema = z
  .string()
  .trim()
  .max(MAX_IMAGE_URL_LENGTH, "Gambar terlalu besar. Maksimal sekitar 5 MB.")
  .refine((value) => value === "" || value.startsWith("data:image/") || /^https?:\/\//i.test(value), {
    message: "Gambar harus berupa tautan http(s) atau hasil unggahan.",
  })
  .nullable()
  .optional()
  .transform((value) => (value === "" ? null : value));

const careerHubPostFieldsSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(180),
  slug: optionalSlugSchema,
  // Ringkasan dan isi boleh kosong selagi artikel masih draf. Divalidasi
  // terpisah di bawah supaya "Simpan draf" tidak ditolak dengan pesan
  // "Isi artikel wajib diisi" di tengah menulis.
  excerpt: z.string().trim().max(500, "Ringkasan maksimal 500 karakter."),
  content: z.string().trim().max(50000, "Isi artikel maksimal 50.000 karakter."),
  coverImageUrl: optionalUrlSchema,
  category: categorySchema,
  tags: tagsSchema,
  status: z.enum(["draft", "published"]).optional(),
});

/** Syarat yang hanya berlaku saat artikel benar-benar diterbitkan. */
function requirePublishFields(
  data: { excerpt?: string; content?: string; status?: string },
  ctx: z.RefinementCtx,
): void {
  if (data.status !== "published") return;
  if (!data.excerpt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["excerpt"],
      message: "Ringkasan wajib diisi sebelum artikel diterbitkan.",
    });
  }
  if (!data.content) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: "Isi artikel wajib diisi sebelum artikel diterbitkan.",
    });
  }
}

export const careerHubPostCreateSchema = careerHubPostFieldsSchema
  .extend({
    tags: tagsSchema.default([]),
    status: z.enum(["draft", "published"]).default("draft"),
  })
  .superRefine(requirePublishFields);

export const careerHubAdminListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const careerHubPostUpdateSchema = z.object({
  title: careerHubPostFieldsSchema.shape.title.optional(),
  slug: optionalSlugSchema,
  excerpt: careerHubPostFieldsSchema.shape.excerpt.optional(),
  content: careerHubPostFieldsSchema.shape.content.optional(),
  coverImageUrl: optionalUrlSchema,
  category: careerHubPostFieldsSchema.shape.category.optional(),
  tags: tagsSchema.optional(),
  status: careerHubPostFieldsSchema.shape.status,
}).superRefine((data, context) => {
  if (Object.values(data).every((value) => value === undefined)) {
    context.addIssue({ code: "custom", message: "Minimal satu field harus diubah." });
  }
});

export const careerHubListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: categorySchema.optional(),
  tag: z.string().trim().min(1).max(40).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(30).default(12),
});

export function slugifyCareerHubTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
    .replace(/-+$/g, "");
}
