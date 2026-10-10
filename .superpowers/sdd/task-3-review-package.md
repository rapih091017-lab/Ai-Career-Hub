# Review package task-3

Base: 8b6810e
Head: HEAD

## Commits

```
4037944 refactor(portfolio): PortfolioDocument sebagai satu-satunya renderer

```

## Diff stat

```
 src/__tests__/portfolio-document.test.tsx          | 533 +++++++++++++++++++++
 src/components/portfolio/PublishedPortfolio.tsx    | 112 ++---
 .../portfolio/render/PortfolioDocument.tsx         | 400 ++++++++++++++++
 3 files changed, 980 insertions(+), 65 deletions(-)

```

## Diff

```diff
diff --git a/src/__tests__/portfolio-document.test.tsx b/src/__tests__/portfolio-document.test.tsx
new file mode 100644
index 0000000..7293eb9
--- /dev/null
+++ b/src/__tests__/portfolio-document.test.tsx
@@ -0,0 +1,533 @@
+import "@testing-library/jest-dom/vitest";
+import { describe, it, expect, vi, beforeAll } from "vitest";
+import { render } from "@testing-library/react";
+import { renderToStaticMarkup } from "react-dom/server";
+import {
+  PortfolioDocument,
+  EMPTY_FORM_DATA,
+  STATIC_HIDDEN_INITIAL_SELECTORS,
+  STATIC_REVEAL_FALLBACK_CSS,
+} from "@/components/portfolio/render/PortfolioDocument";
+import { DEFAULT_SECTION_ORDER } from "@/components/portfolio/themes";
+import PublishedPortfolio from "@/components/portfolio/PublishedPortfolio";
+import { portfolioFormDataSchema } from "@/lib/portfolio/schema";
+import type { FontSize, SectionId, ThemeId } from "@/components/portfolio/types";
+import type { PortfolioData } from "@/components/portfolio-templates/types";
+
+/**
+ * Dua API browser yang dipakai section dan belum ada di setup global:
+ * `window.matchMedia` (hooks/useReducedMotion) dan `IntersectionObserver`
+ * (whileInView dari motion/react). Tanpa keduanya, merender section apa pun
+ * gagal di jsdom — bukan karena dokumennya salah.
+ */
+beforeAll(() => {
+  const w = window as unknown as Record<string, unknown>;
+  w.matchMedia = () =>
+    ({
+      matches: false,
+      addEventListener() {},
+      removeEventListener() {},
+    }) as unknown as MediaQueryList;
+  w.IntersectionObserver = class {
+    observe() {}
+    unobserve() {}
+    disconnect() {}
+    takeRecords() {
+      return [];
+    }
+  };
+});
+
+const data = {
+  formData: {
+    heroPhotoUrl: "",
+    heroHeadline: "Frontend Developer",
+    heroSubHeadline: "",
+    heroFirstName: "Teguh",
+    heroLastName: "Surya",
+    heroBio: "",
+    aboutText: "Tentang saya",
+    aboutYearsExp: "4",
+    aboutProjectsDone: "18",
+    aboutClientsHappy: "12",
+    skillsMain: "React",
+    skillsTools: "",
+    skillsLanguages: "",
+    contactEmail: "teguh@example.com",
+    contactPhone: "",
+    contactLinkedin: "",
+    contactGithub: "",
+  },
+  projects: [
+    { id: "p1", name: "Website Kantor", description: "D", techStack: "React", link: "" },
+  ],
+  experiences: [],
+  educations: [],
+  certifications: [],
+  organizations: [],
+  hobbies: [],
+  testimonials: [],
+  extraLinks: [],
+} as unknown as PortfolioData;
+
+const kosong = {
+  ...data,
+  formData: {
+    ...data.formData,
+    heroFirstName: "",
+    heroLastName: "",
+    aboutText: "",
+  },
+  projects: [],
+} as unknown as PortfolioData;
+
+function anchors(container: HTMLElement): (string | null)[] {
+  return [...container.querySelectorAll("[data-section-id]")].map((s) =>
+    s.getAttribute("data-section-id"),
+  );
+}
+
+function anchor(container: HTMLElement, id: SectionId): HTMLElement {
+  const el = container.querySelector<HTMLElement>(`[data-section-id="${id}"]`);
+  if (!el) throw new Error(`anchor ${id} tidak ada`);
+  return el;
+}
+
+/** Warna hex bisa muncul apa adanya (SSR) atau sudah dinormalisasi jsdom (rgb). */
+function subtreeMent(el: HTMLElement, hex: string): boolean {
+  const html = el.innerHTML;
+  if (html.includes(hex)) return true;
+  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
+  return html.includes(`rgb(${r}, ${g}, ${b})`) || html.includes(`rgb(${r},${g},${b})`);
+}
+
+function staticMarkup(node: React.ReactElement): string {
+  return renderToStaticMarkup(node);
+}
+
+describe("PortfolioDocument", () => {
+  it("memberi id pada setiap section supaya anchor hero bekerja", () => {
+    const { container } = render(
+      <PortfolioDocument data={data} themeId="glass" mode="static" />,
+    );
+    const ids = anchors(container);
+    expect(ids).toContain("hero");
+    expect(ids).toContain("projects");
+    expect(ids).toContain("contact");
+  });
+
+  it("menghormati sectionOrder", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={["contact", "hero"]}
+      />,
+    );
+    const ids = anchors(container);
+    expect(ids[0]).toBe("contact");
+    expect(ids[1]).toBe("hero");
+    expect(ids).toHaveLength(2);
+  });
+
+  it("tidak merender section yang disembunyikan", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={["hero", "projects"]}
+        sectionVisibility={{ hero: true, projects: false }}
+      />,
+    );
+    expect(container.querySelector('[data-section-id="projects"]')).toBeNull();
+    expect(container.querySelector('[data-section-id="hero"]')).not.toBeNull();
+  });
+
+  it("memanggil onSectionClick di mode editor", () => {
+    const onSectionClick = vi.fn();
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="editor"
+        onSectionClick={onSectionClick}
+      />,
+    );
+    anchor(container, "hero").click();
+    expect(onSectionClick).toHaveBeenCalledWith("hero");
+  });
+
+  it("tidak melempar error untuk data kosong", () => {
+    expect(() =>
+      render(<PortfolioDocument data={kosong} themeId="brutal" mode="static" />),
+    ).not.toThrow();
+  });
+
+  /* ─── Ketahanan data yang masuk dari JSON mentah ─── */
+
+  it("tidak melempar error saat formData dan seluruh array hilang", () => {
+    const rusak = {} as PortfolioData;
+    let ids: (string | null)[] = [];
+    expect(() => {
+      const { container } = render(
+        <PortfolioDocument data={rusak} themeId="glass" mode="editor" />,
+      );
+      ids = anchors(container);
+    }).not.toThrow();
+    expect(ids).toEqual(DEFAULT_SECTION_ORDER);
+  });
+
+  it("lengkap terhadap field form yang didefinisikan schema", () => {
+    // Jaga agar EMPTY_FORM_DATA tidak tertinggal dari schema: field baru di
+    // portfolioFormDataSchema tanpa pasangan di sini akan sampai ke section
+    // sebagai undefined, dan section seperti SkillsSection memanggil
+    // `.split()` padsanya.
+    expect(Object.keys(EMPTY_FORM_DATA).sort()).toEqual(
+      Object.keys(portfolioFormDataSchema.shape).sort(),
+    );
+  });
+
+  it("membuang id section yang tidak dikenal", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={["hero", "galaksi", "contact"] as SectionId[]}
+      />,
+    );
+    expect(anchors(container)).toEqual(["hero", "contact"]);
+  });
+
+  it("merender section duplikat sekali dan tidak mengulang atribut id", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={["hero", "hero", "contact"]}
+      />,
+    );
+    expect(anchors(container)).toEqual(["hero", "contact"]);
+    expect(container.querySelectorAll("#hero")).toHaveLength(1);
+    expect(container.querySelectorAll('[id="contact"]')).toHaveLength(1);
+  });
+
+  it("memakai DEFAULT_SECTION_ORDER saat sectionOrder kosong atau tidak ada", () => {
+    const kosongOrder = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={[]}
+      />,
+    );
+    expect(anchors(kosongOrder.container)).toEqual(DEFAULT_SECTION_ORDER);
+  });
+
+  it("menampilkan section yang tidak disebut di peta visibilitas", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={["hero", "contact"]}
+        sectionVisibility={{ contact: false }}
+      />,
+    );
+    expect(anchors(container)).toEqual(["hero"]);
+  });
+
+  it("tetap merender stats saat about disembunyikan", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={["about", "stats"]}
+        sectionVisibility={{ about: false, stats: true }}
+      />,
+    );
+    expect(anchors(container)).toEqual(["stats"]);
+    expect(anchor(container, "stats").textContent).toContain("4");
+  });
+
+  it("menjaga target anchor meski sectionnya tidak merender apa pun", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="editor"
+        sectionOrder={["testimonials"]}
+      />,
+    );
+    const wrapper = anchor(container, "testimonials");
+    expect(wrapper.id).toBe("testimonials");
+    expect(wrapper.querySelector("section")).toBeNull();
+  });
+
+  it("memakai tema glass saat themeId tidak dikenal", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId={"tema-hantu" as ThemeId}
+        mode="static"
+        sectionOrder={["hero"]}
+      />,
+    );
+    expect(container.querySelector("[data-theme]")?.getAttribute("data-theme")).toBe(
+      "glass",
+    );
+  });
+
+  it("memakai fontSize medium saat nilainya di luar tiga yang diizinkan", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        fontSize={"raksasa" as FontSize}
+      />,
+    );
+    expect(container.querySelector("[data-font-size]")?.getAttribute("data-font-size")).toBe(
+      "medium",
+    );
+  });
+
+  it("menyerap fontSize yang sah ke custom property yang sama dengan builder", () => {
+    const { container } = render(
+      <PortfolioDocument data={data} themeId="glass" mode="static" fontSize="large" />,
+    );
+    const root = container.querySelector("[data-font-size]") as HTMLElement;
+    expect(root.style.getPropertyValue("--p-font-size-base")).toBe("18px");
+    expect(root.style.getPropertyValue("--p-font-size-h2")).toBe("1.75rem");
+  });
+
+  /* ─── Pemisyahan editor vs static ─── */
+
+  it("tidak memasang onSectionClick di mode static", () => {
+    const onSectionClick = vi.fn();
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        onSectionClick={onSectionClick}
+      />,
+    );
+    anchor(container, "hero").click();
+    expect(onSectionClick).not.toHaveBeenCalled();
+  });
+
+  it("menjaga satu section yang melempar agar dokumen lain tetap tampil", () => {
+    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
+    try {
+      const rusak = {
+        ...data,
+        extraLinks: [null],
+      } as unknown as PortfolioData;
+      const { container } = render(
+        <PortfolioDocument
+          data={rusak}
+          themeId="glass"
+          mode="editor"
+          sectionOrder={["hero", "contact"]}
+        />,
+      );
+      expect(anchors(container)).toEqual(["hero", "contact"]);
+      expect(anchor(container, "contact").textContent).toContain("gagal");
+      expect(errorSpy).toHaveBeenCalled();
+    } finally {
+      errorSpy.mockRestore();
+    }
+  });
+
+  it("tidak membocorkan pesan kegagalan ke halaman publik", () => {
+    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
+    try {
+      const rusak = { ...data, extraLinks: [null] } as unknown as PortfolioData;
+      const { container } = render(
+        <PortfolioDocument
+          data={rusak}
+          themeId="glass"
+          mode="static"
+          sectionOrder={["contact"]}
+        />,
+      );
+      expect(anchor(container, "contact").textContent).toBe("");
+    } finally {
+      errorSpy.mockRestore();
+    }
+  });
+
+  /* ─── Warna per section ─── */
+
+  it("menerapkan sectionColors hanya pada section itu", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionColors={{ projects: { primary: "#123456", accent: "#654321" } }}
+      />,
+    );
+    expect(subtreeMent(anchor(container, "projects"), "#123456")).toBe(true);
+    expect(subtreeMent(anchor(container, "hero"), "#123456")).toBe(false);
+  });
+
+  it("membawa warna bawaan tema sebagai nilai awal tiap section", () => {
+    const { container } = render(
+      <PortfolioDocument data={data} themeId="brutal" mode="static" />,
+    );
+    // projects bawaan brutal: primary #3366FF, hero #FF3366
+    expect(subtreeMent(anchor(container, "projects"), "#3366ff")).toBe(true);
+    expect(subtreeMent(anchor(container, "hero"), "#ff3366")).toBe(true);
+  });
+
+  it("menolak override warna yang bisa menyuntik deklarasi CSS lain", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={["projects"]}
+        sectionColors={{
+          projects: {
+            primary: "red;background:url(https://contoh.example/pixel.gif)",
+            accent: "}body{display:none",
+            text: "rgb(1, 2, 3)",
+          } as unknown as Record<string, string>,
+        }}
+      />,
+    );
+    const html = anchor(container, "projects").innerHTML;
+    expect(html).not.toContain("contoh.example");
+    expect(html).not.toContain("display:none");
+    // nilai yang benar-benar aman tetap dipakai, bawaan tema tetap utuh
+    expect(html).toContain("rgb(1, 2, 3)");
+    expect(subtreeMent(anchor(container, "projects"), "#6dd5fa")).toBe(true);
+  });
+
+  it("mengabaikan kunci override yang bukan warna milik tema", () => {
+    const { container } = render(
+      <PortfolioDocument
+        data={data}
+        themeId="glass"
+        mode="static"
+        sectionOrder={["projects"]}
+        sectionColors={{
+          projects: { warnaLain: "#ff0000" } as unknown as Record<string, string>,
+        }}
+      />,
+    );
+    expect(anchor(container, "projects").innerHTML).not.toContain("#ff0000");
+  });
+
+  /* ─── Server rendering ─── */
+
+  it("menyisipkan penjaga noscript hanya di mode static", () => {
+    const statis = staticMarkup(
+      <PortfolioDocument data={data} themeId="glass" mode="static" />,
+    );
+    expect(statis).toContain("<noscript>");
+    expect(statis).toContain("opacity: 1 !important");
+
+    const editor = staticMarkup(
+      <PortfolioDocument data={data} themeId="glass" mode="editor" />,
+    );
+    expect(editor).not.toContain("<noscript>");
+  });
+
+  it("menjaga setiap section tersembunyi motion agar penjaga noscript menutupinya", () => {
+    // Dua bentuk serialisasi harus sama-sama tertangkap: markup hasil
+    // renderToStaticMarkup (`opacity:0;...`, tanpa spasi) dan hasil render
+    // klien (`opacity: 0; ...;`, dengan spasi dan titik koma akhir).
+    const { container: diDom } = render(
+      <PortfolioDocument data={data} themeId="glass" mode="static" />,
+    );
+    const markup = [
+      staticMarkup(<PortfolioDocument data={data} themeId="glass" mode="static" />),
+      diDom.innerHTML,
+    ];
+
+    const inlineOpacityIsZero = (el: Element) =>
+      /(^|;)\s*opacity\s*:\s*0\s*(;|$)/.test(el.getAttribute("style") ?? "");
+
+    for (const source of markup) {
+      const host = document.createElement("div");
+      host.innerHTML = source;
+
+      const tersembunyi = [...host.querySelectorAll("*")].filter(inlineOpacityIsZero);
+      expect(tersembunyi.length).toBeGreaterThan(0);
+
+      const tidakTertangkap = tersembunyi.filter(
+        (el) => !STATIC_HIDDEN_INITIAL_SELECTORS.some((sel) => el.matches(sel)),
+      );
+      expect(tidakTertangkap.map((el) => el.outerHTML.slice(0, 90))).toEqual([]);
+    }
+  });
+
+  it("tidak pernah membatalkan opacity dekoratif saat menyalin gaya motion", () => {
+    const html = staticMarkup(
+      <PortfolioDocument data={data} themeId="glass" mode="static" />,
+    );
+    const host = document.createElement("div");
+    host.innerHTML = html;
+    const dekoratif = [...host.querySelectorAll("[style*='opacity:0.0']")];
+    expect(dekoratif.length).toBeGreaterThan(0);
+    const keliruTertangkap = dekoratif.filter((el) =>
+      STATIC_HIDDEN_INITIAL_SELECTORS.some((sel) => el.matches(sel)),
+    );
+    expect(keliruTertangkap).toEqual([]);
+  });
+
+  it("menghasilkan penjaga noscript dari satu daftar selektor", () => {
+    for (const sel of STATIC_HIDDEN_INITIAL_SELECTORS) {
+      expect(STATIC_REVEAL_FALLBACK_CSS).toContain(sel);
+    }
+  });
+
+  it("merender isi yang terbaca di HTML statis: nama dan isi project ikut masuk", () => {
+    const html = staticMarkup(
+      <PortfolioDocument data={data} themeId="glass" mode="static" />,
+    );
+    expect(html).toContain("Teguh Surya");
+    expect(html).toContain("Website Kantor");
+  });
+});
+
+describe("PublishedPortfolio", () => {
+  it("merender lewat PortfolioDocument: anchor section ikut terbawa", () => {
+    const { container } = render(
+      <PublishedPortfolio data={data} themeId="glass" />,
+    );
+    expect(anchors(container)).toEqual(DEFAULT_SECTION_ORDER);
+    expect(container.querySelector("[data-mode]")?.getAttribute("data-mode")).toBe(
+      "static",
+    );
+  });
+
+  it("meneruskan urutan, visibilitas, dan warna per section", () => {
+    const { container } = render(
+      <PublishedPortfolio
+        data={{ ...data, sectionColors: { contact: { primary: "#0abcde" } } } as unknown as PortfolioData}
+        themeId="glass"
+        sectionOrder={["contact", "projects"]}
+        sectionVisibility={{ projects: false }}
+      />,
+    );
+    expect(anchors(container)).toEqual(["contact"]);
+    expect(subtreeMent(anchor(container, "contact"), "#0abcde")).toBe(true);
+  });
+
+  it("menyembunyikan footer saat showFooter dimatikan", () => {
+    const { container, rerender } = render(
+      <PublishedPortfolio data={data} themeId="glass" />,
+    );
+    expect(container.querySelector("footer")).not.toBeNull();
+    rerender(<PublishedPortfolio data={data} themeId="glass" showFooter={false} />);
+    expect(container.querySelector("footer")).toBeNull();
+  });
+});
diff --git a/src/components/portfolio/PublishedPortfolio.tsx b/src/components/portfolio/PublishedPortfolio.tsx
index aff4b1e..ca974ea 100644
--- a/src/components/portfolio/PublishedPortfolio.tsx
+++ b/src/components/portfolio/PublishedPortfolio.tsx
@@ -1,87 +1,69 @@
 "use client";
 
-import React from "react";
-import { THEMES, DEFAULT_THEME_ID, DEFAULT_SECTION_ORDER } from "./themes";
-import { ThemeContext } from "./PortfolioCanvas";
-import { resolveVisibility } from "./sectionVisibility";
-import type { SectionId, SectionVisibility, ThemeDefinition, PortfolioData } from "./types";
-
-import HeroSection from "./sections/HeroSection";
-import AboutSection from "./sections/AboutSection";
-import StatsSection from "./sections/StatsSection";
-import SkillsSection from "./sections/SkillsSection";
-import ProjectsSection from "./sections/ProjectsSection";
-import ExperienceSection from "./sections/ExperienceSection";
-import EducationSection from "./sections/EducationSection";
-import CertificationsSection from "./sections/CertificationsSection";
-import OrganizationsSection from "./sections/OrganizationsSection";
-import HobbiesSection from "./sections/HobbiesSection";
-import TestimonialsSection from "./sections/TestimonialsSection";
-import ContactSection from "./sections/ContactSection";
+import { THEMES, DEFAULT_THEME_ID } from "./themes";
+import PortfolioDocument, {
+  type PortfolioSectionColors,
+} from "./render/PortfolioDocument";
+import type {
+  PortfolioData,
+  SectionId,
+  SectionVisibility,
+  ThemeDefinition,
+} from "./types";
 
 export interface PublishedPortfolioProps {
-  data: PortfolioData;
+  /**
+   * `sectionColors` ikut di dalam data karena disimpan di jsonb yang sama;
+   * halaman publik harus meneruskannya supaya warna per section sama dengan
+   * yang dilihat di builder.
+   */
+  data: PortfolioData & { sectionColors?: PortfolioSectionColors };
   themeId: string;
   sectionOrder?: SectionId[];
   sectionVisibility?: SectionVisibility;
   showFooter?: boolean;
 }
 
-/** Render portfolio publik, persis seperti preview (WYSIWYG), tanpa chrome app. */
+/**
+ * Render portfolio publik. Pohon section-nya milik `PortfolioDocument`;
+ * file ini hanya pembungkus chrome halaman (footer).
+ */
 export default function PublishedPortfolio({
   data,
   themeId,
   sectionOrder,
   sectionVisibility,
   showFooter = true,
 }: PublishedPortfolioProps) {
   const theme: ThemeDefinition = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
-  const { formData: f, projects, experiences, educations, certifications, organizations, hobbies, testimonials, extraLinks } = data;
-
-  const order = sectionOrder && sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;
-  const visibleOrder = resolveVisibility(order, sectionVisibility);
-
-  const name = [f.heroFirstName, f.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap";
-
-  const renderSection = (id: SectionId) => {
-    switch (id) {
-      case "hero": return <HeroSection data={f} />;
-      case "about": return <AboutSection data={f} />;
-      case "stats": return <StatsSection data={f} />;
-      case "experience": return <ExperienceSection items={experiences} />;
-      case "education": return <EducationSection items={educations} />;
-      case "projects": return <ProjectsSection items={projects} />;
-      case "skills": return <SkillsSection data={f} />;
-      case "certifications": return <CertificationsSection items={certifications || []} />;
-      case "organizations": return <OrganizationsSection items={organizations || []} />;
-      case "hobbies": return <HobbiesSection items={hobbies || []} />;
-      case "testimonials": return <TestimonialsSection items={testimonials} />;
-      case "contact": return <ContactSection data={f} extraLinks={extraLinks} />;
-    }
-  };
+  const name =
+    [data.formData?.heroFirstName, data.formData?.heroLastName]
+      .filter(Boolean)
+      .join(" ") || "Nama Lengkap";
 
   return (
-    <ThemeContext.Provider value={theme}>
-      <div
-        className="min-h-screen"
-        style={{
-          backgroundColor: theme.colors.bg,
-          color: theme.colors.text,
-          fontFamily: theme.font.includes(" ") ? `'${theme.font}', sans-serif` : `${theme.font}, sans-serif`,
-        }}
-      >
-        {visibleOrder.map((id) => (
-          <React.Fragment key={id}>{renderSection(id)}</React.Fragment>
-        ))}
-        {showFooter && (
-          <footer
-            className="text-center py-8"
-            style={{ color: theme.colors.textMuted, borderTop: `1px solid ${theme.colors.border}`, fontSize: 13 }}
-          >
-            &copy; {new Date().getFullYear()} {name}. Dibuat dengan AI Career Hub
-          </footer>
-        )}
-      </div>
-    </ThemeContext.Provider>
+    <div>
+      <PortfolioDocument
+        data={data}
+        themeId={theme.id}
+        mode="static"
+        sectionOrder={sectionOrder}
+        sectionVisibility={sectionVisibility}
+        sectionColors={data.sectionColors ?? null}
+      />
+
+      {showFooter && (
+        <footer
+          className="text-center py-8"
+          style={{
+            color: theme.colors.textMuted,
+            borderTop: `1px solid ${theme.colors.border}`,
+            fontSize: 13,
+          }}
+        >
+          &copy; {new Date().getFullYear()} {name}. Dibuat dengan AI Career Hub
+        </footer>
+      )}
+    </div>
   );
 }
diff --git a/src/components/portfolio/render/PortfolioDocument.tsx b/src/components/portfolio/render/PortfolioDocument.tsx
new file mode 100644
index 0000000..59aca1e
--- /dev/null
+++ b/src/components/portfolio/render/PortfolioDocument.tsx
@@ -0,0 +1,400 @@
+"use client";
+
+import { Component, type CSSProperties, type ReactElement, type ReactNode } from "react";
+import { MotionConfig } from "motion/react";
+
+import { ThemeContext } from "../PortfolioCanvas";
+import { DEFAULT_SECTION_ORDER, DEFAULT_THEME_ID, THEMES } from "../themes";
+import { isSectionVisible } from "../sectionVisibility";
+import { FONT_SIZES, SECTION_IDS } from "../types";
+import type {
+  FontSize,
+  PortfolioData,
+  PortfolioFormData,
+  SectionId,
+  SectionVisibility,
+  ThemeColors,
+  ThemeDefinition,
+  ThemeId,
+} from "../types";
+import type { SafeRenderMode } from "./safe-render-mode";
+
+import HeroSection from "../sections/HeroSection";
+import AboutSection from "../sections/AboutSection";
+import StatsSection from "../sections/StatsSection";
+import ExperienceSection from "../sections/ExperienceSection";
+import EducationSection from "../sections/EducationSection";
+import ProjectsSection from "../sections/ProjectsSection";
+import SkillsSection from "../sections/SkillsSection";
+import CertificationsSection from "../sections/CertificationsSection";
+import OrganizationsSection from "../sections/OrganizationsSection";
+import HobbiesSection from "../sections/HobbiesSection";
+import TestimonialsSection from "../sections/TestimonialsSection";
+import ContactSection from "../sections/ContactSection";
+
+/**
+ * Mode render. Sama dengan `SafeRenderMode` dan sengaja memakai satu kosakata:
+ * agar `mode` bisa diteruskan apa adanya ke SafeLink/SafeImg tanpa
+ * terjemahan di setiap call site.
+ *
+ * - `editor`: interaktif, sedang disunting (canvas builder, /portfolio/preview).
+ * - `static`: hasil akhir sekali tulis — halaman publik dan file HTML export.
+ *   Wajib terbaca tanpa JavaScript.
+ */
+export type RenderMode = SafeRenderMode;
+
+/** Override warna per section, bentuk yang sama dengan `portfolioDataSchema`. */
+export type PortfolioSectionColors = Partial<Record<SectionId, Record<string, string>>>;
+
+export type PortfolioDocumentProps = {
+  data: PortfolioData;
+  themeId: ThemeId;
+  mode: RenderMode;
+  /**
+   * Urutan section. Tipe tetap `SectionId[]` supaya salah ketik di call site
+   * masih tertangkap compiler; data yang sudah tersimpan tidak pernah
+   * divalidasi di titik ini, jadi `resolveOrder` tetap menyaring id asing
+   * dan duplikat saat runtime.
+   */
+  sectionOrder?: SectionId[];
+  sectionVisibility?: SectionVisibility;
+  sectionColors?: PortfolioSectionColors | null;
+  fontSize?: FontSize;
+  onSectionClick?: (id: SectionId) => void;
+};
+
+/**
+ * Peta section ke komponen. Nama prop di sini hasil baca langsung dari
+ * `interface Props` tiap file di `sections/`: `data` untuk yang membaca
+ * formData (hero, about, stats, skills), `items` untuk yang membaca array
+ * (experience, education, projects, certifications, organizations, hobbies,
+ * testimonials), dan contact memakai dua-duanya.
+ */
+const RENDERERS: Record<SectionId, (d: PortfolioData) => ReactElement | null> = {
+  hero: (d) => <HeroSection data={d.formData} />,
+  about: (d) => <AboutSection data={d.formData} />,
+  stats: (d) => <StatsSection data={d.formData} />,
+  experience: (d) => <ExperienceSection items={d.experiences} />,
+  education: (d) => <EducationSection items={d.educations} />,
+  projects: (d) => <ProjectsSection items={d.projects} />,
+  skills: (d) => <SkillsSection data={d.formData} />,
+  certifications: (d) => <CertificationsSection items={d.certifications} />,
+  organizations: (d) => <OrganizationsSection items={d.organizations} />,
+  hobbies: (d) => <HobbiesSection items={d.hobbies} />,
+  testimonials: (d) => <TestimonialsSection items={d.testimonials} />,
+  contact: (d) => <ContactSection data={d.formData} extraLinks={d.extraLinks} />,
+};
+
+/**
+ * Bentuk minimum `PortfolioFormData`. Data portofolio datang dari jsonb dan
+ * dari draft di localStorage, jadi field boleh hilang; section seperti
+ * `f.skillsMain.split(",")` akan melempar kalau field-nya `undefined`.
+ * Otoritas bentuk data tetap `portfolioFormDataSchema`
+ * (`src/lib/portfolio/schema.ts`) — daftar ini hanya jaring pengaman runtime
+ * saat render, bukan sumber kebenaran kedua.
+ */
+export const EMPTY_FORM_DATA: PortfolioFormData = {
+  heroPhotoUrl: "",
+  heroHeadline: "",
+  heroSubHeadline: "",
+  heroBgUrl: "",
+  heroFirstName: "",
+  heroLastName: "",
+  heroCreativeTitle: "",
+  heroBio: "",
+  aboutText: "",
+  aboutYearsExp: "",
+  aboutProjectsDone: "",
+  aboutClientsHappy: "",
+  skillsMain: "",
+  skillsTools: "",
+  skillsLanguages: "",
+  contactEmail: "",
+  contactPhone: "",
+  contactLinkedin: "",
+  contactGithub: "",
+};
+
+const FORM_KEYS = Object.keys(EMPTY_FORM_DATA) as (keyof PortfolioFormData)[];
+
+/** Array dari jsonb bisa saja bukan array sama sekali; section memfilter
+ *  di dalamnya, jadi bentuknya dinormalkan dulu di titik masuk. */
+function asList<T>(value: unknown): T[] {
+  return Array.isArray(value) ? (value as T[]) : [];
+}
+
+function normalizeData(data: PortfolioData): PortfolioData {
+  const rawForm = (data?.formData ?? {}) as Partial<PortfolioFormData>;
+  const formData = { ...EMPTY_FORM_DATA };
+  for (const key of FORM_KEYS) {
+    const value = rawForm[key];
+    if (typeof value === "string") formData[key] = value;
+  }
+
+  return {
+    formData,
+    projects: asList(data?.projects),
+    experiences: asList(data?.experiences),
+    educations: asList(data?.educations),
+    certifications: asList(data?.certifications),
+    organizations: asList(data?.organizations),
+    hobbies: asList(data?.hobbies),
+    testimonials: asList(data?.testimonials),
+    extraLinks: asList(data?.extraLinks),
+  };
+}
+
+function isSectionId(value: unknown): value is SectionId {
+  return typeof value === "string" && (SECTION_IDS as readonly string[]).includes(value);
+}
+
+/**
+ * Urutan yang dirender: id asing dibuang, id duplikat diringkas jadi satu
+ * kemunculan (dua elemen dengan `id` sama merusak anchor dan menggeser
+ * penandaan editor), dan urutan yang lebih pendek dari dua belas tidak
+ * dilengkapi — `sectionOrder` sepanjang dua berarti "hanya dua section ini",
+ * bukan "dua section ini dulu". Array kosong berarti belum diatur, jadi
+ * dipakai DEFAULT_SECTION_ORDER.
+ */
+function resolveOrder(order: readonly string[] | undefined): SectionId[] {
+  if (!order || order.length === 0) return DEFAULT_SECTION_ORDER;
+
+  const seen = new Set<SectionId>();
+  const resolved: SectionId[] = [];
+  for (const candidate of order) {
+    if (!isSectionId(candidate) || seen.has(candidate)) continue;
+    seen.add(candidate);
+    resolved.push(candidate);
+  }
+  return resolved;
+}
+
+function resolveTheme(themeId: string): ThemeDefinition {
+  return THEMES[themeId] ?? THEMES[DEFAULT_THEME_ID];
+}
+
+/**
+ * Nilai warna akan masuk ke `style` lalu diserialisasi utuh ke file HTML
+ * export, jadi nilainya harus tetap satu deklarasi: tanpa titik koma, tanpa
+ * kurung kurawal, tanpa penanda komentar, dan tanpa `url(` (yang bisa menarik
+ * sumber daya dari luar file export). Tanda kurung dan koma tetap boleh
+ * karena `rgb()`/`hsl()` memakainya.
+ *
+ * Format penuh sudah dijaga `portfolioDataSchema` (`colorValue`); ini jaring
+ * pengaman kedua untuk baris yang belum pernah lewat schema.
+ */
+const UNSAFE_COLOR_VALUE = /[;{}<>\\"']|\/\*|url\(/i;
+
+function isUsableColorValue(value: unknown): value is string {
+  return typeof value === "string" && value !== "" && !UNSAFE_COLOR_VALUE.test(value);
+}
+
+/**
+ * Warna per section: bawaan tema lebih dulu, lalu override milik pengguna.
+ * Override dibaca ketat — hanya kunci warna yang benar-benar ada di tema dan
+ * hanya string yang aman — supaya nilai dari jsonb tidak bisa menyuntik key
+ * asing maupun deklarasi CSS baru ke objek tema.
+ */
+function themeForSection(
+  theme: ThemeDefinition,
+  sectionId: SectionId,
+  overrides: PortfolioSectionColors | null | undefined,
+): ThemeDefinition {
+  const fromTheme = theme.sectionColors?.[sectionId];
+  const fromUser = overrides?.[sectionId];
+  if (!fromTheme && !fromUser) return theme;
+
+  const colors: ThemeColors = { ...theme.colors };
+  for (const patch of [fromTheme, fromUser]) {
+    if (!patch || typeof patch !== "object") continue;
+    for (const [key, value] of Object.entries(patch)) {
+      if (!isUsableColorValue(value)) continue;
+      if (key in colors) (colors as unknown as Record<string, string>)[key] = value;
+    }
+  }
+  return { ...theme, colors };
+}
+
+/**
+ * Peta ukuran yang sama persis dengan `FONT_SIZE_MAP` di PortfolioCanvas,
+ * supaya dokumen ini dan builder tidak bisa berbeda pendapat soal tipografi.
+ */
+const FONT_SIZE_VARS: Record<FontSize, { base: string; small: string; h2: string; h3: string }> = {
+  small: { base: "14px", small: "12px", h2: "1.25rem", h3: "1.05rem" },
+  medium: { base: "16px", small: "13px", h2: "1.5rem", h3: "1.15rem" },
+  large: { base: "18px", small: "14px", h2: "1.75rem", h3: "1.3rem" },
+};
+
+function resolveFontSize(fontSize: FontSize | undefined): FontSize {
+  return fontSize && (FONT_SIZES as readonly string[]).includes(fontSize)
+    ? fontSize
+    : "medium";
+}
+
+/**
+ * Selektor yang cocok dengan gaya inline state awal motion (`opacity:0` persis,
+ * hasil dari `initial`). Dua bentuk serialisasi harus ditangani: hasil
+ * `renderToStaticMarkup` (`opacity:0;transform:...`, tanpa spasi) dan hasil
+ * render klien di DOM (`opacity: 0; transform: ...;`, dengan titik koma di
+ * akhir).
+ */
+export const STATIC_HIDDEN_INITIAL_SELECTORS: readonly string[] = [
+  '[data-mode="static"] [style*="opacity:0;"]',
+  '[data-mode="static"] [style$=";opacity:0"]',
+  '[data-mode="static"] [style="opacity:0"]',
+  '[data-mode="static"] [style*="opacity: 0;"]',
+  '[data-mode="static"] [style$=";opacity: 0"]',
+  '[data-mode="static"] [style="opacity: 0;"]',
+];
+
+/**
+ * Penjaga "tanpa JavaScript". `motion/react` menuliskan `initial` sebagai
+ * gaya inline saat render di server, sedangkan `whileInView` yang
+ * membukanya hanya jalan kalau ada JS. Di mode static — dokumen yang harus
+ * tetap terbaca tanpa JS, seperti file HTML export — state awal itu tidak
+ * akan pernah berubah, jadi tanpa penjaga ini seluruh section terkunci tak
+ * terlihat. Penjaga-nya diletakkan di dalam `<noscript>` supaya pembaca
+ * yang JS-nya hidup (halaman publik yang terhidrasi) tetap mendapat animasi
+ * masuknya, dan hanya yang tidak punya JS yang kehilangan isi.
+ *
+ * `[style*="opacity:0"]` biasa tidak dipakai karena ikut cocok dengan
+ * `opacity:0.06` — dekoratif seperti grain, orb, dan partikel — lalu
+ * menjadikannya pekat. Karena itu hanya nilai nol persis yang ditembak.
+ */
+export const STATIC_REVEAL_FALLBACK_CSS = `${STATIC_HIDDEN_INITIAL_SELECTORS.join(",\n")} {
+  opacity: 1 !important;
+  transform: none !important;
+}`;
+
+type BoundaryProps = {
+  sectionId: SectionId;
+  mode: RenderMode;
+  /** Berubah identitas saat data berubah, supaya section yang sempat gagal bisa dicoba lagi. */
+  resetKey: unknown;
+  children: ReactNode;
+};
+
+type BoundaryState = { failed: boolean };
+
+class SectionBoundary extends Component<BoundaryProps, BoundaryState> {
+  state: BoundaryState = { failed: false };
+
+  static getDerivedStateFromError(): BoundaryState {
+    return { failed: true };
+  }
+
+  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
+    console.error(
+      `[portfolio] section "${this.props.sectionId}" gagal dirender`,
+      error,
+      info?.componentStack,
+    );
+  }
+
+  componentDidUpdate(previous: BoundaryProps) {
+    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
+      this.setState({ failed: false });
+    }
+  }
+
+  render() {
+    if (!this.state.failed) return this.props.children;
+
+    // Di halaman publik tidak ada yang bisa diperbaiki pembaca, jadi
+    // section-nya dibiarkan kosong; target anchor tetap ada karena pembungkusnya
+    // ada di luar boundary. Di editor, penulis harus tahu bagian mana yang rusak.
+    if (this.props.mode !== "editor") return null;
+
+    return (
+      <p role="status" className="mx-auto max-w-2xl px-6 py-8 text-sm text-on-surface-variant">
+        Bagian ini gagal dirender karena datanya bermasalah. Perbaiki isinya, lalu muat ulang
+        builder.
+      </p>
+    );
+  }
+}
+
+/**
+ * Satu-satunya pohon render portfolio. Empat konsumen memakai ini: canvas
+ * builder (`editor`), /portfolio/preview (`editor`), /p/[slug] (`static`),
+ * dan export HTML (`static` lewat renderToStaticMarkup).
+ *
+ * Wrapper setiap section memakai `id` yang sama dengan SectionId supaya
+ * anchor bawaan hero (`#projects`, `#contact`) punya target, termasuk ketika
+ * sectionnya tidak punya data dan komponen membalas `null`. Wrapper-nya
+ * tidak punya tinggi, jadi tidak ada celah kosong yang mencurigakan.
+ */
+export function PortfolioDocument({
+  data,
+  themeId,
+  mode,
+  sectionOrder,
+  sectionVisibility,
+  sectionColors,
+  fontSize,
+  onSectionClick,
+}: PortfolioDocumentProps) {
+  const safeData = normalizeData(data);
+  const theme = resolveTheme(themeId);
+  const order = resolveOrder(sectionOrder);
+  const resolvedFontSize = resolveFontSize(fontSize);
+  const fontVars = FONT_SIZE_VARS[resolvedFontSize];
+  const interactive = mode === "editor" && onSectionClick ? onSectionClick : null;
+
+  return (
+    <MotionConfig reducedMotion={mode === "static" ? "always" : "user"}>
+      <ThemeContext.Provider value={theme}>
+        <div
+          data-theme={theme.id}
+          data-mode={mode}
+          data-font-size={resolvedFontSize}
+          className="min-h-screen"
+          style={
+            {
+              backgroundColor: theme.colors.bg,
+              color: theme.colors.text,
+              fontFamily: theme.font.includes(" ")
+                ? `'${theme.font}', sans-serif`
+                : `${theme.font}, sans-serif`,
+              "--p-font-size-base": fontVars.base,
+              "--p-font-size-sm": fontVars.small,
+              "--p-font-size-h2": fontVars.h2,
+              "--p-font-size-h3": fontVars.h3,
+              fontSize: fontVars.base,
+            } as CSSProperties
+          }
+        >
+          {mode === "static" && (
+            <noscript>
+              <style>{STATIC_REVEAL_FALLBACK_CSS}</style>
+            </noscript>
+          )}
+
+          {order.map((id) => {
+            if (!isSectionVisible(sectionVisibility, id)) return null;
+
+            const renderSection = RENDERERS[id];
+            if (!renderSection) return null;
+
+            return (
+              <div
+                key={id}
+                id={id}
+                data-section-id={id}
+                onClick={interactive ? () => interactive(id) : undefined}
+              >
+                <ThemeContext.Provider value={themeForSection(theme, id, sectionColors)}>
+                  <SectionBoundary sectionId={id} mode={mode} resetKey={data}>
+                    {renderSection(safeData)}
+                  </SectionBoundary>
+                </ThemeContext.Provider>
+              </div>
+            );
+          })}
+        </div>
+      </ThemeContext.Provider>
+    </MotionConfig>
+  );
+}
+
+export default PortfolioDocument;

```
