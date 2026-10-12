# Portfolio Trust & Persistence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membuat Portfolio Web Generator bisa dipercaya — draft tersimpan di server, builder/preview/publik/export/print identik, tidak ada stored XSS, dan menutup portfolio tidak lagi menghapus karya user.

**Architecture:** Satu komponen React `PortfolioDocument` dengan mode `editor` | `static` menjadi satu-satunya renderer, dipakai empat konsumen. Draft pindah dari `localStorage` ke Postgres dengan `localStorage` sebagai cache write-through. Gambar pindah ke tabel aset agar draft JSON tetap kecil. Validasi Zod jadi otoritas tunggal di server.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Drizzle ORM + Postgres, Zod 4, `motion` (framer-motion), dnd-kit, `next/og` ImageResponse, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-10-portfolio-trust-design.md`

## Global Constraints

- Tidak ada `text-[8px]` sampai `text-[11px]` di mana pun. Batas bawah `text-xs`.
- Semua target sentuh minimal 44×44 px di mobile.
- Tidak ada kontrol mati. Elemen yang tampak bisa diklik harus punya handler.
- Setiap bagian punya empty state yang mengarahkan ke aksi.
- `src/components/portfolio/render/**` tidak boleh memakai literal `rounded-*`, `shadow-*`, `backdrop-blur`, atau hex warna di file baru. Yang ada di file lama boleh, tapi tidak boleh bertambah.
- URL user harus selalu melewati `safeUrl()` sebelum masuk `href` atau `src`.
- Copy dalam bahasa Indonesia yang lugas, bukan terjemahan harfiah.
- Semua tanggal portfolio berformat `YYYY-MM`.
- Satu sumber kebenaran untuk validasi slug: `src/lib/portfolio-safety.ts`.
- Semua task harus lulus `npx tsc --noEmit` dan `npm test` sebelum commit.
- Nama file baru memakai kebab-case. Test memakai `.test.ts` / `.test.tsx` di `src/__tests__/`.

**Peringatan:** beberapa langkah di plan ini memuat string contoh yang sengaja ditandai untuk diganti (karena penulisan ulang karakter non-Latin bisa merusak file). Setiap kali muncul catatan "perbaiki string non-Latin", tulis ulang kalimatnya sebagai bahasa Indonesia biasa sebelum menjalankan test.

---

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

### Task 2: `SafeLink` dan `SafeImg`

Menutup celah XSS halaman publik sekarang juga mencegahnya kembali muncul di spec berikutnya.

**Files:**
- Create: `src/components/portfolio/render/SafeLink.tsx`
- Test: `src/__tests__/portfolio-safe-link.test.tsx`

**Interfaces:**
- Consumes: `safeUrl(v: string): string`
- Produces:
  - `<SafeLink href mode className target rel children>` dengan `mode: "editor" | "static"`
  - `<SafeImg src mode alt width height className>`
  - `export type SafeRenderMode = "editor" | "static"`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-safe-link.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SafeLink, SafeImg } from "@/components/portfolio/render/SafeLink";

describe("SafeLink", () => {
  it("merender tautan https tanpa perubahan", () => {
    render(
      <SafeLink href="https://github.com/teguh" mode="static">Repo</SafeLink>,
    );
    expect(screen.getByRole("link", { name: "Repo" })).toHaveAttribute(
      "href",
      "https://github.com/teguh",
    );
  });

  it("tidak menghasilkan href untuk javascript: di mode static", () => {
    render(<SafeLink href="javascript:alert(1)" mode="static">Jahat</SafeLink>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Jahat")).toBeInTheDocument();
  });

  it("memberi prefiks https pada domain telanjang", () => {
    render(
      <SafeLink href="linkedin.com/in/teguh" mode="static">LinkedIn</SafeLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://linkedin.com/in/teguh",
    );
  });

  it("memperingatkan editor saat tautan ditolak", () => {
    render(<SafeLink href="data:text/html,x" mode="editor">Fail</SafeLink>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/tautan ditolak/i)).toBeInTheDocument();
  });

  it("membuka tautan eksternal di tab baru dengan rel aman", () => {
    render(
      <SafeLink href="https://example.com" mode="static" target="_blank">Ext</SafeLink>,
    );
    const a = screen.getByRole("link");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("merender mailto dan tel", () => {
    render(
      <>
        <SafeLink href="mailto:teguh@example.com" mode="static">Mail</SafeLink>
        <SafeLink href="tel:+628123456789" mode="static">Tel</SafeLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "Mail" })).toHaveAttribute(
      "href",
      "mailto:teguh@example.com",
    );
    expect(screen.getByRole("link", { name: "Tel" })).toHaveAttribute(
      "href",
      "tel:+628123456789",
    );
  });
});

describe("SafeImg", () => {
  it("merender gambar yang diizinkan", () => {
    render(
      <SafeImg src="/api/portfolio/assets/abc" mode="static" alt="Foto Teguh" width={200} height={200} />,
    );
    expect(screen.getByAltText("Foto Teguh")).toBeInTheDocument();
  });

  it("mengganti gambar dengan skema terlarang menjadi placeholder", () => {
    render(<SafeImg src="javascript:alert(1)" mode="static" alt="X" width={100} height={100} />);
    expect(screen.queryByAltText("X")).toBeNull();
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });

  it("menampilkan placeholder saat src kosong", () => {
    render(<SafeImg src="" mode="static" alt="Kosong" width={10} height={10} />);
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-safe-link.test.tsx`
Expected: FAIL — modul tidak ada

- [ ] **Step 3: Buat `src/components/portfolio/render/SafeLink.tsx`**

```tsx
"use client";

import { safeUrl } from "@/lib/portfolio-safety";

export type SafeRenderMode = "editor" | "static";

type SafeLinkProps = {
  href: string;
  mode: SafeRenderMode;
  className?: string;
  target?: string;
  children: React.ReactNode;
};

/**
 * Satu-satunya jalan masuk user-supplied URL ke atribut href.
 * Mode static: skema terlarang dirender jadi span tanpa href.
 * Mode editor: skema terlarang diberi tanda merah supaya terlihat saat menyunting.
 */
