/**
 * Skema validasi job post untuk API admin. Dipisah dari file route karena
 * route handler Next.js hanya boleh mengekspor HTTP methods.
 */
import { z } from "zod";

export const jobPostSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(200),
  company: z.string().trim().max(200).nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  applyUrl: z
    .string()
    .trim()
    .min(5, "Link lamar wajib diisi")
    .max(2000)
    .refine((value) => /^https?:\/\//i.test(value), "Link harus diawali http:// atau https://"),
  // Foto disimpan sebagai data URL hasil /api/upload (maks 5MB file) atau URL biasa.
  imageUrl: z.string().trim().max(8_000_000).nullable().optional(),
  // Kategori rekrutmen yang dipilih admin: staff / mt / odp.
  jobType: z.enum(["staff", "mt", "odp"]).nullable().optional(),
  employmentType: z.enum(["full_time", "part_time", "internship"]).nullable().optional(),
  deadline: z
    .string()
    .trim()
    .nullable()
    .optional()
    // Tanggal tidak valid akan disimpan apa adanya dan muncul sebagai "Invalid
    // Date" di halaman publik, jadi tolak di pintu masuk.
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Batas akhir tidak valid"),
  isPublished: z.boolean().optional(),
});

/** Kolom klasifikasi, dipakai kedua route admin tanpa mengulang daftar field. */
export const jobClassificationFields = {
  jobType: jobPostSchema.shape.jobType,
  employmentType: jobPostSchema.shape.employmentType,
  deadline: jobPostSchema.shape.deadline,
} as const;
