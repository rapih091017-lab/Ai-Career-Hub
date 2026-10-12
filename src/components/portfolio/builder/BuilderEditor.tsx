"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Modal from "@/components/Modal";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import PortfolioPhotoUpload from "@/components/portfolio/render/PortfolioPhotoUpload";
import { applyAiSuggestion, listFormSuggestions, mergeExperiences, type AiChange } from "@/lib/portfolio/ai-map";
import { useUndoStack } from "@/lib/portfolio/useUndoStack";
import type { UsePortfolioDraftResult } from "@/lib/portfolio/usePortfolioDraft";
import { portfolioDataSchema, type ValidatedPortfolioData } from "@/lib/portfolio/schema";
import type { PortfolioData } from "@/components/portfolio-templates/types";
import { DEFAULT_SECTION_ORDER } from "@/components/portfolio/themes";
import { FONT_SIZES, SECTION_IDS, type FontSize, type SectionId, type TextAlignment } from "@/components/portfolio/types";
import { isSectionVisible } from "@/components/portfolio/sectionVisibility";

type AccordionKey = "hero" | "about" | "projects" | "skills" | "experience" | "education" | "certifications" | "organizations" | "hobbies" | "testimonials" | "contact";

/** Nama section untuk panel tampilan, lewat i18n supaya ikut bahasa pengguna. */
const SECTION_NAME_KEYS: Record<SectionId, string> = {
  hero: "build.hero-title",
  about: "build.about",
  stats: "build.stats",
  experience: "build.experience",
  education: "build.education",
  projects: "build.project",
  skills: "build.skill",
  certifications: "build.certifications",
  organizations: "build.organizations",
  hobbies: "build.hobbies",
  testimonials: "build.testimonial",
  contact: "build.contact",
};

const ALIGNMENT_OPTIONS: { value: TextAlignment; key: string }[] = [
  { value: "left", key: "live.align-left" },
  { value: "center", key: "live.align-center" },
  { value: "right", key: "live.align-right" },
];



/* ───────── profile data types ───────── */

interface ProfilePersonalInfo {
  fullName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  linkedin: string | null;
  summary: string | null;
}

interface ProfileWorkEntry {
  id: string;
  company: string;
  position: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

interface ProfileEducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface ProfileSkill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
}

interface MasterProfile {
  personalInfo: ProfilePersonalInfo | null;
  workHistory: ProfileWorkEntry[] | null;
  education: ProfileEducationEntry[] | null;
  skills: ProfileSkill[] | null;
}

interface ProjectItem { id: string; name: string; description: string; techStack: string; link: string; }
interface ExperienceItem { id: string; company: string; position: string; startDate: string; endDate: string; description: string; }
interface EducationItem { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; }
interface TestimonialItem { id: string; name: string; position: string; testimonial: string; }
interface ExtraLink { id: string; label: string; url: string; }
interface CertificationItem { id: string; name: string; issuer: string; year: string; url?: string; }
interface OrganizationItem { id: string; name: string; role: string; period: string; description: string; }
interface HobbyItem { id: string; name: string; description: string; }

interface PortfolioFormData {
  heroPhotoUrl: string;
  heroHeadline: string;
  heroSubHeadline: string;
  heroFirstName: string;
  heroLastName: string;
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

const DEFAULT_FORM: PortfolioFormData = {
  heroPhotoUrl: "",
  heroHeadline: "",
  heroSubHeadline: "",
  heroFirstName: "",
  heroLastName: "",
  heroBio: "",
  aboutText: "",
  aboutYearsExp: "",
  aboutProjectsDone: "",
  aboutClientsHappy: "",
  skillsMain: "",
  skillsTools: "",
  skillsLanguages: "",
  contactEmail: "",
  contactPhone: "",
  contactLinkedin: "",
  contactGithub: "",
};

const genId = () => Math.random().toString(36).slice(2, 9);

const SAVE_FAILED_MESSAGE = "Gagal menyimpan data. Silakan coba lagi.";

/* ── Validation helpers ── */
const validateEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validateUrl = (v: string) => !v || /^https?:\/\/.+/.test(v);
const validatePhone = (v: string) => !v || /^[+]?[\d\s\-()]{7,20}$/.test(v);

/* ── Char Counter component ── */
function CharCounter({ value, max, warnAt }: { value: string; max: number; warnAt?: number }) {
  const len = value.length;
  const threshold = warnAt ?? Math.round(max * 0.9);
  if (len === 0) return null;
  const isWarning = len >= threshold && len < max;
  const isOver = len > max;
  return (
    <span className={`text-xs mt-0.5 block text-right font-medium ${isOver ? "text-error" : isWarning ? "text-amber-600" : "text-outline"}`}>
      {len}/{max}
    </span>
  );
}

/* ── Validated Input wrapper ── */
function ValidatedField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</label>
      {children}
      {error && (
        <span className="text-xs text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </span>
      )}
    </div>
  );
}

/** Petakan draft server (sudah divalidasi schema) ke tipe editor. */
function seedFrom(data: ValidatedPortfolioData): PortfolioData {
  return {
    formData: data.formData,
    projects: data.projects ?? [],
    experiences: data.experiences ?? [],
    educations: data.educations ?? [],
    certifications: data.certifications ?? [],
    organizations: data.organizations ?? [],
    hobbies: data.hobbies ?? [],
    testimonials: data.testimonials ?? [],
    extraLinks: data.extraLinks ?? [],
    sectionOrder: data.sectionOrder,
    sectionVisibility: data.sectionVisibility as PortfolioData["sectionVisibility"],
    fontSize: data.fontSize,
    alignment: data.alignment,
    seo: data.seo,
  };
}

/** Draft benar-benar masih kosong (belum diisi konten bermakna). */
function isDraftEmpty(p: PortfolioData): boolean {
  const f = p.formData;
  return (
    !f.heroFirstName &&
    !f.heroHeadline &&
    !f.aboutText &&
    p.projects.every((x) => !x.name) &&
    p.experiences.every((x) => !x.company) &&
    p.educations.every((x) => !x.institution)
  );
}

