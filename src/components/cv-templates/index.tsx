import { useMemo } from "react";

/* ───────── shared types ───────── */

export interface WorkEntry {
  id: string;
  position: string;
  company: string;
  /** Optional company description — e.g., industry, size, or brief context */
  companyDescription?: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  /** Key achievement / metric highlight for this role */
  achievement?: string;
  isCurrent?: boolean;
  /** Visibility toggle — hide this entry from CV without deleting */
  visible?: boolean;
  /** Optional project/portfolio URL */
  projectUrl?: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  /** Grade Point Average — useful for fresh graduates */
  gpa?: string;
  /** Visibility toggle — hide this entry from CV without deleting */
  visible?: boolean;
}

export interface OrganizationEntry {
  id: string;
  name: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isPresent?: boolean;
  /** Visibility toggle — hide this entry from CV without deleting */
  visible?: boolean;
}

export interface SkillEntry {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  /** Skill category for grouped display: technical | soft | tools */
  category?: "technical" | "soft" | "tools";
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface CustomFieldEntry {
  id: string;
  label: string;
  value: string;
}

export interface CustomSectionEntry {
  id: string;
  title: string;
  /** Content lines — each entry is a bullet point or paragraph */
  content: string;
  /** @default "bullets" */
  contentType?: "paragraph" | "bullets";
}

export interface CvData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  linkedin: string;
  /** Optional portfolio/website URL */
  portfolioUrl?: string;
  summary: string;
  /** Self evaluation / objective — separate from summary */
  selfEvaluation?: string;
  /** Employment status — "Mencari Kerja", "Bekerja", "Freelance", etc. */
  employmentStatus?: string;
  /** Target position for AI guidance — NOT shown on CV paper */
  jobTitle: string;
  jobDescription: string;
  /** Professional title/motto shown on CV header (below name) — optional */
  professionalTitle?: string;
  workHistory: WorkEntry[];
  education: EducationEntry[];
  organisations: OrganizationEntry[];
  skills: SkillEntry[];
  /** Professional certifications & licenses */
  certifications?: CertificationEntry[];
  /** User-defined custom fields in profile section (unlimited) */
  customFields?: CustomFieldEntry[];
  /** User-defined sections like "Key Achievement", "Certifications", etc. */
  customSections?: CustomSectionEntry[];
  /** @default "id" */
  cvLang?: "id" | "en";
  /** Custom section labels — user can rename section titles */
  sectionLabels?: Record<string, string>;
}

/* ───────── template style config ───────── */

export type SectionKey = "summary" | "experience" | "education" | "skills" | "organizations" | "selfEvaluation";

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "organizations",
];

export interface TemplateStyle {
  id: string;
  name: string;
  /** Primary accent color (used sparingly) */
  primary: string;
  /** Header background (null = use white) */
  headerBg: string | null;
  /** Header text color */
  headerText: string;
  /** Section title color */
  sectionTitle: string;
  /** Section title style */
  sectionStyle: "underline" | "bordered" | "minimal";
  /** Body font size in pt */
  bodySize: number;
  /** Heading font */
  headingFont: string;
  /** Body font */
  bodyFont: string;
  /** Text alignment override (default: left) */
  textAlign?: "left" | "center" | "right" | "justify";
}

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  "industrial-pro": {
    id: "industrial-pro",
    name: "Industrial Pro",
    primary: "#111111",
    headerBg: null,
    headerText: "#111111",
    sectionTitle: "#111111",
    sectionStyle: "underline",
    bodySize: 10,
    headingFont: "'Calibri', 'Arial', 'Helvetica', sans-serif",
    bodyFont: "'Calibri', 'Arial', 'Helvetica', sans-serif",
  },
  "clean-slate": {
    id: "clean-slate",
    name: "Clean Slate",
    primary: "#334155",
    headerBg: null,
    headerText: "#1e293b",
    sectionTitle: "#334155",
    sectionStyle: "bordered",
    bodySize: 10.5,
    headingFont: "'Inter', 'Helvetica Neue', sans-serif",
    bodyFont: "'Inter', 'Helvetica Neue', sans-serif",
  },
  "executive-serif": {
    id: "executive-serif",
    name: "Executive Serif",
    primary: "#1e3a5f",
    headerBg: null,
    headerText: "#1e3a5f",
    sectionTitle: "#1e3a5f",
    sectionStyle: "underline",
    bodySize: 10.5,
    headingFont: "'Georgia', 'Times New Roman', serif",
    bodyFont: "'Georgia', 'Times New Roman', serif",
  },
  "fresh-graduate": {
    id: "fresh-graduate",
    name: "Fresh Graduate",
    primary: "#0d9488",
    headerBg: null,
    headerText: "#0f766e",
    sectionTitle: "#0d9488",
    sectionStyle: "minimal",
    bodySize: 10.5,
    headingFont: "'Open Sans', 'Segoe UI', sans-serif",
    bodyFont: "'Open Sans', 'Segoe UI', sans-serif",
  },
  "compact-pro": {
    id: "compact-pro",
    name: "Compact Pro",
    primary: "#1f2937",
    headerBg: null,
    headerText: "#111827",
    sectionTitle: "#1f2937",
    sectionStyle: "bordered",
    bodySize: 9.5,
    headingFont: "system-ui, 'Segoe UI', sans-serif",
    bodyFont: "system-ui, 'Segoe UI', sans-serif",
  },
};

