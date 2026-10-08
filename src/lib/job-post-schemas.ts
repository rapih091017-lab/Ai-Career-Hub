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
  isPublished: z.boolean().optional(),
});