export function SafeLink({ href, mode, className, target, children }: SafeLinkProps) {
  const safe = safeUrl(href ?? "");

  if (!safe) {
    if (mode !== "editor") return <span className={className}>{children}</span>;
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className={className}>{children}</span>
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
          tautan ditolak - skema tidak diizinkan
        </span>
      </span>
    );
  }

  const external = /^https?:\/\//i.test(safe);

  return (
    <a
      href={safe}
      className={className}
      {...(target ? { target } : {})}
      {...(external ? { rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

type SafeImgProps = {
  src: string;
  mode: SafeRenderMode;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
};

/**
 * src yang lolos safeUrl. Data URI gambar tetap boleh supaya aset yang
 * sudah di-inline saat export bisa dirender.
 */
export function SafeImg({ src, mode, alt, width, height, className }: SafeImgProps) {
  const value = src ?? "";
  const ok =
    /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);/i.test(value) ||
    safeUrl(value) !== "";

  if (!ok) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container text-on-surface-variant ${className ?? ""}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span className="px-2 text-center text-xs">gambar tidak dapat ditampilkan</span>
      </div>
    );
  }

  return (
    <img
      src={value}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      data-editor-mode={mode}
    />
  );
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-safe-link.test.tsx`
Expected: PASS — 9 test

- [ ] **Step 5: Typecheck dan commit**

```bash
npx tsc --noEmit
git add src/components/portfolio/render/SafeLink.tsx src/__tests__/portfolio-safe-link.test.tsx
git commit -m "feat(portfolio): SafeLink dan SafeImg menutup stored XSS"
```

---

### Task 3: Ekstrak `PortfolioDocument` + `id` per section

Tugas terbesar dan fondasi semua perbaikan WYSIWYG berikutnya. Tidak mengubah tampilan, hanya memindahkan pohon render.

**Files:**
- Create: `src/components/portfolio/render/PortfolioDocument.tsx`
- Modify: `src/components/portfolio/PublishedPortfolio.tsx`
- Test: `src/__tests__/portfolio-document.test.tsx`

**Interfaces:**
- Consumes: 12 komponen dari `src/components/portfolio/sections/*`, `DEFAULT_SECTION_ORDER` dari `@/components/portfolio/themes`
- Produces:
  ```tsx
  export type RenderMode = "editor" | "static";
  export type PortfolioDocumentProps = {
    data: PortfolioData;
    themeId: ThemeId;
    mode: RenderMode;
    sectionOrder?: SectionId[];
    sectionVisibility?: Record<SectionId, boolean>;
    sectionColors?: Record<string, { primary: string; accent: string }> | null;
    fontSize?: FontSize;
    onSectionClick?: (id: SectionId) => void;
  };
  export function PortfolioDocument(props: PortfolioDocumentProps): JSX.Element;
  ```

- [ ] **Step 1: Baca signature props yang sebenarnya**

Run:
```
rg -n 'export default function|export function' src/components/portfolio/sections/
```

Catat nama prop tiap section. Lanjut ke langkah 3.

- [ ] **Step 2: Tulis test yang gagal**

`src/__tests__/portfolio-document.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";
import type { PortfolioData } from "@/components/portfolio-templates/types";

const data = {
  formData: {
    heroPhotoUrl: "",
    heroHeadline: "Frontend Developer",
    heroSubHeadline: "",
    heroFirstName: "Teguh",
    heroLastName: "Surya",
    heroBio: "",
    aboutText: "Tentang saya",
    aboutYearsExp: "4",
    aboutProjectsDone: "18",
    aboutClientsHappy: "12",
    skillsMain: "React",
    skillsTools: "",
    skillsLanguages: "",
    contactEmail: "teguh@example.com",
    contactPhone: "",
    contactLinkedin: "",
    contactGithub: "",
  },
  projects: [
    { id: "p1", name: "Website Kantor", description: "D", techStack: "React", link: "" },
  ],
  experiences: [],
  educations: [],
  certifications: [],
  organizations: [],
  hobbies: [],
  testimonials: [],
  extraLinks: [],
} as unknown as PortfolioData;

describe("PortfolioDocument", () => {
  it("memberi id pada setiap section supaya anchor hero bekerja", () => {
    const { container } = render(
      <PortfolioDocument data={data} themeId="glass" mode="static" />,
    );
    const ids = [...container.querySelectorAll("[data-section-id]")].map((s) =>
      s.getAttribute("data-section-id"),
    );
    expect(ids).toContain("hero");
    expect(ids).toContain("projects");
    expect(ids).toContain("contact");
  });

  it("menghormati sectionOrder", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["contact", "hero"]}
      />,
    );
    const ids = [...container.querySelectorAll("[data-section-id]")].map((s) =>
      s.getAttribute("data-section-id"),
    );
    expect(ids[0]).toBe("contact");
    expect(ids[1]).toBe("hero");
  });

  it("tidak merender section yang disembunyikan", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["hero", "projects"]}
        sectionVisibility={{ hero: true, projects: false }}
      />,
    );
    expect(container.querySelector('[data-section-id="projects"]')).toBeNull();
    expect(container.querySelector('[data-section-id="hero"]')).not.toBeNull();
  });

  it("memanggil onSectionClick di mode editor", () => {
    const onSectionClick = vi.fn();
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="editor"
        onSectionClick={onSectionClick}
      />,
    );
    const hero = container.querySelector('[data-section-id="hero"]') as HTMLElement;
    hero.click();
    expect(onSectionClick).toHaveBeenCalledWith("hero");
  });

  it("tidak melempar error untuk data kosong", () => {
    const kosong = {
      ...data,
      formData: { ...data.formData, heroFirstName: "", heroLastName: "", aboutText: "" },
      projects: [],
    } as unknown as PortfolioData;
    expect(() =>
      render(<PortfolioDocument data={kosong} themeId="brutal" mode="static" />),
    ).not.toThrow();
  });
});
```

- [ ] **Step 3: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-document.test.tsx`
Expected: FAIL — modul tidak ada

- [ ] **Step 4: Buat `src/components/portfolio/render/PortfolioDocument.tsx`**

```tsx
import type { ReactNode } from "react";
import HeroSection from "../sections/HeroSection";
import AboutSection from "../sections/AboutSection";
import StatsSection from "../sections/StatsSection";
import ExperienceSection from "../sections/ExperienceSection";
import EducationSection from "../sections/EducationSection";
import ProjectsSection from "../sections/ProjectsSection";
import SkillsSection from "../sections/SkillsSection";
import CertificationsSection from "../sections/CertificationsSection";
import OrganizationsSection from "../sections/OrganizationsSection";
import HobbiesSection from "../sections/HobbiesSection";
import TestimonialsSection from "../sections/TestimonialsSection";
import ContactSection from "../sections/ContactSection";
import { DEFAULT_SECTION_ORDER } from "../themes";
import type { FontSize, SectionId, ThemeId } from "../types";
import type { PortfolioData } from "../../portfolio-templates/types";

export type RenderMode = "editor" | "static";

export type PortfolioDocumentProps = {
  data: PortfolioData;
  themeId: ThemeId;
  mode: RenderMode;
  sectionOrder?: SectionId[];
  sectionVisibility?: Record<SectionId, boolean>;
  sectionColors?: Record<string, { primary: string; accent: string }> | null;
  fontSize?: FontSize;
  onSectionClick?: (id: SectionId) => void;
};

/**
 * RENDERERS harus disesuaikan dengan signature prop asli setiap section
 * (hasil langkah 1). Contoh: ExperienceSection mungkin menerima
 * `{ experiences }` alih-alih `{ items }`.
 */
const RENDERERS: Record<SectionId, (d: PortfolioData) => ReactNode> = {
  hero: (d) => <HeroSection data={d.formData} />,
  about: (d) => <AboutSection data={d.formData} />,
  stats: (d) => <StatsSection data={d.formData} />,
  experience: (d) => <ExperienceSection items={d.experiences} />,
  education: (d) => <EducationSection items={d.educations} />,
  projects: (d) => <ProjectsSection items={d.projects} />,
  skills: (d) => <SkillsSection data={d.formData} />,
  certifications: (d) => <CertificationsSection items={d.certifications} />,
  organizations: (d) => <OrganizationsSection items={d.organizations} />,
  hobbies: (d) => <HobbiesSection items={d.hobbies} />,
  testimonials: (d) => <TestimonialsSection items={d.testimonials} />,
  contact: (d) => <ContactSection data={d.formData} extraLinks={d.extraLinks} />,
};

/**
 * Satu-satunya pohon render portfolio. Empat konsumen memakai ini:
 * canvas builder (editor), /portfolio/preview (editor), /p/[slug] (static),
 * dan export HTML (static lewat renderToStaticMarkup).
 */
export function PortfolioDocument({
  data,
  themeId,
  mode,
  sectionOrder,
  sectionVisibility,
  fontSize = "medium",
  onSectionClick,
}: PortfolioDocumentProps) {
  const order = sectionOrder?.length ? sectionOrder : DEFAULT_SECTION_ORDER;
  const scale =
    fontSize === "large" ? "1.12" : fontSize === "small" ? "0.92" : "1";

  return (
    <div
      data-theme={themeId}
      data-mode={mode}
      data-font-size={fontSize}
      style={{ ["--pf-font-scale" as string]: scale }}
    >
      {order.map((id) => {
        if (sectionVisibility && sectionVisibility[id] === false) return null;
        const render = RENDERERS[id];
        if (!render) return null;
        return (
          <div
            key={id}
            id={id}
            data-section-id={id}
            className="pf-section"
            onClick={
              mode === "editor" && onSectionClick ? () => onSectionClick(id) : undefined
            }
          >
            {render(data)}
          </div>
        );
      })}
    </div>
  );
}

export default PortfolioDocument;
```

- [ ] **Step 5: Cocokkan `RENDERERS` dengan signature asli**

Bandingkan tiap baris `RENDERERS` dengan hasil langkah 1. Ubah nama prop di `RENDERERS` saja. Jangan mengubah komponen section di task ini.

- [ ] **Step 6: Arahkan `PublishedPortfolio.tsx` ke dokumen**

Ganti blok render section dengan:

```tsx
import PortfolioDocument from "./render/PortfolioDocument";

<PortfolioDocument
  data={data}
  themeId={theme as ThemeId}
  mode="static"
  sectionOrder={data.sectionOrder}
  sectionVisibility={data.sectionVisibility}
/>
```

Hapus import langsung ke 12 komponen section dari file itu.

- [ ] **Step 7: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-document.test.tsx`
Expected: PASS — 5 test

- [ ] **Step 8: Test penuh dan commit**

```bash
npm test
npx tsc --noEmit
git add src/components/portfolio/render/PortfolioDocument.tsx src/components/portfolio/PublishedPortfolio.tsx src/__tests__/portfolio-document.test.tsx
git commit -m "refactor(portfolio): PortfolioDocument sebagai satu-satunya renderer"
```

---

### Task 4: Arahkan builder, preview, dan halaman publik ke `PortfolioDocument`

Menghapus tiga WYSIWYG break sekaligus: preview mengabaikan `sectionOrder`, `sectionColors` hanya di builder, dan `fontSize` tidak terpakai.

**Files:**
- Modify: `src/components/portfolio/PortfolioCanvas.tsx`
- Modify: `src/app/portfolio/preview/page.tsx`
- Modify: `src/app/p/[slug]/page.tsx`
- Test: `src/__tests__/portfolio-consumers.test.tsx`

**Interfaces:**
- Consumes: `PortfolioDocument` dari Task 3
- Produces: ketiga konsumen memakai `sectionOrder`, `sectionVisibility`, dan `fontSize` yang sama

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-consumers.test.tsx`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("konsumen PortfolioDocument", () => {
  it("preview memakai sectionOrder, bukan daftar hardcoded", () => {
    const src = read("src/app/portfolio/preview/page.tsx");
    expect(src).toContain("PortfolioDocument");
    expect(src).toContain("sectionOrder=");
    expect(src).toContain("sectionVisibility=");
    expect(src).not.toMatch(/from "@\/components\/portfolio\/sections\//);
  });

  it("halaman publik memakai mode static", () => {
    expect(read("src/app/p/[slug]/page.tsx")).toContain('mode="static"');
  });

  it("canvas builder memakai mode editor dan meneruskan onSectionClick", () => {
    const src = read("src/components/portfolio/PortfolioCanvas.tsx");
    expect(src).toContain('mode="editor"');
    expect(src).toContain("onSectionClick=");
  });

  it("canvas builder tidak lagi mengimpor 12 section langsung", () => {
    const src = read("src/components/portfolio/PortfolioCanvas.tsx");
    expect(src.match(/portfolio\/sections\//g)?.length ?? 0).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-consumers.test.tsx`
Expected: FAIL

- [ ] **Step 3: Ubah preview**

Di `src/app/portfolio/preview/page.tsx`, ganti daftar section hardcoded dengan:

```tsx
<PortfolioDocument
  data={data}
  themeId={themeId}
  mode="editor"
  sectionOrder={data.sectionOrder}
  sectionVisibility={data.sectionVisibility}
  fontSize={fontSize}
/>
```

Tambahkan import:

```tsx
import PortfolioDocument from "@/components/portfolio/render/PortfolioDocument";
```

Hapus import ke komponen section.

- [ ] **Step 4: Ubah halaman publik**

Di `src/app/p/[slug]/page.tsx`:

```tsx
<PortfolioDocument
  data={data}
  themeId={theme as ThemeId}
  mode="static"
  sectionOrder={data.sectionOrder}
  sectionVisibility={data.sectionVisibility}
  fontSize={row.fontSize ?? "medium"}
  sectionColors={row.sectionColors ?? null}
/>
```

Tambahkan `fontSize`, `sectionColors`, dan `themeId` ke select query, atau baca dari `row.data`.

- [ ] **Step 5: Ubah canvas builder**

Di `src/components/portfolio/PortfolioCanvas.tsx`, ganti pemanggilan 12 section di dalam `<main>` dengan:

```tsx
<PortfolioDocument
  data={data}
  themeId={themeId}
  mode="editor"
  sectionOrder={sectionOrder}
  sectionVisibility={sectionVisibility}
  fontSize={fontSize}
  sectionColors={sectionColors ?? null}
  onSectionClick={onSectionClick}
/>
```

Bila `PortfolioCanvas` sudah membungkus tiap section dengan handle drag sendiri, hapus wrapper itu supaya tidak ada dua handle.

- [ ] **Step 6: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-consumers.test.tsx`
Expected: PASS — 4 test

- [ ] **Step 7: Test penuh, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/app/portfolio/preview/page.tsx "src/app/p/[slug]/page.tsx" src/components/portfolio/PortfolioCanvas.tsx src/components/portfolio/render/PortfolioDocument.tsx src/__tests__/portfolio-consumers.test.tsx
git commit -m "refactor(portfolio): builder, preview, publik pakai satu renderer"
```

---

### Task 5: Print stylesheet + tombol Simpan PDF

**Files:**
- Create: `src/app/portfolio/print.css`
- Modify: `src/app/portfolio/preview/page.tsx`
- Modify: `src/app/p/[slug]/page.tsx`
- Modify: `src/components/portfolio/sections/HeroSection.tsx` (kelas `pf-atmosphere`)
- Test: `src/__tests__/portfolio-print.test.ts`

**Interfaces:**
- Consumes: kelas `pf-section` dari `PortfolioDocument`
- Produces: `?print=1` yang memaksa `mode="static"` dan menyalakan gaya cetak

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-print.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/app/portfolio/print.css"), "utf8");

describe("print stylesheet", () => {
  it("menyembunyikan lapisan atmosfer saat print", () => {
    expect(css).toMatch(/@media print/);
    expect(css).toMatch(/\.pf-atmosphere/);
    expect(css).toContain("display: none");
  });

  it("memaksa cetak warna", () => {
    expect(css).toContain("print-color-adjust: exact");
  });

  it("menghapus shadow dan blur yang tidak tercetak", () => {
    expect(css).toMatch(/box-shadow:\s*none/);
    expect(css).toMatch(/backdrop-filter:\s*none/);
  });

  it("mencegah kartu terbelah antar halaman", () => {
    expect(css).toMatch(/break-inside:\s*avoid/);
  });

  it("mengatur ukuran dan margin halaman A4", () => {
    expect(css).toMatch(/@page/);
    expect(css).toMatch(/size:\s*A4/);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-print.test.ts`
Expected: FAIL — file tidak ada

- [ ] **Step 3: Buat `src/app/portfolio/print.css`**

```css
/* Gaya cetak portfolio. Dimuat hanya ketika ?print=1 aktif.
   Prinsip: atmosphere (grain, orb, particle) adalah dekorasi layar dan
   tidak pernah menjadi bagian dari dokumen cetak. */

@media print {
  @page {
    size: A4;
    margin: 12mm;
  }

  html,
  body {
    background: #ffffff !important;
  }

  .pf-atmosphere,
  .pf-chrome,
  [data-pf-print-hidden="true"] {
    display: none !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .pf-card,
  .pf-section > * {
    box-shadow: none !important;
    backdrop-filter: none !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  h1,
  h2,
  h3,
  h4 {
    break-after: avoid;
    page-break-after: avoid;
  }

  a {
    text-decoration: underline;
  }

  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.75em;
    word-break: break-all;
  }
}
```

- [ ] **Step 4: Tandai lapisan atmosfer**

Run:
```
rg -n 'feTurbulence|fixed inset-0|position: ?fixed' src/components/portfolio/sections/
```

Untuk setiap hasil, tambahkan kelas `pf-atmosphere` pada elemen dekoratif terluar tersebut. Contoh:

```tsx
<div className="pf-atmosphere pointer-events-none fixed inset-0 z-0 opacity-[0.03]" aria-hidden />
```

- [ ] **Step 5: Selesaikan `?print=1` di halaman publik**

Di `src/app/p/[slug]/page.tsx`:

```tsx
const printMode = searchParams?.print === "1";

if (printMode) {
  await import("../portfolio/print.css");
}
```

Sematkan `data-pf-print-hidden="true"` pada elemen chrome builder dan tombol navigasi.

- [ ] **Step 6: Tambahkan tombol Simpan PDF di preview**

```tsx
<button
  type="button"
  onClick={() => {
    const target = publishedSlug
      ? `/p/${publishedSlug}?print=1`
      : `/portfolio/preview?print=1`;
    window.open(target, "_blank", "noopener");
  }}
  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold"
>
  <span className="material-symbols-outlined text-lg" aria-hidden>picture_as_pdf</span>
  Simpan PDF
</button>
```

`publishedSlug` diambil dari status publish yang sudah ada di halaman ini.

- [ ] **Step 7: Jalankan test, typecheck, commit**

```bash
npx vitest run src/__tests__/portfolio-print.test.ts
npm test
npx tsc --noEmit
git add src/app/portfolio/print.css src/app/portfolio/preview/page.tsx "src/app/p/[slug]/page.tsx" src/components/portfolio/sections src/__tests__/portfolio-print.test.ts
git commit -m "feat(portfolio): tampilan cetak dan tombol Simpan PDF"
```

---

### Task 6: Migrasi 0021 - tabel `portfolio_drafts`

**Files:**
- Create: `drizzle/0021_portfolio_drafts.sql`
- Create: `scripts/apply-0021-portfolio-drafts.mjs`
- Modify: `src/db/schema/index.ts`

**Interfaces:**
- Produces: `portfolioDrafts` diekspor dari `@/db/schema`

- [ ] **Step 1: Tambah tabel ke `src/db/schema/index.ts`**

Tambahkan setelah blok `portfolioTrialUses`:

```ts
/** Draft portfolio milik user. Banyak draft per user. Data disimpan utuh
 *  sebagai JSONB dan divalidasi Zod di server sebelum ditulis. */
export const portfolioDrafts = pgTable(
  "portfolio_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull().default("Portfolio saya"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    userIdx: index("portfolio_drafts_user_idx").on(t.userId),
  }),
);
```

Pastikan `index` sudah di-import dari `drizzle-orm/pg-core`.

- [ ] **Step 2: Buat `drizzle/0021_portfolio_drafts.sql`**

```sql
-- 0021_portfolio_drafts.sql
-- Draft portfolio pindah dari localStorage ke server.
CREATE TABLE IF NOT EXISTS "portfolio_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" varchar(120) DEFAULT 'Portfolio saya' NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_drafts_user_idx') THEN
    CREATE INDEX "portfolio_drafts_user_idx" ON "portfolio_drafts" USING btree ("user_id");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_drafts_user_id_users_fk'
  ) THEN
    ALTER TABLE "portfolio_drafts"
      ADD CONSTRAINT "portfolio_drafts_user_id_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
```

- [ ] **Step 3: Buat `scripts/apply-0021-portfolio-drafts.mjs`**

```js
/**
 * Jalankan migrasi 0021 (portfolio_drafts) di luar drizzle-kit.
 * Pemakaian: node scripts/apply-0021-portfolio-drafts.mjs
 * Membaca DATABASE_URL dari environment.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(here, "..", "drizzle", "0021_portfolio_drafts.sql");
const sql = readFileSync(sqlPath, "utf8");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set.");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  const { rows } = await client.query("SELECT count(*)::int AS n FROM portfolio_drafts");
  console.log("0021 selesai. Baris portfolio_drafts:", rows[0].n);
} finally {
  await client.end();
}
```

- [ ] **Step 4: Jalankan migrasi lokal**

Run: `node scripts/apply-0021-portfolio-drafts.mjs`
Expected: `0021 selesai. Baris portfolio_drafts: 0`

- [ ] **Step 5: Typecheck dan commit**

```bash
npx tsc --noEmit
git add drizzle/0021_portfolio_drafts.sql scripts/apply-0021-portfolio-drafts.mjs src/db/schema/index.ts
git commit -m "feat(db): tabel portfolio_drafts"
```

---

### Task 7: Migrasi 0022 - tabel `portfolio_assets`

**Files:**
- Create: `drizzle/0022_portfolio_assets.sql`
- Create: `scripts/apply-0022-portfolio-assets.mjs`
- Modify: `src/db/schema/index.ts`

**Interfaces:**
- Produces: `portfolioAssets` diekspor dari `@/db/schema`

- [ ] **Step 1: Tambah tabel ke `src/db/schema/index.ts`**

```ts
/** Aset gambar portfolio. Disimpan sebagai bytea agar draft JSON tetap kecil
 *  dan file HTML export bisa meng-inline gambar tanpa kehilangan. */
export const portfolioAssets = pgTable(
  "portfolio_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mime: varchar("mime", { length: 32 }).notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    userHashIdx: uniqueIndex("portfolio_assets_user_sha_idx").on(t.userId, t.sha256),
    userIdx: index("portfolio_assets_user_idx").on(t.userId),
  }),
);
```

Pastikan `uniqueIndex`, `integer`, dan `bytea` sudah di-import.

- [ ] **Step 2: Buat `drizzle/0022_portfolio_assets.sql`**

```sql
-- 0022_portfolio_assets.sql
-- Aset gambar portfolio pindah dari base64 di dalam JSON ke tabel sendiri.
CREATE TABLE IF NOT EXISTS "portfolio_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "mime" varchar(32) NOT NULL,
  "bytes" integer NOT NULL,
  "width" integer,
  "height" integer,
  "sha256" varchar(64) NOT NULL,
  "data" bytea NOT NULL,
  "created_at" timestamp DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_assets_user_sha_idx') THEN
    CREATE UNIQUE INDEX "portfolio_assets_user_sha_idx" ON "portfolio_assets" USING btree ("user_id","sha256");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_assets_user_idx') THEN
    CREATE INDEX "portfolio_assets_user_idx" ON "portfolio_assets" USING btree ("user_id");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_assets_user_id_users_fk'
  ) THEN
    ALTER TABLE "portfolio_assets"
      ADD CONSTRAINT "portfolio_assets_user_id_users_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
```

- [ ] **Step 3: Buat `scripts/apply-0022-portfolio-assets.mjs`**

Sama seperti script 0021, hanya nama file dan query verifikasi yang berbeda:

```js
const sqlPath = join(here, "..", "drizzle", "0022_portfolio_assets.sql");
```

```js
const { rows } = await client.query("SELECT count(*)::int AS n FROM portfolio_assets");
console.log("0022 selesai. Baris portfolio_assets:", rows[0].n);
```

- [ ] **Step 4: Jalankan migrasi lokal**

Run: `node scripts/apply-0022-portfolio-assets.mjs`
Expected: `0022 selesai. Baris portfolio_assets: 0`

- [ ] **Step 5: Typecheck dan commit**

```bash
npx tsc --noEmit
git add drizzle/0022_portfolio_assets.sql scripts/apply-0022-portfolio-assets.mjs src/db/schema/index.ts
git commit -m "feat(db): tabel portfolio_assets"
```

---

### Task 8: API draft + `usePortfolioDraft`

**Files:**
- Create: `src/lib/portfolio/usePortfolioDraft.ts`
- Create: `src/app/api/portfolio/draft/route.ts`
- Test: `src/__tests__/portfolio-draft-store.test.ts`

**Interfaces:**
- Consumes: `db`, `portfolioDrafts`, `draftPayloadSchema`
- Produces:
  - `GET /api/portfolio/draft?draftId=` → `{ draftId, name, data, updatedAt }`, atau draft terbaru bila `draftId` kosong
  - `POST /api/portfolio/draft` → `{ draftId }` (201)
  - `PATCH /api/portfolio/draft` → `{ updatedAt }`
  - `DELETE /api/portfolio/draft?draftId=` → `{ ok: true }`
  - `cacheKey`, `readCache`, `writeCache`, `clearCache`, `usePortfolioDraft`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-draft-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  cacheKey,
  readCache,
  writeCache,
  clearCache,
  type CachedDraft,
} from "@/lib/portfolio/usePortfolioDraft";

const draft = {
  name: "Portfolio saya",
  data: { formData: {} },
  updatedAt: "2026-10-10T00:00:00.000Z",
} as unknown as CachedDraft;

describe("cache draft", () => {
  beforeEach(() => localStorage.clear());

  it("membuat kunci cache per draft", () => {
    expect(cacheKey("abc")).toBe("portfolio_cache_v1_abc");
  });

  it("menulis dan membaca cache", () => {
    writeCache("abc", draft);
    expect(readCache("abc")).toEqual(draft);
  });

  it("mengembalikan null saat cache kosong atau rusak", () => {
    expect(readCache("kosong")).toBeNull();
    localStorage.setItem(cacheKey("rusak"), "{bukan json");
    expect(readCache("rusak")).toBeNull();
  });

  it("membersihkan cache", () => {
    writeCache("abc", draft);
    clearCache("abc");
    expect(readCache("abc")).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-draft-store.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/usePortfolioDraft.ts`**

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ValidatedPortfolioData } from "./schema";

