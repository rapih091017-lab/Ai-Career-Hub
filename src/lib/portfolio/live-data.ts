import type {
  SectionId,
  SectionVisibility,
  ThemeId,
  PortfolioFormData,
  ProjectItem,
  ExperienceItem,
  EducationItem,
  CertificationItem,
  OrganizationItem,
  HobbyItem,
  TestimonialItem,
  ExtraLink,
  FontSize,
  TextAlignment,
} from "@/components/portfolio/types";

/** Bentuk draft visual editor yang dulu disimpan ke localStorage. Sekarang hanya
 *  dipakai sebagai kontrak tipe (uji compile-time) karena editornya sudah
 *  dipindah ke satu builder server-backed. Dua field tampilan sengaja parsial
 *  supaya lolos draftPayloadSchema: peta parsial tidak muat ke Record lengkap. */
export interface LiveData {
  formData: PortfolioFormData;
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
  organizations: OrganizationItem[];
  hobbies: HobbyItem[];
  testimonials: TestimonialItem[];
  extraLinks: ExtraLink[];
  sectionOrder: SectionId[];
  themeId: ThemeId;
  sectionVisibility: SectionVisibility;
  fontSize: FontSize;
  alignment: Partial<Record<SectionId, TextAlignment>>;
  seo?: { pageTitle?: string; metaDescription?: string; keywords?: string[] };
}
