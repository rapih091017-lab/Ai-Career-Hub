import { z } from "zod";
import { isValidSlug, safeUrl } from "@/lib/portfolio-safety";
import { FONT_SIZES, SECTION_IDS, THEME_IDS, type SectionId } from "@/components/portfolio/types";

export { THEME_IDS };

/** Batas jumlah item per array. Yang menegakkan batas ini adalah schema;
 *  task builder berikutnya yang bertanggung jawab mencerminkannya jadi batas
 *  input di form. */
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

/** Panjang maksimum string. Schema satu-satunya otoritas panjang: form builder
 *  perlu mencerminkan angka-angka ini sebagai maxLength, tapi saat ini input form
 *  belum semuanya memakai maxLength, jadi jangan jadikan angka ini bukti
 *  validasi di sisi form.
 *  Panjang slug tidak ada di sini: SLUG_REGEX (lewat isValidSlug) satu-satunya
 *  penentu panjang slug. */
const MAX = {
  short: 200,
  line: 500,
  paragraph: 1000,
  long: 1500,
  name: 80,
  email: 254,
  phone: 32,
  url: 2048,
} as const;

const text = (max: number) => z.string().max(max);

/** Pesan gagal urlField; diekspor supaya migrasi legacy mengenali kegagalan URL
 *  tanpa menduplikasi string. */
export const URL_FIELD_MESSAGE = "Tautan memakai skema yang tidak diizinkan";

/** URL wajib lolos safeUrl. String kosong tetap sah. */
const urlField = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim())
    .refine((v) => v === "" || safeUrl(v) !== "", {
      message: URL_FIELD_MESSAGE,
    });

/** Tanggal portfolio: YYYY-MM, atau string kosong (spasi tepi di-trim dulu). */
const monthField = z
  .string()
  .trim()
  .regex(/^$|^\d{4}-(0[1-9]|1[0-2])$/, "Tanggal harus format YYYY-MM");

/** Nama field tanggal selesai, supaya pesan error menyebut field yang benar:
 *  pengalaman kerja tidak sama dengan riwayat pendidikan. */
type EndDateLabel = "tanggal selesai" | "tanggal lulus";

/**
 * Nilai sectionColors akan masuk ke inline style dan custom property, jadi
 * bentuknya dibatasi ke notasi warna CSS yang stand alone: hex, rgb(), hsl().
 * var(), url(), dan expression() sengaja ditolak: semuanya tak berguna sebagai
 * warna dan bisa jadi jalur injeksi begitu override per-section disambungkan.
 */
const COLOR_PATTERN =
  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(\s*\d+(?:\.\d+)?%?\s*,\s*\d+(?:\.\d+)?%?\s*,\s*\d+(?:\.\d+)?%?\s*(?:,\s*\d+(?:\.\d+)?%?\s*)?\)|hsla?\(\s*-?\d+(?:\.\d+)?(?:deg|grad|rad|turn)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%\s*(?:,\s*\d+(?:\.\d+)?%?\s*)?\))$/i;

const colorValue = z.string().regex(COLOR_PATTERN, "Warna harus hex (#rgb atau #rrggbb), rgb(), atau hsl()");

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Tiga aturan rentang tanggal (YYYY-MM, string kosong = belum diisi). Mengembalikan
 * alasan kegagalan yang tepat, atau null kalau rentangnya sah. Tiap aturan punya
 * pesannya sendiri karena tiga masalahnya berbeda: satu soal field yang belum diisi,
 * satu soal dua field yang saling bertentangan, satu soal urutan yang terbalik.
 */
