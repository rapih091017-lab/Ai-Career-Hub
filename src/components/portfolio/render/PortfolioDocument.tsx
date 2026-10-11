"use client";

import { Component, Fragment, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { MotionConfig } from "motion/react";

import { ThemeContext } from "../PortfolioCanvas";
import { DEFAULT_SECTION_ORDER, DEFAULT_THEME_ID, THEMES } from "../themes";
import { isSectionVisible } from "../sectionVisibility";
import { FONT_SIZES, SECTION_IDS } from "../types";
import type {
  FontSize,
  PortfolioData,
  PortfolioFormData,
  SectionId,
  SectionVisibility,
  ThemeColors,
  ThemeDefinition,
  ThemeId,
} from "../types";
import type { SafeRenderMode } from "./safe-render-mode";

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

/**
 * Mode render. Sama dengan `SafeRenderMode` dan sengaja memakai satu kosakata:
 * agar `mode` bisa diteruskan apa adanya ke SafeLink/SafeImg tanpa
 * terjemahan di setiap call site.
 *
 * - `editor`: interaktif, sedang disunting (canvas builder, /portfolio/preview).
 * - `static`: hasil akhir sekali tulis — halaman publik dan file HTML export.
 *   Wajib terbaca tanpa JavaScript.
 */
export type RenderMode = SafeRenderMode;

/** Override warna per section, bentuk yang sama dengan `portfolioDataSchema`. */
export type PortfolioSectionColors = Partial<Record<SectionId, Record<string, string>>>;

export type PortfolioDocumentProps = {
  data: PortfolioData;
  themeId: ThemeId;
  mode: RenderMode;
  /**
   * Urutan section. Tipe tetap `SectionId[]` supaya salah ketik di call site
   * masih tertangkap compiler; data yang sudah tersimpan tidak pernah
   * divalidasi di titik ini, jadi `resolveOrder` tetap menyaring id asing
   * dan duplikat saat runtime.
   */
  sectionOrder?: SectionId[];
  sectionVisibility?: SectionVisibility;
  sectionColors?: PortfolioSectionColors | null;
  fontSize?: FontSize;
  onSectionClick?: (id: SectionId) => void;
  /**
   * Khusus editor: pembungkus tambahan di luar section (mis. wrapper
   * sortable dnd-kit di canvas builder). Halaman publik tidak memakainya,
   * jadi pohon render tetap satu untuk semua konsumen.
   */
  sectionWrapper?: (id: SectionId, node: ReactNode) => ReactNode;
  /** Gaya per section dari editor (mis. perataan teks builder). */
  sectionStyle?: Partial<Record<SectionId, CSSProperties>>;
};

/**
 * Peta section ke komponen. Nama prop di sini hasil baca langsung dari
 * `interface Props` tiap file di `sections/`: `data` untuk yang membaca
 * formData (hero, about, stats, skills), `items` untuk yang membaca array
 * (experience, education, projects, certifications, organizations, hobbies,
 * testimonials), dan contact memakai dua-duanya.
 */
const RENDERERS: Record<SectionId, (d: PortfolioData) => ReactElement | null> = {
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
 * Bentuk minimum `PortfolioFormData`. Data portofolio datang dari jsonb dan
 * dari draft di localStorage, jadi field boleh hilang; section seperti
 * `f.skillsMain.split(",")` akan melempar kalau field-nya `undefined`.
 * Otoritas bentuk data tetap `portfolioFormDataSchema`
 * (`src/lib/portfolio/schema.ts`) — daftar ini hanya jaring pengaman runtime
 * saat render, bukan sumber kebenaran kedua.
 */
export const EMPTY_FORM_DATA: PortfolioFormData = {
  heroPhotoUrl: "",
  heroHeadline: "",
  heroSubHeadline: "",
  heroFirstName: "",
  heroLastName: "",
  heroBio: "",
  aboutText: "",
  aboutYearsExp: "",
  aboutProjectsDone: "",
  aboutClientsHappy: "",
  skillsMain: "",
  skillsTools: "",
  skillsLanguages: "",
  contactEmail: "",
  contactPhone: "",
  contactLinkedin: "",
  contactGithub: "",
};

const FORM_KEYS = Object.keys(EMPTY_FORM_DATA) as (keyof PortfolioFormData)[];

/** Array dari jsonb bisa saja bukan array sama sekali; section memfilter
 *  di dalamnya, jadi bentuknya dinormalkan dulu di titik masuk. */
function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeData(data: PortfolioData): PortfolioData {
  const rawForm = (data?.formData ?? {}) as Partial<PortfolioFormData>;
  const formData = { ...EMPTY_FORM_DATA };
  for (const key of FORM_KEYS) {
    const value = rawForm[key];
    if (typeof value === "string") formData[key] = value;
  }

  return {
    formData,
    projects: asList(data?.projects),
    experiences: asList(data?.experiences),
    educations: asList(data?.educations),
    certifications: asList(data?.certifications),
    organizations: asList(data?.organizations),
    hobbies: asList(data?.hobbies),
    testimonials: asList(data?.testimonials),
    extraLinks: asList(data?.extraLinks),
  };
}

function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && (SECTION_IDS as readonly string[]).includes(value);
}

/**
 * Urutan yang dirender: id asing dibuang, id duplikat diringkas jadi satu
 * kemunculan (dua elemen dengan `id` sama merusak anchor dan menggeser
 * penandaan editor), dan urutan yang lebih pendek dari dua belas tidak
 * dilengkapi — `sectionOrder` sepanjang dua berarti "hanya dua section ini",
 * bukan "dua section ini dulu". Array kosong berarti belum diatur, jadi
 * dipakai DEFAULT_SECTION_ORDER.
 */
function resolveOrder(order: readonly string[] | undefined): SectionId[] {
  if (!order || order.length === 0) return DEFAULT_SECTION_ORDER;

  const seen = new Set<SectionId>();
  const resolved: SectionId[] = [];
  for (const candidate of order) {
    if (!isSectionId(candidate) || seen.has(candidate)) continue;
    seen.add(candidate);
    resolved.push(candidate);
  }
  return resolved;
}

function resolveTheme(themeId: string): ThemeDefinition {
  return THEMES[themeId] ?? THEMES[DEFAULT_THEME_ID];
}

/**
 * Nilai warna akan masuk ke `style` lalu diserialisasi utuh ke file HTML
 * export, jadi nilainya harus tetap satu deklarasi: tanpa titik koma, tanpa
 * kurung kurawal, tanpa penanda komentar, dan tanpa `url(` (yang bisa menarik
 * sumber daya dari luar file export). Tanda kurung dan koma tetap boleh
 * karena `rgb()`/`hsl()` memakainya.
 *
 * Format penuh sudah dijaga `portfolioDataSchema` (`colorValue`); ini jaring
 * pengaman kedua untuk baris yang belum pernah lewat schema.
 */
const UNSAFE_COLOR_VALUE = /[;{}<>\\"']|\/\*|url\(/i;

function isUsableColorValue(value: unknown): value is string {
  return typeof value === "string" && value !== "" && !UNSAFE_COLOR_VALUE.test(value);
}

/**
 * Warna per section: bawaan tema lebih dulu, lalu override milik pengguna.
 * Override dibaca ketat — hanya kunci warna yang benar-benar ada di tema dan
 * hanya string yang aman — supaya nilai dari jsonb tidak bisa menyuntik key
 * asing maupun deklarasi CSS baru ke objek tema.
 */
function themeForSection(
  theme: ThemeDefinition,
  sectionId: SectionId,
  overrides: PortfolioSectionColors | null | undefined,
): ThemeDefinition {
  const fromTheme = theme.sectionColors?.[sectionId];
  const fromUser = overrides?.[sectionId];
  if (!fromTheme && !fromUser) return theme;

  const colors: ThemeColors = { ...theme.colors };
  for (const patch of [fromTheme, fromUser]) {
    if (!patch || typeof patch !== "object") continue;
    for (const [key, value] of Object.entries(patch)) {
      if (!isUsableColorValue(value)) continue;
      if (key in colors) (colors as unknown as Record<string, string>)[key] = value;
    }
  }
  return { ...theme, colors };
}

/**
 * Peta ukuran yang sama persis dengan `FONT_SIZE_MAP` di PortfolioCanvas,
 * supaya dokumen ini dan builder tidak bisa berbeda pendapat soal tipografi.
 */
const FONT_SIZE_VARS: Record<FontSize, { base: string; small: string; h2: string; h3: string }> = {
  small: { base: "14px", small: "12px", h2: "1.25rem", h3: "1.05rem" },
  medium: { base: "16px", small: "13px", h2: "1.5rem", h3: "1.15rem" },
  large: { base: "18px", small: "14px", h2: "1.75rem", h3: "1.3rem" },
};

function resolveFontSize(fontSize: FontSize | undefined): FontSize {
  return fontSize && (FONT_SIZES as readonly string[]).includes(fontSize)
    ? fontSize
    : "medium";
}

/**
 * Selektor yang cocok dengan gaya inline state awal motion (`opacity:0` persis,
 * hasil dari `initial`). Dua bentuk serialisasi harus ditangani: hasil
 * `renderToStaticMarkup` (`opacity:0;transform:...`, tanpa spasi) dan hasil
 * render klien di DOM (`opacity: 0; transform: ...;`, dengan titik koma di
 * akhir).
 */
export const STATIC_HIDDEN_INITIAL_SELECTORS: readonly string[] = [
  '[data-mode="static"] [style*="opacity:0;"]',
  '[data-mode="static"] [style$=";opacity:0"]',
  '[data-mode="static"] [style="opacity:0"]',
  '[data-mode="static"] [style*="opacity: 0;"]',
  '[data-mode="static"] [style$=";opacity: 0"]',
  '[data-mode="static"] [style="opacity: 0;"]',
];

/**
 * Penjaga "tanpa JavaScript". `motion/react` menuliskan `initial` sebagai
 * gaya inline saat render di server, sedangkan `whileInView` yang
 * membukanya hanya jalan kalau ada JS. Di mode static — dokumen yang harus
 * tetap terbaca tanpa JS, seperti file HTML export — state awal itu tidak
 * akan pernah berubah, jadi tanpa penjaga ini seluruh section terkunci tak
 * terlihat. Penjaga-nya diletakkan di dalam `<noscript>` supaya pembaca
 * yang JS-nya hidup (halaman publik yang terhidrasi) tetap mendapat animasi
 * masuknya, dan hanya yang tidak punya JS yang kehilangan isi.
 *
 * `[style*="opacity:0"]` biasa tidak dipakai karena ikut cocok dengan
 * `opacity:0.06` — dekoratif seperti grain, orb, dan partikel — lalu
 * menjadikannya pekat. Karena itu hanya nilai nol persis yang ditembak.
 */
export const STATIC_REVEAL_FALLBACK_CSS = `${STATIC_HIDDEN_INITIAL_SELECTORS.join(",\n")} {
  opacity: 1 !important;
  transform: none !important;
}`;

type BoundaryProps = {
  sectionId: SectionId;
  mode: RenderMode;
  /** Berubah identitas saat data berubah, supaya section yang sempat gagal bisa dicoba lagi. */
  resetKey: unknown;
  children: ReactNode;
};

type BoundaryState = { failed: boolean };

class SectionBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(
      `[portfolio] section "${this.props.sectionId}" gagal dirender`,
      error,
      info?.componentStack,
    );
  }

  componentDidUpdate(previous: BoundaryProps) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    // Di halaman publik tidak ada yang bisa diperbaiki pembaca, jadi
    // section-nya dibiarkan kosong; target anchor tetap ada karena pembungkusnya
    // ada di luar boundary. Di editor, penulis harus tahu bagian mana yang rusak.
    if (this.props.mode !== "editor") return null;

    return (
      <p role="status" className="mx-auto max-w-2xl px-6 py-8 text-sm text-on-surface-variant">
        Bagian ini gagal dirender karena datanya bermasalah. Perbaiki isinya, lalu muat ulang
        builder.
      </p>
    );
  }
}