export type CachedDraft = {
  name: string;
  data: ValidatedPortfolioData;
  updatedAt: string;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function cacheKey(draftId: string): string {
  return `portfolio_cache_v1_${draftId}`;
}

export function readCache(draftId: string): CachedDraft | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(draftId));
    if (!raw) return null;
    return JSON.parse(raw) as CachedDraft;
  } catch {
    return null;
  }
}

export function writeCache(draftId: string, draft: CachedDraft): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(cacheKey(draftId), JSON.stringify(draft));
  } catch {
    // Cache penuh atau ditolak browser. Tidak menggagalkan alur: server
    // tetap sumber kebenaran dan banner offline memberi tahu user.
  }
}

export function clearCache(draftId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(cacheKey(draftId));
  } catch {
    /* diabaikan */
  }
}

const DEBOUNCE_MS = 1200;

export type UsePortfolioDraftResult = {
  draftId: string | null;
  data: ValidatedPortfolioData | null;
  setData: (
    next: ValidatedPortfolioData | ((p: ValidatedPortfolioData) => ValidatedPortfolioData),
  ) => void;
  name: string;
  setName: (n: string) => void;
  status: SaveStatus;
  offline: boolean;
  error: string | null;
  lastSavedAt: string | null;
  retry: () => void;
  loading: boolean;
};

