import { z } from "zod";
import { isValidSlug, safeUrl } from "@/lib/portfolio-safety";

/** Batas jumlah item per array. Dipakai form dan Zod sekaligus. */
export const LIMITS = {
  projects: 60,
  experiences: 40,
  educations: 20,
  certifications: 40,
  organizations: 20,
  hobbies: 30,
  testimonials: 30,
  extraLinks: 12,
} as const;

/** Panjang maksimum string. Cerminan maxLength di form. */
const MAX = {
  short: 200,
  line: 500,
  paragraph: 1000,
  long: 1500,
  name: 80,
  email: 254,
  phone: 32,
  url: 2048,
  slug: 60,
} as const;

const text = (max: number) => z.string().max(max);

/** URL wajib lolos safeUrl. String kosong tetap sah. */
const urlField = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim())
    .refine((v) => v === "" || safeUrl(v) !== "", {
      message: "Tautan memakai skema yang tidak diizinkan",
    });

/** Tanggal portfolio: YYYY-MM, atau string kosong. */
const monthField = z
  .string()
  .regex(/^$|^\d{4}-(0[1-9]|1[0-2])$/, "Tanggal harus format YYYY-MM")
  .transform((v) => v.trim());

const id = z.string().min(1).max(64);

export const projectItemSchema = z.object({
  id,
  name: text(MAX.name),
  description: text(MAX.line),
  techStack: text(MAX.line),
  link: urlField(MAX.url),
  imageUrl: urlField(MAX.url).default(""),
  liveUrl: urlField(MAX.url).default(""),
  repoUrl: urlField(MAX.url).default(""),
  role: z.string().max(MAX.short).default(""),
  featured: z.boolean().default(false),
});

