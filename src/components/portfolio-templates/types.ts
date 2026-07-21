export interface TestimonialItem { id: string; name: string; position: string; testimonial: string; }
export interface ExtraLink { id: string; label: string; url: string; }
export interface ProjectItem { id: string; name: string; description: string; techStack: string; link: string; imageUrl?: string; }
export interface ExperienceItem { id: string; company: string; position: string; startDate: string; endDate: string; description: string; isPresent?: boolean; imageUrl?: string; companyLogo?: string; }
export interface EducationItem { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; isPresent?: boolean; }

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
  testimonials: TestimonialItem[];
  extraLinks: ExtraLink[];
}
