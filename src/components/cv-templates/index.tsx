import { Fragment, type ComponentType } from "react";
import { cvFontStack } from "@/lib/cv-fonts";
import { formatCertification, formatSkill, groupNamedSkills, namedCertifications } from "@/lib/cv-sections";

/**
 * Teks mode paragraf: baris yang diketik user dipertahankan (white-space:
 * pre-line), baris kosong dan spasi tepi dibuang. Tidak menambah tanda baca,
 * jadi teks di CV persis seperti yang ditulis.
 */
function paragraphText(text: string): string {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

/* ───────── shared types ───────── */

export interface WorkEntry {
  id: string;
  position: string;
  company: string;
  /** Optional company description, e.g., industry, size, or brief context */
  companyDescription?: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  /** Key achievement / metric highlight for this role */
  achievement?: string;
  isCurrent?: boolean;
  /** Visibility toggle, hide this entry from CV without deleting */
  visible?: boolean;
  /** Optional project/portfolio URL */
  projectUrl?: string;
  /** Bentuk deskripsi; tidak ada = "bullets" (perilaku lama). */
  descriptionType?: "bullets" | "paragraph";
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  /** Grade Point Average, useful for fresh graduates */
  gpa?: string;
  /** Visibility toggle, hide this entry from CV without deleting */
  visible?: boolean;
}

export interface OrganizationEntry {
  id: string;
  name: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  /** Bentuk deskripsi; tidak ada = "bullets" (perilaku lama). */
  descriptionType?: "bullets" | "paragraph";
  isPresent?: boolean;
  /** Visibility toggle, hide this entry from CV without deleting */
  visible?: boolean;
}

export interface SkillEntry {
  id: string;
  name: string;
  /** "" = level belum dipilih; tidak dirender. */
  level: "beginner" | "intermediate" | "advanced" | "";
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
  /** Content lines, each entry is a bullet point or paragraph */
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
  /** Self evaluation / objective, separate from summary */
  selfEvaluation?: string;
  /** Employment status, "Mencari Kerja", "Bekerja", "Freelance", etc. */
  employmentStatus?: string;
  /** Target position for AI guidance, NOT shown on CV paper */
  jobTitle: string;
  jobDescription: string;
  /** Professional title/motto shown on CV header (below name), optional */
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
  /** Custom section labels, user can rename section titles */
  sectionLabels?: Record<string, string>;
  /**
   * Pengaturan tampilan yang ikut tersimpan di server. Tidak ada = CV lama,
   * tampil dengan nilai bawaan builder (lihat LEGACY_LAYOUT di builder-format).
   */
  layout?: CvLayout;
}

/**
 * Pengaturan tampilan CV. Field yang tidak ada memakai gaya template
 * (font, ukuran, warna) atau nilai bawaan (spasi, margin, urutan).
 */
export interface CvLayout {
  fontFamily?: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  /** Garis di atas semua section; `dividers[key]` menimpa per section. */
  showDividers?: boolean;
  primaryColor?: string;
  spacingMode?: "compact" | "normal" | "spacious";
  headerLayout?: "centered" | "left";
  marginMode?: "tight" | "normal" | "wide";
  sectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;
  showSkillLevel?: boolean;
  /** Garis di atas section tertentu (true = ada, false = tidak ada). */
  dividers?: Record<string, boolean>;
  /** Bagian yang dihapus dari CV; isinya tetap tersimpan untuk "Pakai lagi". */
  removedSections?: string[];
  /**
   * Gaya per bagian. Kunci: "header", kunci section bawaan, atau id section
   * kustom. Field yang tidak ada mengikuti gaya global.
   */
  sectionStyles?: Record<string, BlockStyle>;
}

/** Gaya satu bagian CV; menimpa gaya global untuk bagian itu saja. */
export interface BlockStyle {
  /** Nilai `cvFontValue` dari daftar font CV. */
  fontFamily?: string;
  /** pt, 8–14. */
  fontSize?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  /** 1–2. */
  lineHeight?: number;
  /** Warna judul bagian (hex). Untuk header: warna nama. */
  titleColor?: string;
}

/* ───────── template style config ───────── */

export type SectionKey =
  | "summary"
  | "selfEvaluation"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "organizations";

/** Urutan bawaan. Section kosong tidak dirender, jadi aman ada di sini. */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "selfEvaluation",
  "experience",
  "education",
  "skills",
  "certifications",
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
  /** Heading font, nilai dari `cvFontValue` (nilai lama tetap dipetakan lewat `resolveCvFont`). */
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
    headingFont: "'CV Carlito', sans-serif",
    bodyFont: "'CV Carlito', sans-serif",
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
    headingFont: "'CV Inter', sans-serif",
    bodyFont: "'CV Inter', sans-serif",
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
    headingFont: "'CV Tinos', serif",
    bodyFont: "'CV Tinos', serif",
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
    headingFont: "'CV Open Sans', sans-serif",
    bodyFont: "'CV Open Sans', sans-serif",
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
    headingFont: "'CV Inter', sans-serif",
    bodyFont: "'CV Inter', sans-serif",
  },
};

