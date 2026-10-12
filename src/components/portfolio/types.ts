/** Dua belas section portfolio. Sumber kebenaran untuk union SectionId
 *  sekaligus untuk validasi Zod (sectionOrder / sectionVisibility). */
export const SECTION_IDS = [
  "hero",
  "about",
  "stats",
  "experience",
  "education",
  "projects",
  "skills",
  "certifications",
  "organizations",
  "hobbies",
  "testimonials",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** Peta visibilitas section. Sengaja parsial: section yang tidak disebut
 *  dianggap tampil, jadi peta kosong berarti "semua section tampil". */
export type SectionVisibility = Partial<Record<SectionId, boolean>>;

/** Tema yang tersedia. Sumber kebenaran untuk union ThemeId sekaligus untuk
 *  validasi Zod (publishPayloadSchema.themeId). */
export const THEME_IDS = ["glass", "brutal", "luxe"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  border: string;
  borderHover: string;
}

export interface ThemeRadii { card: string; button: string; pill: string; image: string }
export interface ThemeBlur { card: string; glow: string }
export interface ThemeShadow { card: string; focus: string }
export interface ThemeTypography { display: string; body: string; eyebrow: string }
export interface ThemeFocusRing { color: string; width: string }

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  font: string;
  fontUrl: string;
  colors: ThemeColors;
  radii: ThemeRadii;
  blur: ThemeBlur;
  shadow: ThemeShadow;
  typography: ThemeTypography;
  focusRing: ThemeFocusRing;
  sectionColors?: Partial<Record<SectionId, Partial<ThemeColors>>>;
  previewGradient: string;
}

export interface SectionConfig {
  id: SectionId;
  label: string;
  icon: string;
  visible: boolean;
}

/** Ukuran font yang tersedia. Sumber kebenaran untuk union FontSize sekaligus
 *  untuk validasi Zod (publishPayloadSchema.fontSize). */
export const FONT_SIZES = ["small", "medium", "large"] as const;

export type FontSize = (typeof FONT_SIZES)[number];
export type TextAlignment = "left" | "center" | "right";

export interface TypographySettings {
  fontSize: FontSize;
  alignment: Record<SectionId, TextAlignment>;
}

export interface PortfolioSettings {
  sectionOrder: SectionId[];
  themeId: ThemeId;
  sectionConfigs: Record<SectionId, SectionConfig>;
  typography: TypographySettings;
}

export type {
  ProjectItem,
  ExperienceItem,
  EducationItem,
  CertificationItem,
  OrganizationItem,
  HobbyItem,
  TestimonialItem,
  ExtraLink,
  PortfolioFormData,
  PortfolioData,
} from "../portfolio-templates/types";
