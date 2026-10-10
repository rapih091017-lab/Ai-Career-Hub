### Task 1: Skema Zod portfolio + hardening `safeUrl`

Fondasi yang dipakai semua task berikutnya. Tidak ada DB, tidak ada React.

**Files:**
- Create: `src/lib/portfolio/schema.ts`
- Modify: `src/lib/portfolio-safety.ts:16-22`
- Modify: `src/components/portfolio-templates/types.ts`
- Test: `src/__tests__/portfolio-schema.test.ts`

**Interfaces:**
- Consumes: `isValidSlug`, `safeUrl` dari `@/lib/portfolio-safety`
- Produces:
  - `safeUrl(v: string): string` — sekarang menerima path relatif yang diawali `/`
  - `portfolioDataSchema`, `publishPayloadSchema`, `draftPayloadSchema` dari `@/lib/portfolio/schema`
  - `LIMITS`, `THEME_IDS`, `emptySectionIds()` dari `@/lib/portfolio/schema`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  portfolioDataSchema,
  publishPayloadSchema,
  draftPayloadSchema,
  LIMITS,
} from "@/lib/portfolio/schema";

const validFormData = {
  heroPhotoUrl: "",
  heroHeadline: "Frontend Developer",
  heroSubHeadline: "Bangun antarmuka yang cepat",
  heroFirstName: "Teguh",
  heroLastName: "Surya",
  heroBio: "Developer frontend dengan 4 tahun pengalaman.",
  aboutText: "Saya fokus pada aksesibilitas dan performa web.",
  aboutYearsExp: "4",
  aboutProjectsDone: "18",
  aboutClientsHappy: "12",
  skillsMain: "React, TypeScript",
  skillsTools: "Vite, Playwright",
  skillsLanguages: "Bahasa Indonesia, Inggris",
  contactEmail: "teguh@example.com",
  contactPhone: "",
  contactLinkedin: "https://linkedin.com/in/teguh",
  contactGithub: "https://github.com/teguh",
};

const emptyData = {
  formData: validFormData,
  projects: [],
  experiences: [],
  educations: [],
  certifications: [],
  organizations: [],
  hobbies: [],
  testimonials: [],
  extraLinks: [],
};

