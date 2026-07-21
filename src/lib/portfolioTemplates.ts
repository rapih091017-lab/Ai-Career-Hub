export type TemplateId = "porto-premium" | "colorful" | "modern";

export interface PortfolioTemplate {
  id: TemplateId;
  name: string;
  description: string;
  font: string;
  fontUrl: string;
  colors: {
    bg: string;
    bgSecondary: string;
    cardBg: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryGlow: string;
    secondary: string;
    accent: string;
    border: string;
    borderHover: string;
  };
  /** Tailwind preview class for theme card */
  previewClass: string;
  /** CSS class for the body-level theme */
  themeClass: string;
}

export const PORTFOLIO_TEMPLATES: Record<TemplateId, PortfolioTemplate> = {
  "porto-premium": {
    id: "porto-premium",
    name: "Porto Premium",
    description: "Tampilan gelap premium dengan aksen indigo, cocok untuk developer & kreator",
    font: "Plus Jakarta Sans",
    fontUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    colors: {
      bg: "#0B0F19",
      bgSecondary: "#151B2C",
      cardBg: "#1A2038",
      text: "#F3F4F6",
      textMuted: "#9CA3AF",
      primary: "#6366F1",
      primaryGlow: "rgba(99,102,241,0.15)",
      secondary: "#818CF8",
      accent: "#A5B4FC",
      border: "rgba(255,255,255,0.08)",
      borderHover: "rgba(99,102,241,0.3)",
    },
    previewClass: "bg-gradient-to-br from-[#0B0F19] via-[#151B2C] to-[#0B0F19]",
    themeClass: "theme-porto-premium",
  },
  "colorful": {
    id: "colorful",
    name: "Colorful",
    description: "Gradasi cerah penuh warna, energik dan ceria · personal branding maksimal",
    font: "Montserrat",
    fontUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap",
    colors: {
      bg: "#F8F9FF",
      bgSecondary: "#FFFFFF",
      cardBg: "#FFFFFF",
      text: "#1A1D2D",
      textMuted: "#666E81",
      primary: "#FF6B6B",
      primaryGlow: "rgba(255,107,107,0.25)",
      secondary: "#2D9CDB",
      accent: "#D93B80",
      border: "rgba(0,0,0,0.06)",
      borderHover: "rgba(255,107,107,0.3)",
    },
    previewClass: "bg-gradient-to-br from-[#FF6B6B] via-[#D93B80] to-[#2D9CDB]",
    themeClass: "theme-colorful",
  },
  "modern": {
    id: "modern",
    name: "Modern",
    description: "Desain bersih profesional dengan aksen ungu elegan, optimal untuk semua industri",
    font: "Inter",
    fontUrl: "",
    colors: {
      bg: "#FBF8FE",
      bgSecondary: "#FFFFFF",
      cardBg: "#FFFFFF",
      text: "#1B1B1F",
      textMuted: "#4A4452",
      primary: "#6C45B2",
      primaryGlow: "rgba(108,69,178,0.12)",
      secondary: "#9C7BD8",
      accent: "#C4B5E3",
      border: "rgba(0,0,0,0.06)",
      borderHover: "rgba(108,69,178,0.2)",
    },
    previewClass: "bg-gradient-to-br from-primary/5 via-white to-primary/5",
    themeClass: "theme-modern",
  },
};

export const DEFAULT_PORTFOLIO_TEMPLATE: TemplateId = "porto-premium";

export function getTemplateStyle(templateId: TemplateId): React.CSSProperties {
  const t = PORTFOLIO_TEMPLATES[templateId];
  if (!t) return {};
  return {
    "--p-bg": t.colors.bg,
    "--p-bg-secondary": t.colors.bgSecondary,
    "--p-card-bg": t.colors.cardBg,
    "--p-text": t.colors.text,
    "--p-text-muted": t.colors.textMuted,
    "--p-primary": t.colors.primary,
    "--p-primary-glow": t.colors.primaryGlow,
    "--p-secondary": t.colors.secondary,
    "--p-accent": t.colors.accent,
    "--p-border": t.colors.border,
    "--p-border-hover": t.colors.borderHover,
    "--p-font": `'${t.font}', sans-serif`,
  } as React.CSSProperties;
}
