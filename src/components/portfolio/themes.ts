import type { SectionId, ThemeDefinition } from "./types";

export const THEMES: Record<string, ThemeDefinition> = {
  /* ═══════════════════════════════════════════════
   * GLASS, Ethereal Glass (was "bento")
   * VIBE: Deep OLED black, frosted glass cards,
   *       radial mesh gradients, Geist font
   * LAYOUT: Centered hero, asymmetrical bento grid
   * ═══════════════════════════════════════════════ */
  "glass": {
    id: "glass",
    name: "Glassmorphism",
    description: "Dark premium dengan frosted glass, purple-emerald mesh, bento grid asimetris, lebih terang dari sebelumnya",
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
      primary: "#8365FC",
      onPrimary: "#12121F",
      primaryGlow: "rgba(124,92,252,0.25)",
      secondary: "#A78BFA",
      accent: "#6DD5FA",
      border: "rgba(255,255,255,0.08)",
      borderHover: "rgba(124,92,252,0.35)",
    },
    radii: { card: "1.5rem", button: "9999px", pill: "9999px", image: "2rem" },
    blur: { card: "blur(20px)", glow: "blur(120px)" },
    shadow: {
      card: "inset 0 1px 1px rgba(255,255,255,0.06)",
      focus: "0 0 0 3px rgba(167,139,250,0.55)",
    },
    typography: { display: "'Geist', sans-serif", body: "'Geist', sans-serif", eyebrow: "'Geist', sans-serif" },
    focusRing: { color: "#A78BFA", width: "3px" },
    sectionColors: {
      hero: { primary: "#8365FC", accent: "#6DD5FA" },
      about: { primary: "#A78BFA", accent: "#7C5CFC" },
      stats: { primary: "#6DD5FA", accent: "#7C5CFC" },
      experience: { primary: "#8365FC", accent: "#A78BFA" },
      education: { primary: "#A78BFA", accent: "#6DD5FA" },
      projects: { primary: "#6DD5FA", accent: "#7C5CFC" },
      skills: { primary: "#8365FC", accent: "#6DD5FA" },
      certifications: { primary: "#6DD5FA", accent: "#A78BFA" },
      organizations: { primary: "#A78BFA", accent: "#6DD5FA" },
      hobbies: { primary: "#8365FC", accent: "#6DD5FA" },
      testimonials: { primary: "#A78BFA", accent: "#7C5CFC" },
      contact: { primary: "#8365FC", accent: "#6DD5FA" },
    },
  },

  /* ═══════════════════════════════════════════════
   * BRUTAL, Soft Structuralism (BRIGHT, bold)
   * VIBE: White/cream bg, bold black borders,
   *       grain texture, hot pink accents
   * LAYOUT: Asymmetrical hero, Z-Axis cascade
   * NOTE: Bright style, user prefers this!
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
      primary: "#E40039",
      onPrimary: "#FFFFFF",
      primaryGlow: "rgba(255,51,102,0.15)",
      secondary: "#3366FF",
      accent: "#FFCC00",
      border: "#1A1A1A",
      borderHover: "#FF3366",
    },
    radii: { card: "0", button: "0", pill: "0", image: "0" },
    blur: { card: "", glow: "" },
    shadow: { card: "6px 6px 0 0 currentColor", focus: "0 0 0 3px #FF3366" },
    typography: {
      display: "'Space Grotesk', sans-serif",
      body: "'Space Grotesk', sans-serif",
      eyebrow: "'Space Grotesk', sans-serif",
    },
    focusRing: { color: "#FF3366", width: "3px" },
    sectionColors: {
      hero: { primary: "#E40039", accent: "#3366FF" },
      about: { primary: "#1D4ED8", accent: "#FF3366" },
      stats: { primary: "#8A6400", accent: "#3366FF" },
      experience: { primary: "#E40039", accent: "#FFCC00" },
      education: { primary: "#0E7490", accent: "#FF3366" },
      projects: { primary: "#1D4ED8", accent: "#33CCFF" },
      skills: { primary: "#E40039", accent: "#3366FF" },
      certifications: { primary: "#0E7490", accent: "#FFCC00" },
      organizations: { primary: "#1D4ED8", accent: "#FF3366" },
      hobbies: { primary: "#8A6400", accent: "#3366FF" },
      testimonials: { primary: "#8A6400", accent: "#FF3366" },
      contact: { primary: "#1D4ED8", accent: "#33CCFF" },
    },
  },

  /* ═══════════════════════════════════════════════
   * LUXE, Editorial Luxury (was "clay")
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
      textMuted: "#6E5F52",
      primary: "#936B30",
      onPrimary: "#FFFFFF",
      primaryGlow: "rgba(184,134,60,0.12)",
      secondary: "#D4A574",
      accent: "#8FBC8F",
      border: "#E8DCD0",
      borderHover: "#B8863C",
    },
    radii: { card: "1.5rem", button: "9999px", pill: "9999px", image: "2rem" },
    blur: { card: "", glow: "" },
    shadow: { card: "none", focus: "0 0 0 3px #B8863C" },
    typography: {
      display: "'Playfair Display', serif",
      body: "'Sora', sans-serif",
      eyebrow: "'Sora', sans-serif",
    },
    focusRing: { color: "#B8863C", width: "3px" },
    sectionColors: {
      hero: { primary: "#936B30", accent: "#8FBC8F" },
      about: { primary: "#8A6442", accent: "#B8863C" },
      stats: { primary: "#4C7E4C", accent: "#B8863C" },
      experience: { primary: "#936B30", accent: "#D4A574" },
      education: { primary: "#8A6442", accent: "#8FBC8F" },
      projects: { primary: "#4C7E4C", accent: "#B8863C" },
      skills: { primary: "#936B30", accent: "#8FBC8F" },
      certifications: { primary: "#8A6442", accent: "#B8863C" },
      organizations: { primary: "#4C7E4C", accent: "#D4A574" },
      hobbies: { primary: "#936B30", accent: "#D4A574" },
      testimonials: { primary: "#8A6442", accent: "#B8863C" },
      contact: { primary: "#936B30", accent: "#8FBC8F" },
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
