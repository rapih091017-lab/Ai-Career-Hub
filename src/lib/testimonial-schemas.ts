import { z } from "zod";

export const testimonialCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi.").max(100),
  role: z.string().trim().min(2, "Peran wajib diisi.").max(100),
  text: z.string().trim().min(10, "Testimoni minimal 10 karakter.").max(600),
  avatarUrl: z.string().trim().url("URL avatar tidak valid.").max(2048).nullable().optional(),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const testimonialUpdateSchema = z
  .object({
    name: testimonialCreateSchema.shape.name.optional(),
    role: testimonialCreateSchema.shape.role.optional(),
    text: testimonialCreateSchema.shape.text.optional(),
    avatarUrl: z.string().trim().url().max(2048).nullable().optional(),
    isPublished: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Minimal satu field harus diubah.",
  });