export default function BuilderEditor({ draft }: { draft: UsePortfolioDraftResult }) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AccordionKey | "">("hero");

  const { setData: draftSetData } = draft;
  const seed = useMemo(() => seedFrom(draft.data!), [draft.data]);
  const { state: portfolio, set: setPortfolio, undo, redo, canUndo, canRedo } = useUndoStack<PortfolioData>(seed);

  const formData = portfolio.formData;
  const seo = portfolio.seo;
  const setFormData = (updater: React.SetStateAction<PortfolioFormData>) => {
    setPortfolio(prev => ({ ...prev, formData: typeof updater === "function" ? updater(prev.formData) : updater }));
  };
  const projects = portfolio.projects;
  const setProjects = (updater: React.SetStateAction<ProjectItem[]>) => {
    setPortfolio(prev => ({ ...prev, projects: typeof updater === "function" ? updater(prev.projects) : updater }));
  };
  const experiences = portfolio.experiences;
  const setExperiences = (updater: React.SetStateAction<ExperienceItem[]>) => {
    setPortfolio(prev => ({ ...prev, experiences: typeof updater === "function" ? updater(prev.experiences) : updater }));
  };
  const educations = portfolio.educations;
  const setEducations = (updater: React.SetStateAction<EducationItem[]>) => {
    setPortfolio(prev => ({ ...prev, educations: typeof updater === "function" ? updater(prev.educations) : updater }));
  };
  const certifications = portfolio.certifications;
  const setCertifications = (updater: React.SetStateAction<CertificationItem[]>) => {
    setPortfolio(prev => ({ ...prev, certifications: typeof updater === "function" ? updater(prev.certifications) : updater }));
  };
  const organizations = portfolio.organizations;
  const setOrganizations = (updater: React.SetStateAction<OrganizationItem[]>) => {
    setPortfolio(prev => ({ ...prev, organizations: typeof updater === "function" ? updater(prev.organizations) : updater }));
  };
  const hobbies = portfolio.hobbies;
  const setHobbies = (updater: React.SetStateAction<HobbyItem[]>) => {
    setPortfolio(prev => ({ ...prev, hobbies: typeof updater === "function" ? updater(prev.hobbies) : updater }));
  };
  const testimonials = portfolio.testimonials;
  const setTestimonials = (updater: React.SetStateAction<TestimonialItem[]>) => {
    setPortfolio(prev => ({ ...prev, testimonials: typeof updater === "function" ? updater(prev.testimonials) : updater }));
  };
  const extraLinks = portfolio.extraLinks;
  const setExtraLinks = (updater: React.SetStateAction<ExtraLink[]>) => {
    setPortfolio(prev => ({ ...prev, extraLinks: typeof updater === "function" ? updater(prev.extraLinks) : updater }));
  };

  const [profileForFill, setProfileForFill] = useState<MasterProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiRaw, setAiRaw] = useState<Record<string, unknown> | null>(null);
  const [aiChanges, setAiChanges] = useState<AiChange[]>([]);
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [userCvList, setUserCvList] = useState<{ id: string; jobTitle: string | null; updatedAt: string }[]>([]);
  const [cvLoading, setCvLoading] = useState(false);
  const [generatingFromCv, setGeneratingFromCv] = useState<string | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);

  /** Draft baru: /portfolio/build selalu mengarahkan ke draft terbaru yang
   *  sudah ada, jadi awal yang benar-benar kosong dibuat dari sini. */
  const createNewDraft = async () => {
    if (creatingDraft) return;
    setCreatingDraft(true);
    try {
      // Perubahan tertunda (debounce 1,2 detik) harus masuk draft lama dulu,
      // supaya tidak ikut terbawa ke draft baru.
      const flushed = await draft.flushNow();
      if (!flushed) {
        addToast({ type: "error", message: SAVE_FAILED_MESSAGE });
        return;
      }
      const res = await fetch("/api/portfolio/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: portfolioDataSchema.parse({ formData: DEFAULT_FORM }) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.draftId) throw new Error("gagal membuat draft");
      router.replace(`/portfolio/build/${json.draftId}`);
    } catch {
      addToast({ type: "error", message: "Gagal membuat draft baru. Coba lagi." });
    } finally {
      setCreatingDraft(false);
    }
  };

  // Status simpan berasal dari hook draft (server adalah sumber kebenaran).
  const saveStatus: "idle" | "saving" | "saved" | "error" =
    draft.status === "saving"
      ? "saving"
      : draft.status === "error"
        ? "error"
        : draft.status === "saved" || draft.lastSavedAt
          ? "saved"
          : "idle";

  // Pemilih sumber dibuka sekali untuk draft yang masih kosong.
  useEffect(() => {
    if (isDraftEmpty(portfolio)) setShowSourcePicker(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronkan stack editor ke draft server setiap perubahan.
  // Muat awal dilewati supaya tidak menyimpan ulang data yang baru dibaca.
  const syncedOnce = useRef(false);
  useEffect(() => {
    if (!syncedOnce.current) {
      syncedOnce.current = true;
      return;
    }
    draftSetData(portfolio as unknown as ValidatedPortfolioData);
  }, [portfolio, draftSetData]);

  // Fetch user's CV list untuk opsi "Generate dari CV"
  useEffect(() => {
    setCvLoading(true);
    fetch("/api/cv-documents")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setUserCvList(Array.isArray(data) ? data : []);
        setCvLoading(false);
      })
      .catch(() => setCvLoading(false));
  }, []);

  /* ───────── Generate portfolio from CV ───────── */
  const generateFromCv = async (cvId: string) => {
    setGeneratingFromCv(cvId);
    try {
      // 1. Ambil data CV
      const cvRes = await fetch(`/api/cv-documents/${cvId}`);
      if (!cvRes.ok) throw new Error("Gagal mengambil data CV");
      const cvDoc = await cvRes.json();
      const cv = cvDoc.tailoredContent || cvDoc;

      // 2. Kirim ke AI suggest dengan cvData
      const suggestRes = await fetch("/api/portfolio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData: cv }),
      });

      if (!suggestRes.ok) {
        const err = await suggestRes.json();
        throw new Error(err.message || "Gagal generate portfolio dari CV");
      }

      const data = await suggestRes.json();

      // ── Compute ALL updates BEFORE setState ──

      // 3. Map AI response ke form fields + CV field
      const updates: Partial<PortfolioFormData> = {};
      if (data.hero) {
        updates.heroHeadline = data.hero.headline || "";
        updates.heroSubHeadline = data.hero.subheadline || "";
      }
      const nameParts = (cv.fullName || "").split(" ");
      updates.heroFirstName = nameParts[0] || "";
      updates.heroLastName = nameParts.slice(1).join(" ") || "";
      if (data.about) {
        updates.aboutText = [data.about.paragraph_1, data.about.paragraph_2, data.about.paragraph_3]
          .filter(Boolean).join("\n\n");
      }
      if (data.skills_display) {
        updates.skillsMain = (data.skills_display.primary || []).join(", ");
        updates.skillsTools = (data.skills_display.secondary || []).join(", ");
      } else if (cv.skills?.length > 0) {
        updates.skillsMain = cv.skills.map((s: any) => s.name).filter(Boolean).join(", ");
      }
      updates.contactEmail = cv.email || "";
      updates.contactPhone = cv.phone || "";
      updates.contactLinkedin = cv.linkedin || "";

      // 4. Compute mapped experiences & educations
      const incomingExperiences = data.experience_highlights?.length > 0
        ? data.experience_highlights.map((eh: any) => ({
            id: genId(),
            company: eh.company || "",
            position: eh.role || "",
            startDate: eh.period || "",
            endDate: "",
            description: [eh.headline, eh.impact].filter(Boolean).join("\n"),
          }))
        : cv.workHistory?.length > 0
          ? cv.workHistory.map((w: any) => ({
              id: w.id || genId(),
              company: w.company || "",
              position: w.position || "",
              startDate: w.startDate || "",
              endDate: w.endDate || "",
              description: w.description || "",
            }))
          : [];

      const mergedExp = mergeExperiences(experiences, incomingExperiences);

      const mappedEducations = cv.education?.length > 0
        ? cv.education.map((e: any) => ({
            id: e.id || genId(),
            institution: e.institution || "",
            degree: e.degree || "",
            field: e.field || "",
            startDate: e.startDate || "",
            endDate: e.endDate || "",
          }))
        : educations;

      // ── Apply all state updates ──
      // Perubahan lewat setPortfolio di atas sudah otomatis tersinkron ke
      // draft server lewat efek sinkron, jadi tidak ada penyimpanan manual.
      const updatedFormData = { ...formData, ...updates };
      setFormData(updatedFormData);
      setExperiences(mergedExp.merged);
      setEducations(mappedEducations);

      setShowSourcePicker(false);
      addToast({ type: "success", message: "Portfolio berhasil di-generate dari CV!" });
    } catch (err: any) {
      addToast({ type: "error", message: err.message || "Gagal generate dari CV" });
    } finally {
      setGeneratingFromCv(null);
    }
  };

  // Fetch profile data untuk auto-fill
  useEffect(() => {
    setProfileLoading(true);
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Profil belum dibuat");
        return res.json();
      })
      .then((data: MasterProfile) => {
        setProfileForFill(data);
        setProfileLoading(false);
      })
      .catch(() => {
        setProfileLoading(false);
        /* profile not found, wajar, user mungkin belum isi profil */
      });
  }, []);

  /* ───────── auto-fill from profile ───────── */

  /* ───────── AI Suggestion ───────── */

  // Respons mentah /api/portfolio/suggest disimpan terpisah; daftar untuk
  // modal selalu datar (string per kunci formulir), diturunkan lewat ai-map.
  const aiFormList = useMemo(
    () => (aiRaw ? listFormSuggestions(portfolio, aiRaw) : []),
    [aiRaw, portfolio],
  );
  const aiSeoList = useMemo(
    () =>
      aiRaw
        ? applyAiSuggestion(portfolio, aiRaw).changes.filter((c) => c.field.startsWith("seo."))
        : [],
    [aiRaw, portfolio],
  );

  const handleAiSuggest = async () => {
    if (!profileForFill) return;
    setAiSuggesting(true);
    setAiError(null);

    try {
      const res = await fetch("/api/portfolio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mendapatkan saran AI");
      }

      const data = await res.json();
      setAiRaw(data);
      if (applyAiSuggestion(portfolio, data).changes.length === 0) {
        setAiError("AI tidak mengembalikan perubahan baru.");
      }
      setShowAiPopup(true);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiSuggesting(false);
    }
  };

  /** Apply a single AI-suggested field */
  const applyAiField = (field: string, value: string) => {
    const label = fieldLabels[field] || field;
    const from = String((formData as unknown as Record<string, unknown>)[field] ?? "");
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAiChanges((prev) => [...prev.filter((c) => c.field !== field), { field, label, from, to: value }]);
  };

  /** Apply all AI suggestions */
  const applyAllAi = () => {
    if (!aiRaw) return;
    const currentPortfolioData: PortfolioData = {
      formData,
      projects,
      experiences,
      educations,
      certifications,
      organizations,
      hobbies,
      testimonials,
      extraLinks,
      seo,
    };
    const { data: merged, changes } = applyAiSuggestion(currentPortfolioData, aiRaw);
    if (changes.length === 0) {
      setAiError("AI tidak mengembalikan perubahan baru.");
      return;
    }
    setPortfolio(prev => ({ ...prev, formData: merged.formData, seo: merged.seo }));
    setAiChanges(changes);
    setShowAiPopup(false);
  };

  const fillFromProfile = () => {
    if (!profileForFill) return;

    const pi = profileForFill.personalInfo;
    const nameParts = (pi?.fullName || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Map profile → portfolio form fields
    setFormData((prev) => ({
      ...prev,
      heroFirstName: firstName || prev.heroFirstName,
      heroLastName: lastName || prev.heroLastName,
      heroBio: pi?.summary || prev.heroBio,
      aboutText: pi?.summary || prev.aboutText,
      contactEmail: pi?.email || prev.contactEmail,
      contactPhone: pi?.phone || prev.contactPhone,
      contactLinkedin: pi?.linkedin || prev.contactLinkedin,
      skillsMain:
        (profileForFill.skills || [])
          .map((s) => s.name)
          .filter(Boolean)
          .join(", ") || prev.skillsMain,
    }));

    // Map work history → experiences
    if (profileForFill.workHistory && profileForFill.workHistory.length > 0) {
      setExperiences(
        profileForFill.workHistory.map((w) => ({
          id: w.id || genId(),
          company: w.company || "",
          position: w.position || "",
          startDate: w.startDate || "",
          endDate: w.endDate || "",
          description: w.description || "",
        })),
      );
    }

    // Map education
    if (profileForFill.education && profileForFill.education.length > 0) {
      setEducations(
        profileForFill.education.map((e) => ({
          id: e.id || genId(),
          institution: e.institution || "",
          degree: e.degree || "",
          field: e.field || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
        })),
      );
    }
  };

  // Auto-save ke draft server ditangani usePortfolioDraft (debounce + status),
  // efek penyimpanan localStorage lama sudah dihapus.

  const update = <K extends keyof PortfolioFormData>(key: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [key]: e.target.value }));
  };

  const updateTestimonial = (id: string, field: keyof Omit<TestimonialItem, "id">) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, [field]: e.target.value } : t));
  };

  const toggleSection = (key: AccordionKey) => {
    setActiveSection((prev) => (prev === key ? "" : key));
  };

  /* ───────── Tampilan: urutan, visibilitas, ukuran teks, perataan ───────── */

  /** Satu jalur tulis untuk semua kontrol tampilan: masuk ke undo stack
   *  editor dan langsung ke draft server, lewat updater fungsional. */
  const applyAppearance = (patch: (prev: PortfolioData) => PortfolioData) => {
    setPortfolio((prev) => patch(prev));
    draftSetData((prev) =>
      patch(prev as unknown as PortfolioData) as unknown as ValidatedPortfolioData,
    );
  };

  /** Urutan untuk panel: default saat belum diatur; id asing dibuang dan id
   *  yang hilang ditambahkan di belakang supaya tidak ada section yang lenyap. */
  const order = useMemo<SectionId[]>(() => {
    const stored = [...new Set(portfolio.sectionOrder ?? [])].filter((id) =>
      (SECTION_IDS as readonly string[]).includes(id),
    ) as SectionId[];
    const missing = DEFAULT_SECTION_ORDER.filter((id) => !stored.includes(id));
    return [...stored, ...missing];
  }, [portfolio.sectionOrder]);

  const fontSizeValue: FontSize = portfolio.fontSize ?? "medium";

  const moveSection = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    applyAppearance((prev) => ({ ...prev, sectionOrder: next }));
  };

  const toggleSectionVisible = (id: SectionId) => {
    // Peta parsial: section yang tidak disebut tampil. Toggle selalu menulis
    // nilai eksplisit true/false, konsisten dengan resolveVisibility.
    applyAppearance((prev) => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [id]: !isSectionVisible(prev.sectionVisibility, id),
      },
    }));
  };

  const setAppearanceFontSize = (size: FontSize) => {
    applyAppearance((prev) => ({ ...prev, fontSize: size }));
  };

  const setSectionAlignment = (id: SectionId, align: TextAlignment) => {
    applyAppearance((prev) => ({
      ...prev,
      alignment: { ...prev.alignment, [id]: align },
    }));
  };

  // Progress berdasarkan actual field completeness (lebih akurat)
  const progressPct = useMemo(() => {
    let filled = 0;
    let total = 0;
    // Hero: headline, subheadline, firstname, lastname (4 fields)
    total += 4;
    if (formData.heroHeadline) filled++;
    if (formData.heroSubHeadline) filled++;
    if (formData.heroFirstName) filled++;
    if (formData.heroLastName) filled++;
    // About: text (1 field)
    total += 1;
    if (formData.aboutText) filled++;
    // Skills: main (1 field)
    total += 1;
    if (formData.skillsMain) filled++;
    // Contact: email, phone (2 fields)
    total += 2;
    if (formData.contactEmail) filled++;
    if (formData.contactPhone) filled++;
    // Projects: at least 1 with name+description (1 point)
    total += 1;
    if (projects.some(p => p.name && p.description)) filled++;
    // Experience: at least 1 with company+position (1 point)
    total += 1;
    if (experiences.some(e => e.company && e.position)) filled++;
    // Education: at least 1 with institution+degree (1 point)
    total += 1;
    if (educations.some(e => e.institution && e.degree)) filled++;
    return Math.round((filled / total) * 100);
  }, [formData, projects, experiences, educations]);

  return (
    <>
      <div className="min-h-screen bg-background text-on-background pb-24">
        <AppHeader />
        <main className="pt-24 px-margin-mobile md:px-gutter flex justify-center">
          <div className="w-full max-w-[800px] flex flex-col gap-6">
            {/* Progress */}
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-premium-sm border-t-4 border-primary">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h1 className="font-headline-lg text-on-background mb-1">{t("build.title")}</h1>
                  <p className="font-body-md text-on-surface-variant">{t("build.subtitle")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={createNewDraft}
                    disabled={creatingDraft}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-outline-variant px-3 text-label-bold text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">note_add</span>
                    {t("build.new-draft")}
                  </button>
                  <span className="font-label-bold text-primary text-lg">{progressPct}%</span>
                </div>
              </div>
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
              </div>

              {/* Isi dari Profil + Generate dari CV + Saran AI */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={fillFromProfile}
                  disabled={!profileForFill || profileLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl font-label-bold hover:bg-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? (
                    <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  )}
                  {profileLoading ? t("build.fill-loading") : t("build.fill-profile")}
                </button>
                {!profileForFill && !profileLoading && (
                  <p className="text-body-sm text-on-surface-variant">
                    {t("build.profile-hint")}{" "}
                    <a href="/profile" className="text-primary underline">sini</a>
                  </p>
                )}

                {/* Generate dari CV, re-open source picker */}
                <button
                  onClick={() => setShowSourcePicker(true)}
                  disabled={userCvList.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-label-bold border border-indigo-200 hover:bg-indigo-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  Generate dari CV
                </button>

                {/* Saran AI, aktif kalau profileForFill ada */}
                <button
                  onClick={handleAiSuggest}
                  disabled={!profileForFill || aiSuggesting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-label-bold border border-amber-200 hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiSuggesting ? (
                    <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  )}
                  {aiSuggesting ? t("build.ai-loading") : t("build.ai-suggest")}
                </button>
              </div>
            </section>

            {/* Accordions */}
            <div className="flex flex-col gap-4">
              {/* 1. Hero & Branding */}
              <AccordionItem id="hero" icon="palette" title={t("build.hero-title")} isOpen={activeSection === "hero"} onToggle={toggleSection}>
                <div className="px-6 space-y-4">
                  <Field label={t("build.hero-subheadline")}>
                    <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Frontend Developer & UI/UX Enthusiast"
                      value={formData.heroSubHeadline} onChange={update("heroSubHeadline")} />
                  </Field>
                  <Field label={t("build.hero-job-title")}>
                    <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Frontend Web Developer"
                      value={formData.heroHeadline} onChange={update("heroHeadline")} />
                  </Field>
                  <PortfolioPhotoUpload
                    value={formData.heroPhotoUrl}
                    onChange={(url) => setFormData((prev) => ({ ...prev, heroPhotoUrl: url }))}
                    label={t("build.hero-photo-url")}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={t("build.hero-firstname")}>
                      <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Teguh"
                        value={formData.heroFirstName} onChange={update("heroFirstName")} />
                    </Field>
                    <Field label={t("build.hero-lastname")}>
                      <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Surya"
                        value={formData.heroLastName} onChange={update("heroLastName")} />
                    </Field>
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{t("build.hero-bio")}</label>
                    </div>
                    <textarea className="w-full px-4 py-3 pr-12 rounded-xl border border-outline-variant bg-background text-body-md resize-none" rows={3} placeholder="Ceritakan sedikit tentang dirimu..." maxLength={500}
                      value={formData.heroBio} onChange={update("heroBio")} />
                    {formData.heroBio && (
                      <span className="absolute right-2 top-8">
                        <AIPolishButton content={formData.heroBio} onApply={(v) => setFormData(prev => ({ ...prev, heroBio: v }))} field="bio hero" size="sm" />
                      </span>
                    )}
                    <CharCounter value={formData.heroBio} max={500} />
                  </div>
                </div>
              </AccordionItem>

              {/* 2. About */}
              <AccordionItem id="about" icon="person" title={t("build.about")} isOpen={activeSection === "about"} onToggle={toggleSection}>
                <div className="px-6 space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{t("build.about-text")}</label>
                    </div>
                    <textarea className="w-full px-4 py-3 pr-12 rounded-xl border border-outline-variant bg-background text-body-md resize-none" rows={5} placeholder="Tulis cerita tentang perjalanan kariermu..." maxLength={1500}
                      value={formData.aboutText} onChange={update("aboutText")} />
                    {formData.aboutText && (
                      <span className="absolute right-2 top-8">
                        <AIPolishButton content={formData.aboutText} onApply={(v) => setFormData(prev => ({ ...prev, aboutText: v }))} field="tentang saya" size="sm" />
                      </span>
                    )}
                    <CharCounter value={formData.aboutText} max={1500} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">                      <Field label={t("build.about-years")}>
                      <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="3+"
                        value={formData.aboutYearsExp} onChange={update("aboutYearsExp")} />
                    </Field>
                    <Field label={t("build.about-projects")}>
                      <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="20+"
                        value={formData.aboutProjectsDone} onChange={update("aboutProjectsDone")} />
                    </Field>
                    <Field label={t("build.about-clients")}>
                      <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="15+"
                        value={formData.aboutClientsHappy} onChange={update("aboutClientsHappy")} />
                    </Field>
                  </div>
                </div>
              </AccordionItem>

              {/* 3. Projects */}
              <AccordionItem id="projects" icon="folder" title={t("build.project")} isOpen={activeSection === "projects"} onToggle={toggleSection}>
                <div className="px-6 space-y-6">
                  {projects.map((p, idx) => (
                    <div key={p.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-label-bold text-primary">Project {idx + 1}</h4>
                        <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors"
                          onClick={() => setProjects(prev => prev.filter(x => x.id !== p.id))}
                          aria-label="Hapus project">
                          <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-label-sm text-on-surface-variant mb-1">{t("live.form.project-name")}</label>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Nama project"
                            value={p.name} onChange={e => setProjects(prev => prev.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} />
                        </div>
                        <div className="md:col-span-2 relative">
                          <label className="block text-label-sm text-on-surface-variant mb-1">{t("live.form.description")}</label>
                          <textarea className="w-full px-4 py-3 pr-12 rounded-xl border border-outline-variant bg-background text-body-md resize-none" rows={2} placeholder="Deskripsi singkat project..." maxLength={500}
                            value={p.description} onChange={e => setProjects(prev => prev.map(x => x.id === p.id ? {...x, description: e.target.value} : x))} />
                          {p.description && (
                            <span className="absolute right-2 top-8">
                              <AIPolishButton content={p.description} onApply={(text) => setProjects(prev => prev.map(x => x.id === p.id ? {...x, description: text} : x))} field={`deskripsi project ${p.name || idx + 1}`} size="sm" />
                            </span>
                          )}
                          <CharCounter value={p.description} max={500} />
                        </div>
                        <Field label={t("live.form.tech-stack")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="React, Node.js, PostgreSQL"
                            value={p.techStack} onChange={e => setProjects(prev => prev.map(x => x.id === p.id ? {...x, techStack: e.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.link-optional")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="https://github.com/..."
                            value={p.link} onChange={e => setProjects(prev => prev.map(x => x.id === p.id ? {...x, link: e.target.value} : x))} />
                        </Field>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setProjects(prev => [...prev, { id: genId(), name: "", description: "", techStack: "", link: "" }])}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-label-bold flex items-center justify-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all">
                    <span className="material-symbols-outlined">add</span>
                    {t("live.form.add-project")}
                  </button>
                </div>
              </AccordionItem>

              {/* 4. Skills */}
              <AccordionItem id="skills" icon="stars" title={t("build.skill")} isOpen={activeSection === "skills"} onToggle={toggleSection}>
                <div className="px-6 space-y-4">
                  <Field label={t("build.skills-main")}>
                    <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="React, TypeScript, Node.js, Tailwind CSS..."
                      value={formData.skillsMain} onChange={update("skillsMain")} />
                  </Field>
                  {formData.skillsMain.split(",").filter(s => s.trim()).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skillsMain.split(",").filter(s => s.trim()).map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full border border-outline-variant bg-background text-label-sm text-on-surface-variant flex items-center gap-1">
                          {skill.trim()}
                          <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error"
                            onClick={() => {
                              const skills = formData.skillsMain.split(",").map(s => s.trim()).filter(Boolean);
                              skills.splice(i, 1);
                              setFormData(prev => ({ ...prev, skillsMain: skills.join(", ") }));
                            }}>close</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{t("build.skills-tools")}</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Figma, VS Code, Git, Docker..."
                      value={formData.skillsTools} onChange={update("skillsTools")} />
                  </div>
                  <div>
                    <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{t("build.skills-languages")}</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Bahasa Indonesia (Native), Inggris (Professional)"
                      value={formData.skillsLanguages} onChange={update("skillsLanguages")} />
                  </div>
                </div>
              </AccordionItem>

              {/* 5. Experience */}
              <AccordionItem id="experience" icon="work" title={t("build.experience")} isOpen={activeSection === "experience"} onToggle={toggleSection}>
                <div className="px-6 space-y-6">
                  {experiences.map((e, idx) => (
                    <div key={e.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-label-bold text-primary">{t("portfolio.label-experience")} {idx + 1}</h4>
                        <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors"
                          onClick={() => setExperiences(prev => prev.filter(x => x.id !== e.id))}
                          aria-label="Hapus pengalaman">
                          <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label={t("live.form.company")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Nama perusahaan"
                            value={e.company} onChange={ev => setExperiences(prev => prev.map(x => x.id === e.id ? {...x, company: ev.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.position")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Frontend Developer"
                            value={e.position} onChange={ev => setExperiences(prev => prev.map(x => x.id === e.id ? {...x, position: ev.target.value} : x))} />
                        </Field>
                        <div className="md:col-span-2">
                          <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{t("portfolio.label-date-range")}</label>
                          <div className="flex items-center gap-2">
                            <input className="flex-1 px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" type="month" placeholder="Mulai"
                              value={e.startDate} onChange={ev => setExperiences(prev => prev.map(x => x.id === e.id ? {...x, startDate: ev.target.value} : x))} />
                            <span className="text-on-surface-variant">ke</span>
                            <input className="flex-1 px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" type="month" placeholder="Selesai"
                              value={e.endDate} onChange={ev => setExperiences(prev => prev.map(x => x.id === e.id ? {...x, endDate: ev.target.value} : x))} />
                          </div>
                        </div>
                        <div className="md:col-span-2 relative">
                          <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{t("live.form.description")}</label>
                          <textarea className="w-full px-4 py-3 pr-12 rounded-xl border border-outline-variant bg-background text-body-md resize-none" rows={3} placeholder="Jelaskan tanggung jawab dan pencapaian..." maxLength={1000}
                            value={e.description} onChange={ev => setExperiences(prev => prev.map(x => x.id === e.id ? {...x, description: ev.target.value} : x))} />
                          {e.description && (
                            <span className="absolute right-2 top-8">
                              <AIPolishButton content={e.description} onApply={(text) => setExperiences(prev => prev.map(x => x.id === e.id ? {...x, description: text} : x))} field={`deskripsi pengalaman ${e.position || idx + 1}`} size="sm" />
                            </span>
                          )}
                          <CharCounter value={e.description} max={1000} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setExperiences(prev => [...prev, { id: genId(), company: "", position: "", startDate: "", endDate: "", description: "" }])}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-label-bold flex items-center justify-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all">
                    <span className="material-symbols-outlined">add</span>
                    {t("live.form.add-experience")}
                  </button>
                </div>
              </AccordionItem>

              {/* 6. Education */}
              <AccordionItem id="education" icon="school" title={t("build.education")} isOpen={activeSection === "education"} onToggle={toggleSection}>
                <div className="px-6 space-y-6">
                  {educations.map((e, idx) => (
                    <div key={e.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-label-bold text-primary">Pendidikan {idx + 1}</h4>
                        <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors"
                          onClick={() => setEducations(prev => prev.filter(x => x.id !== e.id))}
                          aria-label="Hapus pendidikan">
                          <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Field label={t("live.form.institution")}>
                            <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Universitas Gadjah Mada"
                              value={e.institution} onChange={ev => setEducations(prev => prev.map(x => x.id === e.id ? {...x, institution: ev.target.value} : x))} />
                          </Field>
                        </div>
                        <Field label={t("live.form.degree")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Sarjana (S1)"
                            value={e.degree} onChange={ev => setEducations(prev => prev.map(x => x.id === e.id ? {...x, degree: ev.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.field")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Ilmu Komputer"
                            value={e.field} onChange={ev => setEducations(prev => prev.map(x => x.id === e.id ? {...x, field: ev.target.value} : x))} />
                        </Field>
                        <div className="md:col-span-2">
                          <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{t("portfolio.label-year-range")}</label>
                          <div className="flex items-center gap-2">
                            <input className="flex-1 px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" type="month" placeholder="Mulai"
                              value={e.startDate} onChange={ev => setEducations(prev => prev.map(x => x.id === e.id ? {...x, startDate: ev.target.value} : x))} />
                            <span className="text-on-surface-variant">ke</span>
                            <input className="flex-1 px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" type="month" placeholder="Selesai"
                              value={e.endDate} onChange={ev => setEducations(prev => prev.map(x => x.id === e.id ? {...x, endDate: ev.target.value} : x))} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEducations(prev => [...prev, { id: genId(), institution: "", degree: "", field: "", startDate: "", endDate: "" }])}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-label-bold flex items-center justify-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all">
                    <span className="material-symbols-outlined">add</span>
                    {t("live.form.add-education")}
                  </button>
                </div>
              </AccordionItem>

              {/* 6b. Certifications */}
              <AccordionItem id="certifications" icon="workspace_premium" title={t("build.certifications")} isOpen={activeSection === "certifications"} onToggle={toggleSection}>
                <div className="px-6 space-y-6">
                  {certifications.map((cert, idx) => (
                    <div key={cert.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-label-bold text-primary">{t("live.form.certification")} {idx + 1}</h4>
                        <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors"
                          onClick={() => setCertifications(prev => prev.filter(x => x.id !== cert.id))}
                          aria-label="Hapus sertifikat">
                          <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label={t("live.form.cert-name")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="AWS Certified Developer"
                            value={cert.name} onChange={e => setCertifications(prev => prev.map(x => x.id === cert.id ? {...x, name: e.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.cert-issuer")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Amazon Web Services"
                            value={cert.issuer} onChange={e => setCertifications(prev => prev.map(x => x.id === cert.id ? {...x, issuer: e.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.cert-year")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="2024"
                            value={cert.year} onChange={e => setCertifications(prev => prev.map(x => x.id === cert.id ? {...x, year: e.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.cert-url")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="https://credential.example.com/..."
                            value={cert.url || ""} onChange={e => setCertifications(prev => prev.map(x => x.id === cert.id ? {...x, url: e.target.value} : x))} />
                        </Field>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setCertifications(prev => [...prev, { id: genId(), name: "", issuer: "", year: "", url: "" }])}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-label-bold flex items-center justify-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all">
                    <span className="material-symbols-outlined">add</span>
                    {t("live.form.add-certification")}
                  </button>
                </div>
              </AccordionItem>

              {/* 6c. Organizations */}
              <AccordionItem id="organizations" icon="groups" title={t("build.organizations")} isOpen={activeSection === "organizations"} onToggle={toggleSection}>
                <div className="px-6 space-y-6">
                  {organizations.map((org, idx) => (
                    <div key={org.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-label-bold text-primary">{t("live.form.organization")} {idx + 1}</h4>
                        <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors"
                          onClick={() => setOrganizations(prev => prev.filter(x => x.id !== org.id))}
                          aria-label="Hapus organisasi">
                          <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label={t("live.form.org-name")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Himpunan Mahasiswa Teknik"
                            value={org.name} onChange={e => setOrganizations(prev => prev.map(x => x.id === org.id ? {...x, name: e.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.org-role")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Ketua Divisi Acara"
                            value={org.role} onChange={e => setOrganizations(prev => prev.map(x => x.id === org.id ? {...x, role: e.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.org-period")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="2022 - 2024"
                            value={org.period} onChange={e => setOrganizations(prev => prev.map(x => x.id === org.id ? {...x, period: e.target.value} : x))} />
                        </Field>
                        <div className="md:col-span-2">
                          <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{t("live.form.org-desc")}</label>
                          <textarea className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md resize-none" rows={2} placeholder="Jelaskan tanggung jawab & pencapaian..." maxLength={500}
                            value={org.description} onChange={e => setOrganizations(prev => prev.map(x => x.id === org.id ? {...x, description: e.target.value} : x))} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setOrganizations(prev => [...prev, { id: genId(), name: "", role: "", period: "", description: "" }])}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-label-bold flex items-center justify-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all">
                    <span className="material-symbols-outlined">add</span>
                    {t("live.form.add-organization")}
                  </button>
                </div>
              </AccordionItem>

              {/* 6d. Hobbies */}
              <AccordionItem id="hobbies" icon="favorite" title={t("build.hobbies")} isOpen={activeSection === "hobbies"} onToggle={toggleSection}>
                <div className="px-6 space-y-4">
                  {hobbies.map((hobby, idx) => (
                    <div key={hobby.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-label-bold text-primary">{t("live.form.hobby")} {idx + 1}</h4>
                        {hobbies.length > 1 && (
                          <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors"
                            onClick={() => setHobbies(prev => prev.filter(x => x.id !== hobby.id))}
                            aria-label="Hapus hobi">
                            <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label={t("live.form.hobby-name")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Fotografi"
                            value={hobby.name} onChange={e => setHobbies(prev => prev.map(x => x.id === hobby.id ? {...x, name: e.target.value} : x))} />
                        </Field>
                        <Field label={t("live.form.hobby-desc")}>
                          <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Street photography & landscape"
                            value={hobby.description} onChange={e => setHobbies(prev => prev.map(x => x.id === hobby.id ? {...x, description: e.target.value} : x))} />
                        </Field>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setHobbies(prev => [...prev, { id: genId(), name: "", description: "" }])}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-label-bold flex items-center justify-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all">
                    <span className="material-symbols-outlined">add</span>
                    {t("live.form.add-hobby")}
                  </button>
                </div>
              </AccordionItem>

              {/* 7. Testimonials */}
              <AccordionItem id="testimonials" icon="format_quote" title={t("build.testimonial")} isOpen={activeSection === "testimonials"} onToggle={toggleSection}>
                <div className="px-6 space-y-4">
                  {testimonials.map((item, i) => (
                    <div key={item.id} className="p-4 rounded-xl border border-outline-variant bg-surface">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-label-bold text-primary">Testimoni {i + 1}</h4>
                        {testimonials.length > 1 && (
                          <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors"
                            onClick={() => setTestimonials(prev => prev.filter(x => x.id !== item.id))}
                            aria-label="Hapus testimoni">
                            <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <label className="block text-label-sm text-on-surface-variant mb-2">Foto</label>
                          <div className="w-16 h-16 rounded-full bg-surface-container border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden cursor-pointer">
                            <span className="material-symbols-outlined text-outline text-xl">person_add</span>
                          </div>
                        </div>
                        <div className="flex-grow space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                            <Field label="Nama">
                              <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Nama pemberi testimoni"
                                value={item.name} onChange={updateTestimonial(item.id, "name")} />
                            </Field>
                            <Field label={t("live.form.position-company")}>
                              <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="CTO at TechCorp"
                                value={item.position} onChange={updateTestimonial(item.id, "position")} />
                            </Field>
                          </div>
                          <Field label={t("live.form.testimonial")}>
                            <div className="relative">
                              <textarea className="w-full px-4 py-3 pr-12 rounded-xl border border-outline-variant bg-background text-body-md resize-none" rows={2} placeholder="Apa yang mereka katakan tentangmu?" maxLength={500}
                                value={item.testimonial} onChange={updateTestimonial(item.id, "testimonial")} />
                              {item.testimonial && (
                                <span className="absolute right-2 top-2">
                                  <AIPolishButton content={item.testimonial} onApply={(v) => { const ev = { target: { value: v } } as any; updateTestimonial(item.id, "testimonial")(ev); }} field="testimoni" size="sm" />
                                </span>
                              )}
                            </div>
                            <CharCounter value={item.testimonial} max={500} />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setTestimonials(prev => [...prev, { id: genId(), name: "", position: "", testimonial: "" }])}
                    className="w-full py-3 rounded-xl border border-outline-variant text-on-surface font-label-bold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined">add</span>
                    {t("live.form.add-testimonial")}
                  </button>
                </div>
              </AccordionItem>

              {/* 8. Contact */}
              <AccordionItem id="contact" icon="contact_support" title={t("build.contact")} isOpen={activeSection === "contact"} onToggle={toggleSection}>
                <div className="px-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ValidatedField label="Email" error={!validateEmail(formData.contactEmail) ? "Format email tidak valid" : undefined}>
                      <div className="flex items-center gap-2 border border-outline-variant rounded-xl px-4 py-3 bg-background">
                        <span className="material-symbols-outlined text-outline text-xl">mail</span>
                        <input className="w-full border-none p-0 focus:ring-0 text-body-md bg-transparent" placeholder="email@contoh.com" type="email"
                          value={formData.contactEmail} onChange={update("contactEmail")} />
                      </div>
                    </ValidatedField>
                    <ValidatedField label="WhatsApp / No. Telp" error={!validatePhone(formData.contactPhone) ? "Format nomor tidak valid" : undefined}>
                      <div className="flex items-center gap-2 border border-outline-variant rounded-xl px-4 py-3 bg-background">
                        <span className="material-symbols-outlined text-outline text-xl">phone</span>
                        <input className="w-full border-none p-0 focus:ring-0 text-body-md bg-transparent" placeholder="+62 812..." type="tel"
                          value={formData.contactPhone} onChange={update("contactPhone")} />
                      </div>
                    </ValidatedField>
                    <ValidatedField label="LinkedIn URL" error={!validateUrl(formData.contactLinkedin) ? "URL harus diawali http:// atau https://" : undefined}>
                      <div className="flex items-center gap-2 border border-outline-variant rounded-xl px-4 py-3 bg-background">
                        <span className="material-symbols-outlined text-outline text-xl">link</span>
                        <input className="w-full border-none p-0 focus:ring-0 text-body-md bg-transparent" placeholder="https://linkedin.com/in/username"
                          value={formData.contactLinkedin} onChange={update("contactLinkedin")} />
                      </div>
                    </ValidatedField>
                    <ValidatedField label="GitHub URL" error={!validateUrl(formData.contactGithub) ? "URL harus diawali http:// atau https://" : undefined}>
                      <div className="flex items-center gap-2 border border-outline-variant rounded-xl px-4 py-3 bg-background">
                        <span className="material-symbols-outlined text-outline text-xl">code</span>
                        <input className="w-full border-none p-0 focus:ring-0 text-body-md bg-transparent" placeholder="https://github.com/username"
                          value={formData.contactGithub} onChange={update("contactGithub")} />
                      </div>
                    </ValidatedField>
                    {/* Extra Links */}
                    {extraLinks.map((link, i) => (
                      <div key={link.id} className="md:col-span-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-xl">link</span>
                        <input className="flex-1 px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="Label (Twitter, Dribbble...)"
                          value={link.label} onChange={e => setExtraLinks(prev => prev.map(x => x.id === link.id ? {...x, label: e.target.value} : x))} />
                        <input className="flex-1 px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder="URL"
                          value={link.url} onChange={e => setExtraLinks(prev => prev.map(x => x.id === link.id ? {...x, url: e.target.value} : x))} />
                        <button className="text-error hover:bg-error-container/30 p-1 rounded"
                          onClick={() => setExtraLinks(prev => prev.filter(x => x.id !== link.id))}
                          aria-label="Hapus link">
                          <span className="material-symbols-outlined select-none">close</span>
                        </button>
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <button onClick={() => setExtraLinks(prev => [...prev, { id: genId(), label: "", url: "" }])}
                        className="text-primary font-label-bold flex items-center gap-1 text-sm hover:underline">
                        <span className="material-symbols-outlined text-lg">add_link</span>
                        {t("build.add-link")}
                      </button>
                    </div>
                  </div>
                </div>
              </AccordionItem>
            </div>

            {/* Panel Tampilan: urutan & visibilitas section, ukuran teks, perataan */}
            <section
              data-testid="appearance-panel"
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-soft border border-outline-variant/30 space-y-5"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">tune</span>
                <h2 className="font-label-bold text-on-surface">{t("live.appearance")}</h2>
              </div>

              {/* Ukuran teks */}
              <div>
                <span className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                  {t("live.font-size")}
                </span>
                <div className="flex gap-2" role="group" aria-label={t("live.font-size")}>
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setAppearanceFontSize(size)}
                      aria-pressed={fontSizeValue === size}
                      className={`flex-1 min-h-11 rounded-xl text-sm font-semibold transition-all ${
                        fontSizeValue === size
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {size === "small"
                        ? t("live.font-small")
                        : size === "medium"
                          ? t("live.font-medium")
                          : t("live.font-large")}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  {fontSizeValue === "small"
                    ? t("live.font-compact")
                    : fontSizeValue === "medium"
                      ? t("live.font-standard")
                      : t("live.font-bold")}
                </p>
              </div>

              {/* Daftar section: visibilitas, perataan, urutan */}
              <div>
                <span className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                  {t("live.section-order")}
                </span>
                <ul className="space-y-1.5">
                  {order.map((id, index) => {
                    const visible = isSectionVisible(portfolio.sectionVisibility, id);
                    const align = portfolio.alignment?.[id] ?? "left";
                    const name = t(SECTION_NAME_KEYS[id]);
                    return (
                      <li
                        key={id}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSectionVisible(id)}
                          aria-pressed={visible}
                          aria-label={visible ? `${t("live.hide-section")}: ${name}` : `${t("live.show-section")}: ${name}`}
                          title={visible ? t("live.hide-section") : t("live.show-section")}
                          className={`min-h-11 min-w-11 shrink-0 rounded-lg border flex items-center justify-center transition-all ${
                            visible
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-outline-variant text-outline hover:bg-surface-container"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">
                            {visible ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                        <span
                          className={`flex-1 min-w-[8rem] truncate text-body-md ${
                            visible ? "text-on-surface" : "text-on-surface-variant line-through"
                          }`}
                        >
                          {name}
                        </span>
                        <select
                          value={align}
                          onChange={(e) => setSectionAlignment(id, e.target.value as TextAlignment)}
                          aria-label={`${t("live.text-align")}: ${name}`}
                          className="min-h-11 rounded-lg border border-outline-variant bg-background px-2 text-body-md"
                        >
                          {ALIGNMENT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {t(opt.key)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          aria-label={`${t("live.move-up")}: ${name}`}
                          title={t("live.move-up")}
                          className="min-h-11 min-w-11 rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">keyboard_arrow_up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(index, 1)}
                          disabled={index === order.length - 1}
                          aria-label={`${t("live.move-down")}: ${name}`}
                          title={t("live.move-down")}
                          className="min-h-11 min-w-11 rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">keyboard_arrow_down</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            {/* Changes list from AI */}
            {aiChanges.length > 0 && (
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-soft border border-primary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-label-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    Perubahan AI ({aiChanges.length})
                  </h3>
                  <button onClick={() => setAiChanges([])} className="text-xs text-on-surface-variant hover:text-on-surface">
                    Tutup
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {aiChanges.map((c, i) => (
                    <div key={i} className="text-xs p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-1">
                      <span className="font-semibold text-on-surface">{c.label} ({c.field})</span>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-on-surface-variant text-xs">{c.from || "(kosong)"}</span>
                        <span className="text-on-surface-variant">→</span>
                        <span className="text-primary font-medium">{c.to}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info, panduan resmi */}
            <a href="/portfolio/preview" className="block p-6 rounded-2xl bg-surface-container border-2 border-dashed border-primary/20 relative overflow-hidden group hover:border-primary/40 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>preview</span>
                </div>
                <div>
                  <h3 className="font-label-bold text-on-surface mb-1">{t("build.preview-hint-title")}</h3>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">{t("build.preview-hint-desc")}</p>
                </div>
              </div>
            </a>
          </div>
        </main>

        {/* Bottom Nav */}
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-highest shadow-[0_-8px_24px_rgba(0,0,0,0.06)] py-4 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-[800px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border-r border-outline-variant/30 pr-3">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Urungkan (Undo)"
                  aria-label="Undo"
                >
                  <span className="material-symbols-outlined text-lg">undo</span>
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Ulangi (Redo)"
                  aria-label="Redo"
                >
                  <span className="material-symbols-outlined text-lg">redo</span>
                </button>
              </div>
              {draft.offline && saveStatus !== "saving" && saveStatus !== "error" ? (
                <>
                  <span className="material-symbols-outlined text-amber-600 text-lg">cloud_off</span>
                  <span className="text-label-sm text-amber-700" role="status">
                    {t("build.offline")}
                  </span>
                </>
              ) : saveStatus === "saving" ? (
                <>
                  <span className="material-symbols-outlined text-amber-500 text-lg animate-spin">sync</span>
                  <span className="text-label-sm text-amber-600">{t("build.saving")}</span>
                </>
              ) : saveStatus === "error" ? (
                <button
                  type="button"
                  onClick={() => draft.retry()}
                  className="inline-flex items-center gap-1.5 text-label-sm text-error hover:underline"
                >
                  <span className="material-symbols-outlined text-lg">error</span>
                  {draft.error ?? "Belum tersimpan. Ketuk untuk coba lagi."}
                </button>
              ) : saveStatus === "saved" ? (
                <>
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-label-sm text-primary">{t("build.saved")}</span>
                </>
              ) : (
                <span className="text-label-sm text-on-surface-variant">{t("build.unsaved")}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden md:block text-on-surface-variant font-label-bold hover:text-primary transition-colors px-4 py-2"
                onClick={() => {
                  setConfirmAction({
                    title: "Batalkan Semua Perubahan",
                    message: "Yakin ingin membatalkan semua perubahan? Data yang belum disimpan akan hilang.",
                    variant: "danger",
                    confirmLabel: "Ya, Batalkan",
                    onConfirm: () => {
                      // Reset ke draft kosong; efek sinkron otomatis mendorongnya ke server.
                      setFormData(DEFAULT_FORM);
                      setPortfolio(prev => ({ ...prev, seo: undefined }));
                      setProjects([{ id: genId(), name: "", description: "", techStack: "", link: "" }, { id: genId(), name: "", description: "", techStack: "", link: "" }, { id: genId(), name: "", description: "", techStack: "", link: "" }]);
                      setExperiences([{ id: genId(), company: "", position: "", startDate: "", endDate: "", description: "" }, { id: genId(), company: "", position: "", startDate: "", endDate: "", description: "" }]);
                      setEducations([{ id: genId(), institution: "", degree: "", field: "", startDate: "", endDate: "" }]);
                      setCertifications([{ id: genId(), name: "", issuer: "", year: "", url: "" }]);
                      setOrganizations([{ id: genId(), name: "", role: "", period: "", description: "" }]);
                      setHobbies([{ id: genId(), name: "", description: "" }]);
                      setTestimonials([{ id: genId(), name: "", position: "", testimonial: "" }]);
                      setExtraLinks([]);
                      addToast({ type: "info", message: "Semua perubahan dibatalkan" });
                    },
                  });
                }}>
                {t("build.cancel")}
              </button>
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    // Pastikan perubahan terakhir sudah masuk server sebelum
                    // preview dibuka (server adalah sumber kebenaran preview).
                    const flushed = await draft.flushNow();
                    if (!flushed) {
                      addToast({ type: "error", message: SAVE_FAILED_MESSAGE });
                      return;
                    }
                    window.open(`/portfolio/preview?draftId=${draft.draftId}`, "_blank");
                  } catch (err) {
                    addToast({ type: "error", message: SAVE_FAILED_MESSAGE });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-primary text-on-primary font-label-bold rounded-lg px-8 py-3 hover:brightness-110 active:scale-95 duration-200 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <><span className="material-symbols-outlined text-lg animate-spin">sync</span> {t("build.saving")}</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">preview</span>                {t("build.save-preview")}</>
                )}
              </button>
            </div>
          </div>
        </footer>

        <div className="pb-20"></div>
        <AppFooter bordered />
      </div>

      <ConfirmModal confirm={confirmAction} onClose={() => setConfirmAction(null)} />

      {/* ── Source Picker Popup ── */}
      <Modal open={showSourcePicker} onClose={() => setShowSourcePicker(false)} title="Buat Portfolio Baru" size="max-w-lg">
        <div className="space-y-4 pt-2">
          <p className="text-sm text-on-surface-variant">
            Pilih cara memulai portfolio:
          </p>
          <div className="flex flex-col gap-3">
            {/* Option 1: Generate dari CV */}
            <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:border-primary/50 transition-all">
              <h4 className="font-label-bold text-on-surface flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                Generate dari CV
              </h4>
              <p className="text-sm text-on-surface-variant mb-3">
                Pilih salah satu CV yang sudah kamu buat, AI akan generate konten portfolio secara otomatis.
              </p>
              {userCvList.length === 0 ? (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  {cvLoading ? t("portfolio.loading-cvs") : <>{t("portfolio.no-cv")} <a href="/dashboard" className="text-primary underline">{t("portfolio.no-cv-action")}</a></>}
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {userCvList.map((cv) => (
                    <button
                      key={cv.id}
                      onClick={() => generateFromCv(cv.id)}
                      disabled={generatingFromCv === cv.id}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 transition-all disabled:opacity-50"
                    >
                      <div className="text-left">
                        <span className="font-medium text-sm text-on-surface">{cv.jobTitle || t("portfolio.cv-untitled")}</span>
                        <p className="text-xs text-outline">Diperbarui: {new Date(cv.updatedAt).toLocaleDateString("id-ID")}</p>
                      </div>
                      {generatingFromCv === cv.id ? (
                        <span className="material-symbols-outlined text-primary animate-spin">sync</span>
                      ) : (
                        <span className="material-symbols-outlined text-outline">chevron_right</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Option 2: Dari Profil */}
            <button
              onClick={() => {
                fillFromProfile();
                setShowSourcePicker(false);
              }}
              disabled={!profileForFill}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary/40 hover:bg-surface-container-low transition-all disabled:opacity-40 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div>
                <h4 className="font-label-bold text-on-surface">Dari Profil</h4>
                <p className="text-xs text-on-surface-variant">
                  {profileForFill ? "Isi otomatis dari data profil yang sudah kamu buat" : "Isi profil dulu di halaman profil"}
                </p>
              </div>
            </button>

            {/* Option 3: Manual */}
            <button
              onClick={() => setShowSourcePicker(false)}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary/40 hover:bg-surface-container-low transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              </div>
              <div>
                <h4 className="font-label-bold text-on-surface">Isi Manual</h4>
                <p className="text-xs text-on-surface-variant">{t("portfolio.start-empty")}</p>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* ── AI Suggestions Popup ── */}
      <Modal open={showAiPopup} onClose={() => setShowAiPopup(false)} title="Saran AI untuk Portfolio" size="max-w-xl">
        <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <p className="text-sm text-on-surface-variant">
            AI telah menganalisis data profilmu dan memberikan saran berikut.
            Klik <strong>Terapkan</strong> untuk menggunakan saran pada field tertentu,
            atau <strong>Terapkan Semua</strong> untuk langsung mengisi semua.
          </p>

          {aiFormList.length + aiSeoList.length > 0 && (
            <div className="space-y-3">
              {[
                ...aiFormList.map((c) => ({ ...c, applyable: true })),
                ...aiSeoList.map((c) => ({ ...c, applyable: false })),
              ].map((c) => (
                <div key={c.field} className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">
                      {c.label}
                    </span>
                    {c.applyable ? (
                      <button
                        onClick={() => applyAiField(c.field, c.to)}
                        className="shrink-0 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 active:scale-95 transition-all"
                      >
                        Terapkan
                      </button>
                    ) : (
                      <span className="shrink-0 px-3 py-1 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-semibold">
                        Via Terapkan Semua
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed">
                    {c.from ? (
                      <>
                        <span className="line-through text-on-surface-variant mr-2">{c.from}</span>
                        <span className="text-primary">{c.to}</span>
                      </>
                    ) : (
                      c.to
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Error state: daftar kosong (AI tidak mengembalikan apa pun yang bisa dipetakan) */}
          {aiError && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-100/30 border border-red-200">
              <span className="material-symbols-outlined text-error text-lg shrink-0">error</span>
              <p className="text-sm text-error">{aiError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAiPopup(false)}
              className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-label-bold hover:bg-surface-container transition-all active:scale-[0.98]"
            >
              Tutup
            </button>
            <button
              onClick={applyAllAi}
              className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label-bold hover:brightness-110 transition-all active:scale-[0.98]"
            >
              Terapkan Semua
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ── Sub-components ── */

function AccordionItem({ id, icon, title, isOpen, onToggle, children }: {
  id: AccordionKey; icon: string; title: string; isOpen: boolean; onToggle: (id: AccordionKey) => void; children: React.ReactNode;
}) {
  return (
    <div className={`bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant/30 overflow-hidden transition-all`}>
      <button
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:bg-surface-container"
        onClick={() => onToggle(id)}
      >
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary">{icon}</span>
          <span className="font-label-bold text-on-surface">{title}</span>
        </div>
        <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>
      <div
        className="accordion-content"
        style={{
          maxHeight: isOpen ? "4000px" : "0px",
          paddingBottom: isOpen ? "1.5rem" : "0px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

/* ── AI field labels ── */

const fieldLabels: Record<string, string> = {
  heroHeadline: "Job Title Utama",
  heroSubHeadline: "Sub-headline / Tagline",
  heroBio: "Bio Singkat",
  aboutText: "Tentang Saya",
  aboutYearsExp: "Tahun Pengalaman",
  aboutProjectsDone: "Project Selesai",
  aboutClientsHappy: "Klien Puas",
  skillsMain: "Keahlian utama",
  skillsTools: "Tools & Software",
  skillsLanguages: "Bahasa",
};
