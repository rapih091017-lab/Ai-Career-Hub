import type { PortfolioData } from "@/components/portfolio-templates/types";

/** Langkah input portofolio. Urutan di sini = urutan stepper. */
export const PORTFOLIO_STEP_IDS = ["hero", "about", "projects", "experience", "testimonials", "contact", "appearance"] as const;
export type PortfolioStepId = (typeof PORTFOLIO_STEP_IDS)[number];

/** Kunci i18n judul/deskripsi + ikon tiap langkah. */
export const PORTFOLIO_STEP_META: Record<PortfolioStepId, { title: string; desc: string; icon: string }> = {
  hero: { title: "build.step.hero", desc: "build.step.hero-desc", icon: "badge" },
  about: { title: "build.step.about", desc: "build.step.about-desc", icon: "person" },
  projects: { title: "build.step.projects", desc: "build.step.projects-desc", icon: "folder" },
  experience: { title: "build.step.experience", desc: "build.step.experience-desc", icon: "work" },
  testimonials: { title: "build.step.testimonials", desc: "build.step.testimonials-desc", icon: "format_quote" },
  contact: { title: "build.step.contact", desc: "build.step.contact-desc", icon: "contact_support" },
  appearance: { title: "build.step.appearance", desc: "build.step.appearance-desc", icon: "tune" },
};

const has = (v: string | undefined | null) => !!v && v.trim().length > 0;

/**
 * Status kelengkapan per langkah, dihitung dari data draft (bukan dari
 * komponen yang sedang tampil), jadi tetap benar untuk langkah tersembunyi.
 */
export function portfolioStepCompletion(p: PortfolioData): boolean[] {
  const f = p.formData;
  const done: Record<PortfolioStepId, boolean> = {
    hero: has(f.heroFirstName) && has(f.heroHeadline),
    about: has(f.aboutText) && has(f.skillsMain),
    projects: p.projects.some((x) => has(x.name) && has(x.description)),
    experience:
      p.experiences.some((x) => has(x.company) && has(x.position)) ||
      p.educations.some((x) => has(x.institution) && has(x.degree)),
    testimonials: p.testimonials.some((x) => has(x.name) && has(x.testimonial)),
    contact: has(f.contactEmail) || has(f.contactPhone),
    // Tampilan selalu punya nilai bawaan yang sah.
    appearance: true,
  };
  return PORTFOLIO_STEP_IDS.map((id) => done[id]);
}

/** Fokus sedang di kolom isian: Ctrl+panah milik navigasi teks, bukan pindah langkah. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable === true;
}
