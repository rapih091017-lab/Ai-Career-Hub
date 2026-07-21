"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import PortfolioCanvas, { SECTION_META } from "@/components/portfolio/PortfolioCanvas";
import DateField from "@/components/portfolio/DateField";
import PhotoUpload from "@/components/portfolio/PhotoUpload";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";
import { THEMES, DEFAULT_THEME_ID, DEFAULT_SECTION_ORDER } from "@/components/portfolio/themes";
import type {
  SectionId, ThemeId, PortfolioFormData,
  ProjectItem, ExperienceItem, EducationItem,
  TestimonialItem, ExtraLink, FontSize, TextAlignment,
} from "@/components/portfolio/types";

/* ─── SECTION IMPORTS ─── */
import HeroSection from "@/components/portfolio/sections/HeroSection";
import AboutSection from "@/components/portfolio/sections/AboutSection";
import StatsSection from "@/components/portfolio/sections/StatsSection";
import SkillsSection from "@/components/portfolio/sections/SkillsSection";
import ProjectsSection from "@/components/portfolio/sections/ProjectsSection";
import ExperienceSection from "@/components/portfolio/sections/ExperienceSection";
import EducationSection from "@/components/portfolio/sections/EducationSection";
import TestimonialsSection from "@/components/portfolio/sections/TestimonialsSection";
import ContactSection from "@/components/portfolio/sections/ContactSection";

/* ─── HELPERS ─── */
const genId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_FORM: PortfolioFormData = {
  heroPhotoUrl: "", heroHeadline: "", heroSubHeadline: "", heroBgUrl: "",
  heroFirstName: "", heroLastName: "", heroCreativeTitle: "", heroBio: "",
  aboutText: "", aboutYearsExp: "", aboutProjectsDone: "", aboutClientsHappy: "",
  skillsMain: "", skillsTools: "", skillsLanguages: "",
  contactEmail: "", contactPhone: "", contactLinkedin: "", contactGithub: "",
};

const DEFAULT_ALIGNMENT: Record<SectionId, TextAlignment> = {
  hero: "center", about: "left", stats: "center",
  experience: "left", education: "left", projects: "left",
  skills: "left", testimonials: "center", contact: "center",
};

type TabId = "sections" | "edit" | "design" | "ai";

const STORAGE_KEY = "portfolio_live_data";

interface LiveData {
  formData: PortfolioFormData;
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  educations: EducationItem[];
  testimonials: TestimonialItem[];
  extraLinks: ExtraLink[];
  sectionOrder: SectionId[];
  themeId: ThemeId;
  sectionVisibility: Record<SectionId, boolean>;
  fontSize: FontSize;
  alignment: Record<SectionId, TextAlignment>;
}

function loadDraft(): LiveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveDraft(data: LiveData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* quota */ }
}