export const experienceItemSchema = z
  .object({
    id,
    company: text(MAX.name),
    position: text(MAX.name),
    startDate: monthField,
    endDate: monthField,
    description: text(MAX.paragraph),
    isPresent: z.boolean().default(false),
    imageUrl: z.string().max(MAX.url).default(""),
    companyLogo: urlField(MAX.url).default(""),
  })
  .refine(
    (v) => v.startDate === "" || v.endDate === "" || v.isPresent || v.endDate >= v.startDate,
    { message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai" },
  );

export const educationItemSchema = z
  .object({
    id,
    institution: text(MAX.name),
    degree: text(MAX.name),
    field: text(MAX.name),
    startDate: monthField,
    endDate: monthField,
    isPresent: z.boolean().default(false),
  })
  .refine(
    (v) => v.startDate === "" || v.endDate === "" || v.isPresent || v.endDate >= v.startDate,
    { message: "Tanggal lulus tidak boleh lebih awal dari tanggal mulai" },
  );

export const certificationItemSchema = z.object({
  id,
  name: text(MAX.name),
  issuer: text(MAX.name),
  year: text(MAX.short),
  url: urlField(MAX.url).default(""),
});

export const organizationItemSchema = z.object({
  id,
  name: text(MAX.name),
  role: text(MAX.name),
  period: text(MAX.short),
  description: text(MAX.line),
});

export const hobbyItemSchema = z.object({
  id,
  name: text(MAX.name),
  description: text(MAX.line),
});

export const testimonialItemSchema = z.object({
  id,
  name: text(MAX.name),
  position: text(MAX.name),
  testimonial: text(MAX.line),
});

export const extraLinkSchema = z.object({
  id,
  label: text(MAX.short),
  url: urlField(MAX.url),
});

export const portfolioFormDataSchema = z.object({
  heroPhotoUrl: urlField(MAX.url).default(""),
  heroHeadline: text(MAX.name),
  heroSubHeadline: text(MAX.line),
  heroFirstName: text(MAX.name),
  heroLastName: text(MAX.name),
  heroBio: text(MAX.line),
  aboutText: text(MAX.long),
  aboutYearsExp: z.string().max(MAX.short).default(""),
  aboutProjectsDone: z.string().max(MAX.short).default(""),
  aboutClientsHappy: z.string().max(MAX.short).default(""),
  skillsMain: text(MAX.paragraph),
  skillsTools: text(MAX.paragraph),
  skillsLanguages: text(MAX.paragraph),
  contactEmail: z
    .string()
    .max(MAX.email)
    .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format email tidak valid"),
  contactPhone: z.string().max(MAX.phone).regex(/^$|^[+()\d\s-]{7,32}$/),
  contactLinkedin: urlField(MAX.url),
  contactGithub: urlField(MAX.url),
});

export const portfolioDataSchema = z.object({
  formData: portfolioFormDataSchema,
  projects: z.array(projectItemSchema).max(LIMITS.projects).default([]),
  experiences: z.array(experienceItemSchema).max(LIMITS.experiences).default([]),
  educations: z.array(educationItemSchema).max(LIMITS.educations).default([]),
  certifications: z.array(certificationItemSchema).max(LIMITS.certifications).default([]),
  organizations: z.array(organizationItemSchema).max(LIMITS.organizations).default([]),
  hobbies: z.array(hobbyItemSchema).max(LIMITS.hobbies).default([]),
  testimonials: z.array(testimonialItemSchema).max(LIMITS.testimonials).default([]),
  extraLinks: z.array(extraLinkSchema).max(LIMITS.extraLinks).default([]),
  sectionOrder: z.array(z.string()).optional(),
  sectionVisibility: z.record(z.string(), z.boolean()).optional(),
  sectionColors: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});

export type ValidatedPortfolioData = z.infer<typeof portfolioDataSchema>;

export const THEME_IDS = ["glass", "brutal", "luxe"] as const;

export const publishPayloadSchema = z
  .object({
    slug: z
      .string()
      .min(3)
      .max(MAX.slug)
      .transform((v) => v.trim().toLowerCase())
      .refine(isValidSlug, "Slug tidak valid atau kata terlarang"),
    themeId: z.enum(THEME_IDS),
    data: portfolioDataSchema,
    fontSize: z.enum(["small", "medium", "large"]).default("medium"),
    alignment: z.record(z.string(), z.enum(["left", "center", "right"])).default({}),
  })
  .refine((v) => v.data.formData.heroFirstName.trim() !== "", {
    message: "Isi nama dulu sebelum menerbitkan",
  });

export type PublishPayload = z.infer<typeof publishPayloadSchema>;

/**
 * Nama draft: default "Portfolio saya" kalau kosong, dan dipotong 120 karakter
 * (bukan ditolak) supaya input yang kelewat panjang tetap bisa disimpan.
 */
const draftNameSchema = z
  .string()
  .optional()
  .transform((v) => ((v ?? "").trim() || "Portfolio saya").slice(0, 120));

export const draftPayloadSchema = z.object({
  name: draftNameSchema,
  data: portfolioDataSchema,
});

export type DraftPayload = z.infer<typeof draftPayloadSchema>;

/**
 * Daftar section yang tidak punya data. Publish ditolak kalau semua kosong,
 * supaya portfolio yang secara visual kosong tidak bisa terbit.
 */
export function emptySectionIds(data: ValidatedPortfolioData): string[] {
  const f = data.formData;
  const has = (s: string) => s.trim() !== "";
  const checks: Record<string, boolean> = {
    hero: has(f.heroFirstName),
    about: has(f.aboutText),
    stats: has(f.aboutYearsExp) || has(f.aboutProjectsDone) || has(f.aboutClientsHappy),
    experience: data.experiences.some((e) => has(e.company) || has(e.position)),
    education: data.educations.some((e) => has(e.institution)),
    projects: data.projects.some((p) => has(p.name)),
    skills: has(f.skillsMain),
    certifications: data.certifications.some((c) => has(c.name)),
    organizations: data.organizations.some((o) => has(o.name)),
    hobbies: data.hobbies.some((h) => has(h.name)),
    testimonials: data.testimonials.some((t) => has(t.name)),
    contact: has(f.contactEmail) || has(f.contactLinkedin) || has(f.contactGithub),
  };
  return Object.entries(checks)
    .filter(([, filled]) => !filled)
    .map(([id]) => id);
}