export function usePortfolioDraft(draftId: string | null): UsePortfolioDraftResult {
  const [data, setDataState] = useState<ValidatedPortfolioData | null>(null);
  const [name, setName] = useState("Portfolio saya");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ValidatedPortfolioData | null>(null);
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!draftId) {
      setLoading(false);
      return;
    }
    if (hydratedFor.current === draftId) return;
    hydratedFor.current = draftId;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/portfolio/draft?draftId=${draftId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("gagal memuat");
        const json = (await res.json()) as CachedDraft;
        if (cancelled) return;
        setDataState(json.data);
        setName(json.name);
        setLastSavedAt(json.updatedAt);
        setOffline(false);
        writeCache(draftId, json);
      } catch {
        const cached = readCache(draftId);
        if (cancelled) return;
        if (cached) {
          setDataState(cached.data);
          setName(cached.name);
          setLastSavedAt(cached.updatedAt);
          setOffline(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const flush = useCallback(async () => {
    if (!draftId || !pending.current) return;
    const body = pending.current;
    pending.current = null;
    setStatus("saving");
    try {
      const res = await fetch("/api/portfolio/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, name, data: body }),
      });
      if (!res.ok) throw new Error("gagal menyimpan");
      const json = (await res.json()) as { updatedAt: string };
      setStatus("saved");
      setError(null);
      setOffline(false);
      setLastSavedAt(json.updatedAt);
      writeCache(draftId, { name, data: body, updatedAt: json.updatedAt });
    } catch {
      setStatus("error");
      setOffline(true);
      setError("Perubahan belum masuk server. Ketuk coba lagi.");
      writeCache(draftId, { name, data: body, updatedAt: new Date().toISOString() });
    }
  }, [draftId, name]);

  const setData = useCallback(
    (next: ValidatedPortfolioData | ((p: ValidatedPortfolioData) => ValidatedPortfolioData)) => {
      setDataState((prev) => {
        if (!prev) return prev;
        const value = typeof next === "function" ? next(prev) : next;
        pending.current = value;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
        return value;
      });
    },
    [flush],
  );

  const retry = useCallback(() => {
    if (!pending.current) return;
    void flush();
  }, [flush]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return {
    draftId,
    data,
    setData,
    name,
    setName,
    status,
    offline,
    error,
    lastSavedAt,
    retry,
    loading,
  };
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-draft-store.test.ts`
Expected: PASS — 4 test

- [ ] **Step 5: Buat `src/app/api/portfolio/draft/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioDrafts } from "@/db/schema";
import { draftPayloadSchema } from "@/lib/portfolio/schema";

export const dynamic = "force-dynamic";

const pick = {
  id: portfolioDrafts.id,
  name: portfolioDrafts.name,
  data: portfolioDrafts.data,
  updatedAt: portfolioDrafts.updatedAt,
};

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const draftId = request.nextUrl.searchParams.get("draftId");

  const base = draftId
    ? and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId))
    : eq(portfolioDrafts.userId, auth.userId);

  const [row] = await db
    .select(pick)
    .from(portfolioDrafts)
    .where(base)
    .orderBy(desc(portfolioDrafts.updatedAt))
    .limit(1);

  if (!row) {
    return draftId
      ? errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404)
      : NextResponse.json({ draftId: null });
  }

  return NextResponse.json({
    draftId: row.id,
    name: row.name,
    data: row.data,
    updatedAt: row.updatedAt.toISOString(),
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = draftPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_DATA",
      parsed.error.issues[0]?.message ?? "Data draft tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const [row] = await db
    .insert(portfolioDrafts)
    .values({
      userId: auth.userId,
      name: parsed.data.name ?? "Portfolio saya",
      data: parsed.data.data as Record<string, unknown>,
    })
    .returning({ id: portfolioDrafts.id });

  return NextResponse.json({ draftId: row.id }, { status: 201 });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const raw = (await request.json().catch(() => null)) as {
    draftId?: string;
    name?: string;
    data?: unknown;
  } | null;

  if (!raw?.draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  const parsed = draftPayloadSchema.safeParse({ name: raw.name, data: raw.data });
  if (!parsed.success) {
    return errorResponse(
      "INVALID_DATA",
      parsed.error.issues[0]?.message ?? "Data draft tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const [existing] = await db
    .select({ id: portfolioDrafts.id })
    .from(portfolioDrafts)
    .where(
      and(eq(portfolioDrafts.id, raw.draftId), eq(portfolioDrafts.userId, auth.userId)),
    )
    .limit(1);

  if (!existing) {
    return errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404);
  }

  const [row] = await db
    .update(portfolioDrafts)
    .set({
      name: parsed.data.name ?? "Portfolio saya",
      data: parsed.data.data as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(portfolioDrafts.id, raw.draftId))
    .returning({ updatedAt: portfolioDrafts.updatedAt });

  return NextResponse.json({ updatedAt: row.updatedAt.toISOString() });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json().catch(() => ({}))) as { draftId?: string };
  const draftId = request.nextUrl.searchParams.get("draftId") ?? body.draftId;

  if (!draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  await db
    .delete(portfolioDrafts)
    .where(and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId)));

  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 6: Typecheck dan commit**

```bash
npx tsc --noEmit
git add src/lib/portfolio/usePortfolioDraft.ts src/app/api/portfolio/draft/route.ts src/__tests__/portfolio-draft-store.test.ts
git commit -m "feat(portfolio): API draft + hook dengan cache write-through"
```

---

### Task 9: API aset + upload ke storage server

Menghapus jebakan base64: foto 4 MB tidak lagi menjadi string 4 MB di dalam draft JSON.

**Files:**
- Create: `src/lib/portfolio/assets.ts`
- Create: `src/app/api/portfolio/assets/route.ts`
- Create: `src/app/api/portfolio/assets/[id]/route.ts`
- Create: `src/components/portfolio/render/PortfolioPhotoUpload.tsx`
- Modify: `src/app/portfolio/build/page.tsx`
- Delete: `src/components/portfolio/PhotoUpload.tsx` (bila sudah tidak ada importer)
- Test: `src/__tests__/portfolio-assets.test.ts`

**Interfaces:**
- Produces:
  - `MAX_ASSET_BYTES`, `ALLOWED_MIME`, `isAllowedMime`, `assetUrl`, `readImageSize`, `fitsDimensionBudget`, `dimensionWarning`
  - `POST /api/portfolio/assets` (multipart, field `file`) → `{ id, url, width, height, bytes, deduplicated }`
  - `GET /api/portfolio/assets/[id]` → bytes, hanya untuk pemiliknya
  - `<PortfolioPhotoUpload value onChange label hint className />`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-assets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  MAX_ASSET_BYTES,
  ALLOWED_MIME,
  isAllowedMime,
  fitsDimensionBudget,
  dimensionWarning,
  readImageSize,
} from "@/lib/portfolio/assets";

describe("validasi aset", () => {
  it("membatasi ukuran 4 MB", () => {
    expect(MAX_ASSET_BYTES).toBe(4194304);
  });

  it("hanya menerima gambar yang didukung", () => {
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("image/webp")).toBe(true);
    expect(isAllowedMime("image/svg+xml")).toBe(false);
    expect(isAllowedMime("application/pdf")).toBe(false);
  });

  it("menandai gambar yang melebihi anggaran dimensi", () => {
    expect(fitsDimensionBudget(4000, 3000)).toBe(false);
    expect(fitsDimensionBudget(1600, 1200)).toBe(true);
    expect(dimensionWarning(4000, 3000)).toContain("4000");
  });

  it("membaca dimensi PNG dari header", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x03, 0x20, 0x00, 0x00, 0x01, 0xe0,
    ]);
    expect(readImageSize(png, "image/png")).toEqual({ width: 800, height: 480 });
  });

  it("mengembalikan null untuk format tak didukung", () => {
    expect(readImageSize(Buffer.alloc(4), "image/webp")).toBeNull();
  });

  it("menyebutkan daftar format yang diterima", () => {
    expect(ALLOWED_MIME.join(", ")).toContain("image/webp");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-assets.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/assets.ts`**

```ts
export const MAX_ASSET_BYTES = 4 * 1024 * 1024;

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export function isAllowedMime(mime: string): boolean {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

/** Dimensi maksimum agar file export tidak terlalu berat. */
export const BUDGET_PX = 2200;

export function fitsDimensionBudget(width: number, height: number): boolean {
  return Math.max(width, height) <= BUDGET_PX;
}

export function dimensionWarning(width: number, height: number): string {
  return `Gambar ${width}x${height} px melebihi ${BUDGET_PX} px. Berkas export akan berat, pertimbangkan gambar yang lebih kecil.`;
}

export function assetUrl(id: string): string {
  return `/api/portfolio/assets/${id}`;
}

/** Deteksi dimensi PNG/GIF/JPEG dari header byte tanpa library gambar. */
export function readImageSize(
  buf: Buffer,
  mime: string,
): { width: number; height: number } | null {
  if (mime === "image/png" && buf.length > 24 && buf.readUInt32BE(12) === 0x49484452) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (mime === "image/gif" && buf.length > 10) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  if (mime === "image/jpeg") {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-assets.test.ts`
Expected: PASS — 6 test

- [ ] **Step 5: Buat `src/app/api/portfolio/assets/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioAssets } from "@/db/schema";
import {
  MAX_ASSET_BYTES,
  ALLOWED_MIME,
  isAllowedMime,
  assetUrl,
  readImageSize,
} from "@/lib/portfolio/assets";

export const dynamic = "force-dynamic";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return errorResponse("NO_FILE", "Tidak ada berkas yang diunggah", 400);
  }

  if (!isAllowedMime(file.type)) {
    return errorResponse(
      "UNSUPPORTED_TYPE",
      `Format ${file.type || "tidak dikenal"} tidak didukung. Gunakan: ${ALLOWED_MIME.join(", ")}.`,
      415,
    );
  }

  if (file.size > MAX_ASSET_BYTES) {
    return errorResponse(
      "FILE_TOO_LARGE",
      `Ukuran maksimal 4 MB. Berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      413,
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const [existing] = await db
    .select()
    .from(portfolioAssets)
    .where(
      and(eq(portfolioAssets.userId, auth.userId), eq(portfolioAssets.sha256, sha256)),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      url: assetUrl(existing.id),
      width: existing.width,
      height: existing.height,
      bytes: existing.bytes,
      deduplicated: true,
    });
  }

  const size = readImageSize(buf, file.type);
  const [row] = await db
    .insert(portfolioAssets)
    .values({
      userId: auth.userId,
      mime: file.type,
      bytes: buf.byteLength,
      width: size?.width ?? null,
      height: size?.height ?? null,
      sha256,
      data: buf,
    })
    .returning({ id: portfolioAssets.id });

  return NextResponse.json(
    {
      id: row.id,
      url: assetUrl(row.id),
      width: size?.width ?? null,
      height: size?.height ?? null,
      bytes: buf.byteLength,
      deduplicated: false,
    },
    { status: 201 },
  );
});
```

- [ ] **Step 6: Buat route aset yang melayani editor sekaligus halaman publik**

`src/app/api/portfolio/assets/[id]/route.ts`. Route ini **tidak** memakai `withAuth`, karena halaman `/p/[slug]` dibuka anonim dan gambar di dalamnya harus tampil. Akses diberikan bila salah satu berlaku: aset milik user yang sedang login, atau id aset dirujuk oleh data portfolio berstatus `published`.

```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioAssets, portfolioPages } from "@/db/schema";

export const dynamic = "force-dynamic";

export const GET = async (
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  const { id } = await ctx.params;

  const [row] = await db
    .select()
    .from(portfolioAssets)
    .where(eq(portfolioAssets.id, id))
    .limit(1);

  if (!row) return errorResponse("ASSET_NOT_FOUND", "Gambar tidak ditemukan", 404);

  const session = await auth();
  const isOwner = !!session?.user?.id && session.user.id === row.userId;

  if (!isOwner) {
    const needle = `/api/portfolio/assets/${id}`;
    const pages = await db
      .select({ data: portfolioPages.data })
      .from(portfolioPages)
      .where(eq(portfolioPages.status, "published"));
    const referenced = pages.some((p) =>
      JSON.stringify(p.data ?? "").includes(needle),
    );
    if (!referenced) {
      return errorResponse("ASSET_NOT_FOUND", "Gambar tidak ditemukan", 404);
    }
  }

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(row.bytes),
    },
  });
};
```

Repo ini memakai NextAuth v5, jadi session diambil dengan `await auth()` dari `@/lib/auth` - bukan `getServerSession`. `errorResponse` dari `@/lib/api-utils` bisa dipanggil tanpa `apiHandler`.

- [ ] **Step 7: Buat `src/components/portfolio/render/PortfolioPhotoUpload.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import {
  ALLOWED_MIME,
  MAX_ASSET_BYTES,
  dimensionWarning,
  fitsDimensionBudget,
} from "@/lib/portfolio/assets";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  className?: string;
};

export default function PortfolioPhotoUpload({
  value,
  onChange,
  label,
  hint,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setNotice(null);

    if (file.size > MAX_ASSET_BYTES) {
      setError(
        `Ukuran maksimal 4 MB. Berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/portfolio/assets", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengunggah gambar");
        return;
      }
      onChange(json.url as string);
      if (json.width && json.height && !fitsDimensionBudget(json.width, json.height)) {
        setNotice(dimensionWarning(json.width, json.height));
      }
    } catch {
      setError("Gagal mengunggah gambar. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <span className="mb-1 block text-sm font-medium text-on-surface">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden>upload</span>
          {busy ? "Mengunggah" : "Pilih gambar"}
        </button>
        <span className="truncate text-xs text-on-surface-variant">
          {value ? value : "Belum ada gambar"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME.join(",")}
        onChange={onPick}
        className="sr-only"
        aria-label={label}
      />
      {hint ? <p className="mt-1 text-xs text-on-surface-variant">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
      {notice ? <p className="mt-1 text-xs text-amber-700">{notice}</p> : null}
    </div>
  );
}
```

- [ ] **Step 8: Arahkan builder ke komponen baru**

Di `src/app/portfolio/build/page.tsx`, ganti pemakaian `PhotoUpload` untuk `heroPhotoUrl` dengan `PortfolioPhotoUpload`. Hapus alur yang menyimpan base64 ke `formData.heroPhotoUrl`.

- [ ] **Step 9: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/lib/portfolio/assets.ts "src/app/api/portfolio/assets/route.ts" "src/app/api/portfolio/assets/[id]/route.ts" src/components/portfolio/render/PortfolioPhotoUpload.tsx src/components/portfolio/PhotoUpload.tsx src/app/portfolio/build/page.tsx src/__tests__/portfolio-assets.test.ts
git commit -m "feat(portfolio): aset gambar di server, bukan base64 di draft JSON"
```

---

### Task 10: Migrasi 0023 + siklus publish

Memperbaiki unpublish yang saat ini `DELETE` dan route-nya memanggil `delete` tanpa import (ReferenceError).

**Files:**
- Create: `drizzle/0023_portfolio_pages_lifecycle.sql`
- Create: `scripts/apply-0023-portfolio-pages-lifecycle.mjs`
- Modify: `src/db/schema/index.ts`
- Modify: `src/app/api/portfolio/publish/route.ts`
- Modify: `src/lib/access.ts`
- Modify: `src/components/portfolio/PublishDialog.tsx`
- Test: `src/__tests__/portfolio-publish-gate.test.ts`

**Interfaces:**
- Produces:
  - `src/lib/portfolio/publish-gate.ts` dengan `PORTFOLIO_STATUS`, `canPublish()`, `quotaMessage()`, `UPGRADE_URL`
  - `maxActivePortfolios` pada definisi paket di `access.ts`
  - `GET` status + kuota, `POST` publish, `PATCH` archive, `DELETE` hapus permanen

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-publish-gate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  canPublish,
  quotaMessage,
  PORTFOLIO_STATUS,
} from "@/lib/portfolio/publish-gate";

describe("gate publish", () => {
  it("membolehkan publish pertama untuk user gratis", () => {
    expect(canPublish({ maxActive: 1, activeCount: 0, alreadyOwns: false }).ok).toBe(true);
  });

  it("memblokir publish kedua untuk user gratis", () => {
    const r = canPublish({ maxActive: 1, activeCount: 1, alreadyOwns: false });
    expect(r.ok).toBe(false);
    expect(r).toEqual({ ok: false, code: "QUOTA_EXCEEDED" });
  });

  it("tidak menghitung kuota saat user sudah memiliki portfolio itu", () => {
    expect(canPublish({ maxActive: 1, activeCount: 1, alreadyOwns: true }).ok).toBe(true);
  });

  it("menghasilkan pesan yang menyebut batas dan paket", () => {
    const msg = quotaMessage(1, 1);
    expect(msg).toContain("1");
    expect(msg).toContain("Portfolio Web");
  });

  it("mendefinisikan tiga status", () => {
    expect(PORTFOLIO_STATUS).toEqual(["draft", "published", "archived"]);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-publish-gate.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/publish-gate.ts`**

```ts
export const PORTFOLIO_STATUS = ["draft", "published", "archived"] as const;
export type PortfolioStatus = (typeof PORTFOLIO_STATUS)[number];

export const UPGRADE_URL = "/settings/billing?plan=portfolio-web";

export type CanPublishInput = {
  maxActive: number;
  activeCount: number;
  alreadyOwns: boolean;
};

export type CanPublishResult = { ok: true } | { ok: false; code: "QUOTA_EXCEEDED" };

/**
 * Kuota dihitung dari jumlah portfolio berstatus published. Update portfolio
 * yang sudah dimiliki user tidak menambah hitungan, sehingga archive lalu
 * publish ulang tidak pernah memakai kuota.
 */
export function canPublish({
  maxActive,
  activeCount,
  alreadyOwns,
}: CanPublishInput): CanPublishResult {
  if (alreadyOwns) return { ok: true };
  if (activeCount < maxActive) return { ok: true };
  return { ok: false, code: "QUOTA_EXCEEDED" };
}

export function quotaMessage(maxActive: number, activeCount: number): string {
  return (
    `Kamu sudah punya ${activeCount} portfolio aktif dari batas ${maxActive} di paket gratis. ` +
    "Tutup salah satu atau aktifkan paket Portfolio Web untuk menambah slot."
  );
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-publish-gate.test.ts`
Expected: PASS — 5 test

- [ ] **Step 5: Tambah `maxActivePortfolios` di `access.ts`**

Baca struktur tipe paket di `access.ts` lebih dulu, lalu tambahkan field `maxActivePortfolios: number` ke setiap definisi paket:

| Paket | Nilai |
|---|---|
| free | 1 |
| `portfolio_web` | 5 |
| `premium_pass_30d` | 5 |
| `bundle_hemat` | 5 |
| `business_monthly` | 5 |
| paket lain | 0 |

Tambahkan helper:

```ts
export function maxActivePortfoliosFor(access: UserAccess): number {
  return access.packageDef.maxActivePortfolios ?? 0;
}
```

Sesuaikan nama field `packageDef` dengan struktur yang benar di `access.ts`.

- [ ] **Step 6: Tambah kolom `status` ke `portfolioPages`**

```ts
export const portfolioPages = pgTable(
  "portfolio_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 60 }).notNull().unique(),
    theme: varchar("theme", { length: 50 }).notNull().default("glass"),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    statusIdx: index("portfolio_pages_status_idx").on(t.status),
  }),
);
```

- [ ] **Step 7: Buat migrasi 0023**

`drizzle/0023_portfolio_pages_lifecycle.sql`:

```sql
-- 0023_portfolio_pages_lifecycle.sql
-- Archive menggantikan hapus: slug dan data tidak hilang.
ALTER TABLE "portfolio_pages"
  ADD COLUMN IF NOT EXISTS "status" varchar(16) DEFAULT 'draft' NOT NULL;

UPDATE "portfolio_pages" SET "status" = 'published' WHERE "published_at" IS NOT NULL;
UPDATE "portfolio_pages" SET "status" = 'draft'     WHERE "published_at" IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_pages_status_idx') THEN
    CREATE INDEX "portfolio_pages_status_idx" ON "portfolio_pages" USING btree ("status");
  END IF;
END $$;

DROP TABLE IF EXISTS "portfolio_trial_uses";
```

Buat `scripts/apply-0023-portfolio-pages-lifecycle.mjs` dengan pola script 0021, verifikasi:

```js
const { rows } = await client.query(
  "SELECT status, count(*)::int AS n FROM portfolio_pages GROUP BY status ORDER BY status",
);
console.log("0023 selesai. portfolio_pages per status:", rows);
```

- [ ] **Step 8: Jalankan migrasi lokal**

Run: `node scripts/apply-0023-portfolio-pages-lifecycle.mjs`
Expected: `0023 selesai. portfolio_pages per status: []` atau daftar berisi baris yang ada

- [ ] **Step 9: Tulis ulang `src/app/api/portfolio/publish/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { getUserAccess, maxActivePortfoliosFor } from "@/lib/access";
import { publishPayloadSchema, emptySectionIds } from "@/lib/portfolio/schema";
import { canPublish, quotaMessage, UPGRADE_URL } from "@/lib/portfolio/publish-gate";

export const dynamic = "force-dynamic";

async function activeCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(portfolioPages)
    .where(
      and(eq(portfolioPages.userId, userId), eq(portfolioPages.status, "published")),
    );
  return Number(row?.n ?? 0);
}

async function baseUrl(req?: NextRequest): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) return `${req.nextUrl.protocol}//${host}`;
  }
  return "http://localhost:3000";
}

function suggestSlugs(first: string, last: string, taken: string): string[] {
  const base = `${first}-${last}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const out: string[] = [];
  let n = 1;
  while (out.length < 3 && n < 100) {
    const cand = n === 1 ? base : `${base}-${n}`;
    if (cand !== taken) out.push(cand);
    n += 1;
  }
  return out;
}

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const access = await getUserAccess(auth.userId);
  const max = maxActivePortfoliosFor(access);
  const used = await activeCount(auth.userId);

  const [row] = await db
    .select({
      slug: portfolioPages.slug,
      theme: portfolioPages.theme,
      status: portfolioPages.status,
      publishedAt: portfolioPages.publishedAt,
      updatedAt: portfolioPages.updatedAt,
    })
    .from(portfolioPages)
    .where(eq(portfolioPages.userId, auth.userId))
    .limit(1);

  return NextResponse.json({
    published: row?.status === "published",
    status: row?.status ?? null,
    slug: row?.slug ?? null,
    theme: row?.theme ?? null,
    url: row?.slug ? `${await baseUrl(request)}/p/${row.slug}` : null,
    publishedAt: row?.publishedAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    plan: {
      maxActive: max,
      used,
      remaining: Math.max(0, max - used),
      entitled: max > 0,
      upgradeUrl: UPGRADE_URL,
    },
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = publishPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_PAYLOAD",
      parsed.error.issues[0]?.message ?? "Data tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const { slug, themeId, data, fontSize, alignment } = parsed.data;

  const kosong = emptySectionIds(data);
  if (kosong.length >= 12) {
    return errorResponse(
      "PORTFOLIO_EMPTY",
      "Isi minimal satu bagian sebelum menerbitkan.",
      400,
      { emptySections: kosong },
    );
  }

  const access = await getUserAccess(auth.userId);
  const max = maxActivePortfoliosFor(access);
  if (max <= 0) {
    return errorResponse(
      "PORTFOLIO_PACKAGE_REQUIRED",
      "Paket Portfolio Web diperlukan untuk menerbitkan.",
      403,
      { upgradeUrl: UPGRADE_URL },
    );
  }

  const [existing] = await db
    .select({ id: portfolioPages.id, userId: portfolioPages.userId })
    .from(portfolioPages)
    .where(eq(portfolioPages.userId, auth.userId))
    .limit(1);

  const used = await activeCount(auth.userId);
  const gate = canPublish({ maxActive: max, activeCount: used, alreadyOwns: !!existing });
  if (!gate.ok) {
    return errorResponse("QUOTA_EXCEEDED", quotaMessage(max, used), 403, {
      upgradeUrl: UPGRADE_URL,
    });
  }

  const clash = await db
    .select({ userId: portfolioPages.userId })
    .from(portfolioPages)
    .where(eq(portfolioPages.slug, slug))
    .limit(1);

  if (clash.length && clash[0].userId !== auth.userId) {
    return errorResponse(
      "SLUG_TAKEN",
      "Slug ini sudah dipakai pengguna lain. Coba nama lain.",
      409,
      {
        suggestions: suggestSlugs(data.formData.heroFirstName, data.formData.heroLastName, slug),
      },
    );
  }

  const now = new Date();
  const payload = {
    ...data,
    fontSize,
    alignment,
    sectionOrder: data.sectionOrder ?? null,
    sectionVisibility: data.sectionVisibility ?? null,
    sectionColors: data.sectionColors ?? null,
  };

  try {
    if (existing) {
      await db
        .update(portfolioPages)
        .set({
          slug,
          theme: themeId,
          status: "published",
          data: payload,
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(portfolioPages.id, existing.id));
    } else {
      await db.insert(portfolioPages).values({
        userId: auth.userId,
        slug,
        theme: themeId,
        status: "published",
        data: payload,
        publishedAt: now,
        updatedAt: now,
      });
    }
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      return errorResponse("SLUG_TAKEN", "Slug sudah dipakai pengguna lain.", 409);
    }
    throw err;
  }

  return NextResponse.json({
    published: true,
    slug,
    theme: themeId,
    url: `${await baseUrl(request)}/p/${slug}`,
    publishedAt: now.toISOString(),
    emptySections: kosong,
  });
});

export const PATCH = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  await db
    .update(portfolioPages)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(portfolioPages.userId, auth.userId));

  return NextResponse.json({ status: "archived", slugRetained: true });
});

export const DELETE = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  await db.delete(portfolioPages).where(eq(portfolioPages.userId, auth.userId));

  return NextResponse.json({ status: null, slugReleased: true });
});
```

Pastikan `delete` di-import dari `drizzle-orm` - itulah bug yang membuat unpublish rusak hari ini.

- [ ] **Step 10: Perbaiki `PublishDialog.tsx`**

- "Tutup portfolio" memanggil `PATCH`, bukan `DELETE`.
- "Hapus permanen" memanggil `DELETE` dengan konfirmasi kedua yang menyebut konsekuensi: slug dilepas dan bisa diambil user lain.
- Ganti `trialUsed`/`trialAvailable` dengan `plan.remaining`.
- Tambahkan `quotaKnown: boolean`. Selama belum diketahui, tombol Publish nonaktif dengan teks "Memeriksa ketersediaan".
- Kirim `fontSize` dan `alignment` di payload POST.

- [ ] **Step 11: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add drizzle/0023_portfolio_pages_lifecycle.sql scripts/apply-0023-portfolio-pages-lifecycle.mjs src/db/schema/index.ts src/lib/access.ts src/lib/portfolio/publish-gate.ts src/app/api/portfolio/publish/route.ts src/components/portfolio/PublishDialog.tsx src/__tests__/portfolio-publish-gate.test.ts
git commit -m "feat(portfolio): arsip menggantikan hapus, kuota portfolio aktif"
```

---

### Task 11: `ai-map.ts` + undo stack

Mematikan bug `applyAllAi` yang menulis `formData.hero = {…}` dan menghapus overwrite massal `experiences`.

**Files:**
- Create: `src/lib/portfolio/ai-map.ts`
- Create: `src/lib/portfolio/useUndoStack.ts`
- Modify: `src/app/portfolio/build/page.tsx`
- Modify: `src/app/portfolio/live/page.tsx`
- Test: `src/__tests__/portfolio-ai-map.test.ts`

**Interfaces:**
- Produces:
  - `applyAiSuggestion(data, res): { data, changes: AiChange[] }`
  - `mergeExperiences(current, incoming): { merged, addedCount, keptCount }`
  - `useUndoStack<T>(initial, limit?)` → `{ state, set, undo, redo, canUndo, canRedo, reset }`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-ai-map.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { applyAiSuggestion, mergeExperiences } from "@/lib/portfolio/ai-map";

const formData = {
  heroPhotoUrl: "",
  heroHeadline: "Taufferan Lama",
  heroSubHeadline: "",
  heroFirstName: "Teguh",
  heroLastName: "Surya",
  heroBio: "Bio lama",
  aboutText: "About lama",
  aboutYearsExp: "",
  aboutProjectsDone: "",
  aboutClientsHappy: "",
  skillsMain: "Lama",
  skillsTools: "",
  skillsLanguages: "",
  contactEmail: "",
  contactPhone: "",
  contactLinkedin: "",
  contactGithub: "",
};

const base = {
  formData,
  projects: [],
  experiences: [],
  educations: [],
  certifications: [],
  organizations: [],
  hobbies: [],
  testimonials: [],
  extraLinks: [],
} as never;

describe("applyAiSuggestion", () => {
  it("menulis ke field datar yang benar, bukan objek baru", () => {
    const res = {
      hero: { headline: "Frontend Developer", sub_headline: "React & TypeScript" },
      about: { meta_description: "Deskripsi baru", paragraphs: ["Paragraf 1."] },
    } as never;

    const { data } = applyAiSuggestion(base, res);
    const f = (data as never as { formData: Record<string, string> }).formData;

    expect(f.heroHeadline).toBe("Frontend Developer");
    expect(f.heroSubHeadline).toBe("React & TypeScript");
    expect(f.aboutText).toContain("Paragraf 1.");
    expect(f.hero).toBeUndefined();
  });

  it("mempertahankan nilai yang tidak disentuh AI", () => {
    const { data } = applyAiSuggestion(base, { hero: { headline: "Baru" } } as never);
    const f = (data as never as { formData: Record<string, string> }).formData;
    expect(f.heroFirstName).toBe("Teguh");
    expect(f.heroBio).toBe("Bio lama");
  });

  it("melaporkan field yang berubah untuk ditampilkan sebagai diff", () => {
    const { changes } = applyAiSuggestion(base, { hero: { headline: "Baru" } } as never);
    expect(changes.map((c) => c.field)).toContain("heroHeadline");
  });

  it("mengembalikan input apa adanya bila respons kosong", () => {
    const { data, changes } = applyAiSuggestion(base, {} as never);
    expect(data).toBe(base);
    expect(changes).toHaveLength(0);
  });
});

describe("mergeExperiences", () => {
  const cur = [
    { id: "e1", company: "Acme", position: "Dev", startDate: "2022-01", endDate: "2023-01", description: "" },
  ];

  it("menambah entri baru tanpa menghapus entri lama", () => {
    const incoming = [
      { id: "ai1", company: "Globex", position: "FE", startDate: "2023-02", endDate: "2024-01", description: "" },
    ];
    const r = mergeExperiences(cur as never, incoming as never);
    expect(r.merged).toHaveLength(2);
    expect(r.keptCount).toBe(1);
    expect(r.addedCount).toBe(1);
  });

  it("tidak menggandakan entri dengan perusahaan dan posisi sama", () => {
    const incoming = [
      { id: "ai2", company: "Acme", position: "Dev", startDate: "2022-01", endDate: "2023-01", description: "" },
    ];
    expect(mergeExperiences(cur as never, incoming as never).addedCount).toBe(0);
  });

  it("mengembalikan array kosong tanpa merusak input", () => {
    expect(mergeExperiences([] as never, [] as never).merged).toEqual([]);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-ai-map.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/ai-map.ts`**

```ts
import type { PortfolioData } from "@/components/portfolio-templates/types";

export type AiChange = {
  field: string;
  label: string;
  from: string;
  to: string;
};

type Dict = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Satu-satunya cara respons /api/portfolio/suggest masuk ke state portfolio.
 * Respons bersarang dipetakan ke field datar PortfolioFormData, jadi tidak
 * mungkin ada kunci asing yang tersimpan dan ikut terbit.
 */
export function applyAiSuggestion(
  data: PortfolioData,
  res: Dict,
): { data: PortfolioData; changes: AiChange[] } {
  const form = { ...data.formData } as Record<string, string>;
  const changes: AiChange[] = [];

  const set = (field: string, value: unknown, label: string) => {
    const next = str(value);
    if (!next) return;
    const from = String(form[field] ?? "");
    if (from === next) return;
    form[field] = next;
    changes.push({ field, label, from, to: next });
  };

  const hero = (res.hero ?? {}) as Dict;
  set("heroHeadline", hero.headline, "Judul peran");
  set("heroSubHeadline", hero.sub_headline, "Sub-judul");
  set("heroBio", hero.bio, "Bio singkat");

  const about = (res.about ?? {}) as Dict;
  const paragraphs = Array.isArray(about.paragraphs) ? about.paragraphs : [];
  set(
    "aboutText",
    paragraphs.map(str).filter(Boolean).join("\n\n") || about.meta_description,
    "Tentang saya",
  );

  const skills = (res.skills_display ?? {}) as Dict;
  const mainSkills = Array.isArray(skills.skills) ? skills.skills : [];
  set(
    "skillsMain",
    mainSkills.map(str).filter(Boolean).join(", "),
    "Keahlian utama",
  );

  if (changes.length === 0) return { data, changes };
  return { data: { ...data, formData: form as unknown as PortfolioData["formData"] }, changes };
}

/**
 * AI tidak boleh menghapus pekerjaan yang sudah diketik user. Entri dengan
 * perusahaan dan posisi yang sama dianggap duplikat dan dilewati.
 */
export function mergeExperiences(
  current: PortfolioData["experiences"],
  incoming: PortfolioData["experiences"],
): { merged: PortfolioData["experiences"]; addedCount: number; keptCount: number } {
  const key = (e: { company?: string; position?: string }) =>
    `${(e.company ?? "").trim().toLowerCase()}|${(e.position ?? "").trim().toLowerCase()}`;

  const seen = new Set(current.map(key));
  const added: PortfolioData["experiences"] = [];
  for (const exp of incoming) {
    const k = key(exp);
    if (seen.has(k)) continue;
    seen.add(k);
    added.push(exp);
  }

  return {
    merged: [...current, ...added],
    addedCount: added.length,
    keptCount: current.length,
  };
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-ai-map.test.ts`
Expected: PASS — 7 test

- [ ] **Step 5: Buat `src/lib/portfolio/useUndoStack.ts`**

```ts
"use client";

import { useCallback, useRef, useState } from "react";

export function useUndoStack<T>(initial: T, limit = 50) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = useCallback(
    (next: T | ((p: T) => T)) => {
      setState((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (Object.is(value, prev)) return prev;
        past.current = [...past.current.slice(-(limit - 1)), prev];
        future.current = [];
        return value;
      });
    },
    [limit],
  );

  const undo = useCallback(() => {
    setState((prev) => {
      const last = past.current[past.current.length - 1];
      if (last === undefined) return prev;
      past.current = past.current.slice(0, -1);
      future.current = [prev, ...future.current];
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const [next, ...rest] = future.current;
      if (next === undefined) return prev;
      future.current = rest;
      past.current = [...past.current, prev];
      return next;
    });
  }, []);

  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    setState(value);
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    reset,
  };
}
```

- [ ] **Step 6: Ganti pemanggil di kedua builder**

`src/app/portfolio/build/page.tsx`, ganti `applyAllAi`:

```ts
const { data: merged, changes } = applyAiSuggestion(data, aiSuggestions);
if (changes.length === 0) {
  setAiError("AI tidak mengembalikan perubahan baru.");
  return;
}
pushUndo();
setData(merged);
setAiChanges(changes);
```

`src/app/portfolio/live/page.tsx`, ganti `handleAiGenerate`:

```ts
const mergedExp = mergeExperiences(experiences, incomingExperiences);
pushUndo();
setExperiences(mergedExp.merged);
setAiDiff({
  addedExperiences: mergedExp.addedCount,
  keptExperiences: mergedExp.keptCount,
});
```

Tampilkan `changes` sebagai daftar before/after, bukan toast yang disappears.

- [ ] **Step 7: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/lib/portfolio/ai-map.ts src/lib/portfolio/useUndoStack.ts src/app/portfolio/build/page.tsx src/app/portfolio/live/page.tsx src/__tests__/portfolio-ai-map.test.ts
git commit -m "fix(portfolio): mapping AI terpusat dan undo stack"
```

---

### Task 12: Export HTML dari renderer yang sama

Menggantikan `generateExportHtml` yang sekarang mengabaikan tema dan membuang semua gambar.

**Files:**
- Create: `src/lib/portfolio/export-html.ts`
- Create: `src/app/api/portfolio/export/route.ts`
- Modify: `src/app/portfolio/preview/page.tsx` (hapus generator, sambungkan tombol)
- Test: `src/__tests__/portfolio-export.test.ts`

**Interfaces:**
- Produces:
  - `buildHtmlDocument(markup, themeId, title?): string`
  - `inlineAssets(data, ownerId): Promise<PortfolioData>`
  - `GET /api/portfolio/export?draftId=&theme=` → `text/html` + `Content-Disposition`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-export.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildHtmlDocument } from "@/lib/portfolio/export-html";

const markup = '<div data-theme="brutal"><h1>Teguh</h1></div>';

describe("buildHtmlDocument", () => {
  it("menghasilkan dokumen HTML lengkap", () => {
    const html = buildHtmlDocument(markup, "brutal");
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<html lang="id">');
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
  });

  it("menyisipkan style inline, bukan stylesheet eksternal", () => {
    const html = buildHtmlDocument(markup, "brutal");
    expect(html).toMatch(/<style>/);
    expect(html).not.toMatch(/rel="stylesheet"/);
  });

  it("memuat font tema lewat Google Fonts", () => {
    expect(buildHtmlDocument(markup, "luxe")).toContain("fonts.googleapis.com");
  });

  it("menyertakan gaya cetak", () => {
    expect(buildHtmlDocument(markup, "glass")).toContain("@media print");
  });

  it("meloloskan markup mentah tanpa meng-escape", () => {
    expect(buildHtmlDocument(markup, "glass")).toContain("<h1>Teguh</h1>");
  });

  it("meloloskan judul ke-escape", () => {
    const html = buildHtmlDocument(markup, "glass", '"><script>alert(1)</script>');
    expect(html).not.toContain('"><script>alert(1)</script>');
  });

  it("memakai warna latar dari tema", () => {
    expect(buildHtmlDocument(markup, "brutal")).toContain("#FFFAF0");
  });
});

describe("preview tidak lagi membangun HTML sendiri", () => {
  it("generateExportHtml sudah dihapus", () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/portfolio/preview/page.tsx"),
      "utf8",
    );
    expect(src).not.toContain("generateExportHtml");
    expect(src).not.toContain("<!DOCTYPE html>");
    expect(src).toContain("/api/portfolio/export");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-export.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/export-html.ts`**

```ts
import type { ThemeId } from "@/components/portfolio/types";
import type { PortfolioData } from "@/components/portfolio-templates/types";
import { THEMES } from "@/components/portfolio/themes";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { portfolioAssets } from "@/db/schema";

const RESET_CSS = `
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; }
img { max-width: 100%; height: auto; display: block; }
.pf-atmosphere { display: none !important; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  .pf-atmosphere, .pf-chrome { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .pf-section > * { box-shadow: none !important; backdrop-filter: none !important; break-inside: avoid; }
  h1, h2, h3, h4 { break-after: avoid; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.75em; word-break: break-all; }
}`;

function escTitle(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Membungkus markup dari PortfolioDocument menjadi dokumen HTML mandiri.
 * Warna latar dan teks diambil dari tema yang sama dengan halaman publik,
 * sehingga hasil export benar-benar sama dengan yang dilihat user.
 */
export function buildHtmlDocument(
  markup: string,
  themeId: ThemeId,
  title = "Portfolio",
): string {
  const theme = THEMES[themeId];
  const bg = theme?.colors.bg ?? "#ffffff";
  const fg = theme?.colors.text ?? "#111111";
  const fontUrl = theme?.fontUrl ?? "";
  const font = theme?.font ?? "system-ui, sans-serif";

  const fontLinks = fontUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n` +
      `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
      `<link href="${fontUrl}" rel="stylesheet">\n`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escTitle(title)}</title>
${fontLinks}<style>
${RESET_CSS}
body { background: ${bg}; color: ${fg}; font-family: ${font}; }
${PRINT_CSS}
</style>
</head>
<body>
${markup}
</body>
</html>`;
}

const ASSET_RE = /^\/api\/portfolio\/assets\/([0-9a-f-]{36})$/i;

function collectAssetIds(data: PortfolioData): string[] {
  const ids = new Set<string>();
  const push = (v: unknown) => {
    if (typeof v !== "string") return;
    const m = ASSET_RE.exec(v);
    if (m) ids.add(m[1]);
  };
  push(data.formData.heroPhotoUrl);
  for (const p of data.projects) push(p.imageUrl);
  for (const e of data.experiences) push(e.imageUrl);
  return [...ids];
}

/**
 * Mengganti URL aset menjadi data URI supaya file export mandiri.
 * Aset yang hilang tidak menggagalkan export: URL-nya dibiarkan apa adanya
 * dan akan tampil sebagai placeholder.
 */
export async function inlineAssets(
  data: PortfolioData,
  ownerId: string,
): Promise<PortfolioData> {
  const ids = collectAssetIds(data);
  if (ids.length === 0) return data;

  const map = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const [row] = await db
        .select({ mime: portfolioAssets.mime, data: portfolioAssets.data })
        .from(portfolioAssets)
        .where(
          and(eq(portfolioAssets.id, id), eq(portfolioAssets.userId, ownerId)),
        )
        .limit(1);
      if (!row) return;
      map.set(
        `/api/portfolio/assets/${id}`,
        `data:${row.mime};base64,${Buffer.from(row.data).toString("base64")}`,
      );
    }),
  );

  const swap = (v: string) => map.get(v) ?? v;
  return {
    ...data,
    formData: { ...data.formData, heroPhotoUrl: swap(data.formData.heroPhotoUrl) },
    projects: data.projects.map((p) =>
      p.imageUrl ? { ...p, imageUrl: swap(p.imageUrl) } : p,
    ),
    experiences: data.experiences.map((e) =>
      e.imageUrl ? { ...e, imageUrl: swap(e.imageUrl) } : e,
    ),
  };
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-export.test.ts`
Expected: 7 test lulus kecuali yang membaca `preview/page.tsx`, yang masih gagal sampai langkah 6.

- [ ] **Step 5: Buat `src/app/api/portfolio/export/route.ts`**

```tsx
import { NextRequest, NextResponse } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { and, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioDrafts } from "@/db/schema";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";
import { buildHtmlDocument, inlineAssets } from "@/lib/portfolio/export-html";
import { portfolioDataSchema } from "@/lib/portfolio/schema";
import { THEMES } from "@/components/portfolio/themes";
import type { ThemeId } from "@/components/portfolio/types";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const draftId = request.nextUrl.searchParams.get("draftId");
  if (!draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  const [row] = await db
    .select({ data: portfolioDrafts.data, name: portfolioDrafts.name })
    .from(portfolioDrafts)
    .where(
      and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId)),
    )
    .limit(1);

  if (!row) {
    return errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404);
  }

  const parsed = portfolioDataSchema.safeParse(row.data);
  if (!parsed.success) {
    return errorResponse("INVALID_DATA", "Data draft rusak", 400);
  }

  const requested = request.nextUrl.searchParams.get("theme") ?? "glass";
  const themeId = (requested in THEMES ? requested : "glass") as ThemeId;

  const data = await inlineAssets(parsed.data, auth.userId);
  const markup = renderToStaticMarkup(
    <PortfolioDocument data={data} themeId={themeId} mode="static" />,
  );
  const html = buildHtmlDocument(markup, themeId, row.name);

  const filename = `${(row.name || "portfolio")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
```

