export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  defaultFont: string;
  primaryColor: string;
  /** ATS-optimized flag */
  atsOptimized: boolean;
  /** Best for (industry/role recommendation) */
  bestFor: string;
  /** Layout type: single-column always for ATS */
  layout: "single-column";
  /** Section header style */
  sectionStyle: "underline" | "bordered" | "minimal";
}

export const CV_TEMPLATES: CVTemplate[] = [
  {
    id: "industrial-pro",
    name: "Industrial Pro",
    description: "Calibri klasik, monokrom bersih, header full nama + kontak. Optimal untuk fresh graduate & profesional berpengalaman.",
    thumbnail: "/templates/industrial-pro.png",
    defaultFont: "Calibri",
    primaryColor: "#111111",
    atsOptimized: true,
    bestFor: "Engineering, Manufaktur, Fresh Graduate · Layout padat informasi nan bersih",
    layout: "single-column",
    sectionStyle: "underline",
  },
  {
    id: "clean-slate",
    name: "Clean Slate",
    description: "Inter font, charcoal gray, bordered sections. Modern minimalist yang tetap ATS-friendly.",
    thumbnail: "/templates/clean-slate.png",
    defaultFont: "Inter",
    primaryColor: "#334155",
    atsOptimized: true,
    bestFor: "Tech, Startup, Product · Bersih & modern tanpa gimmick",
    layout: "single-column",
    sectionStyle: "bordered",
  },
  {
    id: "executive-serif",
    name: "Executive Serif",
    description: "Georgia serif, dark navy, elegan formal. Untuk posisi senior & manajerial.",
    thumbnail: "/templates/executive-serif.png",
    defaultFont: "Georgia",
    primaryColor: "#1e3a5f",
    atsOptimized: true,
    bestFor: "Management, Finance, Legal · Formal & berwibawa",
    layout: "single-column",
    sectionStyle: "underline",
  },
  {
    id: "fresh-graduate",
    name: "Fresh Graduate",
    description: "Open Sans, teal accent, menonjolkan pendidikan & skill. Dirancang khusus untuk lulusan baru.",
    thumbnail: "/templates/fresh-graduate.png",
    defaultFont: "Open Sans",
    primaryColor: "#0d9488",
    atsOptimized: true,
    bestFor: "Fresh Graduate, Magang · Highlight pendidikan & skill ketimbang pengalaman",
    layout: "single-column",
    sectionStyle: "minimal",
  },
  {
    id: "compact-pro",
    name: "Compact Pro",
    description: "System fonts, layout padat, maksimalkan ruang. Untuk profesional berpengalaman dengan banyak konten.",
    thumbnail: "/templates/compact-pro.png",
    defaultFont: "system-ui",
    primaryColor: "#1f2937",
    atsOptimized: true,
    bestFor: "Senior, Multi-industry · Muat lebih banyak informasi dalam 1 halaman",
    layout: "single-column",
    sectionStyle: "bordered",
  },
];

export const DEFAULT_TEMPLATE_ID = "industrial-pro";
