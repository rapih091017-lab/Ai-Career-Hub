export interface TestimonialItem { id: string; name: string; position: string; testimonial: string; }
export interface ExtraLink { id: string; label: string; url: string; }
export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  techStack: string;
  link: string;
  imageUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  role?: string;
  featured?: boolean;
}
export interface ExperienceItem { id: string; company: string; position: string; startDate: string; endDate: string; description: string; isPresent?: boolean; imageUrl?: string; companyLogo?: string; }
export interface EducationItem { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; isPresent?: boolean; }
export interface CertificationItem { id: string; name: string; issuer: string; year: string; url?: string; }
export interface OrganizationItem { id: string; name: string; role: string; period: string; description: string; }
export interface HobbyItem { id: string; name: string; description: string; }

export interface PortfolioFormData {
  heroPhotoUrl: string;
  heroHeadline: string;
  heroSubHeadline: string;
  heroBgUrl: string;
  heroFirstName: string;
  heroLastName: string;
  heroCreativeTitle: string;
  heroBio: string;
  aboutText: string;
  aboutYearsExp: string;
  aboutProjectsDone: string;
  aboutClientsHappy: string;
  skillsMain: string;
  skillsTools: string;
  skillsLanguages: string;
  contactEmail: string;
  contactPhone: string;
  contactLinkedin: string;
  contactGithub: string;
}

export interface PortfolioData {
  formData: PortfolioFormData;
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
  organizations: OrganizationItem[];
  hobbies: HobbyItem[];
  testimonials: TestimonialItem[];
  extraLinks: ExtraLink[];
  sectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;
  /** Tipografi draft; union inline supaya tidak membuat siklus impor dengan components/portfolio/types. */
  fontSize?: "small" | "medium" | "large";
  /** Perataan teks per section; union inline supaya tidak membuat siklus impor. */
  alignment?: Record<string, "left" | "center" | "right">;
  /** Blok SEO dari saran AI; inline supaya tidak membuat siklus impor. */
  seo?: { pageTitle?: string; metaDescription?: string; keywords?: string[] };
}