/** Semua ukuran CV memakai pt agar pratinjau = ukuran cetak. */
const pt = (n: number) => `${n}pt`;

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

/** Props komponen teks yang bisa diedit (lihat EditableText, khusus pratinjau). */
export interface CvEditTextProps {
  path: string;
  value: string;
  /** Teks abu-abu saat kosong (mode edit saja). */
  placeholder?: string;
  /** false = teks biasa yang bisa diklik untuk lompat ke form (layar sentuh/kecil). */
  editable: boolean;
  onEdit: (path: string, value: string) => void;
  /** Satu sesi edit selesai (blur) dengan nilai berubah; untuk undo. */
  onSession: (path: string, before: string, after: string) => void;
  /** Data field ini diubah dari luar selama diedit; ketikan di pratinjau dibuang. */
  onConflict?: (path: string) => void;
}

/**
 * Mode edit pratinjau. Renderer tetap murni (tanpa hook) karena juga dirender
 * di server untuk PDF; komponen edit disuntikkan dari pratinjau. Tanpa
 * `edit` (mode cetak) HTML-nya sama persis dengan sebelum ada fitur edit.
 */
export interface CvEditBindings {
  Text: ComponentType<CvEditTextProps>;
  editable: boolean;
  onEdit: CvEditTextProps["onEdit"];
  onSession: CvEditTextProps["onSession"];
  onConflict?: CvEditTextProps["onConflict"];
}

interface RendererProps {
  data: CvData;
  style: TemplateStyle;
  /** Section ordering, controls which sections appear & in what order */
  sectionOrder?: (SectionKey | string)[];
  /** Garis di atas semua section (kecuali yang pertama). */
  showDividers?: boolean;
  /** Garis per section; menimpa `showDividers` untuk section tsb. */
  dividers?: Record<string, boolean>;
  /** Pratinjau saja: tombol tambah/hapus garis di atas section. */
  onToggleDivider?: (sectionKey: string) => void;
  /** Language override, defaults to data.cvLang or "id" */
  lang?: "id" | "en";
  /** Click handler for sections, maps section key to edit step */
  onSectionClick?: (sectionKey: string) => void;
  /** Tampilkan level di belakang nama skill, mis. "React (Mahir)". */
  showSkillLevel?: boolean;
  /** Gaya per bagian (layout.sectionStyles). */
  sectionStyles?: Record<string, BlockStyle>;
  /** Pratinjau saja: bagian yang sedang diatur gayanya (diberi outline). */
  selectedSection?: string | null;
  /** Pratinjau saja: teks bisa diedit/diklik (lihat CvEditBindings). */
  edit?: CvEditBindings;
}

const CV_LABELS: Record<string, { id: string; en: string }> = {
  summary: { id: "RINGKASAN PROFESIONAL", en: "PROFESSIONAL SUMMARY" },
  experience: { id: "PENGALAMAN KERJA", en: "WORK EXPERIENCE" },
  education: { id: "PENDIDIKAN", en: "EDUCATION" },
  skills: { id: "KEAHLIAN", en: "SKILLS" },
  organizations: { id: "ORGANISASI & PROYEK", en: "ORGANIZATIONS & PROJECTS" },
  selfEvaluation: { id: "EVALUASI DIRI", en: "SELF EVALUATION" },
  certifications: { id: "SERTIFIKASI", en: "CERTIFICATIONS" },
  skillsLabel: { id: "Keahlian:", en: "Skills:" },
  present: { id: "Sekarang", en: "Present" },
  namePlaceholder: { id: "NAMA LENGKAP ANDA", en: "YOUR FULL NAME" },
};