const dateRangeError = (
  startDate: string,
  endDate: string,
  isPresent: boolean,
  endDateLabel: EndDateLabel,
): string | null => {
  if (endDate !== "" && startDate === "") {
    return `Isi tanggal mulai dulu sebelum mengisi ${endDateLabel}`;
  }
  if (isPresent && endDate !== "") {
    return `${capitalize(endDateLabel)} tidak bisa diisi kalau ditandai masih berjalan`;
  }
  if (startDate !== "" && endDate !== "" && endDate < startDate) {
    return `${capitalize(endDateLabel)} tidak boleh lebih awal dari tanggal mulai`;
  }
  return null;
};

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
    imageUrl: urlField(MAX.url).default(""),
    companyLogo: urlField(MAX.url).default(""),
  })
  .superRefine((v, ctx) => {
    const reason = dateRangeError(v.startDate, v.endDate, v.isPresent, "tanggal selesai");
    if (reason) ctx.addIssue({ code: "custom", message: reason });
  });

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
  .superRefine((v, ctx) => {
    const reason = dateRangeError(v.startDate, v.endDate, v.isPresent, "tanggal lulus");
    if (reason) ctx.addIssue({ code: "custom", message: reason });
  });

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
    .trim()
    .max(MAX.email)
    .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format email tidak valid"),
  contactPhone: z
    .string()
    .trim()
    .max(MAX.phone)
    .regex(/^$|^[+()\d\s-]{7,32}$/, "Nomor telepon tidak valid"),
  contactLinkedin: urlField(MAX.url),
  contactGithub: urlField(MAX.url),
});

/** Blok SEO dari saran AI. Ditoleransi, bukan ditolak: output AI dan data lama
 *  tidak boleh membuat draft gagal simpan — nilai kepanjangan dipotong, entri
 *  rusak dibuang, kunci asing di-strip Zod. */
const seoText = (max: number) =>
  z
    .string()
    .catch("")
    .transform((v) => v.trim().slice(0, max));

export const portfolioSeoSchema = z.object({
  pageTitle: seoText(120).optional(),
  metaDescription: seoText(300).optional(),
  keywords: z
    .array(z.string().catch(""))
    .catch([])
    .transform((ks) =>
      ks.map((k) => k.trim().slice(0, 60)).filter(Boolean).slice(0, 10),
    )
    .optional(),
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
  sectionOrder: z.array(z.enum(SECTION_IDS)).optional(),
  sectionVisibility: z.partialRecord(z.enum(SECTION_IDS), z.boolean()).optional(),
  sectionColors: z
    .partialRecord(z.enum(SECTION_IDS), z.record(z.string(), colorValue))
    .optional(),
  // Tipografi termasuk data draft supaya round-trip lewat API draft;
  // publishPayloadSchema punya atasan sendiri untuk payload publish.
  fontSize: z.enum(FONT_SIZES).optional(),
  // Perataan per section termasuk data draft supaya rantai preview & /p/ lengkap;
  // publishPayloadSchema tetap punya alignment top-level sendiri (default {}).
  alignment: z.partialRecord(z.enum(SECTION_IDS), z.enum(["left", "center", "right"])).optional(),
  seo: portfolioSeoSchema.optional().catch(undefined),
});

export type ValidatedPortfolioData = z.infer<typeof portfolioDataSchema>;

export const publishPayloadSchema = z
  .object({
    slug: z
      .string()
      .transform((v) => v.trim().toLowerCase())
      .refine(isValidSlug, "Slug tidak valid atau kata terlarang"),
    themeId: z.enum(THEME_IDS),
    data: portfolioDataSchema,
    fontSize: z.enum(FONT_SIZES).default("medium"),
    alignment: z
      .partialRecord(z.enum(SECTION_IDS), z.enum(["left", "center", "right"]))
      .default({}),
  })
  .superRefine((v, ctx) => {
    if (v.data.formData.heroFirstName.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Isi nama dulu sebelum menerbitkan",
        path: ["data", "formData", "heroFirstName"],
      });
    }
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
 * Daftar section yang tidak punya data, dalam urutan SECTION_IDS.
 * Fungsi ini hanya melaporkan; pemanggil yang memutuskan threshold publish
 * (misal: menolak publish kalau semua section kosong).
 */
export function emptySectionIds(data: ValidatedPortfolioData): SectionId[] {
  const f = data.formData;
  const has = (s: string) => s.trim() !== "";
  const checks: Record<SectionId, boolean> = {
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
  return (Object.entries(checks) as [SectionId, boolean][])
    .filter(([, filled]) => !filled)
    .map(([sectionId]) => sectionId);
}
