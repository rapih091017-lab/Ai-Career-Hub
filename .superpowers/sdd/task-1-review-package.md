# Review package task-1

Base: b8dd9ff
Head: HEAD

## Commits

```
cdbfecd fix(portfolio): satu aturan visibilitas parsial, format warna, LiveData diperlebar
ed5f2fd fix(portfolio): pesan per aturan tanggal, SectionVisibility di konsumen, THEME_IDS di types
2c1bd87 fix(portfolio): safeUrl anti-bypass, imageUrl schema, field hero tidak lagi di-strip, SectionId dari SECTION_IDS
4d9a7ad fix(portfolio): schema URL fields bypass safeUrl and companyLogo survives
2bb44f9 feat(portfolio): zod schema + safeUrl path relatif

```

## Diff stat

```
 src/__tests__/portfolio-safety.test.ts          |  30 +
 src/__tests__/portfolio-schema.test.ts          | 758 ++++++++++++++++++++++++
 src/app/p/[slug]/page.tsx                       |   4 +-
 src/app/portfolio/live/page.tsx                 |  19 +-
 src/components/portfolio-templates/types.ts     |  13 +-
 src/components/portfolio/PortfolioCanvas.tsx    |  26 +-
 src/components/portfolio/PublishDialog.tsx      |   2 +-
 src/components/portfolio/PublishedPortfolio.tsx |  11 +-
 src/components/portfolio/sectionVisibility.ts   |  19 +
 src/components/portfolio/types.ts               |  47 +-
 src/lib/portfolio-safety.ts                     |  18 +-
 src/lib/portfolio/schema.ts                     | 296 +++++++++
 12 files changed, 1197 insertions(+), 46 deletions(-)

```

## Diff

```diff
diff --git a/src/__tests__/portfolio-safety.test.ts b/src/__tests__/portfolio-safety.test.ts
index c3b6822..bc6eb08 100644
--- a/src/__tests__/portfolio-safety.test.ts
+++ b/src/__tests__/portfolio-safety.test.ts
@@ -36,20 +36,50 @@ describe("safeUrl", () => {
     expect(safeUrl("tel:+62812")).toBe("tel:+62812");
   });
 
   it("menambahkan https:// untuk domain tanpa protokol", () => {
     expect(safeUrl("linkedin.com/in/teguh")).toBe("https://linkedin.com/in/teguh");
   });
 
   it("meng-escape nilai yang lolos validasi", () => {
     expect(safeUrl(`https://a.com/?q="><script>`)).toBe(`https://a.com/?q=&quot;&gt;&lt;script&gt;`);
   });