/* ─── MAIN PAGE ─── */
export default function PortfolioLiveBuilder() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PortfolioFormData>(DEFAULT_FORM);
  const [projects, setProjects] = useState<ProjectItem[]>([{ id: genId(), name: "", description: "", techStack: "", link: "" }]);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [extraLinks, setExtraLinks] = useState<ExtraLink[]>([]);
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(DEFAULT_SECTION_ORDER);
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID as ThemeId);
  const [sectionVisibility, setSectionVisibility] = useState<Record<SectionId, boolean>>(
    Object.fromEntries(DEFAULT_SECTION_ORDER.map(s => [s, true])) as Record<SectionId, boolean>
  );
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [alignment, setAlignment] = useState<Record<SectionId, TextAlignment>>(DEFAULT_ALIGNMENT);
  const [selectedSection, setSelectedSection] = useState<SectionId | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("sections");
  const [showPanel, setShowPanel] = useState(true);
  const [fullscreenForm, setFullscreenForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // AI generation state
  const [aiLoading, setAiLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Load draft
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft.formData);
      setProjects(draft.projects);
      setExperiences(draft.experiences);
      setEducations(draft.educations);
      setTestimonials(draft.testimonials);
      setExtraLinks(draft.extraLinks);
      setSectionOrder(draft.sectionOrder);
      setThemeId(draft.themeId);
      if (draft.sectionVisibility) setSectionVisibility(draft.sectionVisibility);
      if (draft.fontSize) setFontSize(draft.fontSize);
      if (draft.alignment) setAlignment(draft.alignment);
    }
    setMounted(true);
  }, []);

  // Auto-save
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      saveDraft({ formData, projects, experiences, educations, testimonials, extraLinks, sectionOrder, themeId, sectionVisibility, fontSize, alignment });
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, projects, experiences, educations, testimonials, extraLinks, sectionOrder, themeId, sectionVisibility, fontSize, alignment, mounted]);

  const toggleSection = useCallback((id: SectionId) => {
    setSectionVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const updateForm = <K extends keyof PortfolioFormData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const moveSection = (index: number, dir: -1 | 1) => {
    const newOrder = [...sectionOrder];
    const target = index + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setSectionOrder(newOrder);
  };

  /* ─── AI GENERATE ─── */
  const handleAiGenerate = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/portfolio/suggest", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal generate");
      }
      const data = await res.json();
      // Map AI response to form fields
      if (data.hero) {
        setFormData(prev => ({
          ...prev,
          heroHeadline: data.hero.headline || prev.heroHeadline,
          heroSubHeadline: data.hero.subheadline || prev.heroSubHeadline,
          heroBio: data.about?.meta_description || prev.heroBio,
        }));
      }
      if (data.about) {
        const aboutText = [data.about.paragraph_1, data.about.paragraph_2, data.about.paragraph_3]
          .filter(Boolean).join("\n\n");
        if (aboutText) {
          setFormData(prev => ({ ...prev, aboutText }));
        }
      }
      if (data.experience_highlights?.length) {
        setExperiences(data.experience_highlights.map((eh: any) => ({
          id: genId(),
          company: eh.company || "",
          position: eh.role || "",
          startDate: eh.period || "",
          endDate: "",
          description: [eh.headline, eh.impact].filter(Boolean).join("\n"),
        })));
      }
      if (data.skills_display?.primary?.length) {
        setFormData(prev => ({
          ...prev,
          skillsMain: data.skills_display.primary.join(", "),
        }));
      }
      if (data.contact_cta) {
        setFormData(prev => ({
          ...prev,
          heroBio: prev.heroBio || data.contact_cta.subtext || "",
        }));
      }
      setActiveTab("edit");
      setSelectedSection("about");
    } catch (err: any) {
      setAiError(err.message || "Gagal terhubung ke AI");
    } finally {
      setAiLoading(false);
    }
  };

  /* ─── PROFILE AUTO-FILL ─── */
  const handleLoadProfile = async () => {
    setProfileLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Profil tidak ditemukan");
      }
      const profile = await res.json();
      const pi = profile.personalInfo || {};
      const wh = profile.workHistory || [];
      const edu = profile.education || [];
      const sk = profile.skills || [];

      // Personal info
      if (pi.fullName) {
        const parts = pi.fullName.split(" ");
        setFormData(prev => ({
          ...prev,
          heroFirstName: parts[0] || "",
          heroLastName: parts.slice(1).join(" ") || "",
          contactEmail: pi.email || prev.contactEmail,
          contactPhone: pi.phone || prev.contactPhone,
          contactLinkedin: pi.linkedin || prev.contactLinkedin,
          heroBio: pi.summary || prev.heroBio,
        }));
      }

      // Work history
      if (wh.length) {
        setExperiences(wh.map((w: any) => ({
          id: genId(),
          company: w.company || "",
          position: w.position || "",
          startDate: w.startDate || "",
          endDate: w.endDate || "",
          description: w.description || "",
        })));
      }

      // Education
      if (edu.length) {
        setEducations(edu.map((e: any) => ({
          id: genId(),
          institution: e.institution || "",
          degree: e.degree || "",
          field: e.field || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
        })));
      }

      // Skills
      if (sk.length) {
        setFormData(prev => ({
          ...prev,
          skillsMain: sk.map((s: any) => s.name).join(", "),
        }));
      }

      setActiveTab("edit");
      setSelectedSection("about");
    } catch (err: any) {
      setAiError(err.message || "Gagal memuat profil");
    } finally {
      setProfileLoading(false);
    }
  };

  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const themeOptions = Object.values(THEMES);

  const renderSection = (id: SectionId) => {
    switch (id) {
      case "hero": return <HeroSection data={formData} />;
      case "about": return <AboutSection data={formData} />;
      case "stats": return <StatsSection data={formData} />;
      case "experience": return <ExperienceSection items={experiences} />;
      case "education": return <EducationSection items={educations} />;
      case "projects": return <ProjectsSection items={projects} />;
      case "skills": return <SkillsSection data={formData} />;
      case "testimonials": return <TestimonialsSection items={testimonials} />;
      case "contact": return <ContactSection data={formData} extraLinks={extraLinks} />;
    }
  };

  const editSection = (sid: SectionId) => {
    setSelectedSection(selectedSection === sid ? null : sid);
    setActiveTab("edit");
  };

  /* ─── TYPOGRAPHY ─── */
  const setAlignmentFor = (sid: SectionId, align: TextAlignment) => {
    setAlignment(prev => ({ ...prev, [sid]: align }));
  };

  const switchToTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "edit" && !selectedSection) {
      setSelectedSection("hero");
    }
  };

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "sections", label: t("live.tab-section"), icon: "layers" },
    { id: "edit", label: t("live.tab-edit"), icon: "edit" },
    { id: "design", label: t("live.tab-design"), icon: "palette" },
    { id: "ai", label: t("live.tab-ai"), icon: "auto_awesome" },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex h-[calc(100vh-64px)] pt-16">
          {/* ─── SIDEBAR ─── */}
          <aside
            className={`${showPanel ? "w-96" : "w-0"} transition-all duration-300 overflow-hidden border-r relative flex flex-col`}
            style={{ borderColor: "var(--border, rgba(0,0,0,0.06))" }}
          >
            {/* ── TAB BAR ── */}
            <div className="flex border-b shrink-0" style={{ borderColor: "var(--border, rgba(0,0,0,0.06))" }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => switchToTab(tab.id)}
                  className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-w-0">
              {/* ===== SECTION TAB ===== */}
              {activeTab === "sections" && (
                <div className="space-y-4">
                  {/* Theme */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 block">{t("live.theme")}</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {themeOptions.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setThemeId(t.id as ThemeId)}
                          className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
                            themeId === t.id ? "ring-2" : "opacity-60 hover:opacity-100"
                          }`}
                          style={{
                            background: t.colors.bg,
                            color: t.colors.text,
                            ...(themeId === t.id ? { boxShadow: `0 0 0 2px ${t.colors.primary}`, outline: "none" } : {}),
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: t.colors.primary }} />
                            {t.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section List */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 block">
                      {t("live.section-order")}
                    </label>
                    <div className="space-y-1">
                      {sectionOrder.map((sid, i) => {
                        const meta = SECTION_META[sid];
                        return (
                          <div
                            key={sid}
                            className={`flex items-center gap-1.5 p-2 rounded-lg transition-all ${
                              selectedSection === sid ? "bg-primary/10" : "hover:bg-surface-container-low"
                            }`}
                          >
                            {/* Visibility toggle */}
                            <button
                              onClick={() => toggleSection(sid)}
                              className={`w-4.5 h-4.5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-all ${
                                sectionVisibility[sid]
                                  ? "bg-primary text-on-primary border-primary"
                                  : "border-outline-variant"
                              }`}
                            >
                              {sectionVisibility[sid] && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M20 6L9 17l-5-5"/>
                                </svg>
                              )}
                            </button>

                            {/* Name */}
                            <span className={`text-xs flex-1 truncate ${
                              sectionVisibility[sid] ? "text-on-surface" : "text-on-surface-variant line-through"
                            }`}>
                              <span className="mr-1">{meta?.icon}</span>
                              {meta?.label || sid}
                            </span>

                            {/* Move up */}
                            <button
                              onClick={() => moveSection(i, -1)}
                              disabled={i === 0}
                              className="p-0.5 rounded hover:bg-surface-container-low disabled:opacity-20 text-on-surface-variant"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 15l-6-6-6 6"/>
                              </svg>
                            </button>

                            {/* Move down */}
                            <button
                              onClick={() => moveSection(i, 1)}
                              disabled={i === sectionOrder.length - 1}
                              className="p-0.5 rounded hover:bg-surface-container-low disabled:opacity-20 text-on-surface-variant"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6"/>
                              </svg>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => editSection(sid)}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                selectedSection === sid
                                  ? "bg-primary text-on-primary"
                                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                              }`}
                            >
                              {t("live.edit-section")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== EDIT TAB ===== */}
              {activeTab === "edit" && (
                <div className="space-y-3">
                  {selectedSection ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Edit {SECTION_META[selectedSection]?.label}
                        </h3>
                        <button
                          onClick={() => setSelectedSection(null)}
                          className="text-xs text-on-surface-variant hover:text-on-surface"
                        >
                          {t("live.close")}
                        </button>
                      </div>
                      {renderFormFields(selectedSection, formData, updateForm, setFormData, projects, setProjects, experiences, setExperiences, educations, setEducations, testimonials, setTestimonials, extraLinks, setExtraLinks, handleAiGenerate, t)}
                    </>
                  ) : (
                    <div className="text-center py-10 text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl mb-2">touch_app</span>
                      <p className="text-sm">{t("live.select-hint")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== DESIGN TAB ===== */}
              {activeTab === "design" && (
                <div className="space-y-5">
                  {/* Font Size */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">text_fields</span>
                      {t("live.font-size")}
                    </label>
                    <div className="flex gap-2">
                      {(["small", "medium", "large"] as FontSize[]).map(size => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                            fontSize === size
                              ? "bg-primary text-on-primary"
                              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          {size === "small" ? t("live.font-small") : size === "medium" ? t("live.font-medium") : t("live.font-large")}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1.5">
                      {fontSize === "small" ? t("live.font-compact") :
                       fontSize === "medium" ? t("live.font-standard") :
                       t("live.font-bold")}
                    </p>
                  </div>

                  {/* Text Alignment per Section */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">format_align_left</span>
                      {t("live.text-align")}
                    </label>
                    <div className="space-y-1.5">
                      {sectionOrder.filter(sid => sectionVisibility[sid]).map(sid => {
                        const meta = SECTION_META[sid];
                        const currentAlign = alignment[sid] || "left";
                        return (
                          <div key={sid} className="flex items-center gap-2">
                            <span className="text-[11px] flex-1 truncate text-on-surface">{meta?.icon} {meta?.label}</span>
                            <div className="flex gap-0.5">
                              {(["left", "center", "right"] as TextAlignment[]).map(align => (
                                <button
                                  key={align}
                                  onClick={() => setAlignmentFor(sid, align)}
                                  className={`p-1 rounded text-[11px] transition-all ${
                                    currentAlign === align
                                      ? "bg-primary/15 text-primary"
                                      : "text-on-surface-variant hover:bg-surface-container-low"
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    {align === "left" ? "format_align_left" : align === "center" ? "format_align_center" : "format_align_right"}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== AI TAB ===== */}
              {activeTab === "ai" && (
                <div className="space-y-4">
                  {/* ── INFO BANNER: Profil Auto-fill ── */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    <div>
                      <p className="text-xs font-semibold text-primary mb-0.5">{t("live.profile-data")}</p>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        {t("live.profile-desc")}
                      </p>
                    </div>
                  </div>

                  {/* AI Generate */}
                  <div className="p-4 rounded-xl border" style={{ borderColor: "var(--border, rgba(0,0,0,0.06))", background: "var(--surface, rgba(0,0,0,0.02))" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <h3 className="text-sm font-semibold">{t("live.generate-ai")}</h3>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
                      {t("live.generate-desc")}
                    </p>
                    <button
                      onClick={handleAiGenerate}
                      disabled={aiLoading}
                      className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t("live.generating")}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                          {t("live.generate-btn")}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Profile Auto-fill — prominent card */}
                  <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 relative">
                    <div className="absolute -top-2.5 left-3 px-2 bg-primary/5 text-[10px] font-semibold text-primary uppercase tracking-wider">{t("live.recommendation")}</div>
                    <div className="flex items-center gap-2 mb-2 mt-1">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                      </span>
                      <h3 className="text-sm font-semibold">{t("live.fill-profile")}</h3>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
                      {t("live.fill-desc")}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleLoadProfile}
                        disabled={profileLoading}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {profileLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t("live.loading")}
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            {t("live.load-profile")}
                          </>
                        )}
                      </button>
                      <a
                        href="/profile"
                        className="px-3 py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all whitespace-nowrap"
                      >
                        {t("live.edit-profile")}
                      </a>
                    </div>
                  </div>

                  {/* Error */}
                  {aiError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-red-500 shrink-0">error</span>
                      {aiError}
                    </div>
                  )}

                  {/* Export */}
                  <div className="pt-2 border-t" style={{ borderColor: "var(--border, rgba(0,0,0,0.06))" }}>
                    <button
                      onClick={() => {
                        const previewData = { formData, projects, experiences, educations, testimonials, extraLinks };
                        localStorage.setItem("portfolio_draft", JSON.stringify(previewData));
                        window.open(`/portfolio/preview?template=${themeId}`, "_blank");
                      }}
                      className="w-full py-3 rounded-xl bg-surface-container-high text-on-surface font-semibold text-xs hover:bg-surface-container-higher transition-all flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                      {t("live.export-preview")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Collapse button */}
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-2 right-2 p-1 rounded hover:bg-surface-container-low z-10"
              aria-label="Tutup panel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          </aside>

          {/* ─── FULLSCREEN TOGGLE ─── */}
          <button
            onClick={() => setFullscreenForm(!fullscreenForm)}
            className={`fixed z-30 p-2 rounded-lg bg-surface shadow-md border hover:bg-surface-container-low transition-all ${
              showPanel ? "right-4" : "hidden"
            }`}
            style={{ top: "80px" }}
            aria-label={fullscreenForm ? "Tampilkan preview" : "Fullscreen form"}
            title={fullscreenForm ? "Tampilkan preview" : "Perbesar form"}
          >
            {fullscreenForm ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
              </svg>
            )}
          </button>

          {/* ─── TOGGLE ─── */}
          {!showPanel && (
            <button
              onClick={() => setShowPanel(true)}
              className="fixed left-4 top-20 z-30 p-2 rounded-lg bg-surface shadow-md border hover:bg-surface-container-low transition-all"
              aria-label="Buka panel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          )}

          {/* ─── PREVIEW AREA ─── */}
          <main className={`flex-1 overflow-y-auto relative ${fullscreenForm ? "hidden" : ""}`}>
            <PortfolioCanvas
              themeId={themeId}
              sectionOrder={sectionOrder}
              onSectionOrderChange={setSectionOrder}
              sectionVisibility={sectionVisibility}
              onToggleSection={toggleSection}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              fontSize={fontSize}
            >
              {sectionOrder.map(sid => (
                <div key={sid} data-section-id={sid} style={{ textAlign: alignment[sid] || "left" }}>
                  {renderSection(sid)}
                </div>
              ))}
            </PortfolioCanvas>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

/* ─── FORM FIELDS ─── */

function renderFormFields(
  section: SectionId,
  formData: PortfolioFormData,
  update: (key: keyof PortfolioFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  setFormData: (d: PortfolioFormData | ((prev: PortfolioFormData) => PortfolioFormData)) => void,
  projects: ProjectItem[], setProjects: (p: ProjectItem[]) => void,
  experiences: ExperienceItem[], setExperiences: (e: ExperienceItem[]) => void,
  educations: EducationItem[], setEducations: (e: EducationItem[]) => void,
  testimonials: TestimonialItem[], setTestimonials: (t: TestimonialItem[]) => void,
  extraLinks: ExtraLink[], setExtraLinks: (e: ExtraLink[]) => void,
  handleAiGenerate?: () => void,
  t?: (key: string) => string,
) {
  const L = t || ((k: string) => k);
  const _id = () => Math.random().toString(36).slice(2, 9);
  const inputClass = "w-full px-3 py-2 rounded-lg border text-sm bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all";
  const labelClass = "block text-[11px] font-medium text-on-surface-variant mb-1";

  switch (section) {
    case "hero":
      return (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelClass}>{L("live.form.first-name")}</label><input className={inputClass} value={formData.heroFirstName} onChange={update("heroFirstName")} placeholder="Teguh" /></div>
            <div><label className={labelClass}>{L("live.form.last-name")}</label><input className={inputClass} value={formData.heroLastName} onChange={update("heroLastName")} placeholder="Surya" /></div>
          </div>
          <div><label className={labelClass}>{L("live.form.job-title")}</label><input className={inputClass} value={formData.heroHeadline} onChange={update("heroHeadline")} placeholder="Frontend Web Developer" /></div>
          <div><label className={labelClass}>{L("live.form.sub-headline")}</label><input className={inputClass} value={formData.heroSubHeadline} onChange={update("heroSubHeadline")} placeholder="Membangun web modern dengan performa tinggi" /></div>          <div>
            <label className={labelClass}>{L("live.form.bio")}</label>
            <div className="relative">
              <textarea className={inputClass} rows={3} value={formData.heroBio} onChange={update("heroBio")} placeholder="Ceritakan sedikit tentang dirimu..." />
              <div className="absolute bottom-2 right-2">
                <AIPolishButton content={formData.heroBio} onApply={(v) => setFormData(prev => ({ ...prev, heroBio: v }))} field="bio hero" size="sm" />
              </div>
            </div></div>
          <PhotoUpload value={formData.heroPhotoUrl} onChange={(url) => setFormData(prev => ({ ...prev, heroPhotoUrl: url }))} label={L("live.form.photo")} />
        </div>
      );

    case "about":
      return (
        <div className="space-y-2.5">          <div><label className={labelClass}>{L("live.form.about")}</label>
            <div className="relative">
              <textarea className={inputClass} rows={5} value={formData.aboutText} onChange={update("aboutText")} placeholder="Cerita perjalanan karirmu..." />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <AIPolishButton content={formData.aboutText} onApply={(v) => setFormData(prev => ({ ...prev, aboutText: v }))} field="tentang saya" size="sm" />
                {handleAiGenerate && (
                  <button onClick={() => handleAiGenerate()}
                    className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-all flex items-center gap-1"
                    title="Generate teks dengan AI"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"/>
                    </svg>
                    AI
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={labelClass}>{L("live.form.years-exp")}</label><input className={inputClass} value={formData.aboutYearsExp} onChange={update("aboutYearsExp")} placeholder="3+" /></div>
            <div><label className={labelClass}>{L("live.form.project")}</label><input className={inputClass} value={formData.aboutProjectsDone} onChange={update("aboutProjectsDone")} placeholder="20+" /></div>
            <div><label className={labelClass}>{L("live.form.clients")}</label><input className={inputClass} value={formData.aboutClientsHappy} onChange={update("aboutClientsHappy")} placeholder="15+" /></div>
          </div>
        </div>
      );

    case "skills":
      return (
        <div className="space-y-2.5">
          <div><label className={labelClass}>{L("live.form.main-skills")} <span className="text-on-surface-variant">{L("live.form.separate-comma")}</span></label>
            <textarea className={inputClass} rows={2} value={formData.skillsMain} onChange={update("skillsMain")} placeholder="React, TypeScript, Node.js" /></div>
          <div><label className={labelClass}>{L("live.form.tools")}</label>
            <input className={inputClass} value={formData.skillsTools} onChange={update("skillsTools")} placeholder="Figma, VS Code, Git" /></div>
          <div><label className={labelClass}>{L("live.form.languages")}</label>
            <input className={inputClass} value={formData.skillsLanguages} onChange={update("skillsLanguages")} placeholder="Indonesia (Native), Inggris" /></div>
        </div>
      );

    case "contact":
      return (
        <div className="space-y-2.5">
          <div><label className={labelClass}>{L("live.form.email")}</label><input className={inputClass} type="email" value={formData.contactEmail} onChange={update("contactEmail")} placeholder="email@contoh.com" /></div>
          <div><label className={labelClass}>{L("live.form.phone")}</label><input className={inputClass} type="tel" value={formData.contactPhone} onChange={update("contactPhone")} placeholder="+62 812..." /></div>
          <div><label className={labelClass}>{L("live.form.linkedin")}</label><input className={inputClass} value={formData.contactLinkedin} onChange={update("contactLinkedin")} placeholder="linkedin.com/in/..." /></div>
          <div><label className={labelClass}>{L("live.form.github")}</label><input className={inputClass} value={formData.contactGithub} onChange={update("contactGithub")} placeholder="github.com/..." /></div>
          {extraLinks.map((link, i) => (
            <div key={link.id} className="flex gap-1.5">
              <input className={inputClass + " flex-1"} placeholder="Label" value={link.label} onChange={e => setExtraLinks(extraLinks.map(x => x.id === link.id ? { ...x, label: e.target.value } : x))} />
              <input className={inputClass + " flex-[2]"} placeholder="URL" value={link.url} onChange={e => setExtraLinks(extraLinks.map(x => x.id === link.id ? { ...x, url: e.target.value } : x))} />
            </div>
          ))}
          <button onClick={() => setExtraLinks([...extraLinks, { id: _id(), label: "", url: "" }])}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span> {L("live.form.add-link")}
          </button>
        </div>
      );

    case "projects":
      return (
        <div className="space-y-3">
          {projects.map((p, i) => (
            <div key={p.id} className="p-3 rounded-lg border text-sm">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-xs">Project {i + 1}</span>
                <button className="text-red-500 text-[10px]" onClick={() => setProjects(projects.filter(x => x.id !== p.id))}>{L("live.form.delete")}</button>
              </div>
              <div className="space-y-1.5">
                <input className={inputClass} placeholder={L("live.form.project-name")} value={p.name} onChange={e => setProjects(projects.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} />
                <input className={inputClass} placeholder={L("live.form.description")} value={p.description} onChange={e => setProjects(projects.map(x => x.id === p.id ? { ...x, description: e.target.value } : x))} />
                <input className={inputClass} placeholder={L("live.form.tech-stack")} value={p.techStack} onChange={e => setProjects(projects.map(x => x.id === p.id ? { ...x, techStack: e.target.value } : x))} />
                <input className={inputClass} placeholder={L("live.form.link-optional")} value={p.link} onChange={e => setProjects(projects.map(x => x.id === p.id ? { ...x, link: e.target.value } : x))} />
                <div>
                  <label className={labelClass}>{L("live.form.screenshot-url")} ({L("live.form.optional")})</label>
                  <input className={inputClass} type="url" placeholder="https://...screenshot.png" value={p.imageUrl || ""} onChange={e => setProjects(projects.map(x => x.id === p.id ? { ...x, imageUrl: e.target.value } : x))} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setProjects([...projects, { id: _id(), name: "", description: "", techStack: "", link: "" }])}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span> {L("live.form.add-project")}
          </button>
        </div>
      );

    case "experience":
      return (
        <div className="space-y-3">
          {experiences.map((e, i) => (
            <div key={e.id} className="p-3 rounded-lg border text-sm">
              <div className="flex justify-between mb-2"><span className="font-medium text-xs">{L("live.form.experience")} {i + 1}</span>
                <button className="text-red-500 text-[10px]" onClick={() => setExperiences(experiences.filter(x => x.id !== e.id))}>{L("live.form.delete")}</button>
              </div>
              <div className="space-y-1.5">
                <input className={inputClass} placeholder={L("live.form.company")} value={e.company} onChange={ev => setExperiences(experiences.map(x => x.id === e.id ? { ...x, company: ev.target.value } : x))} />
                <input className={inputClass} placeholder={L("live.form.position")} value={e.position} onChange={ev => setExperiences(experiences.map(x => x.id === e.id ? { ...x, position: ev.target.value } : x))} />
                <div className="flex gap-1.5">
                  <DateField
                    label={L("live.form.start-date")}
                    value={e.startDate}
                    onChange={v => setExperiences(experiences.map(x => x.id === e.id ? { ...x, startDate: v } : x))}
                  />
                  <DateField
                    label={L("live.form.end-date")}
                    value={e.endDate}
                    onChange={v => setExperiences(experiences.map(x => x.id === e.id ? { ...x, endDate: v } : x))}
                    showPresent={true}
                    isPresent={!!e.isPresent}
                    onPresentChange={p => setExperiences(experiences.map(x => x.id === e.id ? { ...x, isPresent: p, endDate: p ? "" : x.endDate } : x))}
                  />
                </div>
                <textarea className={inputClass} rows={2} placeholder={L("live.form.description")} value={e.description} onChange={ev => setExperiences(experiences.map(x => x.id === e.id ? { ...x, description: ev.target.value } : x))} />
                <div>
                  <label className={labelClass}>{L("live.form.image-url")} ({L("live.form.optional")})</label>
                  <input className={inputClass} type="url" placeholder="https://..." value={e.imageUrl || ""} onChange={ev => setExperiences(experiences.map(x => x.id === e.id ? { ...x, imageUrl: ev.target.value } : x))} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setExperiences([...experiences, { id: _id(), company: "", position: "", startDate: "", endDate: "", description: "" }])}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span> {L("live.form.add-experience")}
          </button>
        </div>
      );

    case "education":
      return (
        <div className="space-y-3">
          {educations.map((e, i) => (
            <div key={e.id} className="p-3 rounded-lg border text-sm">
              <div className="flex justify-between mb-2"><span className="font-medium text-xs">{L("live.form.education")} {i + 1}</span>
                <button className="text-red-500 text-[10px]" onClick={() => setEducations(educations.filter(x => x.id !== e.id))}>{L("live.form.delete")}</button>
              </div>
              <div className="space-y-1.5">
                <input className={inputClass} placeholder={L("live.form.institution")} value={e.institution} onChange={ev => setEducations(educations.map(x => x.id === e.id ? { ...x, institution: ev.target.value } : x))} />
                <input className={inputClass} placeholder={L("live.form.degree")} value={e.degree} onChange={ev => setEducations(educations.map(x => x.id === e.id ? { ...x, degree: ev.target.value } : x))} />
                <input className={inputClass} placeholder={L("live.form.field")} value={e.field} onChange={ev => setEducations(educations.map(x => x.id === e.id ? { ...x, field: ev.target.value } : x))} />
                <div className="flex gap-1.5">
                  <DateField
                    label={L("live.form.start-date")}
                    value={e.startDate}
                    onChange={v => setEducations(educations.map(x => x.id === e.id ? { ...x, startDate: v } : x))}
                  />
                  <DateField
                    label={L("live.form.end-date")}
                    value={e.endDate}
                    onChange={v => setEducations(educations.map(x => x.id === e.id ? { ...x, endDate: v } : x))}
                    showPresent={true}
                    isPresent={!!e.isPresent}
                    onPresentChange={p => setEducations(educations.map(x => x.id === e.id ? { ...x, isPresent: p, endDate: p ? "" : x.endDate } : x))}
                  />
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setEducations([...educations, { id: _id(), institution: "", degree: "", field: "", startDate: "", endDate: "" }])}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span> {L("live.form.add-education")}
          </button>
        </div>
      );

    case "testimonials":
      return (
        <div className="space-y-3">
          {testimonials.map((t, i) => (
            <div key={t.id} className="p-3 rounded-lg border text-sm">
              <div className="flex justify-between mb-2"><span className="font-medium text-xs">{L("live.form.testimonial")} {i + 1}</span>
                <button className="text-red-500 text-[10px]" onClick={() => setTestimonials(testimonials.filter(x => x.id !== t.id))}>{L("live.form.delete")}</button>
              </div>
              <div className="space-y-1.5">
                <input className={inputClass} placeholder={L("live.form.testimonial")} value={t.name} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} />
                <input className={inputClass} placeholder={L("live.form.position")} value={t.position} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, position: e.target.value } : x))} />
                <textarea className={inputClass} rows={2} placeholder={L("live.form.testimonial")} value={t.testimonial} onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, testimonial: e.target.value } : x))} />
              </div>
            </div>
          ))}
          <button onClick={() => setTestimonials([...testimonials, { id: _id(), name: "", position: "", testimonial: "" }])}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span> {L("live.form.add-testimonial")}
          </button>
        </div>
      );

    case "stats":
      return (
        <div className="p-4 rounded-lg bg-surface-container-low text-sm text-on-surface-variant">
          <p className="font-medium text-on-surface mb-1">{L("live.form.stats")}</p>
          <p>{L("live.form.stats-desc")}</p>
        </div>
      );

    default:
      return <p className="text-sm text-on-surface-variant">{L("live.select-hint")}</p>;
  }
}
