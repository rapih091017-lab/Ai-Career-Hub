"use client";

import React from "react";
import { THEMES, DEFAULT_THEME_ID, DEFAULT_SECTION_ORDER } from "./themes";
import { ThemeContext } from "./PortfolioCanvas";
import type { SectionId, ThemeDefinition, PortfolioData } from "./types";

import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";
import StatsSection from "./sections/StatsSection";
import SkillsSection from "./sections/SkillsSection";
import ProjectsSection from "./sections/ProjectsSection";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import CertificationsSection from "./sections/CertificationsSection";
import OrganizationsSection from "./sections/OrganizationsSection";
import HobbiesSection from "./sections/HobbiesSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import ContactSection from "./sections/ContactSection";

interface PublishedPortfolioProps {
  data: PortfolioData;
  themeId: string;
  sectionOrder?: SectionId[];
  sectionVisibility?: Record<SectionId, boolean>;
  showFooter?: boolean;
}

/** Render portfolio publik — persis seperti preview (WYSIWYG), tanpa chrome app. */
export default function PublishedPortfolio({
  data,
  themeId,
  sectionOrder,
  sectionVisibility,
  showFooter = true,
}: PublishedPortfolioProps) {
  const theme: ThemeDefinition = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const { formData: f, projects, experiences, educations, certifications, organizations, hobbies, testimonials, extraLinks } = data;

  const order = sectionOrder && sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;
  const isVisible = (id: SectionId) => !sectionVisibility || sectionVisibility[id] !== false;

  const name = [f.heroFirstName, f.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap";

  const renderSection = (id: SectionId) => {
    switch (id) {
      case "hero": return <HeroSection data={f} />;
      case "about": return <AboutSection data={f} />;
      case "stats": return <StatsSection data={f} />;
      case "experience": return <ExperienceSection items={experiences} />;
      case "education": return <EducationSection items={educations} />;
      case "projects": return <ProjectsSection items={projects} />;
      case "skills": return <SkillsSection data={f} />;
      case "certifications": return <CertificationsSection items={certifications || []} />;
      case "organizations": return <OrganizationsSection items={organizations || []} />;
      case "hobbies": return <HobbiesSection items={hobbies || []} />;
      case "testimonials": return <TestimonialsSection items={testimonials} />;
      case "contact": return <ContactSection data={f} extraLinks={extraLinks} />;
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className="min-h-screen"
        style={{
          backgroundColor: theme.colors.bg,
          color: theme.colors.text,
          fontFamily: theme.font.includes(" ") ? `'${theme.font}', sans-serif` : `${theme.font}, sans-serif`,
        }}
      >
        {order.filter(isVisible).map((id) => (
          <React.Fragment key={id}>{renderSection(id)}</React.Fragment>
        ))}
        {showFooter && (
          <footer
            className="text-center py-8"
            style={{ color: theme.colors.textMuted, borderTop: `1px solid ${theme.colors.border}`, fontSize: 13 }}
          >
            &copy; {new Date().getFullYear()} {name}. Dibuat dengan AI Career Hub
          </footer>
        )}
      </div>
    </ThemeContext.Provider>
  );
}