/* ───────── format date helper (ATS-friendly) ───────── */

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Handle YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [y, m] = dateStr.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  }
  // Handle YYYY format
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  return dateStr;
}

/* ───────── ATS Profesional Renderer ───────── */

interface RendererProps {
  data: CvData;
  style: TemplateStyle;
  /** Section ordering — controls which sections appear & in what order */
  sectionOrder?: (SectionKey | string)[];
  /** Show horizontal dividers between sections */
  showDividers?: boolean;
  /** Language override — defaults to data.cvLang or "id" */
  lang?: "id" | "en";
  /** Click handler for sections — maps section key to edit step */
  onSectionClick?: (sectionKey: string) => void;
}

const CV_LABELS: Record<string, { id: string; en: string }> = {
  summary: { id: "RINGKASAN PROFESIONAL", en: "PROFESSIONAL SUMMARY" },
  experience: { id: "PENGALAMAN KERJA", en: "WORK EXPERIENCE" },
  education: { id: "PENDIDIKAN", en: "EDUCATION" },
  skills: { id: "KEAHLIAN", en: "SKILLS" },
  organizations: { id: "ORGANISASI & PROYEK", en: "ORGANIZATIONS & PROJECTS" },
  selfEvaluation: { id: "EVALUASI DIRI", en: "SELF EVALUATION" },
  skillsLabel: { id: "Keahlian:", en: "Skills:" },
  present: { id: "Sekarang", en: "Present" },
  namePlaceholder: { id: "NAMA LENGKAP ANDA", en: "YOUR FULL NAME" },
};