export function AtsBaseRenderer({ data, style, sectionOrder, showDividers, dividers, onToggleDivider, lang: langProp, sectionLabels: customLabels, headerLayout, lineHeight: lineHeightProp, onSectionClick, showSkillLevel = false, sectionStyles, selectedSection, edit }: RendererProps & { sectionLabels?: Record<SectionKey, string>; headerLayout?: "centered" | "left"; lineHeight?: number }) {
  const lang = langProp || data.cvLang || "id";
  const contacts = (
    [
      ["address", data.address],
      ["phone", data.phone],
      ["email", data.email],
      ["linkedin", data.linkedin],
      ["portfolioUrl", data.portfolioUrl],
    ] as const
  ).filter(([, v]) => v) as unknown as [string, string][];
  const contactItems = contacts.map(([, v]) => v);

  /**
   * Teks satu field. Mode cetak: string biasa (`value || fallback`), sama
   * seperti sebelumnya. Mode edit: komponen edit dengan data-cv-path.
   */
  const T = (path: string, value: string | undefined, fallback?: string, placeholder?: string): React.ReactNode =>
    edit ? (
      <edit.Text path={path} value={value ?? ""} placeholder={placeholder ?? fallback} editable={edit.editable} onEdit={edit.onEdit} onSession={edit.onSession} onConflict={edit.onConflict} />
    ) : fallback !== undefined ? (
      value || fallback
    ) : (
      value
    );
  /** Atribut target klik (lompat ke form); kosong di mode cetak. */
  const P = (path: string): Record<string, string> => (edit ? { "data-cv-path": path } : {});

  const order = sectionOrder ?? DEFAULT_SECTION_ORDER;

  /* ── Resolve section label (custom > built-in > key) ── */
  const L = (key: string) => {
    const customKey = data.sectionLabels?.[key] || customLabels?.[key as SectionKey];
    return customKey || CV_LABELS[key]?.[lang] || key;
  };

  /* ── skill grouping helper (hanya skill bernama) ── */
  const groupedSkills = groupNamedSkills(data.skills);
  const certifications = namedCertifications(data.certifications);

  const CATEGORY_LABELS: Record<string, string> = {
    technical: lang === "en" ? "Technical" : "Teknis",
    soft: lang === "en" ? "Soft Skills" : "Soft Skills",
    tools: lang === "en" ? "Tools & Platform" : "Tools & Platform",
  };

  /* ── Filter visible items helper ── */
  const visibleWork = data.workHistory.filter((w) => w.visible !== false);
  const visibleEducation = data.education.filter((e) => e.visible !== false);
  const visibleOrgs = data.organisations.filter((o) => o.visible !== false);

  /* ── Gaya efektif per bagian: template → global → layout.sectionStyles[key] ── */
  const globalStyle = style;
  const globalLineHeight = lineHeightProp;
  const styleOf = (key: string): { st: TemplateStyle; lh: number | undefined; o: BlockStyle | undefined } => {
    const o = sectionStyles?.[key];
    if (!o) return { st: globalStyle, lh: globalLineHeight, o };
    return {
      st: {
        ...globalStyle,
        ...(o.fontSize !== undefined ? { bodySize: o.fontSize } : {}),
        ...(o.fontFamily ? { bodyFont: o.fontFamily, headingFont: o.fontFamily } : {}),
        ...(o.textAlign ? { textAlign: o.textAlign } : {}),
        ...(o.titleColor ? { sectionTitle: o.titleColor } : {}),
      },
      lh: o.lineHeight ?? globalLineHeight,
      o,
    };
  };
  /** Gaya turunan (font/ukuran/spasi) di pembungkus bagian; kosong bila tidak ada override. */
  const blockCss = (o: BlockStyle | undefined): React.CSSProperties =>
    o
      ? {
          ...(o.fontFamily ? { fontFamily: cvFontStack(o.fontFamily) } : {}),
          ...(o.fontSize !== undefined ? { fontSize: pt(o.fontSize) } : {}),
          ...(o.lineHeight !== undefined ? { lineHeight: o.lineHeight } : {}),
        }
      : {};

  /* ── section renderers map ── */
  const buildRenderers = (style: TemplateStyle, lineHeightProp: number | undefined) => {
  const bodyFontSize = style.bodySize;
  const textAlign = style.textAlign || "left";
  const sectionRenderers: Record<SectionKey, { render: () => React.ReactNode; label: string }> = {
    summary: {
      label: L("summary"),
      render: () =>
        data.summary ? (
          <>
            <SectionHeader title={T("sectionLabels.summary", L("summary"))} style={style} />
            <p style={{ margin: 0, color: "#111111", lineHeight: lineHeightProp ?? 1.5, textAlign }}>
              {T("summary", data.summary)}
            </p>
          </>
        ) : null,
    },
    experience: {
      label: L("experience"),
      render: () =>
        visibleWork.length > 0 ? (
          <>
            <SectionHeader title={T("sectionLabels.experience", L("experience"))} style={style} />
            {visibleWork.map((work, i) => (
              <div key={work.id || i} style={{ marginBottom: pt(12), breakInside: "avoid", textAlign }}>
                {/* Company + Location, BOLD, primary row with date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: pt(bodyFontSize), fontWeight: 700, color: "#111111" }}>
                    {edit ? (
                      <>
                        {T(`workHistory.${work.id}.company`, work.company, "-", "Perusahaan")}
                        {work.location ? <>{", "}{T(`workHistory.${work.id}.location`, work.location)}</> : null}
                      </>
                    ) : (
                      <>{work.company || "-"}{work.location ? `, ${work.location}` : ""}</>
                    )}
                  </span>
                  <span
                    {...P(`workHistory.${work.id}.startDate`)}
                    style={{
                      fontSize: pt(bodyFontSize),
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      marginLeft: pt(8),
                    }}
                  >
                    {formatDate(work.startDate)}
                    {work.startDate && (work.endDate || work.isCurrent) ? " - " : ""}
                    {work.isCurrent ? L("present") : formatDate(work.endDate)}
                  </span>
                </div>
                {/* Position, italic, smaller, below company */}
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#444444",
                    margin: "0 0 3pt 0",
                    fontSize: pt(bodyFontSize - 1),
                  }}
                >
                  {T(`workHistory.${work.id}.position`, work.position, "-", "Posisi")}
                </p>
                {work.companyDescription && (
                  <p {...P(`workHistory.${work.id}.companyDescription`)} style={{ fontSize: pt(bodyFontSize - 1), color: "#666666", margin: "0 0 5pt 0", fontStyle: "italic" }}>
                    {work.companyDescription}
                  </p>
                )}
                {/* Achievement highlight */}
                {work.achievement && (
                  <p
                    {...P(`workHistory.${work.id}.achievement`)}
                    style={{
                      fontSize: pt(bodyFontSize - 1),
                      fontWeight: 400,
                      color: "#111111",
                      margin: "0 0 5pt 0",
                      padding: "3pt 6pt",
                      background: "#f0fdf4",
                      borderLeft: "3pt solid #22c55e",
                      borderRadius: pt(2),
                    }}
                  >
                    {work.achievement}
                  </p>
                )}
                {work.description && (work.descriptionType === "paragraph" ? (
                  <p {...P(`workHistory.${work.id}.description`)} style={{ margin: "0 0 8pt 0", color: "#111111", lineHeight: lineHeightProp ?? 1.5, textAlign, whiteSpace: "pre-line" }}>
                    {paragraphText(work.description)}
                  </p>
                ) : (
                  <ul style={{ margin: "0 0 8pt 0", paddingLeft: pt(20), listStyle: "disc" }}>
                    {work.description.split("\n").filter(Boolean).map((line, j) => (
                      <li key={j} {...P(`workHistory.${work.id}.description.${j}`)} style={{ marginBottom: pt(4), color: "#111111", textAlign }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                ))}
                {/* Project URL */}
                {work.projectUrl && (
                  <p {...P(`workHistory.${work.id}.projectUrl`)} style={{ fontSize: pt(bodyFontSize - 1), color: "#0066cc", margin: "0 0 4pt 0" }}>
                    {work.projectUrl}
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
            <SectionHeader title={T("sectionLabels.education", L("education"))} style={style} />
            {visibleEducation.map((edu, i) => (
              <div key={edu.id || i} style={{ marginBottom: pt(12), breakInside: "avoid", textAlign }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: pt(bodyFontSize) }}>
                    {edit ? (
                      <>
                        {T(`education.${edu.id}.degree`, edu.degree, "-", "Gelar")}
                        {edu.field ? <>{" · "}{T(`education.${edu.id}.field`, edu.field)}</> : null}
                      </>
                    ) : (
                      <>{edu.degree || "-"}{edu.field ? ` · ${edu.field}` : ""}</>
                    )}
                  </span>
                  <span
                    {...P(`education.${edu.id}.startDate`)}
                    style={{
                      fontSize: pt(bodyFontSize),
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      marginLeft: pt(8),
                    }}
                  >
                    {formatDate(edu.startDate)}
                    {edu.startDate && edu.endDate ? " - " : ""}
                    {formatDate(edu.endDate)}
                  </span>
                </div>
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#444444",
                    margin: "0",
                    fontSize: pt(bodyFontSize),
                  }}
                >
                  {T(`education.${edu.id}.institution`, edu.institution, undefined, "Institusi")}
                </p>
                {edu.gpa && (
                  <p {...P(`education.${edu.id}.gpa`)} style={{ fontSize: pt(bodyFontSize - 1), color: "#555555", margin: "2pt 0 0 0" }}>
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
        groupedSkills.length > 0 ? (
          <>
            <SectionHeader title={T("sectionLabels.skills", L("skills"))} style={style} />
            {/* Grouped skills by category */}
            {groupedSkills.map(([category, catSkills]) => (
              <div key={category} {...P("skills")} style={{ marginBottom: pt(8) }}>
                <p style={{ margin: "0 0 3pt 0", color: "#111111", fontSize: pt(bodyFontSize - 1), fontWeight: 700 }}>
                  {CATEGORY_LABELS[category] || category}:
                </p>
                <p style={{ margin: "0 0 6pt 0", color: "#111111", textAlign }}>
                  {catSkills.map((s) => formatSkill(s, showSkillLevel, lang)).join(", ")}
                </p>
              </div>
            ))}
          </>
        ) : null,
    },
    certifications: {
      label: L("certifications"),
      render: () =>
        certifications.length > 0 ? (
          <>
            <SectionHeader title={T("sectionLabels.certifications", L("certifications"))} style={style} />
            {certifications.map((cert, i) => (
              <p key={cert.id || i} {...P(`certifications.${cert.id}`)} style={{ margin: "0 0 2pt 0", color: "#111111", fontSize: pt(bodyFontSize - 1) }}>
                • {formatCertification(cert)}
              </p>
            ))}
          </>
        ) : null,
    },
    organizations: {
      label: L("organizations"),
      render: () =>
        visibleOrgs.length > 0 ? (
          <>
            <SectionHeader title={T("sectionLabels.organizations", L("organizations"))} style={style} />
            {visibleOrgs.map((org, i) => (
              <div key={org.id || i} style={{ marginBottom: pt(12), breakInside: "avoid", textAlign }}>
                {/* Organization name, BOLD, primary row with date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: pt(bodyFontSize), fontWeight: 700, color: "#111111" }}>
                    {T(`organisations.${org.id}.name`, org.name, "-", "Organisasi")}
                  </span>
                  <span
                    {...P(`organisations.${org.id}.startDate`)}
                    style={{
                      fontSize: pt(bodyFontSize),
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      marginLeft: pt(8),
                    }}
                  >
                    {formatDate(org.startDate)}
                    {org.startDate && org.endDate ? " – " : ""}
                    {formatDate(org.endDate)}
                  </span>
                </div>
                {/* Position, italic, smaller, below org name */}
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#444444",
                    margin: "0 0 5pt 0",
                    fontSize: pt(bodyFontSize - 1),
                  }}
                >
                  {T(`organisations.${org.id}.position`, org.position, "-", "Jabatan")}
                </p>
                {org.description && (org.descriptionType === "paragraph" ? (
                  <p {...P(`organisations.${org.id}.description`)} style={{ margin: "0 0 8pt 0", color: "#111111", lineHeight: lineHeightProp ?? 1.5, textAlign, whiteSpace: "pre-line" }}>
                    {paragraphText(org.description)}
                  </p>
                ) : (
                  <ul style={{ margin: "0 0 8pt 0", paddingLeft: pt(20), listStyle: "disc" }}>
                    {org.description.split("\n").filter(Boolean).map((line, j) => (
                      <li key={j} {...P(`organisations.${org.id}.description.${j}`)} style={{ marginBottom: pt(4), color: "#111111", textAlign }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                ))}
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
            <SectionHeader title={T("sectionLabels.selfEvaluation", L("selfEvaluation"))} style={style} />
            <p style={{ margin: 0, color: "#111111", lineHeight: lineHeightProp ?? 1.5, textAlign }}>
              {T("selfEvaluation", data.selfEvaluation)}
            </p>
          </>
        ) : null,
    },
  };
  return sectionRenderers;
  };

  const header = styleOf("header");
  const hs = header.st;
  const headerAlign = header.o?.textAlign ?? (headerLayout === "left" ? "left" : "center");

  return (
    <div
      style={{
        fontFamily: cvFontStack(style.bodyFont),
        color: "#111111",
        fontSize: pt(style.bodySize),
        lineHeight: lineHeightProp ?? 1.5,
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{ textAlign: headerAlign, marginBottom: pt(25), ...blockCss(header.o), ...(onSectionClick ? { position: "relative", cursor: "pointer" } : {}) }}
        // Atribut pratinjau saja; mode cetak tetap HTML yang sama seperti sebelumnya.
        {...(onSectionClick
          ? { "data-cv-section": "header", "data-cv-selected": selectedSection === "header" ? "" : undefined, onClick: () => onSectionClick("header") }
          : {})}
      >
        {onSectionClick && header.o && <span className="cv-style-dot" aria-hidden="true" title="Bagian ini punya gaya sendiri" />}
        <h1
          style={{
            fontSize: pt(Math.round(hs.bodySize * 2.2)),
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: pt(0.5),
            margin: "0 0 5pt 0",
            color: header.o?.titleColor ?? "#111111",
            fontFamily: cvFontStack(hs.headingFont),
          }}
        >
          {T("fullName", data.fullName, "NAMA LENGKAP ANDA")}
        </h1>
        {/* Professional title (motto/jabatan profesional), BUKAN jobTitle */}
        {data.professionalTitle && (
          <p
            style={{
              fontSize: pt(hs.bodySize + 2),
              fontWeight: 700,
              color: "#333333",
              margin: "0 0 8pt 0",
              fontFamily: cvFontStack(hs.headingFont),
            }}
          >
            {T("professionalTitle", data.professionalTitle)}
          </p>
        )}
        {/* Employment status badge */}
        {data.employmentStatus && (
          <p
            {...P("employmentStatus")}
            style={{
              fontSize: pt(hs.bodySize - 1),
              color: "#666666",
              margin: "0 0 6pt 0",
              fontStyle: "italic",
            }}
          >
            {data.employmentStatus}
          </p>
        )}
        {contactItems.length > 0 && (
          <p
            style={{
              fontSize: pt(hs.bodySize - 1),
              color: "#555555",
              margin: 0,
            }}
          >
            {edit
              ? contacts.map(([k, v], i) => (
                  <Fragment key={k}>
                    {i > 0 ? "  •  " : null}
                    {T(k, v)}
                  </Fragment>
                ))
              : contactItems.join("  •  ")}
          </p>
        )}
        {/* Custom fields in header */}
        {data.customFields && data.customFields.length > 0 && (
          <p
            {...P("customFields")}
            style={{
              fontSize: pt(hs.bodySize - 1),
              color: "#555555",
              margin: "4pt 0 0 0",
            }}
          >
            {data.customFields.map((f) => `${f.label}: ${f.value}`).filter(Boolean).join("  •  ")}
          </p>
        )}
      </header>

      {/* ── DYNAMIC SECTIONS (ordered by sectionOrder) ── */}
      {order
        .map((key) => {
        const isPredefined = (DEFAULT_SECTION_ORDER as string[]).includes(key);
        let content: React.ReactNode = null;

        const { st: style, lh: lineHeightProp } = styleOf(key);
        if (isPredefined) {
          const sr = buildRenderers(style, lineHeightProp)[key as SectionKey];
          content = sr?.render() ?? null;
        } else {
          // Custom section, look up by ID
          const customSection = data.customSections?.find(cs => cs.id === key);
          if (customSection) {
            const lines = customSection.content.split('\n').filter(Boolean);
            content = lines.length === 0 ? null : (
              <>
                <SectionHeader title={T(`customSections.${customSection.id}.title`, customSection.title)} style={style} />
                {customSection.contentType === "paragraph" ? (
                  <p {...P(`customSections.${customSection.id}`)} style={{ margin: 0, color: "#111111", lineHeight: lineHeightProp ?? 1.5, textAlign: style.textAlign || "left", whiteSpace: "pre-line" }}>
                    {paragraphText(customSection.content)}
                  </p>
                ) : (
                  <ul style={{ margin: "0 0 8pt 0", paddingLeft: pt(20), listStyle: "disc" }}>
                    {lines.map((line, j) => (
                      <li key={j} {...P(`customSections.${customSection.id}`)} style={{ marginBottom: pt(4), color: "#111111", textAlign: style.textAlign || "left" }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          }
        }
        return { key, content };
        })
        // Section kosong tidak dirender, jadi garis dihitung dari section yang tampil.
        .filter((s) => s.content)
        .map(({ key, content }, idx) => {
        const hasDivider = idx > 0 && (dividers?.[key] ?? showDividers ?? false);
        return (
          <div
            key={key}
            data-cv-section={key}
            // Mode edit (klik & hover) hanya di pratinjau; mode cetak tanpa handler.
            {...(onSectionClick
              ? { onClick: () => onSectionClick(key), title: "Klik untuk edit section ini" }
              : {})}
            {...(onSectionClick && selectedSection === key ? { "data-cv-selected": "" } : {})}
            style={{ cursor: onSectionClick ? "pointer" : undefined, position: onToggleDivider || onSectionClick ? "relative" : undefined }}
          >
            {onSectionClick && sectionStyles?.[key] && <span className="cv-style-dot" aria-hidden="true" title="Bagian ini punya gaya sendiri" />}
            {onToggleDivider && idx > 0 && (
              // Tombol melayang (absolute) agar tidak menggeser tata letak pratinjau.
              <button
                type="button"
                className="cv-divider-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDivider(key);
                }}
                aria-label={hasDivider ? "Hapus garis di atas bagian ini" : "Tambah garis di atas bagian ini"}
                title={hasDivider ? "Hapus garis" : "Tambah garis"}
              >
                {hasDivider ? "× garis" : "+ garis"}
              </button>
            )}
            {hasDivider && (
              <hr
                style={{
                  border: "none",
                  borderTop: "1pt solid #cccccc",
                  margin: "16pt 0",
                }}
              />
            )}
            <section
              style={{
                marginBottom: pt(20),
                padding: "2pt 4pt",
                borderRadius: pt(4),
                ...blockCss(sectionStyles?.[key]),
              }}
              className={onSectionClick ? "cv-section-hover" : undefined}
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

function SectionHeader({ title, style }: { title: React.ReactNode; style: TemplateStyle }) {
  const sectionBorder =
    style.sectionStyle === "bordered"
      ? { border: `2pt solid ${style.sectionTitle}`, padding: "4pt 8pt", borderRadius: pt(2) }
      : style.sectionStyle === "minimal"
        ? { borderBottom: `2pt solid ${style.primary}`, paddingBottom: pt(3) }
        : { borderBottom: `1pt solid ${style.sectionTitle}`, paddingBottom: pt(3) };

  return (
    <h2
      style={{
        fontSize: pt(style.bodySize + 1),
        fontWeight: 700,
        textTransform: "uppercase",
        margin: "0 0 12pt 0",
        letterSpacing: pt(0.5),
        color: style.sectionTitle,
        // Judul section tidak boleh sendirian di bawah halaman.
        breakAfter: "avoid",
        ...sectionBorder,
      }}
    >
      {title}
    </h2>
  );
}
