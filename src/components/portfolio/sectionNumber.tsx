"use client";

import { createContext, useContext } from "react";
import {
  isAboutShown,
  isCertificationShown,
  isEducationShown,
  isExperienceShown,
  isExtraLinkShown,
  isHobbyShown,
  isOrganizationShown,
  isProjectShown,
  isTestimonialShown,
} from "@/lib/portfolio/visibility";
import type { PortfolioData, SectionId } from "./types";

/** Nomor urut section yang sedang dirender (1, 2, ...), null bila tidak dinomori. */
export const SectionNumberContext = createContext<number | null>(null);

export function useSectionNumber(): number | null {
  return useContext(SectionNumberContext);
}

/** Label bernomor "01 / Tentang"; tanpa nomor bila section tidak dinomori. */
export function numberedLabel(n: number | null, label: string): string {
  return n ? `${String(n).padStart(2, "0")} / ${label}` : label;
}

/** Apakah section punya isi yang akan dirender. Hero dan Statistik tidak dinomori. */
export function sectionHasContent(id: SectionId, d: PortfolioData): boolean {
  const f = d.formData;
  switch (id) {
    case "about": return isAboutShown(f);
    case "experience": return d.experiences.some(isExperienceShown);
    case "education": return d.educations.some(isEducationShown);
    case "projects": return d.projects.some(isProjectShown);
    case "skills": return Boolean(f.skillsMain || f.skillsTools || f.skillsLanguages);
    case "certifications": return d.certifications.some(isCertificationShown);
    case "organizations": return d.organizations.some(isOrganizationShown);
    case "hobbies": return d.hobbies.some(isHobbyShown);
    case "testimonials": return d.testimonials.some(isTestimonialShown);
    case "contact": return Boolean(f.contactEmail || f.contactPhone || f.contactLinkedin || f.contactGithub || d.extraLinks.some(isExtraLinkShown));
    default: return false;
  }
}

/** Section yang tampil dan berisi di dokumen ini; null bila tidak diketahui (dipakai navigasi hero). */
export const ShownSectionsContext = createContext<ReadonlySet<SectionId> | null>(null);

export function useShownSections(): ReadonlySet<SectionId> | null {
  return useContext(ShownSectionsContext);
}
