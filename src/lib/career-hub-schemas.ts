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

const slugSchema = z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const categorySchema = z.enum(CAREER_HUB_CATEGORIES.map((category) => category.key) as [string, ...string[]]);
const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(12).refine(
  (tags) => new Set(tags.map((tag) => tag.toLocaleLowerCase())).size === tags.length,
  "Tag tidak boleh duplikat.",
);

const careerHubPostFieldsSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(180),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().min(1, "Ringkasan wajib diisi.").max(500),
  content: z.string().trim().min(1, "Isi artikel wajib diisi.").max(50000),
  coverImageUrl: z.string().trim().max(2048).url().nullable().optional(),
  category: categorySchema,
  tags: tagsSchema,
  status: z.enum(["draft", "published"]).optional(),
});

export const careerHubPostCreateSchema = careerHubPostFieldsSchema.extend({
  tags: tagsSchema.default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const careerHubAdminListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const careerHubPostUpdateSchema = z.object({
  title: careerHubPostFieldsSchema.shape.title.optional(),
  slug: slugSchema.optional(),
  excerpt: careerHubPostFieldsSchema.shape.excerpt.optional(),
  content: careerHubPostFieldsSchema.shape.content.optional(),
  coverImageUrl: z.string().trim().max(2048).url().nullable().optional(),
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