Bila Next.js menolak JSX di file route, tambahkan `import { createElement } from "react"` dan pakai `createElement(PortfolioDocument, props)`.

- [ ] **Step 6: Hapus `generateExportHtml` dan sambungkan tombol export**

Di `src/app/portfolio/preview/page.tsx`:
- Hapus fungsi `generateExportHtml` beserta import `esc` dan `safeUrl` yang hanya dipakai di sana.
- Ganti handler download:

```tsx
setExporting(true);
setExportError(null);
try {
  const res = await fetch(`/api/portfolio/export?draftId=${draftId}&theme=${themeId}`);
  if (!res.ok) throw new Error();
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name || "portfolio"}.html`.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  a.click();
  URL.revokeObjectURL(url);
} catch {
  setExportError("Export gagal. Coba lagi sebentar.");
} finally {
  setExporting(false);
}
```

- [ ] **Step 7: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/lib/portfolio/export-html.ts src/app/api/portfolio/export/route.ts src/app/portfolio/preview/page.tsx src/__tests__/portfolio-export.test.ts
git commit -m "feat(portfolio): export HTML dari renderer yang sama, gambar inline"
```

---

### Task 13: Metadata, OG image, sitemap, robots, aset publik

**Files:**
- Modify: `src/app/p/[slug]/page.tsx` (`generateMetadata`)
- Create: `src/app/api/portfolio/og/[slug]/route.tsx`
- Modify: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Modify: `src/components/TitleUpdater.tsx`
- Test: `src/__tests__/portfolio-seo.test.ts`