+
+  it("menerima path relatif yang diawali slash", () => {
+    expect(safeUrl("/api/portfolio/assets/abc")).toBe("/api/portfolio/assets/abc");
+    expect(safeUrl("/")).toBe("/");
+  });
+
+  it("menolak path relatif tanpa slash di depan", () => {
+    expect(safeUrl("api/portfolio/assets/abc")).toBe("");
+  });
+
+  it("menolak URL protocol-relative yang mencuri origin", () => {
+    expect(safeUrl("//evil.com")).toBe("");
+    expect(safeUrl("//evil.com/path")).toBe("");
+  });
+
+  it("menolak backslash yang di-normalisasi browser jadi slash", () => {
+    expect(safeUrl("/\\evil.com")).toBe("");
+    expect(safeUrl("/\\evil.com/path")).toBe("");
+  });
+
+  it("menolak karakter kontrol yang di-strip browser jadi slash", () => {
+    expect(safeUrl("/\t/evil.com")).toBe("");
+    expect(safeUrl("/\n/evil.com")).toBe("");
+    expect(safeUrl("/\r\n/evil.com")).toBe("");
+  });
+
+  it("tetap menerima path aset lokal yang sah", () => {
+    const asset = "/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f";
+    expect(safeUrl(asset)).toBe(asset);
+  });
 });
 
 describe("isValidSlug", () => {
   it("menerima slug valid", () => {
     expect(isValidSlug("teguh-surya")).toBe(true);
     expect(isValidSlug("teguh123")).toBe(true);
   });
 
   it("menolak slug terlalu pendek / karakter ilegal", () => {
     expect(isValidSlug("ab")).toBe(false);
diff --git a/src/__tests__/portfolio-schema.test.ts b/src/__tests__/portfolio-schema.test.ts
new file mode 100644
index 0000000..e0ec76d
--- /dev/null
+++ b/src/__tests__/portfolio-schema.test.ts
@@ -0,0 +1,758 @@
+import { describe, it, expect } from "vitest";
+import { createElement } from "react";
+import { render, screen } from "@testing-library/react";
+import type { PortfolioData } from "@/components/portfolio-templates/types";
+import { SECTION_IDS } from "@/components/portfolio/types";
+import PortfolioCanvas from "@/components/portfolio/PortfolioCanvas";
+import PublishedPortfolio from "@/components/portfolio/PublishedPortfolio";
+import { isSectionVisible, resolveVisibility } from "@/components/portfolio/sectionVisibility";
+import type { PortfolioCanvasProps } from "@/components/portfolio/PortfolioCanvas";
+import type { PublishedPortfolioProps } from "@/components/portfolio/PublishedPortfolio";
+import type { PublishDialogProps } from "@/components/portfolio/PublishDialog";
+import type { LiveData } from "@/app/portfolio/live/page";
+import {
+  portfolioDataSchema,
+  publishPayloadSchema,
+  draftPayloadSchema,
+  emptySectionIds,
+  LIMITS,
+} from "@/lib/portfolio/schema";
+
+const validFormData = {
+  heroPhotoUrl: "",
+  heroHeadline: "Frontend Developer",
+  heroSubHeadline: "Bangun antarmuka yang cepat",
+  heroFirstName: "Teguh",
+  heroLastName: "Surya",
+  heroBio: "Developer frontend dengan 4 tahun pengalaman.",
+  aboutText: "Saya fokus pada aksesibilitas dan performa web.",
+  aboutYearsExp: "4",
+  aboutProjectsDone: "18",
+  aboutClientsHappy: "12",
+  skillsMain: "React, TypeScript",
+  skillsTools: "Vite, Playwright",
+  skillsLanguages: "Bahasa Indonesia, Inggris",
+  contactEmail: "teguh@example.com",
+  contactPhone: "",
+  contactLinkedin: "https://linkedin.com/in/teguh",
+  contactGithub: "https://github.com/teguh",
+};
+
+const emptyData = {
+  formData: validFormData,
+  projects: [],
+  experiences: [],
+  educations: [],
+  certifications: [],
+  organizations: [],
+  hobbies: [],
+  testimonials: [],
+  extraLinks: [],
+};
+
+/** Menolak payload sekaligus memaksa pesan + lokasi issue pertama,
+ *  supaya tiap aturan tanggal punya pesan yang benar-benar diuji. */
+function expectRejectedWith(
+  payload: unknown,
+  message: string,
+  path: (string | number)[],
+) {
+  const result = portfolioDataSchema.safeParse(payload);
+  expect(result.success).toBe(false);
+  if (result.success) return;
+  expect(result.error.issues[0].message).toBe(message);
+  expect(result.error.issues[0].path).toEqual(path);
+}
+
+describe("portfolioDataSchema", () => {
+  it("menerima data portfolio yang valid", () => {
+    expect(portfolioDataSchema.safeParse(emptyData).success).toBe(true);
+  });
+
+  it("menolak URL dengan skema terlarang", () => {
+    const bad = {
+      ...emptyData,
+      formData: { ...validFormData, contactGithub: "javascript:alert(1)" },
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("menolak teks melebihi panjang maksimum", () => {
+    const bad = {
+      ...emptyData,
+      formData: { ...validFormData, heroBio: "x".repeat(501) },
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("menolak array yang melebihi batas", () => {
+    const tooMany = Array.from({ length: LIMITS.projects + 1 }, (_, i) => ({
+      id: `p${i}`,
+      name: "P",
+      description: "D",
+      techStack: "React",
+      link: "",
+    }));
+    expect(
+      portfolioDataSchema.safeParse({ ...emptyData, projects: tooMany }).success,
+    ).toBe(false);
+  });
+
+  it("menolak tanggal yang bukan format YYYY-MM", () => {
+    const bad = {
+      ...emptyData,
+      experiences: [
+        { id: "e1", company: "Acme", position: "Dev", startDate: "01/2024", endDate: "2025-03", description: "" },
+      ],
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("menolak endDate yang lebih awal dari startDate", () => {
+    const bad = {
+      ...emptyData,
+      experiences: [
+        { id: "e1", company: "Acme", position: "Dev", startDate: "2024-01", endDate: "2023-01", description: "" },
+      ],
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("memberi pesan sendiri saat tanggal selesai didahului tanggal mulai yang kosong", () => {
+    expectRejectedWith(
+      {
+        ...emptyData,
+        educations: [
+          {
+            id: "ed1",
+            institution: "Universitas X",
+            degree: "S1",
+            field: "Informatika",
+            startDate: "",
+            endDate: "2024-01",
+          },
+        ],
+      },
+      "Isi tanggal mulai dulu sebelum mengisi tanggal lulus",
+      ["educations", 0],
+    );
+  });
+
+  it("memberi pesan sendiri saat isPresentdisambiguation dengan tanggal selesai", () => {
+    expectRejectedWith(
+      {
+        ...emptyData,
+        experiences: [
+          {
+            id: "e1",
+            company: "Acme",
+            position: "Dev",
+            startDate: "2024-01",
+            endDate: "2025-06",
+            description: "",
+            isPresent: true,
+          },
+        ],
+      },
+      "Tanggal selesai tidak bisa diisi kalau ditandai masih berjalan",
+      ["experiences", 0],
+    );
+  });
+
+  it("memberi pesan sendiri saat urutan tanggal terbalik", () => {
+    expectRejectedWith(
+      {
+        ...emptyData,
+        experiences: [
+          {
+            id: "e1",
+            company: "Acme",
+            position: "Dev",
+            startDate: "2024-01",
+            endDate: "2023-01",
+            description: "",
+          },
+        ],
+      },
+      "Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
+      ["experiences", 0],
+    );
+  });
+
+  it("menolak skema terlarang pada URL aset dan tautan project", () => {
+    const asset = "javascript:alert(1)";
+    expect(
+      portfolioDataSchema.safeParse({
+        ...emptyData,
+        formData: { ...validFormData, heroPhotoUrl: asset },
+      }).success,
+    ).toBe(false);
+
+    for (const key of ["imageUrl", "liveUrl", "repoUrl"]) {
+      const project = {
+        id: "p1",
+        name: "N",
+        description: "D",
+        techStack: "React",
+        link: "",
+        imageUrl: "",
+        liveUrl: "",
+        repoUrl: "",
+        [key]: asset,
+      };
+      expect(portfolioDataSchema.safeParse({ ...emptyData, projects: [project] }).success).toBe(false);
+    }
+  });
+
+  it("menolak skema terlarang pada certifications[].url", () => {
+    const bad = {
+      ...emptyData,
+      certifications: [{ id: "c1", name: "AWS", issuer: "Amazon", year: "2025", url: "javascript:alert(1)" }],
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("menerima path aset lokal pada heroPhotoUrl dan projects[].imageUrl", () => {
+    const assetPath = "/api/portfolio/assets/6f1c2d3e-4a5b-4c7d-8e9f-0a1b2c3d4e5f";
+    const r = portfolioDataSchema.parse({
+      ...emptyData,
+      formData: { ...validFormData, heroPhotoUrl: assetPath },
+      projects: [
+        { id: "p1", name: "N", description: "D", techStack: "React", link: "", imageUrl: assetPath },
+      ],
+    });
+    expect(r.formData.heroPhotoUrl).toBe(assetPath);
+    expect(r.projects[0].imageUrl).toBe(assetPath);
+  });
+
+  it("mempertahankan companyLogo pada experiences", () => {
+    const logo = "/api/portfolio/assets/9a8b7c6d-5e4f-4a3b-9c2d-1e2f3a4b5c6d";
+    const r = portfolioDataSchema.parse({
+      ...emptyData,
+      experiences: [
+        {
+          id: "e1",
+          company: "Acme",
+          position: "Dev",
+          startDate: "2024-01",
+          endDate: "",
+          description: "",
+          companyLogo: logo,
+        },
+      ],
+    });
+    expect(r.experiences[0].companyLogo).toBe(logo);
+  });
+
+  it("menolak skema terlarang pada experiences[].companyLogo", () => {
+    const bad = {
+      ...emptyData,
+      experiences: [
+        {
+          id: "e1",
+          company: "Acme",
+          position: "Dev",
+          startDate: "2024-01",
+          endDate: "",
+          description: "",
+          companyLogo: "javascript:alert(1)",
+        },
+      ],
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("menerima rentang tanggal yang konsisten", () => {
+
+    const ok = {
+      ...emptyData,
+      experiences: [
+        { id: "e1", company: "Acme", position: "Dev", startDate: "2023-01", endDate: "2024-01", description: "" },
+      ],
+      educations: [
+        {
+          id: "ed1",
+          institution: "Universitas X",
+          degree: "S1",
+          field: "Informatika",
+          startDate: "2019-08",
+          endDate: "",
+          isPresent: true,
+        },
+      ],
+    };
+    expect(portfolioDataSchema.safeParse(ok).success).toBe(true);
+  });
+
+  it("menolak skema terlarang pada experiences[].imageUrl", () => {
+    const bad = {
+      ...emptyData,
+      experiences: [
+        {
+          id: "e1",
+          company: "Acme",
+          position: "Dev",
+          startDate: "2024-01",
+          endDate: "",
+          description: "",
+          imageUrl: "javascript:alert(1)",
+        },
+      ],
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("menerima path aset lokal pada experiences[].imageUrl", () => {
+    const assetPath = "/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f";
+    const r = portfolioDataSchema.parse({
+      ...emptyData,
+      experiences: [
+        {
+          id: "e1",
+          company: "Acme",
+          position: "Dev",
+          startDate: "2024-01",
+          endDate: "",
+          description: "",
+          imageUrl: assetPath,
+        },
+      ],
+    });
+    expect(r.experiences[0].imageUrl).toBe(assetPath);
+  });
+
+  it("menolak section id yang tidak dikenal pada sectionOrder", () => {
+    const bad = {
+      ...emptyData,
+      sectionOrder: ["hero", "footer"],
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("menolak section id yang tidak dikenal pada sectionVisibility", () => {
+    const bad = {
+      ...emptyData,
+      sectionVisibility: { hero: true, footer: false },
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("menolak section id yang tidak dikenal pada sectionColors", () => {
+    const bad = {
+      ...emptyData,
+      sectionColors: { hero: { primary: "#fff" }, footer: { primary: "#000" } },
+    };
+    expect(portfolioDataSchema.safeParse(bad).success).toBe(false);
+  });
+
+  it("mempertahankan sectionOrder dan sectionVisibility yang sah", () => {
+    const sectionOrder = ["hero", "about", "contact"] as const;
+    const r = portfolioDataSchema.parse({
+      ...emptyData,
+      sectionOrder: [...sectionOrder],
+      sectionVisibility: { hero: true, about: false },
+    });
+    expect(r.sectionOrder).toEqual([...sectionOrder]);
+    expect(r.sectionVisibility).toEqual({ hero: true, about: false });
+  });
+
+  it("mempertahankan heroBgUrl dan heroCreativeTitle saat parse", () => {
+    const r = portfolioDataSchema.parse({
+      ...emptyData,
+      formData: {
+        ...validFormData,
+        heroBgUrl: "/uploads/hero-bg.jpg",
+        heroCreativeTitle: "Frontend Engineer",
+      },
+    });
+    expect(r.formData.heroBgUrl).toBe("/uploads/hero-bg.jpg");
+    expect(r.formData.heroCreativeTitle).toBe("Frontend Engineer");
+  });
+
+  it("hasil parse tetap memenuhi tipe PortfolioData", () => {
+    const parsed: PortfolioData = portfolioDataSchema.parse(emptyData);
+    expect(parsed.formData.heroBgUrl).toBe("");
+    expect(parsed.formData.heroCreativeTitle).toBe("");
+  });
+
+  it("menerapkan default pada field opsional", () => {
+    const r = portfolioDataSchema.parse({
+      ...emptyData,
+      projects: [{ id: "p1", name: "N", description: "D", techStack: "React", link: "" }],
+      experiences: [
+        { id: "e1", company: "Acme", position: "Dev", startDate: "2024-01", endDate: "", description: "" },
+      ],
+    });
+    expect(r.projects[0].imageUrl).toBe("");
+    expect(r.projects[0].featured).toBe(false);
+    expect(r.experiences[0].isPresent).toBe(false);
+  });
+});
+
+describe("emptySectionIds", () => {
+  it("mengembalikan dua belas id saat seluruh data kosong", () => {
+    const parsed = portfolioDataSchema.parse({
+      ...emptyData,
+      formData: {
+        heroPhotoUrl: "",
+        heroHeadline: "",
+        heroSubHeadline: "",
+        heroBgUrl: "",
+        heroFirstName: "",
+        heroLastName: "",
+        heroCreativeTitle: "",
+        heroBio: "",
+        aboutText: "",
+        aboutYearsExp: "",
+        aboutProjectsDone: "",
+        aboutClientsHappy: "",
+        skillsMain: "",
+        skillsTools: "",
+        skillsLanguages: "",
+        contactEmail: "",
+        contactPhone: "",
+        contactLinkedin: "",
+        contactGithub: "",
+      },
+    });
+    expect(emptySectionIds(parsed)).toEqual([...SECTION_IDS]);
+  });
+
+  it("tidak menandai hero yang sudah terisi", () => {
+    const parsed = portfolioDataSchema.parse({
+      ...emptyData,
+      formData: {
+        ...validFormData,
+        aboutText: "",
+        aboutYearsExp: "",
+        aboutProjectsDone: "",
+        aboutClientsHappy: "",
+        skillsMain: "",
+        contactEmail: "",
+        contactLinkedin: "",
+        contactGithub: "",
+      },
+    });
+    const empty = emptySectionIds(parsed);
+    expect(empty).not.toContain("hero");
+    expect(empty).toContain("about");
+    expect(empty).toHaveLength(SECTION_IDS.length - 1);
+  });
+
+  it("tetap menandai hero kosong saat hanya headline yang terisi", () => {
+    const parsed = portfolioDataSchema.parse({
+      ...emptyData,
+      formData: { ...validFormData, heroFirstName: "" },
+    });
+    expect(emptySectionIds(parsed)).toContain("hero");
+  });
+});
+
+describe("publishPayloadSchema", () => {
+  it("menolak slug terlarang", () => {
+    expect(
+      publishPayloadSchema.safeParse({ slug: "dashboard", themeId: "glass", data: emptyData }).success,
+    ).toBe(false);
+  });
+
+  it("menolak tema yang tidak dikenal", () => {
+    expect(
+      publishPayloadSchema.safeParse({ slug: "teguh-surya", themeId: "neon-hacker", data: emptyData }).success,
+    ).toBe(false);
+  });
+
+  it("menolak publish tanpa nama depan", () => {
+    expect(
+      publishPayloadSchema.safeParse({
+        slug: "teguh-surya",
+        themeId: "glass",
+        data: { ...emptyData, formData: { ...validFormData, heroFirstName: "" } },
+      }).success,
+    ).toBe(false);
+  });
+
+  it("menolak alignment untuk section yang tidak dikenal", () => {
+    expect(
+      publishPayloadSchema.safeParse({
+        slug: "teguh-surya",
+        themeId: "glass",
+        data: emptyData,
+        alignment: { footer: "center" },
+      }).success,
+    ).toBe(false);
+  });
+
+  it("menerima payload valid lengkap dengan opsi tampilan", () => {
+
+    expect(
+      publishPayloadSchema.safeParse({
+        slug: "teguh-surya",
+        themeId: "luxe",
+        data: emptyData,
+        fontSize: "large",
+        alignment: { hero: "center", contact: "center" },
+      }).success,
+    ).toBe(true);
+  });
+});
+
+describe("tipe output schema ke konsumen", () => {
+  it("sectionVisibility hasil parse langsung muat di empat tipe konsumen", () => {
+    const parsed = portfolioDataSchema.parse({
+      ...emptyData,
+      sectionVisibility: { hero: true, about: false },
+    });
+    const visibility = parsed.sectionVisibility;
+    expect(visibility).toBeDefined();
+    if (!visibility) throw new Error("sectionVisibility harus ada pada payload ini");
+
+    // Assertion compile-time: keempat baris ini GAGAL di `npx tsc --noEmit`
+    // kalau tipe konsumen kembali diperketat ke Record<SectionId, boolean>
+    // (peta parsial hasil parse tidak muat ke record lengkap).
+    const canvas: Pick<PortfolioCanvasProps, "sectionVisibility"> = {
+      sectionVisibility: visibility,
+    };
+    const published: Pick<PublishedPortfolioProps, "sectionVisibility"> = {
+      sectionVisibility: visibility,
+    };
+    const dialog: Pick<NonNullable<PublishDialogProps["extras"]>, "sectionVisibility"> = {
+      sectionVisibility: visibility,
+    };
+    const live: Pick<LiveData, "sectionVisibility"> = {
+      sectionVisibility: visibility,
+    };
+
+    expect(canvas.sectionVisibility).toEqual({ hero: true, about: false });
+    expect(published.sectionVisibility).toEqual({ hero: true, about: false });
+    expect(dialog.sectionVisibility).toEqual({ hero: true, about: false });
+    expect(live.sectionVisibility).toEqual({ hero: true, about: false });
+  });
+
+  it("LiveData juga menerima alignment parsial hasil parse", () => {
+    const parsed = publishPayloadSchema.parse({
+      slug: "teguh-surya",
+      themeId: "glass",
+      data: emptyData,
+      alignment: { hero: "center" },
+    });
+
+    // Assertion compile-time: gagal kalau LiveData.alignment kembali
+    // diperketat ke Record<SectionId, TextAlignment>.
+    const live: Pick<LiveData, "alignment"> = { alignment: parsed.alignment };
+    expect(live.alignment).toEqual({ hero: "center" });
+  });
+});
+
+describe("draftPayloadSchema", () => {
+  it("menerima nama kosong dan memakai default", () => {
+    expect(draftPayloadSchema.parse({ data: emptyData }).name).toBe("Portfolio saya");
+  });
+
+  it("memotong nama draft lebih dari 120 karakter", () => {
+    expect(draftPayloadSchema.parse({ name: "a".repeat(200), data: emptyData }).name.length).toBe(120);
+  });
+});
+
+/* ─── Visibilitas parsial: satu aturan, dua konsumen ─── */
+
+/** Seksi portfolio memakai IntersectionObserver dan matchMedia yang tidak ada
+ *  di jsdom; stub ini cuma supaya bisa dirender di test. */
+function stubBrowserApis() {
+  // @ts-expect-error stub minimal IntersectionObserver
+  globalThis.IntersectionObserver = class {
+    observe() {}
+    unobserve() {}
+    disconnect() {}
+    takeRecords() { return []; }
+  };
+  window.matchMedia = ((query: string) => ({
+    matches: false,
+    media: query,
+    onchange: null,
+    addListener() {},
+    removeListener() {},
+    addEventListener() {},
+    removeEventListener() {},
+    dispatchEvent() { return false; },
+  })) as never;
+}
+
+describe("resolveVisibility", () => {
+  const order = ["hero", "about", "contact"] as const;
+
+  it("treats a section missing from the map as visible", () => {
+    expect(resolveVisibility(order, { hero: false })).toEqual(["about", "contact"]);
+  });
+
+  it("treats an absent map as everything visible", () => {
+    expect(resolveVisibility(order, undefined)).toEqual([...order]);
+  });
+
+  it("treats an empty map as everything visible", () => {
+    expect(resolveVisibility(order, {})).toEqual([...order]);
+  });
+
+  it("only drops sections explicitly marked false", () => {
+    expect(resolveVisibility(order, { contact: false, about: false })).toEqual(["hero"]);
+    expect(isSectionVisible({ about: false }, "about")).toBe(false);
+    expect(isSectionVisible({}, "about")).toBe(true);
+  });
+});
+
+describe("canvas dan halaman publik membaca peta parsial sama", () => {
+  it("canvas still renders a section missing from a partial visibility map", () => {
+    // Persis skenario yang ditemukan: output schema (peta parsial) mengalir
+    // ke editor. about tidak disebut di peta, jadi harus tetap tampil.
+    const parsed = portfolioDataSchema.parse({
+      ...emptyData,
+      sectionVisibility: { hero: false },
+    });
+    const sectionVisibility = parsed.sectionVisibility;
+    if (!sectionVisibility) throw new Error("sectionVisibility harus ada pada payload ini");
+
+    render(
+      createElement(PortfolioCanvas, {
+        themeId: "glass",
+        sectionOrder: ["hero", "about"],
+        onSectionOrderChange: () => {},
+        sectionVisibility,
+        onToggleSection: () => {},
+        selectedSection: null,
+        onSelectSection: () => {},
+        children: [
+          createElement("div", { key: "hero", "data-section-id": "hero" }, "SEKSI_HERO"),
+          createElement("div", { key: "about", "data-section-id": "about" }, "SEKSI_ABOUT"),
+        ],
+      }),
+    );
+
+    expect(screen.queryByText("SEKSI_HERO")).toBeNull();
+    expect(screen.getByText("SEKSI_ABOUT")).toBeTruthy();
+  });
+
+  it("published page renders the same section from the same partial map", () => {
+    stubBrowserApis();
+    const parsed = portfolioDataSchema.parse({
+      ...emptyData,
+      formData: { ...validFormData, aboutText: "TENTANG_SAYA_UNIK" },
+      sectionVisibility: { hero: false },
+    });
+    const sectionVisibility = parsed.sectionVisibility;
+    if (!sectionVisibility) throw new Error("sectionVisibility harus ada pada payload ini");
+
+    render(
+      createElement(PublishedPortfolio, {
+        data: parsed as PortfolioData,
+        themeId: "glass",
+        sectionOrder: ["hero", "about"],
+        sectionVisibility,
+      }),
+    );
+
+    expect(screen.getByText(/TENTANG_SAYA_UNIK/)).toBeTruthy();
+  });
+});
+
+/* ─── Format nilai sectionColors ─── */
+
+describe("sectionColors", () => {
+  const withColor = (value: string) =>
+    portfolioDataSchema.safeParse({
+      ...emptyData,
+      sectionColors: { hero: { primary: value } },
+    });
+
+  const ACCEPTED = [
+    "#fff",
+    "#FFFF",
+    "#a1b2c3",
+    "#a1b2c3d4",
+    "#FFF",
+    "rgb(255, 0, 128)",
+    "rgba(255, 0, 128, 0.5)",
+    "rgb(100%, 0%, 50%)",
+    "hsl(210, 50%, 40%)",
+    "hsla(210, 50%, 40%, 0.5)",
+  ];
+
+  it.each(ACCEPTED)("menerima %s", (value) => {
+    expect(withColor(value).success).toBe(true);
+  });
+
+  const REJECTED = [
+    "var(--p-primary)",
+    "url(javascript:alert(1))",
+    "expression(alert(1))",
+    "biru",
+    "#ff",
+    "#fffffffff",
+    "rgb(1, 2)",
+    "hsl(210, 50%)",
+    "rgb(1,2,3); background: url(x)",
+  ];
+
+  it.each(REJECTED)("menolak %s", (value) => {
+    expect(withColor(value).success).toBe(false);
+  });
+
+  it("menolak dengan pesan yang menyebut format yang diterima", () => {
+    const result = withColor("var(--p-primary)");
+    expect(result.success).toBe(false);
+    if (result.success) return;
+    expect(result.error.issues[0].message).toBe(
+      "Warna harus hex (#rgb atau #rrggbb), rgb(), atau hsl()",
+    );
+    expect(result.error.issues[0].path).toEqual(["sectionColors", "hero", "primary"]);
+  });
+});
+
+/* ─── Contact field: trim seperti field teks lain ─── */
+
+describe("field kontak", () => {
+  it("mem-trim spasi tepi pada contactEmail", () => {
+    const r = portfolioDataSchema.parse({
+      ...emptyData,
+      formData: { ...validFormData, contactEmail: "  teguh@example.com  " },
+    });
+    expect(r.formData.contactEmail).toBe("teguh@example.com");
+  });
+
+  it("mem-trim spasi tepi pada contactPhone", () => {
+    const r = portfolioDataSchema.parse({
+      ...emptyData,
+      formData: { ...validFormData, contactPhone: " +62 812 3456 " },
+    });
+    expect(r.formData.contactPhone).toBe("+62 812 3456");
+  });
+
+  it("tetap menolak email dan telepon yang rusak setelah di-trim", () => {
+    expect(
+      portfolioDataSchema.safeParse({
+        ...emptyData,
+        formData: { ...validFormData, contactEmail: " bukan-email " },
+      }).success,
+    ).toBe(false);
+    expect(
+      portfolioDataSchema.safeParse({
+        ...emptyData,
+        formData: { ...validFormData, contactPhone: " 12 " },
+      }).success,
+    ).toBe(false);
+  });
+});
+
+describe("pesan publish tanpa nama", () => {
+  it("menunjuk field yang salah, bukan akar payload", () => {
+    const result = publishPayloadSchema.safeParse({
+      slug: "teguh-surya",
+      themeId: "glass",
+      data: { ...emptyData, formData: { ...validFormData, heroFirstName: "  " } },
+    });
+    expect(result.success).toBe(false);
+    if (result.success) return;
+    const issue = result.error.issues[0];
+    expect(issue.message).toBe("Isi nama dulu sebelum menerbitkan");
+    expect(issue.path).toEqual(["data", "formData", "heroFirstName"]);
+  });
+});
+
diff --git a/src/app/p/[slug]/page.tsx b/src/app/p/[slug]/page.tsx
index 82af12e..489bcbb 100644
--- a/src/app/p/[slug]/page.tsx
+++ b/src/app/p/[slug]/page.tsx
@@ -1,19 +1,19 @@
 import { cache } from "react";
 import { notFound } from "next/navigation";
 import type { Metadata } from "next";
 import { db } from "@/db";
 import { portfolioPages } from "@/db/schema";
 import { eq } from "drizzle-orm";
 import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
 import PublishedPortfolio from "@/components/portfolio/PublishedPortfolio";
-import type { PortfolioData, SectionId } from "@/components/portfolio/types";
+import type { PortfolioData, SectionId, SectionVisibility } from "@/components/portfolio/types";
 
 interface PageProps {
   params: Promise<{ slug: string }>;
 }
 
 export const dynamic = "force-dynamic";
 
 /** Satu query per request, dipakai bersama generateMetadata & page (React cache). */
 const getPublishedPortfolio = cache(async (slug: string) => {
   const [row] = await db
@@ -44,21 +44,21 @@ export async function generateMetadata({ params }: PageProps): Promise<Metadata>
 }
 
 export default async function PublishedPortfolioPage({ params }: PageProps) {
   const { slug } = await params;
   const row = await getPublishedPortfolio(slug);
 
   if (!row) notFound();
 
   const d = row.data as unknown as PortfolioData & {
     sectionOrder?: SectionId[];
-    sectionVisibility?: Record<SectionId, boolean>;
+    sectionVisibility?: SectionVisibility;
   };
   const theme = THEMES[row.theme] || THEMES[DEFAULT_THEME_ID];
 
   return (
     <>
       <link rel="stylesheet" href={theme.fontUrl} />
       <PublishedPortfolio
         data={d}
         themeId={row.theme}
         sectionOrder={d.sectionOrder}
diff --git a/src/app/portfolio/live/page.tsx b/src/app/portfolio/live/page.tsx
index 87040dd..fe0a4b4 100644
--- a/src/app/portfolio/live/page.tsx
+++ b/src/app/portfolio/live/page.tsx
@@ -3,22 +3,23 @@
 import { useState, useEffect, useCallback } from "react";
 import { useTranslation } from "@/lib/i18n";
 import AuthGuard from "@/components/AuthGuard";
 import AppHeader from "@/components/AppHeader";
 import PortfolioCanvas, { SECTION_META } from "@/components/portfolio/PortfolioCanvas";
 import DateField from "@/components/portfolio/DateField";
 import PhotoUpload from "@/components/portfolio/PhotoUpload";
 import { AIPolishButton } from "@/components/ai/AIPolishDialog";
 import PublishDialog from "@/components/portfolio/PublishDialog";
 import { THEMES, DEFAULT_THEME_ID, DEFAULT_SECTION_ORDER } from "@/components/portfolio/themes";
+import { FONT_SIZES } from "@/components/portfolio/types";
 import type {
-  SectionId, ThemeId, PortfolioFormData,
+  SectionId, SectionVisibility, ThemeId, PortfolioFormData,
   ProjectItem, ExperienceItem, EducationItem,
   CertificationItem, OrganizationItem, HobbyItem,
   TestimonialItem, ExtraLink, FontSize, TextAlignment,
 } from "@/components/portfolio/types";
 
 /* ─── SECTION IMPORTS ─── */
 import HeroSection from "@/components/portfolio/sections/HeroSection";
 import AboutSection from "@/components/portfolio/sections/AboutSection";
 import StatsSection from "@/components/portfolio/sections/StatsSection";
 import SkillsSection from "@/components/portfolio/sections/SkillsSection";
@@ -46,35 +47,38 @@ const DEFAULT_ALIGNMENT: Record<SectionId, TextAlignment> = {
   hero: "center", about: "left", stats: "center",
   experience: "left", education: "left", projects: "left",
   skills: "left", certifications: "left", organizations: "left", hobbies: "left",
   testimonials: "center", contact: "center",
 };
 
 type TabId = "sections" | "edit" | "design" | "ai";
 
 const STORAGE_KEY = "portfolio_live_data";
 
-interface LiveData {
+/** Bentuk draft yang disimpan ke localStorage. Dua field tampilan sengaja
+ *  dibiarkan parsial supaya bisa langsung diberi draftPayloadSchema nanti ini:
+ *  peta parsial hasil parse schema tidak muat ke Record lengkap. */
+export interface LiveData {
   formData: PortfolioFormData;
   projects: ProjectItem[];
   experiences: ExperienceItem[];
   educations: EducationItem[];
   certifications: CertificationItem[];
   organizations: OrganizationItem[];
   hobbies: HobbyItem[];
   testimonials: TestimonialItem[];
   extraLinks: ExtraLink[];
   sectionOrder: SectionId[];
   themeId: ThemeId;
-  sectionVisibility: Record<SectionId, boolean>;
+  sectionVisibility: SectionVisibility;
   fontSize: FontSize;
-  alignment: Record<SectionId, TextAlignment>;
+  alignment: Partial<Record<SectionId, TextAlignment>>;
 }
 
 function loadDraft(): LiveData | null {
   if (typeof window === "undefined") return null;
   try {
     const raw = localStorage.getItem(STORAGE_KEY);
     if (!raw) return null;
     return JSON.parse(raw);
   } catch { return null; }
 }
@@ -122,23 +126,24 @@ export default function PortfolioLiveBuilder() {
       setProjects(draft.projects);
       setExperiences(draft.experiences);
       setEducations(draft.educations);
       if (draft.certifications) setCertifications(draft.certifications);
       if (draft.organizations) setOrganizations(draft.organizations);
       if (draft.hobbies) setHobbies(draft.hobbies);
       setTestimonials(draft.testimonials);
       setExtraLinks(draft.extraLinks);
       setSectionOrder(draft.sectionOrder);
       setThemeId(draft.themeId);
-      if (draft.sectionVisibility) setSectionVisibility(draft.sectionVisibility);
+      // Draft boleh parsial (hasil parse schema), state builder selalu lengkap.
+      if (draft.sectionVisibility) setSectionVisibility(prev => ({ ...prev, ...draft.sectionVisibility }));
       if (draft.fontSize) setFontSize(draft.fontSize);
-      if (draft.alignment) setAlignment(draft.alignment);
+      if (draft.alignment) setAlignment(prev => ({ ...prev, ...draft.alignment }));
     }
     setMounted(true);
   }, []);
 
   // Auto-save
   useEffect(() => {
     if (!mounted) return;
     const timer = setTimeout(() => {
       saveDraft({ formData, projects, experiences, educations, certifications, organizations, hobbies, testimonials, extraLinks, sectionOrder, themeId, sectionVisibility, fontSize, alignment });
     }, 1000);
@@ -504,21 +509,21 @@ export default function PortfolioLiveBuilder() {
               {/* ===== DESIGN TAB ===== */}
               {activeTab === "design" && (
                 <div className="space-y-5">
                   {/* Font Size */}
                   <div>
                     <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                       <span className="material-symbols-outlined text-[14px]">text_fields</span>
                       {t("live.font-size")}
                     </label>
                     <div className="flex gap-2">
-                      {(["small", "medium", "large"] as FontSize[]).map(size => (
+                      {FONT_SIZES.map(size => (
                         <button
                           key={size}
                           onClick={() => setFontSize(size)}
                           className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                             fontSize === size
                               ? "bg-primary text-on-primary"
                               : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                           }`}
                         >
                           {size === "small" ? t("live.font-small") : size === "medium" ? t("live.font-medium") : t("live.font-large")}
diff --git a/src/components/portfolio-templates/types.ts b/src/components/portfolio-templates/types.ts
index 6ebfd3e..54cee39 100644
--- a/src/components/portfolio-templates/types.ts
+++ b/src/components/portfolio-templates/types.ts
@@ -1,13 +1,24 @@
 export interface TestimonialItem { id: string; name: string; position: string; testimonial: string; }
 export interface ExtraLink { id: string; label: string; url: string; }
-export interface ProjectItem { id: string; name: string; description: string; techStack: string; link: string; imageUrl?: string; }
+export interface ProjectItem {
+  id: string;
+  name: string;
+  description: string;
+  techStack: string;
+  link: string;
+  imageUrl?: string;
+  liveUrl?: string;
+  repoUrl?: string;
+  role?: string;
+  featured?: boolean;
+}
 export interface ExperienceItem { id: string; company: string; position: string; startDate: string; endDate: string; description: string; isPresent?: boolean; imageUrl?: string; companyLogo?: string; }
 export interface EducationItem { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; isPresent?: boolean; }
 export interface CertificationItem { id: string; name: string; issuer: string; year: string; url?: string; }
 export interface OrganizationItem { id: string; name: string; role: string; period: string; description: string; }
 export interface HobbyItem { id: string; name: string; description: string; }
 
 export interface PortfolioFormData {
   heroPhotoUrl: string;
   heroHeadline: string;
   heroSubHeadline: string;
diff --git a/src/components/portfolio/PortfolioCanvas.tsx b/src/components/portfolio/PortfolioCanvas.tsx
index 95c3087..d1a52bb 100644
--- a/src/components/portfolio/PortfolioCanvas.tsx
+++ b/src/components/portfolio/PortfolioCanvas.tsx
@@ -12,35 +12,36 @@ import {
   type DragEndEvent,
   type DragStartEvent,
 } from "@dnd-kit/core";
 import {
   SortableContext,
   sortableKeyboardCoordinates,
   useSortable,
   verticalListSortingStrategy,
 } from "@dnd-kit/sortable";
 import { CSS } from "@dnd-kit/utilities";
-import type { SectionId, ThemeDefinition, ThemeColors } from "./types";
+import type { FontSize, SectionConfig, SectionId, SectionVisibility, ThemeDefinition } from "./types";
+import { isSectionVisible, resolveVisibility } from "./sectionVisibility";
+import { SECTION_IDS } from "./types";
 import { THEMES, DEFAULT_THEME_ID } from "./themes";
-
 /* ─── Context ─── */
 
 const ThemeContext = createContext<ThemeDefinition>(THEMES[DEFAULT_THEME_ID]);
 export { ThemeContext };
 export const usePortfolioTheme = () => useContext(ThemeContext);
 
 /** Provides section-scoped theme override for per-section colors */
 
 interface OrderContextType {
   sectionOrder: SectionId[];
   setSectionOrder: (order: SectionId[]) => void;
-  sectionConfigs: Record<SectionId, { id: SectionId; label: string; icon: string; visible: boolean }>;
+  sectionConfigs: Record<SectionId, SectionConfig>;
   toggleSection: (id: SectionId) => void;
 }
 
 const OrderContext = createContext<OrderContextType | null>(null);
 export const useSectionOrder = () => useContext(OrderContext)!;
 
 /* ─── Section-scoped Theme Provider ─── */
 
 function SectionThemeProvider({ sectionId, children }: { sectionId: SectionId; children: React.ReactNode }) {
   const theme = usePortfolioTheme();
@@ -160,27 +161,25 @@ export const SECTION_META: Record<SectionId, { label: string; icon: string }> =
   skills: { label: "Keahlian", icon: "stars" },
   certifications: { label: "Sertifikat", icon: "workspace_premium" },
   organizations: { label: "Organisasi", icon: "groups" },
   hobbies: { label: "Hobi & Minat", icon: "favorite" },
   testimonials: { label: "Testimoni", icon: "format_quote" },
   contact: { label: "Kontak", icon: "contact_support" },
 };
 
 /* ─── MAIN COMPONENT ─── */
 
-type FontSize = "small" | "medium" | "large";
-
-interface PortfolioCanvasProps {
+export interface PortfolioCanvasProps {
   themeId: string;
   sectionOrder: SectionId[];
   onSectionOrderChange: (order: SectionId[]) => void;
-  sectionVisibility: Record<SectionId, boolean>;
+  sectionVisibility: SectionVisibility;
   onToggleSection: (id: SectionId) => void;
   selectedSection: SectionId | null;
   onSelectSection: (id: SectionId | null) => void;
   fontSize?: FontSize;
   children: React.ReactNode;
 }
 
 const FONT_SIZE_MAP: Record<string, { base: string; small: string; h2: string; h3: string }> = {
   small: { base: "14px", small: "12px", h2: "1.25rem", h3: "1.05rem" },
   medium: { base: "16px", small: "13px", h2: "1.5rem", h3: "1.15rem" },
@@ -199,54 +198,53 @@ export default function PortfolioCanvas({
   children,
 }: PortfolioCanvasProps) {
   const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
   const [activeId, setActiveId] = React.useState<SectionId | null>(null);
 
   const sensors = useSensors(
     useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
     useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
   );
 
-  const visibleSections = sectionOrder.filter(id => sectionVisibility[id]);
+  const visibleSections = resolveVisibility(sectionOrder, sectionVisibility);
   const fm = FONT_SIZE_MAP[fontSize];
 
   const handleDragEnd = (event: DragEndEvent) => {
     const { active, over } = event;
     setActiveId(null);
 
     if (over && active.id !== over.id) {
       const oldIndex = visibleSections.indexOf(active.id as SectionId);
       const newIndex = visibleSections.indexOf(over.id as SectionId);
       const newOrder = [...visibleSections];
       newOrder.splice(oldIndex, 1);
       newOrder.splice(newIndex, 0, active.id as SectionId);
 
-      const hidden = sectionOrder.filter(id => !sectionVisibility[id]);
       const result: SectionId[] = [];
       let vi = 0;
       for (const sid of sectionOrder) {
-        if (sectionVisibility[sid]) {
+        if (isSectionVisible(sectionVisibility, sid)) {
           result.push(newOrder[vi++]);
         } else {
           result.push(sid);
         }
       }
       onSectionOrderChange(result);
     }
   };
 
   const sectionConfigs = Object.fromEntries(
-    Object.entries(SECTION_META).map(([id, meta]) => [
+    SECTION_IDS.map((id) => [
       id,
-      { id: id as SectionId, ...meta, visible: sectionVisibility[id as SectionId] },
+      { id, ...SECTION_META[id], visible: isSectionVisible(sectionVisibility, id) },
     ])
-  ) as Record<SectionId, { id: SectionId; label: string; icon: string; visible: boolean }>;
+  ) as Record<SectionId, SectionConfig>;
 
   return (
     <ThemeContext.Provider value={theme}>
       <OrderContext.Provider value={{
         sectionOrder,
         setSectionOrder: onSectionOrderChange,
         sectionConfigs,
         toggleSection: onToggleSection,
       }}>
         <div
@@ -268,21 +266,21 @@ export default function PortfolioCanvas({
             onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as SectionId)}
             onDragEnd={handleDragEnd}
             onDragCancel={() => setActiveId(null)}
           >
             <SortableContext items={visibleSections} strategy={verticalListSortingStrategy}>
               <div className="relative">
                 {React.Children.map(children, (child) => {
                   if (!React.isValidElement(child)) return null;
                   // @ts-expect-error - data-section-id is a custom prop
                   const sectionId = child.props["data-section-id"] as SectionId;
-                  if (!sectionId || !sectionVisibility[sectionId]) return null;
+                  if (!sectionId || !isSectionVisible(sectionVisibility, sectionId)) return null;
                   return (
                     <SortableSection
                       id={sectionId}
                       isSelected={selectedSection === sectionId}
                       onSelect={() => onSelectSection(selectedSection === sectionId ? null : sectionId)}
                     >
                       {child}
                     </SortableSection>
                   );
                 })}
diff --git a/src/components/portfolio/PublishDialog.tsx b/src/components/portfolio/PublishDialog.tsx
index 010cf11..970c16c 100644
--- a/src/components/portfolio/PublishDialog.tsx
+++ b/src/components/portfolio/PublishDialog.tsx
@@ -1,19 +1,19 @@
 "use client";
 
 import { useCallback, useEffect, useRef, useState } from "react";
 import { useRouter } from "next/navigation";
 import { useTranslation } from "@/lib/i18n";
 import { useToast } from "@/components/ui/toast";
 import type { PortfolioData } from "@/components/portfolio/types";
 
-interface PublishDialogProps {
+export interface PublishDialogProps {
   open: boolean;
   onClose: () => void;
   data: PortfolioData | null;
   themeId: string;
   /** Tambahan data live-builder (sectionOrder / visibility) */
   extras?: { sectionOrder?: string[]; sectionVisibility?: Record<string, boolean> };
 }
 
 interface PortfolioPlan {
   entitled: boolean;
diff --git a/src/components/portfolio/PublishedPortfolio.tsx b/src/components/portfolio/PublishedPortfolio.tsx
index fd142e0..aff4b1e 100644
--- a/src/components/portfolio/PublishedPortfolio.tsx
+++ b/src/components/portfolio/PublishedPortfolio.tsx
@@ -1,51 +1,52 @@
 "use client";
 
 import React from "react";
 import { THEMES, DEFAULT_THEME_ID, DEFAULT_SECTION_ORDER } from "./themes";
 import { ThemeContext } from "./PortfolioCanvas";
-import type { SectionId, ThemeDefinition, PortfolioData } from "./types";
+import { resolveVisibility } from "./sectionVisibility";
+import type { SectionId, SectionVisibility, ThemeDefinition, PortfolioData } from "./types";
 
 import HeroSection from "./sections/HeroSection";
 import AboutSection from "./sections/AboutSection";
 import StatsSection from "./sections/StatsSection";
 import SkillsSection from "./sections/SkillsSection";
 import ProjectsSection from "./sections/ProjectsSection";
 import ExperienceSection from "./sections/ExperienceSection";
 import EducationSection from "./sections/EducationSection";
 import CertificationsSection from "./sections/CertificationsSection";
 import OrganizationsSection from "./sections/OrganizationsSection";
 import HobbiesSection from "./sections/HobbiesSection";
 import TestimonialsSection from "./sections/TestimonialsSection";
 import ContactSection from "./sections/ContactSection";
 
-interface PublishedPortfolioProps {
+export interface PublishedPortfolioProps {
   data: PortfolioData;
   themeId: string;
   sectionOrder?: SectionId[];
-  sectionVisibility?: Record<SectionId, boolean>;
+  sectionVisibility?: SectionVisibility;
   showFooter?: boolean;
 }
 
 /** Render portfolio publik, persis seperti preview (WYSIWYG), tanpa chrome app. */
 export default function PublishedPortfolio({
   data,
   themeId,
   sectionOrder,
   sectionVisibility,
   showFooter = true,
 }: PublishedPortfolioProps) {
   const theme: ThemeDefinition = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
   const { formData: f, projects, experiences, educations, certifications, organizations, hobbies, testimonials, extraLinks } = data;
 
   const order = sectionOrder && sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;
-  const isVisible = (id: SectionId) => !sectionVisibility || sectionVisibility[id] !== false;
+  const visibleOrder = resolveVisibility(order, sectionVisibility);
 
   const name = [f.heroFirstName, f.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap";
 
   const renderSection = (id: SectionId) => {
     switch (id) {
       case "hero": return <HeroSection data={f} />;
       case "about": return <AboutSection data={f} />;
       case "stats": return <StatsSection data={f} />;
       case "experience": return <ExperienceSection items={experiences} />;
       case "education": return <EducationSection items={educations} />;
@@ -62,21 +63,21 @@ export default function PublishedPortfolio({
   return (
     <ThemeContext.Provider value={theme}>
       <div
         className="min-h-screen"
         style={{
           backgroundColor: theme.colors.bg,
           color: theme.colors.text,
           fontFamily: theme.font.includes(" ") ? `'${theme.font}', sans-serif` : `${theme.font}, sans-serif`,
         }}
       >
-        {order.filter(isVisible).map((id) => (
+        {visibleOrder.map((id) => (
           <React.Fragment key={id}>{renderSection(id)}</React.Fragment>
         ))}
         {showFooter && (
           <footer
             className="text-center py-8"
             style={{ color: theme.colors.textMuted, borderTop: `1px solid ${theme.colors.border}`, fontSize: 13 }}
           >
             &copy; {new Date().getFullYear()} {name}. Dibuat dengan AI Career Hub
           </footer>
         )}
diff --git a/src/components/portfolio/sectionVisibility.ts b/src/components/portfolio/sectionVisibility.ts
new file mode 100644
index 0000000..01b7f28
--- /dev/null
+++ b/src/components/portfolio/sectionVisibility.ts
@@ -0,0 +1,19 @@
+import type { SectionId, SectionVisibility } from "./types";
+
+/**
+ * Aturan tunggal untuk membaca peta visibilitas yang sengaja parsial: section
+ * yang tidak disebut dianggap tampil. Editor (PortfolioCanvas) dan halaman
+ * publik (PublishedPortfolio) wajib lewat helper ini, kalau tidak keduanya
+ * bisa berbeda pendapat soal peta yang sebagian terisi dan preview editor
+ * kehilangan section yang tetap tampil di halaman publik.
+ */
+export const isSectionVisible = (
+  visibility: SectionVisibility | undefined,
+  id: SectionId,
+): boolean => !visibility || visibility[id] !== false;
+
+/** Urutan section yang benar-benar dirender, sesuai aturan di atas. */
+export const resolveVisibility = (
+  order: readonly SectionId[],
+  visibility: SectionVisibility | undefined,
+): SectionId[] => order.filter((id) => isSectionVisible(visibility, id));
diff --git a/src/components/portfolio/types.ts b/src/components/portfolio/types.ts
index 3ef1726..2d7814d 100644
--- a/src/components/portfolio/types.ts
+++ b/src/components/portfolio/types.ts
@@ -1,25 +1,38 @@
-export type SectionId =
-  | "hero"
-  | "about"
-  | "stats"
-  | "experience"
-  | "education"
-  | "projects"
-  | "skills"
-  | "certifications"
-  | "organizations"
-  | "hobbies"
-  | "testimonials"
-  | "contact";
+/** Dua belas section portfolio. Sumber kebenaran untuk union SectionId
+ *  sekaligus untuk validasi Zod (sectionOrder / sectionVisibility). */
+export const SECTION_IDS = [
+  "hero",
+  "about",
+  "stats",
+  "experience",
+  "education",
+  "projects",
+  "skills",
+  "certifications",
+  "organizations",
+  "hobbies",
+  "testimonials",
+  "contact",
+] as const;
 
-export type ThemeId = "glass" | "brutal" | "luxe";
+export type SectionId = (typeof SECTION_IDS)[number];
+
+/** Peta visibilitas section. Sengaja parsial: section yang tidak disebut
+ *  dianggap tampil, jadi peta kosong berarti "semua section tampil". */
+export type SectionVisibility = Partial<Record<SectionId, boolean>>;
+
+/** Tema yang tersedia. Sumber kebenaran untuk union ThemeId sekaligus untuk
+ *  validasi Zod (publishPayloadSchema.themeId). */
+export const THEME_IDS = ["glass", "brutal", "luxe"] as const;
+
+export type ThemeId = (typeof THEME_IDS)[number];
 
 export interface ThemeColors {
   bg: string;
   bgSecondary: string;
   surface: string;
   surfaceHover: string;
   text: string;
   textSecondary: string;
   textMuted: string;
   primary: string;
@@ -42,21 +55,25 @@ export interface ThemeDefinition {
   previewGradient: string;
 }
 
 export interface SectionConfig {
   id: SectionId;
   label: string;
   icon: string;
   visible: boolean;
 }
 
-export type FontSize = "small" | "medium" | "large";
+/** Ukuran font yang tersedia. Sumber kebenaran untuk union FontSize sekaligus
+ *  untuk validasi Zod (publishPayloadSchema.fontSize). */
+export const FONT_SIZES = ["small", "medium", "large"] as const;
+
+export type FontSize = (typeof FONT_SIZES)[number];
 export type TextAlignment = "left" | "center" | "right";
 
 export interface TypographySettings {
   fontSize: FontSize;
   alignment: Record<SectionId, TextAlignment>;
 }
 
 export interface PortfolioSettings {
   sectionOrder: SectionId[];
   themeId: ThemeId;
diff --git a/src/lib/portfolio-safety.ts b/src/lib/portfolio-safety.ts
index e43e947..3a44684 100644
--- a/src/lib/portfolio-safety.ts
+++ b/src/lib/portfolio-safety.ts
@@ -6,23 +6,39 @@
 /** Escape HTML entities, wajib untuk semua user content (anti-XSS). */
 export function esc(v: unknown): string {
   return String(v ?? "")
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#39;");
 }
 
-/** Validasi & sanitasi URL, hanya http/https/mailto/tel yang diizinkan, javascript: ditolak. */
+/** Backslash atau karakter kontrol ASCII (0x00-0x1F, 0x7F). */
+const URL_UNSAFE_CHARS = /[\x00-\x1f\x7f\\]/;
+
+/**
+ * Validasi & sanitasi URL. Menerima http/https/mailto/tel, path relatif yang
+ * diawali `/`, dan domain telanjang (diberi prefiks https://).
+ * Skema lain — javascript:, data:, vbscript:, file: — ditolak dengan "".
+ * `//host` (protocol-relative) juga ditolak: di href itu resolve ke origin lain.
+ *
+ * Backslash dan karakter kontrol ASCII ditolak sebelum cek path relatif: browser
+ * menormalkan `\` jadi `/` dan meng-strip tab/newline dari URL, sehingga
+ * `/\evil.com` dan `/<TAB>/evil.com` berakhir jadi `//evil.com` (origin lain).
+ */
 export function safeUrl(v: string): string {
   const t = v.trim();
+  if (URL_UNSAFE_CHARS.test(t)) return "";
+  // Output `esc()` adalah konteks atribut HTML (href/src); jangan pernah
+  // diberi ke fetch() atau CSS url() — `&amp;` di sana bukan pemisah query.
+  if (/^\/(?!\/)/.test(t)) return esc(t);
   if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return esc(t);
   if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t)) return esc("https://" + t);
   return "";
 }
 
 /** Slug publik portfolio: huruf kecil, angka, tanda hubung, 3–50 karakter. */
 export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,49}$/;
 
 export const RESERVED_SLUGS = new Set([
   "api", "admin", "login", "register", "dashboard", "checker", "builder",
diff --git a/src/lib/portfolio/schema.ts b/src/lib/portfolio/schema.ts
new file mode 100644
index 0000000..f7931ac
--- /dev/null
+++ b/src/lib/portfolio/schema.ts
@@ -0,0 +1,296 @@
+import { z } from "zod";
+import { isValidSlug, safeUrl } from "@/lib/portfolio-safety";
+import { FONT_SIZES, SECTION_IDS, THEME_IDS, type SectionId } from "@/components/portfolio/types";
+
+export { THEME_IDS };
+
+/** Batas jumlah item per array. Yang menegakkan batas ini adalah schema;
+ *  task builder berikutnya yang bertanggung jawab mencerminkannya jadi batas
+ *  input di form. */
+export const LIMITS = {
+  projects: 60,
+  experiences: 40,
+  educations: 20,
+  certifications: 40,
+  organizations: 20,
+  hobbies: 30,
+  testimonials: 30,
+  extraLinks: 12,
+} as const;
+
+/** Panjang maksimum string. Schema satu-satunya otoritas panjang: form builder
+ *  perlu mencerminkan angka-angka ini sebagai maxLength, tapi saat ini input form
+ *  belum semuanya memakai maxLength, jadi jangan jadikan angka ini bukti
+ *  validasi di sisi form.
+ *  Panjang slug tidak ada di sini: SLUG_REGEX (lewat isValidSlug) satu-satunya
+ *  penentu panjang slug. */
+const MAX = {
+  short: 200,
+  line: 500,
+  paragraph: 1000,
+  long: 1500,
+  name: 80,
+  email: 254,
+  phone: 32,
+  url: 2048,
+} as const;
+
+const text = (max: number) => z.string().max(max);
+
+/** URL wajib lolos safeUrl. String kosong tetap sah. */
+const urlField = (max: number) =>
+  z
+    .string()
+    .max(max)
+    .transform((v) => v.trim())
+    .refine((v) => v === "" || safeUrl(v) !== "", {
+      message: "Tautan memakai skema yang tidak diizinkan",
+    });
+
+/** Tanggal portfolio: YYYY-MM, atau string kosong (spasi tepi di-trim dulu). */
+const monthField = z
+  .string()
+  .trim()
+  .regex(/^$|^\d{4}-(0[1-9]|1[0-2])$/, "Tanggal harus format YYYY-MM");
+
+/** Nama field tanggal selesai, supaya pesan error menyebut field yang benar:
+ *  pengalaman kerja tidak sama dengan riwayat pendidikan. */
+type EndDateLabel = "tanggal selesai" | "tanggal lulus";
+
+/**
+ * Nilai sectionColors akan masuk ke inline style dan custom property, jadi
+ * bentuknya dibatasi ke notasi warna CSS yang stand alone: hex, rgb(), hsl().
+ * var(), url(), dan expression() sengaja ditolak: semuanya tak berguna sebagai
+ * warna dan bisa jadi jalur injeksi begitu override per-section disambungkan.
+ */
+const COLOR_PATTERN =
+  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(\s*\d+(?:\.\d+)?%?\s*,\s*\d+(?:\.\d+)?%?\s*,\s*\d+(?:\.\d+)?%?\s*(?:,\s*\d+(?:\.\d+)?%?\s*)?\)|hsla?\(\s*-?\d+(?:\.\d+)?(?:deg|grad|rad|turn)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%\s*(?:,\s*\d+(?:\.\d+)?%?\s*)?\))$/i;
+
+const colorValue = z.string().regex(COLOR_PATTERN, "Warna harus hex (#rgb atau #rrggbb), rgb(), atau hsl()");
+
+const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
+
+/**
+ * Tiga aturan rentang tanggal (YYYY-MM, string kosong = belum diisi). Mengembalikan
+ * alasan kegagalan yang tepat, atau null kalau rentangnya sah. Tiap aturan punya
+ * pesannya sendiri karena tiga masalahnya berbeda: satu soal field yang belum diisi,
+ * satu soal dua field yang saling bertentangan, satu soal urutan yang terbalik.
+ */
+const dateRangeError = (
+  startDate: string,
+  endDate: string,
+  isPresent: boolean,
+  endDateLabel: EndDateLabel,
+): string | null => {
+  if (endDate !== "" && startDate === "") {
+    return `Isi tanggal mulai dulu sebelum mengisi ${endDateLabel}`;
+  }
+  if (isPresent && endDate !== "") {
+    return `${capitalize(endDateLabel)} tidak bisa diisi kalau ditandai masih berjalan`;
+  }
+  if (startDate !== "" && endDate !== "" && endDate < startDate) {
+    return `${capitalize(endDateLabel)} tidak boleh lebih awal dari tanggal mulai`;
+  }
+  return null;
+};
+
+const id = z.string().min(1).max(64);
+
+export const projectItemSchema = z.object({
+  id,
+  name: text(MAX.name),
+  description: text(MAX.line),
+  techStack: text(MAX.line),
+  link: urlField(MAX.url),
+  imageUrl: urlField(MAX.url).default(""),
+  liveUrl: urlField(MAX.url).default(""),
+  repoUrl: urlField(MAX.url).default(""),
+  role: z.string().max(MAX.short).default(""),
+  featured: z.boolean().default(false),
+});
+
+export const experienceItemSchema = z
+  .object({
+    id,
+    company: text(MAX.name),
+    position: text(MAX.name),
+    startDate: monthField,
+    endDate: monthField,
+    description: text(MAX.paragraph),
+    isPresent: z.boolean().default(false),
+    imageUrl: urlField(MAX.url).default(""),
+    companyLogo: urlField(MAX.url).default(""),
+  })
+  .superRefine((v, ctx) => {
+    const reason = dateRangeError(v.startDate, v.endDate, v.isPresent, "tanggal selesai");
+    if (reason) ctx.addIssue({ code: "custom", message: reason });
+  });
+
+export const educationItemSchema = z
+  .object({
+    id,
+    institution: text(MAX.name),
+    degree: text(MAX.name),
+    field: text(MAX.name),
+    startDate: monthField,
+    endDate: monthField,
+    isPresent: z.boolean().default(false),
+  })
+  .superRefine((v, ctx) => {
+    const reason = dateRangeError(v.startDate, v.endDate, v.isPresent, "tanggal lulus");
+    if (reason) ctx.addIssue({ code: "custom", message: reason });
+  });
+
+export const certificationItemSchema = z.object({
+  id,
+  name: text(MAX.name),
+  issuer: text(MAX.name),
+  year: text(MAX.short),
+  url: urlField(MAX.url).default(""),
+});
+
+export const organizationItemSchema = z.object({
+  id,
+  name: text(MAX.name),
+  role: text(MAX.name),
+  period: text(MAX.short),
+  description: text(MAX.line),
+});
+
+export const hobbyItemSchema = z.object({
+  id,
+  name: text(MAX.name),
+  description: text(MAX.line),
+});
+
+export const testimonialItemSchema = z.object({
+  id,
+  name: text(MAX.name),
+  position: text(MAX.name),
+  testimonial: text(MAX.line),
+});
+
+export const extraLinkSchema = z.object({
+  id,
+  label: text(MAX.short),
+  url: urlField(MAX.url),
+});
+
+export const portfolioFormDataSchema = z.object({
+  heroPhotoUrl: urlField(MAX.url).default(""),
+  heroHeadline: text(MAX.name),
+  heroSubHeadline: text(MAX.line),
+  // Dua field di bawah masih dipakai form live builder; dihapus di task terpisah.
+  // String biasa (bukan urlField) supaya isinya tidak ditolak/diubah schema.
+  heroBgUrl: text(MAX.url).default(""),
+  heroFirstName: text(MAX.name),
+  heroLastName: text(MAX.name),
+  heroCreativeTitle: text(MAX.line).default(""),
+  heroBio: text(MAX.line),
+  aboutText: text(MAX.long),
+  aboutYearsExp: z.string().max(MAX.short).default(""),
+  aboutProjectsDone: z.string().max(MAX.short).default(""),
+  aboutClientsHappy: z.string().max(MAX.short).default(""),
+  skillsMain: text(MAX.paragraph),
+  skillsTools: text(MAX.paragraph),
+  skillsLanguages: text(MAX.paragraph),
+  contactEmail: z
+    .string()
+    .trim()
+    .max(MAX.email)
+    .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format email tidak valid"),
+  contactPhone: z
+    .string()
+    .trim()
+    .max(MAX.phone)
+    .regex(/^$|^[+()\d\s-]{7,32}$/, "Nomor telepon tidak valid"),
+  contactLinkedin: urlField(MAX.url),
+  contactGithub: urlField(MAX.url),
+});
+
+export const portfolioDataSchema = z.object({
+  formData: portfolioFormDataSchema,
+  projects: z.array(projectItemSchema).max(LIMITS.projects).default([]),
+  experiences: z.array(experienceItemSchema).max(LIMITS.experiences).default([]),
+  educations: z.array(educationItemSchema).max(LIMITS.educations).default([]),
+  certifications: z.array(certificationItemSchema).max(LIMITS.certifications).default([]),
+  organizations: z.array(organizationItemSchema).max(LIMITS.organizations).default([]),
+  hobbies: z.array(hobbyItemSchema).max(LIMITS.hobbies).default([]),
+  testimonials: z.array(testimonialItemSchema).max(LIMITS.testimonials).default([]),
+  extraLinks: z.array(extraLinkSchema).max(LIMITS.extraLinks).default([]),
+  sectionOrder: z.array(z.enum(SECTION_IDS)).optional(),
+  sectionVisibility: z.partialRecord(z.enum(SECTION_IDS), z.boolean()).optional(),
+  sectionColors: z
+    .partialRecord(z.enum(SECTION_IDS), z.record(z.string(), colorValue))
+    .optional(),
+});
+
+export type ValidatedPortfolioData = z.infer<typeof portfolioDataSchema>;
+
+export const publishPayloadSchema = z
+  .object({
+    slug: z
+      .string()
+      .transform((v) => v.trim().toLowerCase())
+      .refine(isValidSlug, "Slug tidak valid atau kata terlarang"),
+    themeId: z.enum(THEME_IDS),
+    data: portfolioDataSchema,
+    fontSize: z.enum(FONT_SIZES).default("medium"),
+    alignment: z
+      .partialRecord(z.enum(SECTION_IDS), z.enum(["left", "center", "right"]))
+      .default({}),
+  })
+  .superRefine((v, ctx) => {
+    if (v.data.formData.heroFirstName.trim() === "") {
+      ctx.addIssue({
+        code: "custom",
+        message: "Isi nama dulu sebelum menerbitkan",
+        path: ["data", "formData", "heroFirstName"],
+      });
+    }
+  });
+
+export type PublishPayload = z.infer<typeof publishPayloadSchema>;
+
+/**
+ * Nama draft: default "Portfolio saya" kalau kosong, dan dipotong 120 karakter
+ * (bukan ditolak) supaya input yang kelewat panjang tetap bisa disimpan.
+ */
+const draftNameSchema = z
+  .string()
+  .optional()
+  .transform((v) => ((v ?? "").trim() || "Portfolio saya").slice(0, 120));
+
+export const draftPayloadSchema = z.object({
+  name: draftNameSchema,
+  data: portfolioDataSchema,
+});
+
+export type DraftPayload = z.infer<typeof draftPayloadSchema>;
+
+/**
+ * Daftar section yang tidak punya data, dalam urutan SECTION_IDS.
+ * Fungsi ini hanya melaporkan; pemanggil yang memutuskan threshold publish
+ * (misal: menolak publish kalau semua section kosong).
+ */
+export function emptySectionIds(data: ValidatedPortfolioData): SectionId[] {
+  const f = data.formData;
+  const has = (s: string) => s.trim() !== "";
+  const checks: Record<SectionId, boolean> = {
+    hero: has(f.heroFirstName),
+    about: has(f.aboutText),
+    stats: has(f.aboutYearsExp) || has(f.aboutProjectsDone) || has(f.aboutClientsHappy),
+    experience: data.experiences.some((e) => has(e.company) || has(e.position)),
+    education: data.educations.some((e) => has(e.institution)),
+    projects: data.projects.some((p) => has(p.name)),
+    skills: has(f.skillsMain),
+    certifications: data.certifications.some((c) => has(c.name)),
+    organizations: data.organizations.some((o) => has(o.name)),
+    hobbies: data.hobbies.some((h) => has(h.name)),
+    testimonials: data.testimonials.some((t) => has(t.name)),
+    contact: has(f.contactEmail) || has(f.contactLinkedin) || has(f.contactGithub),
+  };
+  return (Object.entries(checks) as [SectionId, boolean][])
+    .filter(([, filled]) => !filled)
+    .map(([sectionId]) => sectionId);
+}

```
