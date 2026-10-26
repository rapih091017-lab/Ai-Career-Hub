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
    description: "Dark premium dengan frosted glass, mesh baja-biru dingin, bento grid asimetris, dan huruf Geist yang tenang",
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
      primary: "#A5B4C8",
      onPrimary: "#12121F",
      primaryGlow: "rgba(165,180,200,0.12)",
      secondary: "#8E9BB0",
      accent: "#93C5FD",
      border: "rgba(255,255,255,0.08)",
      borderHover: "rgba(165,180,200,0.35)",
    },
    radii: { card: "1.5rem", button: "9999px", pill: "9999px", image: "2rem", circle: "9999px" },
    blur: { card: "blur(20px)", glow: "blur(120px)" },
    shadow: {
      card: "inset 0 1px 1px rgba(255,255,255,0.06)",
      focus: "0 0 0 3px rgba(165,180,200,0.55)",
    },
    typography: { display: "'Geist', ui-sans-serif, system-ui", body: "'Geist', ui-sans-serif, system-ui", eyebrow: "'Geist', ui-sans-serif, system-ui" },
    focusRing: { color: "#A5B4C8", width: "3px" },
    sectionColors: {
      hero: { primary: "#B4C1D2", accent: "#60A5FA" },
      about: { primary: "#A5B4C8", accent: "#93C5FD" },
      stats: { primary: "#CBD5E1", accent: "#60A5FA" },
      experience: { primary: "#A5B4C8", accent: "#7DD3FC" },
      education: { primary: "#9FB0C6", accent: "#93C5FD" },
      projects: { primary: "#CBD5E1", accent: "#60A5FA" },
      skills: { primary: "#B4C1D2", accent: "#93C5FD" },
      certifications: { primary: "#A5B4C8", accent: "#7DD3FC" },
      organizations: { primary: "#9FB0C6", accent: "#60A5FA" },
      hobbies: { primary: "#8E9BB0", accent: "#93C5FD" },
      testimonials: { primary: "#B4C1D2", accent: "#60A5FA" },
      contact: { primary: "#CBD5E1", accent: "#7DD3FC" },
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
    shadow: { card: "6px 6px 0 0 #1A1A1A", focus: "0 0 0 3px #FF3366" },
    typography: {
      display: "'Space Grotesk', ui-sans-serif, system-ui",
      body: "'Space Grotesk', ui-sans-serif, system-ui",
      eyebrow: "'Space Grotesk', ui-sans-serif, system-ui",
    },
    focusRing: { color: "#FF3366", width: "3px" },
    // Tiga warna sinyal saja: tinta, merah, biru. Penanda kuning dipakai
    // sebagai accent di SEMUA section supaya identitasnya konsisten; kuning
    // juga satu-satunya accent yang aman sebagai latar badge bertinta gelap.
    sectionColors: {
      hero: { primary: "#E40039", accent: "#FFCC00" },
      about: { primary: "#1A1A1A", accent: "#FFCC00" },
      stats: { primary: "#E40039", accent: "#FFCC00" },
      experience: { primary: "#1A1A1A", accent: "#FFCC00" },
      education: { primary: "#1D4ED8", accent: "#FFCC00" },
      projects: { primary: "#1A1A1A", accent: "#FFCC00" },
      skills: { primary: "#E40039", accent: "#FFCC00" },
      certifications: { primary: "#1A1A1A", accent: "#FFCC00" },
      organizations: { primary: "#1D4ED8", accent: "#FFCC00" },
      hobbies: { primary: "#1A1A1A", accent: "#FFCC00" },
      testimonials: { primary: "#E40039", accent: "#FFCC00" },
      contact: { primary: "#1A1A1A", accent: "#FFCC00" },
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
      accent: "#A6553A",
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
    // Rentang hangat saja: kuningan, kakao, terakota. Hijau sage yang dulu
    // diselipkan terbaca sebagai warna tema lain di atas kertas krem.
    sectionColors: {
      hero: { primary: "#936B30", accent: "#A6553A" },
      about: { primary: "#7A5230", accent: "#B8863C" },
      stats: { primary: "#936B30", accent: "#A6553A" },
      experience: { primary: "#7A5230", accent: "#D4A574" },
      education: { primary: "#936B30", accent: "#B8863C" },
      projects: { primary: "#7A5230", accent: "#A6553A" },
      skills: { primary: "#936B30", accent: "#B8863C" },
      certifications: { primary: "#7A5230", accent: "#D4A574" },
      organizations: { primary: "#936B30", accent: "#A6553A" },
      hobbies: { primary: "#7A5230", accent: "#B8863C" },
      testimonials: { primary: "#936B30", accent: "#D4A574" },
      contact: { primary: "#7A5230", accent: "#A6553A" },
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
      bgSecondary: "#F4F4F2",
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

  /* ═══════════════════════════════════════════════
   * DECAL, Stiker pill di atas tinta gelap
   * VIBE: latar gelap tinta, stiker pill berwarna,
   *       font bulat tebal, animasi stiker yang memantul
   * LAYOUT: judul besar, stiker kategori, kartu pill
   * ═══════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════
   * SCRAPBOOK, Kertas krem dengan tinta biru
   * VIBE: kertas hangat, tinta biru, selotip merah,
   *       judul tulisan tangan, bayangan tinta tegas
   * LAYOUT: kertas tempel bertumpuk, label selotip, judul besar
   * ═══════════════════════════════════════════════ */
  "scrapbook": {
    id: "scrapbook",
    name: "Scrapbook",
    description: "Kertas krem dengan tinta biru, selotip merah, dan judul tulisan tangan",
    font: "Caveat",
    fontUrl: "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Nunito:wght@400;600;700;800&display=swap",
    previewGradient: "bg-[#F4EEDF]",
    colors: {
      bg: "#F4EEDF",
      bgSecondary: "#EAE2CF",
      surface: "#FFFBF2",
      surfaceHover: "#F7F0E0",
      text: "#1B2A44",
      textSecondary: "#3F4F6E",
      textMuted: "#4A5A78",
      primary: "#1F3A68",
      onPrimary: "#FFFBF2",
      primaryGlow: "rgba(31,58,104,0.14)",
      secondary: "#B83A32",
      accent: "#F2D16B",
      border: "#1B2A44",
      borderHover: "#B83A32",
    },
    radii: { card: "6px", button: "999px", pill: "999px", image: "4px", circle: "9999px" },
    blur: { card: "", glow: "" },
    shadow: { card: "3px 4px 0 0 #1B2A44", focus: "0 0 0 3px #B83A32" },
    typography: {
      display: "'Caveat', cursive",
      body: "'Nunito', ui-sans-serif, system-ui",
      eyebrow: "'Nunito', ui-sans-serif, system-ui",
    },
    focusRing: { color: "#B83A32", width: "3px" },
    sectionColors: {
      hero: { primary: "#1F3A68", accent: "#F2D16B" },
      about: { primary: "#B83A32", accent: "#F2D16B" },
      stats: { primary: "#1F3A68", accent: "#B83A32" },
      experience: { primary: "#B83A32", accent: "#1F3A68" },
      education: { primary: "#1F3A68", accent: "#F2D16B" },
      projects: { primary: "#B83A32", accent: "#1F3A68" },
      skills: { primary: "#1F3A68", accent: "#F2D16B" },
      certifications: { primary: "#B83A32", accent: "#1F3A68" },
      organizations: { primary: "#1F3A68", accent: "#B83A32" },
      hobbies: { primary: "#B83A32", accent: "#F2D16B" },
      testimonials: { primary: "#1F3A68", accent: "#F2D16B" },
      contact: { primary: "#B83A32", accent: "#1F3A68" },
    },
  },
  /* ═══════════════════════════════════════════════
   * CRAYON, Kanvas lilac dengan coretan krayon
   * VIBE: latar lilac lembut, kartu putih, aksen ungu
   *       dan coral, judul tebal membulat
   * LAYOUT: kartu rounded, sudut miring kecil, label warna
   * ═══════════════════════════════════════════════ */
  "crayon": {
    id: "crayon",
    name: "Crayon",
    description: "Kanvas lilac dengan kartu putih, aksen ungu dan coral, serta judul tebal membulat",
    font: "Baloo 2",
    fontUrl: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@400;600;700&display=swap",
    previewGradient: "bg-[#F3F1FB]",
    colors: {
      bg: "#F3F1FB",
      bgSecondary: "#E7E3F7",
      surface: "#FFFFFF",
      surfaceHover: "#F8F6FF",
      text: "#1D1B2E",
      textSecondary: "#3D3A55",
      textMuted: "#5A5773",
      primary: "#5B3FD9",
      onPrimary: "#FFFFFF",
      primaryGlow: "rgba(91,63,217,0.16)",
      secondary: "#C2411F",
      accent: "#FFD23F",
      border: "#1D1B2E",
      borderHover: "#5B3FD9",
    },
    radii: { card: "24px", button: "999px", pill: "999px", image: "20px", circle: "9999px" },
    blur: { card: "", glow: "" },
    shadow: { card: "0 6px 0 0 #1D1B2E", focus: "0 0 0 3px #5B3FD9" },
    typography: {
      display: "'Baloo 2', cursive",
      body: "'Nunito', ui-sans-serif, system-ui",
      eyebrow: "'Nunito', ui-sans-serif, system-ui",
    },
    focusRing: { color: "#5B3FD9", width: "3px" },
    sectionColors: {
      hero: { primary: "#5B3FD9", accent: "#FFD23F" },
      about: { primary: "#C2411F", accent: "#FFD23F" },
      stats: { primary: "#5B3FD9", accent: "#C2411F" },
      experience: { primary: "#C2411F", accent: "#5B3FD9" },
      education: { primary: "#5B3FD9", accent: "#FFD23F" },
      projects: { primary: "#C2411F", accent: "#5B3FD9" },
      skills: { primary: "#5B3FD9", accent: "#FFD23F" },
      certifications: { primary: "#C2411F", accent: "#5B3FD9" },
      organizations: { primary: "#5B3FD9", accent: "#C2411F" },
      hobbies: { primary: "#C2411F", accent: "#FFD23F" },
      testimonials: { primary: "#5B3FD9", accent: "#FFD23F" },
      contact: { primary: "#C2411F", accent: "#5B3FD9" },
    },
  },
  "sherbet": {
    id: "sherbet",
    name: "Sherbet",
    description: "Pastel peach dan mint, tipografi tebal, statistik besar, dan karya bergambar potret",
    font: "Bricolage Grotesque",
    fontUrl: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap",
    previewGradient: "bg-[#FFF5F0]",
    colors: {
      bg: "#FFF5F0",
      bgSecondary: "#F5CDBB",
      surface: "#FFFFFF",
      surfaceHover: "#FCE8DF",
      text: "#203C35",
      textSecondary: "#38564D",
      textMuted: "#455A53",
      primary: "#285247",
      onPrimary: "#FFFFFF",
      primaryGlow: "#DCEBE3",
      secondary: "#DCEBE3",
      accent: "#F5CDBB",
      border: "#677D73",
      borderHover: "#285247",
    },
    radii: { card: "16px", button: "999px", pill: "999px", image: "16px", circle: "9999px" },
    blur: { card: "none", glow: "none" },
    shadow: { card: "none", focus: "0 0 0 3px #285247" },
    typography: {
      display: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
      body: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
      eyebrow: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
    },
    focusRing: { color: "#285247", width: "3px" },
  },
  "interstella": {
    id: "interstella",
    name: "Interstella",
    description: "Panggung agensi gelap dengan headline besar, sorotan tembaga, dan proyek layar lebar",
    font: "Manrope",
    fontUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
    previewGradient: "bg-[#111318]",
    colors: {
      bg: "#111318",
      bgSecondary: "#191C23",
      surface: "#20242D",
      surfaceHover: "#2B303B",
      text: "#F6F3ED",
      textSecondary: "#D2D0CC",
      textMuted: "#AFB0B8",
      primary: "#F2B38D",
      onPrimary: "#111318",
      primaryGlow: "#3B2726",
      secondary: "#313544",
      accent: "#F2B38D",
      border: "#555A67",
      borderHover: "#F2B38D",
    },
    radii: { card: "12px", button: "6px", pill: "6px", image: "12px", circle: "9999px" },
    blur: { card: "none", glow: "none" },
    shadow: { card: "none", focus: "0 0 0 3px #F2B38D" },
    typography: {
      display: "'Manrope', ui-sans-serif, system-ui, sans-serif",
      body: "'Manrope', ui-sans-serif, system-ui, sans-serif",
      eyebrow: "'Manrope', ui-sans-serif, system-ui, sans-serif",
    },
    focusRing: { color: "#F2B38D", width: "3px" },
  },
  "decal": {
    id: "decal",
    name: "Decal",
    description: "Gelap tinta dengan stiker pill berwarna, font bulat tebal, dan animasi stiker yang memantul ringan",
    font: "Outfit",
    fontUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap",
    previewGradient: "bg-[#16161D]",
    colors: {
      bg: "#16161D",
      bgSecondary: "#1F1F2A",
      surface: "#232330",
      surfaceHover: "#2B2B3A",
      text: "#F5F3EE",
      textSecondary: "#D6D3CC",
      textMuted: "#A6A3B0",
      primary: "#FF6B4A",
      onPrimary: "#16161D",
      primaryGlow: "rgba(255,107,74,0.18)",
      secondary: "#7BD8C6",
      accent: "#FFD84D",
      border: "#F5F3EE",
      borderHover: "#FFD84D",
    },
    radii: { card: "22px", button: "9999px", pill: "9999px", image: "22px", circle: "9999px" },
    blur: { card: "", glow: "" },
    shadow: { card: "4px 4px 0 0 #FFD84D", focus: "0 0 0 3px #FFD84D" },
    typography: {
      display: "'Outfit', ui-sans-serif, system-ui",
      body: "'Outfit', ui-sans-serif, system-ui",
      eyebrow: "'Outfit', ui-sans-serif, system-ui",
    },
    focusRing: { color: "#FFD84D", width: "3px" },
    sectionColors: {
      hero: { primary: "#FF6B4A", accent: "#FFD84D" },
      about: { primary: "#7BD8C6", accent: "#FFD84D" },
      stats: { primary: "#FFD84D", accent: "#FF6B4A" },
      experience: { primary: "#7BD8C6", accent: "#FF6B4A" },
      education: { primary: "#FFD84D", accent: "#7BD8C6" },
      projects: { primary: "#FF6B4A", accent: "#FFD84D" },
      skills: { primary: "#7BD8C6", accent: "#FFD84D" },
      certifications: { primary: "#FFD84D", accent: "#FF6B4A" },
      organizations: { primary: "#7BD8C6", accent: "#FF6B4A" },
      hobbies: { primary: "#FF6B4A", accent: "#7BD8C6" },
      testimonials: { primary: "#FFD84D", accent: "#7BD8C6" },
      contact: { primary: "#FF6B4A", accent: "#FFD84D" },
    },
  },
};

export const TEMPLATE_PREVIEWS = {
  sherbet: {
    hero: { name: "[Nama Anda]", title: "Kreator Konten", tagline: "Cerita produk, dari sudut pandang saya", bio: "[Tuliskan jenis konten dan bidang yang Anda kerjakan.]" },
    stats: ["", "", ""],
  },
  interstella: {
    hero: { name: "[Nama Anda]", title: "Direktur Kreatif", tagline: "Dari gagasan menjadi kampanye", bio: "[Tuliskan pendekatan kreatif dan bidang kerja Anda.]" },
    stats: ["", "", ""],
  },
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
  decal: {
    hero: { name: "Sari W.", title: "Content Creator", tagline: "Cerita pendek yang bikin orang berhenti", bio: "Membuat konten video singkat untuk brand lokal dan komunitas kreatif." },
    stats: ["4+", "40+", "12+"],
  },
  crayon: {
    hero: { name: "Dimas R.", title: "Guru Gambar & Animator", tagline: "Warna berani untuk cerita yang ringan", bio: "Membuat ilustrasi dan animasi pendek untuk buku anak dan media belajar." },
    stats: ["6+", "35+", "14+"],
  },
  scrapbook: {
    hero: { name: "Rani A.", title: "Ilustrator & Penulis", tagline: "Catatan kecil dari meja kerja", bio: "Menggambar, menulis, dan menempel ide di kertas sebelum jadi karya digital." },
    stats: ["5+", "22+", "9+"],
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
