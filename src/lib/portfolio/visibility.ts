import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ExtraLink,
  HobbyItem,
  OrganizationItem,
  PortfolioFormData,
  ProjectItem,
  TestimonialItem,
} from "@/components/portfolio-templates/types";

/**
 * Satu sumber aturan "entri ini tampil di portofolio?". Renderer section dan
 * editor sama-sama memakai predikat di sini, jadi catatan di editor tidak bisa
 * berbeda pendapat dengan preview. Sengaja memakai truthiness (bukan trim)
 * agar perilaku render lama tidak berubah.
 */
export const isProjectShown = (p: ProjectItem) => !!p.name;
export const isExperienceShown = (e: ExperienceItem) => !!(e.company || e.position);
export const isEducationShown = (e: EducationItem) => !!(e.institution || e.degree);
export const isCertificationShown = (c: CertificationItem) => !!c.name;
export const isOrganizationShown = (o: OrganizationItem) => !!o.name;
export const isHobbyShown = (h: HobbyItem) => !!h.name;
export const isTestimonialShown = (t: TestimonialItem) => !!(t.name || t.testimonial);
export const isExtraLinkShown = (l: ExtraLink) => !!l.url;
export const isAboutShown = (f: PortfolioFormData) => !!f.aboutText;

/** Statistik Tentang terisi tapi teksnya kosong: angka itu tidak akan tampil. */
export const aboutStatsHidden = (f: PortfolioFormData) =>
  !f.aboutText && !!(f.aboutYearsExp || f.aboutProjectsDone || f.aboutClientsHappy);

export type HiddenEntryKind =
  | "project"
  | "experience"
  | "education"
  | "certification"
  | "organization"
  | "hobby"
  | "testimonial";

/** Nama field (label UI) yang perlu diisi agar entri tampil. */
const NEEDED: Record<HiddenEntryKind, string> = {
  project: "Nama proyek",
  experience: "Perusahaan atau Posisi",
  education: "Institusi atau Gelar",
  certification: "Nama sertifikat",
  organization: "Nama organisasi",
  hobby: "Nama hobi",
  testimonial: "Nama atau isi testimoni",
};

/** Kalimat catatan untuk kartu entri yang belum tampil. */
export const hiddenEntryNote = (kind: HiddenEntryKind) =>
  `Belum tampil di portofolio: isi ${NEEDED[kind]}.`;

