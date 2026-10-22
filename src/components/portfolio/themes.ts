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
    fontUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&display=swap",
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
    radii: { card: "1.5rem", button: "9999px", pill: "9999px", image: "2rem", circle: "9999px" },
    blur: { card: "blur(20px)", glow: "blur(120px)" },
    shadow: {
      card: "inset 0 1px 1px rgba(255,255,255,0.06)",
      focus: "0 0 0 3px rgba(167,139,250,0.55)",
    },
    typography: { display: "'Geist', ui-sans-serif, system-ui", body: "'Geist', ui-sans-serif, system-ui", eyebrow: "'Geist', ui-sans-serif, system-ui" },
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
    radii: { card: "0", button: "0", pill: "0", image: "0", circle: "9999px" },
    blur: { card: "", glow: "" },
    shadow: { card: "6px 6px 0 0 currentColor", focus: "0 0 0 3px #FF3366" },
    typography: {
      display: "'Space Grotesk', ui-sans-serif, system-ui",
      body: "'Space Grotesk', ui-sans-serif, system-ui",
      eyebrow: "'Space Grotesk', ui-sans-serif, system-ui",
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
    radii: { card: "1.5rem", button: "9999px", pill: "9999px", image: "2rem", circle: "9999px" },
    blur: { card: "", glow: "" },
    shadow: { card: "none", focus: "0 0 0 3px #B8863C" },
    typography: {
      display: "'Playfair Display', serif",
      body: "'Sora', ui-sans-serif, system-ui",
      eyebrow: "'Sora', ui-sans-serif, system-ui",
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

  /* ═══════════════════════════════════════════════
   * MINIMALIST, Ink on paper
   * VIBE: Putih bersih, satu grotesk, kontras skala
   *       ekstrem, hairline, tanpa isian & bayangan
   * LAYOUT: Lingkaran + tipografi raksasa, daftar
   *         satu kolom dipisah garis rambut
   * ═══════════════════════════════════════════════ */
  "minimalist": {
    id: "minimalist",
    name: "Minimalist",
    description: "Putih bersih dengan satu huruf sans-serif, tipografi raksasa, garis rambut, tanpa bayangan",
    font: "Instrument Sans",
    fontUrl: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;700&display=swap",
    previewGradient: "bg-[#FFFFFF]",
    colors: {
      bg: "#FFFFFF",
      bgSecondary: "#FAFAFA",
      surface: "#F4F4F5",
      surfaceHover: "#ECECEE",
      text: "#111111",
      textSecondary: "#52525B",
      textMuted: "#71717A",
      primary: "#111111",
      onPrimary: "#FFFFFF",
      primaryGlow: "rgba(17,17,17,0)",
      secondary: "#71717A",
      accent: "#111111",
      border: "#E4E4E7",
      borderHover: "#111111",
    },
    radii: { card: "0", button: "0", pill: "0", image: "0", circle: "9999px" },
    blur: { card: "none", glow: "none" },
    shadow: { card: "none", focus: "none" },
    typography: {
      display: "'Instrument Sans', ui-sans-serif, system-ui",
      body: "'Instrument Sans', ui-sans-serif, system-ui",
      eyebrow: "'Instrument Sans', ui-sans-serif, system-ui",
    },
    focusRing: { color: "#111111", width: "2px" },
    sectionColors: {
      hero: { primary: "#111111", accent: "#111111" },
      about: { primary: "#111111", accent: "#52525B" },
      stats: { primary: "#111111", accent: "#111111" },
      experience: { primary: "#111111", accent: "#52525B" },
      education: { primary: "#111111", accent: "#52525B" },
      projects: { primary: "#111111", accent: "#111111" },
      skills: { primary: "#111111", accent: "#52525B" },
      certifications: { primary: "#111111", accent: "#52525B" },
      organizations: { primary: "#111111", accent: "#52525B" },
      hobbies: { primary: "#111111", accent: "#52525B" },
      testimonials: { primary: "#111111", accent: "#52525B" },
      contact: { primary: "#111111", accent: "#111111" },
    },
  },
  /* ═══════════════════════════════════════════════
   * WORKBENCH, Kertas kerja
   * VIBE: Sama dengan tema aplikasi (Evergreen + Lime):
   *       kertas desk-green, garis tinta 2,5px, bayangan
   *       padat tanpa blur, satu penanda lime
   * LAYOUT: Poster asimetris + daftar isi bergaris,
   *         label mono, foto seperti ditempel
   * ═══════════════════════════════════════════════ */
  "workbench": {
    id: "workbench",
    name: "Kertas Kerja",
    description: "Kertas kerja bertema aplikasi: garis tinta tebal, bayangan padat, label mono, dan satu penanda lime",
    font: "Stack Sans Headline",
    fontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Stack+Sans+Headline:wght@400;500;600;700&display=swap",
    previewGradient: "bg-[#f3f6f2]",
    colors: {
      bg: "#F3F6F2",
      bgSecondary: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceHover: "#EEF3EE",
      text: "#0A0F0D",
      textSecondary: "#4A5B52",
      textMuted: "#5B6B62",
      primary: "#1D6B48",
      onPrimary: "#FFFFFF",
      primaryGlow: "rgba(29,107,72,0.18)",
      secondary: "#3F8F77",
      accent: "#D6EE30",
      border: "#0A0F0D",
      borderHover: "#1D6B48",
    },
    radii: { card: "14px", button: "9999px", pill: "9999px", image: "18px", circle: "9999px" },
    blur: { card: "", glow: "" },
    shadow: { card: "6px 6px 0 #D5DED8", focus: "0 0 0 3px rgba(29,107,72,0.45)" },
    typography: {
      display: "'Stack Sans Headline', ui-sans-serif, system-ui",
      body: "'Inter', ui-sans-serif, system-ui",
      eyebrow: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    focusRing: { color: "#1D6B48", width: "3px" },
    sectionColors: {
      hero: { primary: "#1D6B48", accent: "#D6EE30" },
      about: { primary: "#122922", accent: "#D6EE30" },
      stats: { primary: "#1D6B48", accent: "#D6EE30" },
      experience: { primary: "#2F5D3A", accent: "#D6EE30" },
      education: { primary: "#3D5A2A", accent: "#D6EE30" },
      projects: { primary: "#1D6B48", accent: "#D6EE30" },
      skills: { primary: "#122922", accent: "#D6EE30" },
      certifications: { primary: "#3D5A2A", accent: "#D6EE30" },
      organizations: { primary: "#2F5D3A", accent: "#D6EE30" },
      hobbies: { primary: "#4A5B52", accent: "#D6EE30" },
      testimonials: { primary: "#122922", accent: "#D6EE30" },
      contact: { primary: "#1D6B48", accent: "#D6EE30" },
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
  minimalist: {
    hero: { name: "Nadia P.", title: "Product Engineer", tagline: "Small Systems, Clear Thinking", bio: "I build quiet software for loud problems." },
    stats: ["6+", "14+", "9+"],
  },
  workbench: {
    hero: { name: "Bagas P.", title: "Product Designer", tagline: "Rapi di atas kertas, cepat di layar", bio: "Menyusun alur produk dari sketsa sampai rilis." },
    stats: ["8+", "26+", "15+"],
  },
} as const;

export const DEFAULT_THEME_ID = "glass";

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "hero", "about", "stats", "experience", "education",
  "projects", "skills", "certifications", "organizations", "hobbies",
  "testimonials", "contact",
];
