/**
 * Skema validasi career path untuk API admin. Dipisah dari file route karena
 * route handler Next.js hanya boleh mengekspor HTTP methods.
 */
import { z } from "zod";

export const careerLevelSchema = z.object({
  level: z.string().trim().min(1, "Nama jenjang wajib diisi").max(60),
  years: z.string().trim().max(40).default(""),
  salaryRange: z.string().trim().max(60).default(""),
  focus: z.string().trim().max(400).default(""),
});

export const careerPathBodySchema = z.object({
  role: z.string().trim().min(2, "Nama posisi wajib diisi").max(120),
  /** Slug opsional; dibuat otomatis dari role bila kosong. */
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, "Slug hanya huruf kecil, angka, dan tanda hubung")
    .optional(),
  category: z.string().trim().min(2, "Kategori wajib diisi").max(80),
  summary: z.string().trim().max(1000).nullable().optional(),
  levels: z.array(careerLevelSchema).max(6).default([]),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  steps: z.array(z.string().trim().min(1).max(400)).max(12).default([]),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const careerPathUpdateSchema = careerPathBodySchema.partial();

/** Ubah nama posisi menjadi slug URL yang aman. */
export function slugifyRole(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
