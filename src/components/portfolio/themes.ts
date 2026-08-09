import type { SectionId, ThemeDefinition } from "./types";

export const THEMES: Record<string, ThemeDefinition> = {
  /* ═══════════════════════════════════════════════
   * GLASS — Ethereal Glass (was "bento")
   * VIBE: Deep OLED black, frosted glass cards,
   *       radial mesh gradients, Geist font
   * LAYOUT: Centered hero, asymmetrical bento grid
   * ═══════════════════════════════════════════════ */
  "glass": {
    id: "glass",
    name: "Glassmorphism",
    description: "Dark premium dengan frosted glass, purple-emerald mesh, bento grid asimetris — lebih terang dari sebelumnya",
    font: "Geist",
    fontUrl: "https://fonts.cdnfonts.com/css/geist",
    previewGradient: "bg-gradient-to-br from-[#12121F] via-[#1A1A2E] to-[#1A1A35]",
    colors: {
      bg: "#12121F",
      bgSecondary: "#1A1A2E",
      surface: "rgba(255,255,255,0.06)",
      surfaceHover: "rgba(255,255,255,0.09)",
      text: "#F0F0F5",
      textSecondary: "#C0C0D0",
      textMuted: "#808098",
      primary: "#7C5CFC",
      primaryGlow: "rgba(124,92,252,0.25)",
      secondary: "#A78BFA",
      accent: "#6DD5FA",
      border: "rgba(255,255,255,0.08)",
      borderHover: "rgba(124,92,252,0.35)",
    },
    sectionColors: {
      hero: { primary: "#7C5CFC", accent: "#6DD5FA" },
      about: { primary: "#A78BFA", accent: "#7C5CFC" },
      stats: { primary: "#6DD5FA", accent: "#7C5CFC" },
      experience: { primary: "#7C5CFC", accent: "#A78BFA" },
      education: { primary: "#A78BFA", accent: "#6DD5FA" },
      projects: { primary: "#6DD5FA", accent: "#7C5CFC" },
      skills: { primary: "#7C5CFC", accent: "#6DD5FA" },
      certifications: { primary: "#6DD5FA", accent: "#A78BFA" },
      organizations: { primary: "#A78BFA", accent: "#6DD5FA" },
      hobbies: { primary: "#7C5CFC", accent: "#6DD5FA" },
      testimonials: { primary: "#A78BFA", accent: "#7C5CFC" },
      contact: { primary: "#7C5CFC", accent: "#6DD5FA" },
    },
    cssVars: {
      "--p-bg": "#050505",
      "--p-bg-secondary": "#0A0A0F",
      "--p-surface": "rgba(255,255,255,0.03)",
      "--p-surface-hover": "rgba(255,255,255,0.06)",
      "--p-text": "#F0F0F5",
      "--p-text-secondary": "#C0C0D0",
      "--p-text-muted": "#707080",
      "--p-primary": "#7C5CFC",
      "--p-primary-glow": "rgba(124,92,252,0.2)",
      "--p-secondary": "#A78BFA",
      "--p-accent": "#6DD5FA",
      "--p-border": "rgba(255,255,255,0.06)",
      "--p-border-hover": "rgba(124,92,252,0.3)",
    },
  },

  /* ═══════════════════════════════════════════════
   * BRUTAL — Soft Structuralism (BRIGHT, bold)
   * VIBE: White/cream bg, bold black borders,
   *       grain texture, hot pink accents
   * LAYOUT: Asymmetrical hero, Z-Axis cascade
   * NOTE: Bright style — user prefers this!
   * ═══════════════════════════════════════════════ */
  "brutal": {
    id: "brutal",
    name: "Neo Brutal",
    description: "Cerah berani dengan border tebal, grain texture, shadow boxes, dan aksen neon kontras",
    font: "Space Grotesk",
    fontUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    previewGradient: "bg-[#FFFAF0]",
    colors: {
      bg: "#FFFAF0",
      bgSecondary: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceHover: "#FFF5E6",
      text: "#1A1A1A",
      textSecondary: "#333333",
      textMuted: "#666666",
      primary: "#FF3366",
      primaryGlow: "rgba(255,51,102,0.15)",
      secondary: "#3366FF",
      accent: "#FFCC00",
      border: "#1A1A1A",
      borderHover: "#FF3366",
    },
    sectionColors: {
      hero: { primary: "#FF3366", accent: "#3366FF" },
      about: { primary: "#3366FF", accent: "#FF3366" },
      stats: { primary: "#FFCC00", accent: "#3366FF" },
      experience: { primary: "#FF3366", accent: "#FFCC00" },
      education: { primary: "#33CCFF", accent: "#FF3366" },
      projects: { primary: "#3366FF", accent: "#33CCFF" },
      skills: { primary: "#FF3366", accent: "#3366FF" },
      certifications: { primary: "#33CCFF", accent: "#FFCC00" },
      organizations: { primary: "#3366FF", accent: "#FF3366" },
      hobbies: { primary: "#FFCC00", accent: "#3366FF" },
      testimonials: { primary: "#FFCC00", accent: "#FF3366" },
      contact: { primary: "#3366FF", accent: "#33CCFF" },
    },
    cssVars: {
      "--p-bg": "#FFFAF0",
      "--p-bg-secondary": "#FFFFFF",
      "--p-surface": "#FFFFFF",
      "--p-surface-hover": "#FFF5E6",
      "--p-text": "#1A1A1A",
      "--p-text-secondary": "#333333",
      "--p-text-muted": "#666666",
      "--p-primary": "#FF3366",
      "--p-primary-glow": "rgba(255,51,102,0.15)",
      "--p-secondary": "#3366FF",
      "--p-accent": "#FFCC00",
      "--p-border": "#1A1A1A",
      "--p-border-hover": "#FF3366",
    },
  },

  /* ═══════════════════════════════════════════════
   * LUXE — Editorial Luxury (was "clay")
   * VIBE: Warm cream, serif typography, film grain,
   *       gold/terracotta accents
   * LAYOUT: Editorial split, massive typography
   * ═══════════════════════════════════════════════ */
  "luxe": {
    id: "luxe",
    name: "Editorial Luxe",
    description: "Warm editorial dengan serif elegan, film grain texture, tipografi masif paleface",
    font: "Playfair Display",
    fontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Sora:wght@300;400;500;600&display=swap",
    previewGradient: "bg-gradient-to-br from-[#FDFBF7] via-[#F8F3ED] to-[#F0E8D8]",
    colors: {
      bg: "#FDFBF7",
      bgSecondary: "#F8F3ED",
      surface: "#FFFFFF",
      surfaceHover: "#F8F3ED",
      text: "#1A1410",
      textSecondary: "#5C4A3A",
      textMuted: "#8C7A6A",
      primary: "#B8863C",
      primaryGlow: "rgba(184,134,60,0.12)",
      secondary: "#D4A574",
      accent: "#8FBC8F",
      border: "#E8DCD0",
      borderHover: "#B8863C",
    },
    sectionColors: {
      hero: { primary: "#B8863C", accent: "#8FBC8F" },
      about: { primary: "#D4A574", accent: "#B8863C" },
      stats: { primary: "#8FBC8F", accent: "#B8863C" },
      experience: { primary: "#B8863C", accent: "#D4A574" },
      education: { primary: "#D4A574", accent: "#8FBC8F" },
      projects: { primary: "#8FBC8F", accent: "#B8863C" },
      skills: { primary: "#B8863C", accent: "#8FBC8F" },
      certifications: { primary: "#D4A574", accent: "#B8863C" },
      organizations: { primary: "#8FBC8F", accent: "#D4A574" },
      hobbies: { primary: "#B8863C", accent: "#D4A574" },
      testimonials: { primary: "#D4A574", accent: "#B8863C" },
      contact: { primary: "#B8863C", accent: "#8FBC8F" },
    },
    cssVars: {
      "--p-bg": "#FDFBF7",
      "--p-bg-secondary": "#F8F3ED",
      "--p-surface": "#FFFFFF",
      "--p-surface-hover": "#F8F3ED",
      "--p-text": "#1A1410",
      "--p-text-secondary": "#5C4A3A",
      "--p-text-muted": "#8C7A6A",
      "--p-primary": "#B8863C",
      "--p-primary-glow": "rgba(184,134,60,0.12)",
      "--p-secondary": "#D4A574",
      "--p-accent": "#8FBC8F",
      "--p-border": "#E8DCD0",
      "--p-border-hover": "#B8863C",
    },
  },
};

export const TEMPLATE_PREVIEWS = {
  glass: {
    hero: { name: "Alex Morgan", title: "Full-Stack Developer", tagline: "Designing Scalable Digital Ecosystems", bio: "Building high-performance web applications with modern architecture and pixel-perfect interfaces." },
    stats: ["5+", "30+", "20+"],
  },
  brutal: {
    hero: { name: "Riley K.", title: "Creative Developer & Motion Designer", tagline: "Breaking Boundaries with Code", bio: "Pushing the limits of web interaction through experimental design and cutting-edge technology." },
    stats: ["3+", "18+", "12+"],
  },
  luxe: {
    hero: { name: "Maya Chen", title: "UI/UX Designer & Brand Strategist", tagline: "Crafting Human-Centered Experiences", bio: "Transforming complex problems into intuitive, beautiful design solutions." },
    stats: ["7+", "50+", "25+"],
  },
} as const;

export const DEFAULT_THEME_ID = "glass";

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "hero", "about", "stats", "experience", "education",
  "projects", "skills", "certifications", "organizations", "hobbies",
  "testimonials", "contact",
];