/**
 * Satu-satunya pohon render portfolio. Empat konsumen memakai ini: canvas
 * builder (`editor`), /portfolio/preview (`editor`), /p/[slug] (`static`),
 * dan export HTML (`static` lewat renderToStaticMarkup).
 *
 * Wrapper setiap section memakai `id` yang sama dengan SectionId supaya
 * anchor bawaan hero (`#projects`, `#contact`) punya target, termasuk ketika
 * sectionnya tidak punya data dan komponen membalas `null`. Wrapper-nya
 * tidak punya tinggi, jadi tidak ada celah kosong yang mencurigakan.
 */
export function PortfolioDocument({
  data,
  themeId,
  mode,
  sectionOrder,
  sectionVisibility,
  sectionColors,
  fontSize,
  onSectionClick,
  sectionWrapper,
  sectionStyle,
}: PortfolioDocumentProps) {
  const safeData = normalizeData(data);
  const theme = resolveTheme(themeId);
  const order = resolveOrder(sectionOrder);
  const resolvedFontSize = resolveFontSize(fontSize);
  const fontVars = FONT_SIZE_VARS[resolvedFontSize];
  const interactive = mode === "editor" && onSectionClick ? onSectionClick : null;

  return (
    <MotionConfig reducedMotion={mode === "static" ? "always" : "user"}>
      <ThemeContext.Provider value={theme}>
        <div
          data-theme={theme.id}
          data-mode={mode}
          data-font-size={resolvedFontSize}
          className="min-h-screen"
          style={
            {
              backgroundColor: theme.colors.bg,
              color: theme.colors.text,
              fontFamily: theme.font.includes(" ")
                ? `'${theme.font}', sans-serif`
                : `${theme.font}, sans-serif`,
              "--p-font-size-base": fontVars.base,
              "--p-font-size-sm": fontVars.small,
              "--p-font-size-h2": fontVars.h2,
              "--p-font-size-h3": fontVars.h3,
              fontSize: fontVars.base,
            } as CSSProperties
          }
        >
          {mode === "static" && (
            <noscript>
              <style>{STATIC_REVEAL_FALLBACK_CSS}</style>
            </noscript>
          )}

          {order.map((id) => {
            if (!isSectionVisible(sectionVisibility, id)) return null;

            const renderSection = RENDERERS[id];
            if (!renderSection) return null;

            const section = (
              <div
                key={id}
                id={id}
                data-section-id={id}
                style={sectionStyle?.[id]}
                onClick={interactive ? () => interactive(id) : undefined}
              >
                <ThemeContext.Provider value={themeForSection(theme, id, sectionColors)}>
                  <SectionBoundary sectionId={id} mode={mode} resetKey={data}>
                    {renderSection(safeData)}
                  </SectionBoundary>
                </ThemeContext.Provider>
              </div>
            );

            return sectionWrapper ? (
              <Fragment key={id}>{sectionWrapper(id, section)}</Fragment>
            ) : (
              section
            );
          })}
        </div>
      </ThemeContext.Provider>
    </MotionConfig>
  );
}

export default PortfolioDocument;