export function AtsBaseRenderer({ data, style, sectionOrder, showDividers, lang: langProp, sectionLabels: customLabels, headerLayout, lineHeight: lineHeightProp, onSectionClick }: RendererProps & { sectionLabels?: Record<SectionKey, string>; headerLayout?: "centered" | "left"; lineHeight?: number }) {
  const lang = langProp || data.cvLang || "id";
  const bodyFontSize = style.bodySize;
  const textAlign = style.textAlign || "left";
  const contactItems = [
    data.address,
    data.phone,
    data.email,
    data.linkedin,
    data.portfolioUrl,
  ].filter(Boolean);

  const order = sectionOrder ?? DEFAULT_SECTION_ORDER;

  /* ── Resolve section label (custom > built-in > key) ── */
  const L = (key: string) => {
    const customKey = data.sectionLabels?.[key] || customLabels?.[key as SectionKey];
    return customKey || CV_LABELS[key]?.[lang] || key;
  };

  /* ── skill grouping helper ── */
  const groupedSkills = useMemo(() => {
    const groups: Record<string, SkillEntry[]> = {
      technical: [],
      soft: [],
      tools: [],
    };
    for (const s of data.skills) {
      const cat = s.category || "technical";
      if (groups[cat]) groups[cat].push(s);
      else groups.technical.push(s);
    }
    return Object.entries(groups).filter(([, skills]) => skills.length > 0);
  }, [data.skills]);

  const CATEGORY_LABELS: Record<string, string> = {
    technical: lang === "en" ? "Technical" : "Teknis",
    soft: lang === "en" ? "Soft Skills" : "Soft Skills",
    tools: lang === "en" ? "Tools & Platform" : "Tools & Platform",
  };

  /* ── Filter visible items helper ── */
  const visibleWork = useMemo(
    () => data.workHistory.filter((w) => w.visible !== false),
    [data.workHistory]
  );
  const visibleEducation = useMemo(
    () => data.education.filter((e) => e.visible !== false),
    [data.education]
  );
  const visibleOrgs = useMemo(
    () => data.organisations.filter((o) => o.visible !== false),
    [data.organisations]
  );

  /* ── section renderers map ── */
  const sectionRenderers: Record<SectionKey, { render: () => React.ReactNode; label: string }> = {
    summary: {
      label: L("summary"),
      render: () =>
        data.summary ? (
          <>
            <SectionHeader title={L("summary")} style={style} />
            <p style={{ margin: 0, color: "#111111", lineHeight: lineHeightProp ?? 1.5, textAlign }}>
              {data.summary}
            </p>
          </>
        ) : null,
    },
    experience: {
      label: L("experience"),
      render: () =>
        visibleWork.length > 0 ? (
          <>
            <SectionHeader title={L("experience")} style={style} />
            {visibleWork.map((work, i) => (
              <div key={work.id || i} style={{ marginBottom: 12, pageBreakInside: "avoid", textAlign }}>
                {/* Company + Location — BOLD, primary row with date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: bodyFontSize, fontWeight: 700, color: "#111111" }}>
                    {work.company || "—"}{work.location ? `, ${work.location}` : ""}
                  </span>
                  <span
                    style={{
                      fontSize: bodyFontSize,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                    }}
                  >
                    {formatDate(work.startDate)}
                    {work.startDate && (work.endDate || work.isCurrent) ? " – " : ""}
                    {work.isCurrent ? L("present") : formatDate(work.endDate)}
                  </span>
                </div>
                {/* Position — italic, smaller, below company */}
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#444444",
                    margin: "0 0 3px 0",
                    fontSize: bodyFontSize - 1,
                  }}
                >
                  {work.position || "—"}
                </p>
                {work.companyDescription && (
                  <p style={{ fontSize: bodyFontSize - 1, color: "#666666", margin: "0 0 5px 0", fontStyle: "italic" }}>
                    {work.companyDescription}
                  </p>
                )}
                {/* Achievement highlight */}
                {work.achievement && (
                  <p
                    style={{
                      fontSize: bodyFontSize - 1,
                      fontWeight: 500,
                      color: "#111111",
                      margin: "0 0 5px 0",
                      padding: "3px 6px",
                      background: "#f0fdf4",
                      borderLeft: "3px solid #22c55e",
                      borderRadius: 2,
                    }}
                  >
                    ✦ {work.achievement}
                  </p>
                )}
                {work.description && (
                  <ul style={{ margin: "0 0 8px 0", paddingLeft: 20, listStyle: "disc" }}>
                    {work.description.split("\n").filter(Boolean).map((line, j) => (
                      <li key={j} style={{ marginBottom: 4, color: "#111111", textAlign }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Project URL */}
                {work.projectUrl && (
                  <p style={{ fontSize: bodyFontSize - 1, color: "#0066cc", margin: "0 0 4px 0" }}>
                    🔗 {work.projectUrl}
                  </p>
                )}
              </div>
            ))}
          </>
        ) : null,
    },
    education: {
      label: L("education"),
      render: () =>
        visibleEducation.length > 0 ? (
          <>
            <SectionHeader title={L("education")} style={style} />
            {visibleEducation.map((edu, i) => (
              <div key={edu.id || i} style={{ marginBottom: 12, pageBreakInside: "avoid", textAlign }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: bodyFontSize }}>
                    {edu.degree || "—"}{edu.field ? ` — ${edu.field}` : ""}
                  </span>
                  <span
                    style={{
                      fontSize: bodyFontSize,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                    }}
                  >
                    {formatDate(edu.startDate)}
                    {edu.startDate && edu.endDate ? " – " : ""}
                    {formatDate(edu.endDate)}
                  </span>
                </div>
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#444444",
                    margin: "0",
                    fontSize: bodyFontSize,
                  }}
                >
                  {edu.institution}
                </p>
                {edu.gpa && (
                  <p style={{ fontSize: bodyFontSize - 1, color: "#555555", margin: "2px 0 0 0" }}>
                    GPA: {edu.gpa}
                  </p>
                )}
              </div>
            ))}
          </>
        ) : null,
    },
    skills: {
      label: L("skills"),
      render: () =>
        data.skills.length > 0 ? (
          <>
            <SectionHeader title={L("skills")} style={style} />
            {/* Grouped skills by category */}
            {groupedSkills.map(([category, catSkills]) => (
              <div key={category} style={{ marginBottom: 8 }}>
                <p style={{ margin: "0 0 3px 0", color: "#111111", fontSize: bodyFontSize - 1, fontWeight: 600 }}>
                  {CATEGORY_LABELS[category] || category}:
                </p>
                <p style={{ margin: "0 0 6px 0", color: "#111111", textAlign }}>
                  {catSkills.map((s) => s.name).filter(Boolean).join(", ")}
                </p>
              </div>
            ))}
            {/* Certifications */}
            {data.certifications && data.certifications.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ margin: "0 0 4px 0", color: "#111111", fontWeight: 700, fontSize: bodyFontSize - 1 }}>
                  {lang === "en" ? "Certifications:" : "Sertifikasi:"}
                </p>
                {data.certifications.map((cert, i) => (
                  <p key={cert.id || i} style={{ margin: "0 0 2px 0", color: "#111111", fontSize: bodyFontSize - 1 }}>
                    • {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}{cert.year ? ` (${cert.year})` : ""}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : null,
    },
    organizations: {
      label: L("organizations"),
      render: () =>
        visibleOrgs.length > 0 ? (
          <>
            <SectionHeader title={L("organizations")} style={style} />
            {visibleOrgs.map((org, i) => (
              <div key={org.id || i} style={{ marginBottom: 12, pageBreakInside: "avoid", textAlign }}>
                {/* Organization name — BOLD, primary row with date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: bodyFontSize, fontWeight: 700, color: "#111111" }}>
                    {org.name || "—"}
                  </span>
                  <span
                    style={{
                      fontSize: bodyFontSize,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                    }}
                  >
                    {formatDate(org.startDate)}
                    {org.startDate && org.endDate ? " – " : ""}
                    {formatDate(org.endDate)}
                  </span>
                </div>
                {/* Position — italic, smaller, below org name */}
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#444444",
                    margin: "0 0 5px 0",
                    fontSize: bodyFontSize - 1,
                  }}
                >
                  {org.position || "—"}
                </p>
                {org.description && (
                  <ul style={{ margin: "0 0 8px 0", paddingLeft: 20, listStyle: "disc" }}>
                    {org.description.split("\n").filter(Boolean).map((line, j) => (
                      <li key={j} style={{ marginBottom: 4, color: "#111111", textAlign }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        ) : null,
    },
    selfEvaluation: {
      label: L("selfEvaluation"),
      render: () =>
        data.selfEvaluation ? (
          <>
            <SectionHeader title={L("selfEvaluation")} style={style} />
            <p style={{ margin: 0, color: "#111111", lineHeight: lineHeightProp ?? 1.5, textAlign }}>
              {data.selfEvaluation}
            </p>
          </>
        ) : null,
    },
  };

  return (
    <div
      style={{
        fontFamily: style.bodyFont,
        color: "#111111",
        fontSize: bodyFontSize,
        lineHeight: lineHeightProp ?? 1.5,
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      {/* ── HEADER ── */}
      <header style={{ textAlign: headerLayout === "left" ? "left" : "center", marginBottom: 25 }}>
        <h1
          style={{
            fontSize: Math.round(bodyFontSize * 2.2),
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            margin: "0 0 5px 0",
            color: "#111111",
            fontFamily: style.headingFont,
          }}
        >
          {data.fullName || "NAMA LENGKAP ANDA"}
        </h1>
        {/* Professional title (motto/jabatan profesional) — BUKAN jobTitle */}
        {data.professionalTitle && (
          <p
            style={{
              fontSize: bodyFontSize + 2,
              fontWeight: 700,
              color: "#333333",
              margin: "0 0 8px 0",
              fontFamily: style.headingFont,
            }}
          >
            {data.professionalTitle}
          </p>
        )}
        {/* Employment status badge */}
        {data.employmentStatus && (
          <p
            style={{
              fontSize: bodyFontSize - 1,
              color: "#666666",
              margin: "0 0 6px 0",
              fontStyle: "italic",
            }}
          >
            {data.employmentStatus}
          </p>
        )}
        {contactItems.length > 0 && (
          <p
            style={{
              fontSize: bodyFontSize - 1,
              color: "#555555",
              margin: 0,
            }}
          >
            {contactItems.join("  •  ")}
          </p>
        )}
        {/* Custom fields in header */}
        {data.customFields && data.customFields.length > 0 && (
          <p
            style={{
              fontSize: bodyFontSize - 1,
              color: "#555555",
              margin: "4px 0 0 0",
            }}
          >
            {data.customFields.map((f) => `${f.label}: ${f.value}`).filter(Boolean).join("  •  ")}
          </p>
        )}
      </header>

      {/* ── DYNAMIC SECTIONS (ordered by sectionOrder) ── */}
      {order.map((key, idx) => {
        const isPredefined = key in sectionRenderers;
        let content: React.ReactNode = null;

        if (isPredefined) {
          const sr = sectionRenderers[key as SectionKey];
          content = sr?.render() ?? null;
        } else {
          // Custom section — look up by ID
          const customSection = data.customSections?.find(cs => cs.id === key);
          if (customSection) {
            const lines = customSection.content.split('\n').filter(Boolean);
            content = (
              <>
                <SectionHeader title={customSection.title} style={style} />
                {customSection.contentType === "paragraph" ? (
                  <p style={{ margin: 0, color: "#111111", lineHeight: lineHeightProp ?? 1.5, textAlign: style.textAlign || "left" }}>
                    {customSection.content}
                  </p>
                ) : (
                  <ul style={{ margin: "0 0 8px 0", paddingLeft: 20, listStyle: "disc" }}>
                    {lines.map((line, j) => (
                      <li key={j} style={{ marginBottom: 4, color: "#111111", textAlign: style.textAlign || "left" }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          }
        }

        if (!content) return null;
        return (
          <div
            key={key}
            onClick={() => onSectionClick?.(key)}
            style={{ cursor: onSectionClick ? "pointer" : undefined }}
            title={onSectionClick ? "Klik untuk edit section ini" : undefined}
          >
            {showDividers && idx > 0 && (
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #cccccc",
                  margin: "16px 0",
                }}
              />
            )}
            <section
              style={{
                marginBottom: 20,
                transition: "background-color 0.15s",
                padding: "2px 4px",
                borderRadius: 4,
              }}
              className="cv-section-hover"
            >
              {content}
            </section>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── Section Header ───────── */

function SectionHeader({ title, style }: { title: string; style: TemplateStyle }) {
  const sectionBorder =
    style.sectionStyle === "bordered"
      ? { border: `2px solid ${style.sectionTitle}`, padding: "4px 8px", borderRadius: 2 }
      : style.sectionStyle === "minimal"
        ? { borderBottom: `2px solid ${style.primary}`, paddingBottom: 3 }
        : { borderBottom: `1px solid ${style.sectionTitle}`, paddingBottom: 3 };

  return (
    <h2
      style={{
        fontSize: style.bodySize + 1,
        fontWeight: 700,
        textTransform: "uppercase",
        margin: "0 0 12px 0",
        letterSpacing: 0.5,
        color: style.sectionTitle,
        ...sectionBorder,
      }}
    >
      {title}
    </h2>
  );
}
