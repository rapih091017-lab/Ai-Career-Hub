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
