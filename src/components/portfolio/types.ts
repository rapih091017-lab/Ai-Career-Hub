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

export type ThemeId = "glass" | "brutal" | "luxe";

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

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  font: string;
  fontUrl: string;
  colors: ThemeColors;
  sectionColors?: Partial<Record<SectionId, Partial<ThemeColors>>>;
  cssVars: Record<string, string>;
  previewGradient: string;
}

export interface SectionConfig {
  id: SectionId;
  label: string;
  icon: string;
  visible: boolean;
}

export type FontSize = "small" | "medium" | "large";
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