describe("portfolioDataSchema", () => {
  it("menerima data portfolio yang valid", () => {
    expect(portfolioDataSchema.safeParse(emptyData).success).toBe(true);
  });

  it("menolak URL dengan skema terlarang", () => {
    const bad = {
      ...emptyData,
      formData: { ...validFormData, contactGithub: "javascript:alert(1)" },
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak teks melebihi panjang maksimum", () => {
    const bad = {
      ...emptyData,
      formData: { ...validFormData, heroBio: "x".repeat(501) },
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak array yang melebihi batas", () => {
    const tooMany = Array.from({ length: LIMITS.projects + 1 }, (_, i) => ({
      id: `p${i}`,
      name: "P",
      description: "D",
      techStack: "React",
      link: "",
    }));
    expect(
      portfolioDataSchema.safeParse({ ...emptyData, projects: tooMany }).success,
    ).toBe(false);
  });

  it("menolak tanggal yang bukan format YYYY-MM", () => {
    const bad = {
      ...emptyData,
      experiences: [
        { id: "e1", company: "Acme", position: "Dev", startDate: "01/2024", endDate: "2025-03", description: "" },
      ],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak endDate yang lebih awal dari startDate", () => {
    const bad = {
      ...emptyData,
      experiences: [
        { id: "e1", company: "Acme", position: "Dev", startDate: "2024-01", endDate: "2023-01", description: "" },
      ],
    };
    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
  });

  it("menerapkan default pada field opsional", () => {
    const r = portfolioDataSchema.parse({
      ...emptyData,
      projects: [{ id: "p1", name: "N", description: "D", techStack: "React", link: "" }],
    });
    expect(r.projects[0].imageUrl).toBe("");
    expect(r.projects[0].isPresent).toBe(false);
  });
});

describe("publishPayloadSchema", () => {
  it("menolak slug terlarang", () => {
    expect(
      publishPayloadSchema.safeParse({ slug: "dashboard", themeId: "glass", data: emptyData }).success,
    ).toBe(false);
  });

  it("menolak tema yang tidak dikenal", () => {
    expect(
      publishPayloadSchema.safeParse({ slug: "teguh-surya", themeId: "neon-hacker", data: emptyData }).success,
    ).toBe(false);
  });

  it("menolak publish tanpa nama depan", () => {
    expect(
      publishPayloadSchema.safeParse({
        slug: "teguh-surya",
        themeId: "glass",
        data: { ...emptyData, formData: { ...validFormData, heroFirstName: "" } },
      }).success,
    ).toBe(false);
  });

  it("menerima payload valid lengkap dengan opsi tampilan", () => {
    expect(
      publishPayloadSchema.safeParse({
        slug: "teguh-surya",
        themeId: "luxe",
        data: emptyData,
        fontSize: "large",
        alignment: { hero: "center", contact: "center" },
      }).success,
    ).toBe(true);
  });
});

describe("draftPayloadSchema", () => {
  it("menerima nama kosong dan memakai default", () => {
    expect(draftPayloadSchema.parse({ data: emptyData }).name).toBe("Portfolio saya");
  });

  it("memotong nama draft lebih dari 120 karakter", () => {
    expect(draftPayloadSchema.parse({ name: "a".repeat(200), data: emptyData }).name.length).toBe(120);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-schema.test.ts`
Expected: FAIL — `Cannot find module '@/lib/portfolio/schema'`

- [ ] **Step 3: Tambahkan dukungan path relatif di `safeUrl`**

Ganti `src/lib/portfolio-safety.ts` baris 16-22:

```ts
/**
 * Validasi & sanitasi URL. Menerima http/https/mailto/tel, path relatif yang
 * diawali `/`, dan domain telanjang (diberi prefiks https://).
 * Skema lain — javascript:, data:, vbscript:, file: — ditolak dengan "".
 */
export function safeUrl(v: string): string {
  const t = v.trim();
  if (!t) return "";
  if (/^\/[^/]?/.test(t)) return esc(t);
  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return esc(t);
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t)) return esc("https://" + t);
  return "";
}
```

- [ ] **Step 4: Tambah test `safeUrl` untuk path relatif**

Tambahkan di dalam `describe("safeUrl")` pada `src/__tests__/portfolio-safety.test.ts`:

```ts
  it("menerima path relatif yang diawali slash", () => {
    expect(safeUrl("/api/portfolio/assets/abc")).toBe("/api/portfolio/assets/abc");
    expect(safeUrl("/")).toBe("/");
  });

  it("menolak path relatif tanpa slash di depan", () => {
    expect(safeUrl("api/portfolio/assets/abc")).toBe("");
  });
```

- [ ] **Step 5: Jalankan test `safeUrl`**

Run: `npx vitest run src/__tests__/portfolio-safety.test.ts`
Expected: PASS — 13 test

- [ ] **Step 6: Perluas tipe di `src/components/portfolio-templates/types.ts`**

```ts
export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  techStack: string;
  link: string;
  imageUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  role?: string;
  featured?: boolean;
}
```

`ExperienceItem` sudah punya `isPresent?`; tambahkan default di Zod, bukan di tipe.

- [ ] **Step 7: Buat `src/lib/portfolio/schema.ts`**

```ts
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
  imageUrl: z.string().max(MAX.url).default(""),
  liveUrl: z.string().max(MAX.url).default(""),
  repoUrl: z.string().max(MAX.url).default(""),
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
  url: z.string().max(MAX.url).default(""),
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
  heroPhotoUrl: z.string().max(MAX.url).default(""),
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

export const draftPayloadSchema = z.object({
  name: z.string().max(120).optional(),
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
```

- [ ] **Step 8: Jalankan test skema**

Run: `npx vitest run src/__tests__/portfolio-schema.test.ts`
Expected: PASS — 12 test

- [ ] **Step 9: Typecheck dan commit**

```bash
npx tsc --noEmit
git add src/lib/portfolio-safety.ts src/lib/portfolio/schema.ts src/__tests__/portfolio-schema.test.ts src/__tests__/portfolio-safety.test.ts src/components/portfolio-templates/types.ts
git commit -m "feat(portfolio): zod schema + safeUrl path relatif"
```

---