**Interfaces:**
- Produces: OG image 1200x630 di `/api/portfolio/og/[slug]`, `robots.txt`, entri sitemap untuk setiap portfolio published, route aset publik tanpa login

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-seo.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("SEO portfolio", () => {
  it("robots.ts ada dan mengizinkan /p/", () => {
    expect(existsSync(join(process.cwd(), "src/app/robots.ts"))).toBe(true);
    const src = read("src/app/robots.ts");
    expect(src).toMatch(/Allow: \/p\//);
    expect(src).toMatch(/Disallow: \/portfolio\/build/);
  });

  it("sitemap menyertakan portfolio published", () => {
    const src = read("src/app/sitemap.ts");
    expect(src).toContain("portfolioPages");
    expect(src).toContain('"published"');
    expect(src).toContain("/p/");
  });

  it("generateMetadata memakai seo, keywords, canonical, dan gambar OG", () => {
    const src = read("src/app/p/[slug]/page.tsx");
    expect(src).toContain("keywords");
    expect(src).toContain("canonical");
    expect(src).toMatch(/images:\s*\[/);
    expect(src).toContain("/api/portfolio/og/");
  });

  it("TitleUpdater tidak menimpa judul di /p/", () => {
    expect(read("src/components/TitleUpdater.tsx")).toMatch(/startsWith\("\/p\/"\)/);
  });

  it("route OG image ada dengan ukuran 1200x630", () => {
    const p = "src/app/api/portfolio/og/[slug]/route.tsx";
    expect(existsSync(join(process.cwd(), p))).toBe(true);
    const src = read(p);
    expect(src).toContain("1200");
    expect(src).toContain("630");
  });

  it("route aset melayani editor sekaligus halaman publik", () => {
    const src = read("src/app/api/portfolio/assets/[id]/route.ts");
    expect(src).not.toContain("withAuth()");
    expect(src).toContain('from "@/lib/auth"');
    expect(src).toContain("portfolioPages");
    expect(src).toContain("published");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-seo.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/", "/career-hub/"],
        disallow: [
          "/api/",
          "/portfolio/build",
          "/portfolio/live",
          "/portfolio/preview",
          "/dashboard",
          "/settings",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Tambahkan portfolio published ke `sitemap.ts`**

```ts
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { eq } from "drizzle-orm";

const published = await db
  .select({ slug: portfolioPages.slug, updatedAt: portfolioPages.updatedAt })
  .from(portfolioPages)
  .where(eq(portfolioPages.status, "published"));

const portfolioEntries = published.map((p) => ({
  url: `${BASE_URL}/p/${p.slug}`,
  lastModified: p.updatedAt ?? new Date(),
  changeFrequency: "monthly" as const,
  priority: 0.6,
}));
```

Gabungkan `portfolioEntries` ke array hasil, dan hapus `/portfolio/build`, `/portfolio/preview`, `/portfolio/live` dari sitemap karena `robots.ts` melarangnya.

- [ ] **Step 5: Perbarui `generateMetadata` di `/p/[slug]`**

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [row] = await db
    .select()
    .from(portfolioPages)
    .where(and(eq(portfolioPages.slug, slug), eq(portfolioPages.status, "published")))
    .limit(1);

  if (!row) return { title: "Portfolio tidak ditemukan" };

  const data = row.data as {
    formData?: { heroFirstName?: string; heroLastName?: string; heroHeadline?: string; heroBio?: string };
    seo?: { pageTitle?: string; metaDescription?: string; keywords?: string[] };
  };

  const first = data.formData?.heroFirstName ?? "";
  const last = data.formData?.heroLastName ?? "";
  const name = [first, last].filter(Boolean).join(" ") || "Portfolio";
  const title = data.seo?.pageTitle?.trim() || `${name} - ${data.formData?.heroHeadline ?? "Portfolio"}`;
  const description =
    data.seo?.metaDescription?.trim() || data.formData?.heroBio?.slice(0, 160) || "";
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    title,
    description,
    keywords: data.seo?.keywords ?? [],
    alternates: { canonical: `${base}/p/${slug}` },
    openGraph: {
      title,
      description,
      type: "profile",
      locale: "id_ID",
      images: [{ url: `${base}/api/portfolio/og/${slug}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
```

- [ ] **Step 6: Buat route OG image**

`src/app/api/portfolio/og/[slug]/route.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { THEMES } from "@/components/portfolio/themes";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const [row] = await db
    .select()
    .from(portfolioPages)
    .where(and(eq(portfolioPages.slug, slug), eq(portfolioPages.status, "published")))
    .limit(1);

  if (!row) return new Response("Not found", { status: 404 });

  const data = row.data as {
    formData?: { heroFirstName?: string; heroLastName?: string; heroHeadline?: string };
  };
  const theme = THEMES[row.theme] ?? THEMES.glass;
  const name = [data.formData?.heroFirstName, data.formData?.heroLastName]
    .filter(Boolean)
    .join(" ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: theme.colors.bg,
          color: theme.colors.text,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: theme.colors.primary,
            marginBottom: 24,
          }}
        >
          Portfolio
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>
          {name || "Portfolio"}
        </div>
        <div style={{ display: "flex", fontSize: 44, color: theme.colors.textSecondary, marginTop: 24 }}>
          {data.formData?.heroHeadline ?? ""}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            height: 8,
            width: 160,
            background: theme.colors.primary,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
```

Bila `runtime = "edge"` tidak bisa mengakses `db`, jalankan sebagai Node runtime biasa dengan `export const runtime = "nodejs"`.

- [ ] **Step 7: Kecualikan `/p/` di `TitleUpdater`**

Di `src/components/TitleUpdater.tsx`, tambahkan di awal efek:

```ts
const pathname = usePathname();
if (pathname.startsWith("/p/") || pathname.startsWith("/api/")) return;
```

- [ ] **Step 8: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/app/robots.ts src/app/sitemap.ts "src/app/p/[slug]/page.tsx" "src/app/api/portfolio/og/[slug]/route.tsx" src/components/TitleUpdater.tsx src/__tests__/portfolio-seo.test.ts
git commit -m "feat(portfolio): OG image, sitemap, robots, metadata per portfolio"
```

---

### Task 14: Builder ke `/portfolio/build/[draftId]`

Menghapus split-brain: `/portfolio/live` jadi pengalihan, satu kunci cache, satu entry point.

**Files:**
- Create: `src/app/portfolio/build/[draftId]/page.tsx`
- Modify: `src/app/portfolio/build/page.tsx`
- Create: `src/app/portfolio/live/page.tsx` (menjadi redirect)
- Modify: `src/app/portfolio/page.tsx` (hapus tombol Live Builder)
- Modify: `src/components/PortfolioSpotlight.tsx`
- Test: `src/__tests__/portfolio-entry-points.test.ts`

**Interfaces:**
- Produces: `/portfolio/build` membuat draft lalu mengarahkan ke `/portfolio/build/[draftId]`; `/portfolio/live` selalu mengarahkan ke builder

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-entry-points.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("entry point builder", () => {
  it("halaman build/[draftId] ada", () => {
    expect(existsSync(join(process.cwd(), "src/app/portfolio/build/[draftId]/page.tsx"))).toBe(true);
  });

  it("live builder menjadi pengalihan, bukan editor kedua", () => {
    const src = read("src/app/portfolio/live/page.tsx");
    expect(src).toContain("router.replace");
    expect(src).not.toContain("portfolio_live_data");
  });

  it("tidak ada lagi kunci localStorage lama", () => {
    const files = [
      "src/app/portfolio/build/page.tsx",
      "src/app/portfolio/live/page.tsx",
      "src/app/portfolio/preview/page.tsx",
    ];
    for (const f of files) {
      const src = read(f);
      expect(src).not.toContain('"portfolio_draft"');
      expect(src).not.toContain('"portfolio_live_data"');
    }
  });

  it("halaman portfolio tidak lagi menawarkan tombol Live Builder", () => {
    expect(read("src/app/portfolio/page.tsx")).not.toContain("/portfolio/live");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-entry-points.test.ts`
Expected: FAIL

- [ ] **Step 3: Ubah `/portfolio/live` menjadi pengalihan**

Ganti seluruh isi `src/app/portfolio/live/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortfolioSkeleton } from "@/components/portfolio/PortfolioSkeleton";

export default function LiveRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const draftId = params.get("draftId");
    router.replace(draftId ? `/portfolio/build/${draftId}` : "/portfolio/build");
  }, [router, params]);

  return <PortfolioSkeleton message="Membuka editor portfolio" />;
}
```

Buat `src/components/portfolio/PortfolioSkeleton.tsx`:

```tsx
type Props = { message?: string };

export default function PortfolioSkeleton({ message }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin" aria-hidden>
          progress_activity
        </span>
        <span className="text-sm">{message ?? "Memuat"}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Buat `/portfolio/build/[draftId]/page.tsx`**

Pindahkan isi builder yang ada ke sini, lalu ambil `draftId` dari params dan pakai `usePortfolioDraft`:

```tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { usePortfolioDraft } from "@/lib/portfolio/usePortfolioDraft";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";

export default function BuilderPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = use(params);
  const router = useRouter();
  const draft = usePortfolioDraft(draftId);

  if (draft.loading) return <PortfolioSkeleton message="Memuat draft" />;
  if (!draft.data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-on-surface-variant">Draft tidak ditemukan.</p>
        <button
          type="button"
          onClick={() => router.replace("/portfolio/build")}
          className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"
        >
          Mulai draft baru
        </button>
      </div>
    );
  }

  return (
    <AuthGuard>
      <BuilderEditor draft={draft} />
    </AuthGuard>
  );
}
```

`BuilderEditor` adalah isi builder yang sekarang, dengan semua `localStorage` diganti oleh `draft.setData`.

- [ ] **Step 5: Ubah `/portfolio/build` menjadi halaman pembuat draft**

Halaman ini hanya membuat draft lalu mengarahkan:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";
import { portfolioDataSchema } from "@/lib/portfolio/schema";

export default function NewBuildPage() {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    (async () => {
      const res = await fetch("/api/portfolio/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: portfolioDataSchema.parse(emptyFormData()) }),
      });
      const json = await res.json();
      router.replace(`/portfolio/build/${json.draftId}`);
    })();
  }, [router]);

  return (
    <AuthGuard>
      <PortfolioSkeleton message="Menyiapkan draft baru" />
    </AuthGuard>
  );
}

function emptyFormData() {
  return {
    formData: {
      heroPhotoUrl: "", heroHeadline: "", heroSubHeadline: "",
      heroFirstName: "", heroLastName: "", heroBio: "",
      aboutText: "", aboutYearsExp: "", aboutProjectsDone: "", aboutClientsHappy: "",
      skillsMain: "", skillsTools: "", skillsLanguages: "",
      contactEmail: "", contactPhone: "", contactLinkedin: "", contactGithub: "",
    },
    projects: [], experiences: [], educations: [], certifications: [],
    organizations: [], hobbies: [], testimonials: [], extraLinks: [],
  };
}
```

Segarkan komentar di dalam blok kode di atas menjadi bahasa Indonesia biasa sebelum menyimpan file.

- [ ] **Step 6: Bersihkan navigasi**

Di `src/app/portfolio/page.tsx`, hapus tombol "Live Builder" dan arahkan CTA ke `/portfolio/build`. Ubah juga `src/components/PortfolioSpotlight.tsx`.

- [ ] **Step 7: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/app/portfolio/live/page.tsx "src/app/portfolio/build/[draftId]/page.tsx" src/app/portfolio/build/page.tsx src/app/portfolio/page.tsx src/components/PortfolioSpotlight.tsx src/components/portfolio/PortfolioSkeleton.tsx src/__tests__/portfolio-entry-points.test.ts
git commit -m "refactor(portfolio): satu builder, satu draft, satu entry point"
```

---

### Task 15: Hapus kode mati dan perbaiki copy tema yang basi

**Files:**
- Delete: `src/components/portfolio-templates/html-generators.ts`
- Delete: `src/lib/portfolioTemplates.ts`
- Modify: `src/components/portfolio-types.ts` (buang `heroBgUrl`, `heroCreativeTitle`)
- Modify: `src/components/portfolio/build/page.tsx` (atau `[draftId]/page.tsx`)
- Modify: `src/components/FeatureTabs.tsx`
- Modify: `src/components/PortfolioSpotlight.tsx`
- Test: `src/__tests__/portfolio-dead-code.test.ts`

**Interfaces:**
- Menghasilkan: tidak ada import ke berkas yang dihapus; nama tema di copy sama dengan `THEMES`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-dead-code.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const p = (f: string) => join(process.cwd(), f);

describe("kode mati dan copy basi", () => {
  it("html-generators.ts sudah dihapus", () => {
    expect(existsSync(p("src/components/portfolio-templates/html-generators.ts"))).toBe(false);
  });

  it("portfolioTemplates.ts sudah dihapus", () => {
    expect(existsSync(p("src/lib/portfolioTemplates.ts"))).toBe(false);
  });

  it("tidak ada berkas yang mengimpor portfolio-templates/html-generators", () => {
    const files = [
      "src/components/FeatureTabs.tsx",
      "src/components/PortfolioSpotlight.tsx",
      "src/app/portfolio/page.tsx",
    ];
    for (const f of files) {
      expect(read(f)).not.toContain("html-generators");
      expect(read(f)).not.toContain("PORTFOLIO_TEMPLATES");
    }
  });

  it("field mati heroBgUrl dan heroCreativeTitle sudah hilang", () => {
    const types = read("src/components/portfolio-templates/types.ts");
    expect(types).not.toContain("heroBgUrl");
    expect(types).not.toContain("heroCreativeTitle");
    expect(read("src/lib/portfolio/schema.ts")).not.toContain("heroBgUrl");
  });

  it("copy tema di landing memakai nama tema yang nyata", () => {
    for (const f of ["src/components/FeatureTabs.tsx", "src/components/PortfolioSpotlight.tsx"]) {
      const src = read(f);
      expect(src).not.toContain("Modern Slate");
      expect(src).not.toContain("Minimal Dark");
      expect(src).not.toContain("Modern Blue");
    }
  });

  it("copy portfolio memakai bahasa Indonesia, bukan hardcoded Inggris di form", () => {
    const src = read("src/components/portfolio-templates/types.ts");
    expect(src).not.toContain("Sertifikat & Penghargaan");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-dead-code.test.ts`
Expected: FAIL

- [ ] **Step 3: Hapus berkas mati**

```bash
git rm src/components/portfolio-templates/html-generators.ts src/lib/portfolioTemplates.ts
```

Jalankan `rg -n "portfolioTemplates|html-generators|PORTFOLIO_TEMPLATES|getTemplateStyle" src/` dan bersihkan semua sisa referensinya.

- [ ] **Step 4: Buang field mati**

Dari `src/components/portfolio-templates/types.ts`, hapus `heroBgUrl` dan `heroCreativeTitle` dari `PortfolioFormData`. Dari `src/lib/portfolio/schema.ts`, hapus keduanya dari `portfolioFormDataSchema` bila masih ada. Bersihkan juga input form-nya di builder.

- [ ] **Step 5: Perbaiki copy nama tema**

Di `src/components/FeatureTabs.tsx` dan `src/components/PortfolioSpotlight.tsx`, ganti tiga nama tema fiktif dengan nama yang benar:

| Lama | Baru |
|---|---|
| Modern Slate | Glassmorphism |
| Minimal Dark | Neo Brutal |
| Modern Blue | Editorial Luxe |

Deskripsi singkat yang jujur:

- Glassmorphism - "Kaca buram, Bento asimetris, dan cahaya lembut."
- Neo Brutal - "Kotak tajam, bayangan keras, tanpa garis melengkung."
- Editorial Luxe - "Serif besar, ruang kosong lega, tata letak majalah."

- [ ] **Step 6: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add -A
git commit -m "chore(portfolio): hapus 835 baris kode mati, perbaiki copy nama tema"
```

---

### Task 16: Verifikasi akhir & pemeriksaan mutu

**Files:**
- Modify: berkas mana pun yang gagal pemeriksaan

**Interfaces:**
- Memastikan semua constraint global terpenuhi

- [ ] **Step 1: Typecheck dan test penuh**

```bash
npx tsc --noEmit
npm test
```
Expected: 0 error TypeScript, semua test lulus.

- [ ] **Step 2: Build produksi**

```bash
$env:DATABASE_URL='postgresql://build:build@localhost:5432/build'
$env:AUTH_SECRET='build-only-secret'
$env:DEEPSEEK_API_KEY='build-only-key'
$env:NEXT_PUBLIC_BASE_URL='http://localhost:3000'
npm run build
```
Expected: build sukses, `/p/[slug]` dan route export ter-render.

- [ ] **Step 3: Lint**

```bash
npm run lint -- --no-warn-ignored
```
Expected: 0 error. Warning yang sudah ada sebelumnya boleh tetap.

- [ ] **Step 4: Pemeriksaan mutu layout portfolio**

```bash
rg -n 'text-\[(8|9|10|11)px\]' src/components/portfolio src/app/portfolio
```
Expected: tidak ada hasil.

```bash
rg -n 'rounded-full|rounded-\[' src/components/portfolio/render
```
Expected: tidak ada hasil. Berkas render baru tidak boleh meng-hardcode bentuk.

```bash
rg -n '#[0-9A-Fa-f]{6}' src/components/portfolio/render
```
Expected: tidak ada warna hex. Semua warna lewat token tema.

- [ ] **Step 5: Pastikan tidak ada tautan mentah di pohon publik**

```bash
rg -n 'href=\{' src/components/portfolio/sections
```
Expected: setiap hasil adalah `<SafeLink>`, bukan `<a>`. Jika masih ada `<a href={...}>`, ganti dengan `SafeLink`.

- [ ] **Step 6: Verifikasi manual di browser**

Jalankan `npm run dev`, lalu periksa:

1. `/portfolio/build` membuat draft lalu mengarahkan ke `/portfolio/build/<id>`
2. Menutup tab dan membuka kembali: draft masih ada, dari server
3. Mematikan jaringan, mengetik,Gpada banner offline muncul dan isinya tersimpan di cache
4. Preview, halaman publik, dan file HTML export punya isi yang sama
5. `?print=1` menyembunyikan grain dan orb
6. Asset yang diunggah tampil di preview, publik, dan export
7. Unpublish membuat halaman 404 tetapi data masih ada; publish ulang mengembalikan slug yang sama
8. Semua tombol hero menggulir ke section yang benar

- [ ] **Step 7: Commit akhir bila ada perbaikan**

```bash
git add -A
git commit -m "fix(portfolio): perbaikan hasil pemeriksaan mutu"
```

---

## Checklist Sesuai Spec

| Bagian spec | Task |
|---|---|
| 1. Draft di server | 6, 8, 14 |
| 2. Aset gambar | 7, 9, 12, 13 |
| 3. Satu renderer | 3, 4 |
| 4. Keamanan URL | 1, 2, 10 |
| 5. Skema Zod | 1, 8, 10 |
| 6. Siklus publish | 10 |
| 7. Distribusi | 13 |
| 8. Print dan PDF | 5, 12 |
| 9. Perbaikan AI | 11 |
| Mutu | 16 |
| Kode mati dan copy | 15 |

## Batas Spec Ini

Headless PDF server-side, custom domain, subdomain, edit warna tema, import LinkedIn, dan seluruh Spec 2-4 di luar cakupan.