/**
 * CvPdfDocument — Client-side vector PDF renderer (via @react-pdf/renderer).
 *
 * Why: produces a TRUE text PDF (selectable, ATS-readable, crisp at any zoom)
 * entirely in the browser — no server, no cold start, works on any Vercel plan.
 * Mirrors the on-screen AtsBaseRenderer layout so the PDF matches the preview.
 *
 * Imported ONLY via dynamic import (keeps the main bundle lean).
 */
import React from "react";
import { Document, Page, View, Text, Link } from "@react-pdf/renderer";
import {
  DEFAULT_SECTION_ORDER,
  type CvData,
  type SectionKey,
  type TemplateStyle,
} from "@/components/cv-templates";

/* ───────── helpers ───────── */

/** Map a CSS font-family string to a built-in PDF font (always ATS-safe). */
function toPdfFont(cssFont: string): string {
  return /serif|georgia|times/i.test(cssFont) ? "Times-Roman" : "Helvetica";
}

/** MM → points (react-pdf uses pt). */
const MM_TO_PT = 2.8346;

/** Same date formatting as the on-screen template. */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [y, m] = dateStr.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  }
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  return dateStr;
}

/* ───────── labels ───────── */

const CV_LABELS: Record<string, { id: string; en: string }> = {
  summary: { id: "RINGKASAN PROFESIONAL", en: "PROFESSIONAL SUMMARY" },
  experience: { id: "PENGALAMAN KERJA", en: "WORK EXPERIENCE" },
  education: { id: "PENDIDIKAN", en: "EDUCATION" },
  skills: { id: "KEAHLIAN", en: "SKILLS" },
  organizations: { id: "ORGANISASI & PROYEK", en: "ORGANIZATIONS & PROJECTS" },
  selfEvaluation: { id: "EVALUASI DIRI", en: "SELF EVALUATION" },
  present: { id: "Sekarang", en: "Present" },
  namePlaceholder: { id: "NAMA LENGKAP ANDA", en: "YOUR FULL NAME" },
};

const CATEGORY_LABELS_LOOKUP: Record<string, { id: string; en: string }> = {
  technical: { id: "Teknis", en: "Technical" },
  soft: { id: "Soft Skills", en: "Soft Skills" },
  tools: { id: "Tools & Platform", en: "Tools & Platform" },
};

const SECTION_RENDER_KEYS: Record<string, boolean> = {
  summary: true,
  experience: true,
  education: true,
  skills: true,
  organizations: true,
  selfEvaluation: true,
};

/* ───────── props ───────── */

export interface CvPdfDocumentProps {
  data: CvData;
  /** Resolved TemplateStyle (already overridden with builder font/size/align). */
  templateStyle: TemplateStyle;
  /** Section ordering — controls which sections appear & in what order. */
  sectionOrder?: (SectionKey | string)[];
  showDividers?: boolean;
  headerLayout?: "centered" | "left";
  lineHeight?: number;
  /** Page margin in mm — matches the builder's margin mode. */
  marginMm?: number;
  lang?: "id" | "en";
}

/* ───────── section header ───────── */

function PdfSectionHeader({ title, style }: { title: string; style: TemplateStyle }) {
  const bordered = style.sectionStyle === "bordered";
  const minimal = style.sectionStyle === "minimal";
  return (
    <View
      style={{
        marginBottom: 12,
        ...(bordered
          ? { borderWidth: 2, borderColor: style.sectionTitle, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 2 }
          : {
              paddingBottom: 3,
              borderBottomWidth: minimal ? 2 : 1,
              borderBottomColor: minimal ? style.primary : style.sectionTitle,
            }),
      }}
    >
      <Text
        style={{
          fontSize: style.bodySize + 1,
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: style.sectionTitle,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

/* ───────── main document ───────── */

export function CvPdfDocument({
  data,
  templateStyle: style,
  sectionOrder,
  showDividers,
  headerLayout,
  lineHeight,
  marginMm,
  lang: langProp,
}: CvPdfDocumentProps) {
  const lang = langProp || data.cvLang || "id";
  const bodySize = style.bodySize;
  const bodyFont = toPdfFont(style.bodyFont);
  const headingFont = toPdfFont(style.headingFont);
  const textAlign = style.textAlign || "left";
  const order = sectionOrder ?? DEFAULT_SECTION_ORDER;
  const marginPt = (marginMm ?? 20) * MM_TO_PT;

  const contactItems = [
    data.address,
    data.phone,
    data.email,
    data.linkedin,
    data.portfolioUrl,
  ].filter(Boolean);

  const L = (key: string) => {
    const customKey = data.sectionLabels?.[key];
    return customKey || CV_LABELS[key]?.[lang] || key;
  };

  /* ── skill grouping (same as template) ── */
  const groups: Record<string, typeof data.skills> = {
    technical: [],
    soft: [],
    tools: [],
  };
  for (const s of data.skills) {
    const cat = s.category || "technical";
    if (groups[cat]) groups[cat].push(s);
    else groups.technical.push(s);
  }
  const groupedSkills = Object.entries(groups).filter(([, skills]) => skills.length > 0);

  const visibleWork = data.workHistory.filter((w) => w.visible !== false);
  const visibleEducation = data.education.filter((e) => e.visible !== false);
  const visibleOrgs = data.organisations.filter((o) => o.visible !== false);

  const bulletsOf = (description: string) => description.split("\n").filter(Boolean);

  const sharedEntryText = { fontSize: bodySize, color: "#111111" };
  const mutedText = { fontSize: bodySize - 1, color: "#555555" };
  const italicMuted = { fontSize: bodySize - 1, color: "#444444", fontStyle: "italic" as const };

  /* ── section renderers ── */
  const sectionRenderers: Record<SectionKey, { render: () => React.ReactNode }> = {
    summary: {
      render: () =>
        data.summary ? (
          <>
            <PdfSectionHeader title={L("summary")} style={style} />
            <Text style={{ fontSize: bodySize, color: "#111111", textAlign }}>
              {data.summary}
            </Text>
          </>
        ) : null,
    },
    experience: {
      render: () =>
        visibleWork.length > 0 ? (
          <>
            <PdfSectionHeader title={L("experience")} style={style} />
            {visibleWork.map((work, i) => (
              <View key={work.id || i} style={{ marginBottom: 12, pageBreakInside: "avoid" } as any}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: bodySize, fontWeight: "bold", color: "#111111", flex: 1, paddingRight: 8 }}>
                    {work.company || "-"}
                    {work.location ? `, ${work.location}` : ""}
                  </Text>
                  <Text style={{ fontSize: bodySize, color: "#111111" }}>
                    {formatDate(work.startDate)}
                    {work.startDate && (work.endDate || work.isCurrent) ? " - " : ""}
                    {work.isCurrent ? L("present") : formatDate(work.endDate)}
                  </Text>
                </View>
                <Text style={{ ...italicMuted, marginBottom: 3 }}>
                  {work.position || "-"}
                </Text>
                {work.companyDescription && (
                  <Text style={{ fontSize: bodySize - 1, color: "#666666", marginBottom: 5, fontStyle: "italic" }}>
                    {work.companyDescription}
                  </Text>
                )}
                {work.achievement && (
                  <View
                    style={{
                      backgroundColor: "#f0fdf4",
                      borderLeftWidth: 3,
                      borderLeftColor: "#22c55e",
                      paddingVertical: 3,
                      paddingHorizontal: 6,
                      borderRadius: 2,
                      marginBottom: 5,
                    }}
                  >
                    <Text style={{ fontSize: bodySize - 1, fontWeight: 500, color: "#111111" }}>
                      •  {work.achievement}
                    </Text>
                  </View>
                )}
                {work.description && (
                  <View style={{ paddingLeft: 14, marginBottom: 8 }}>
                    {bulletsOf(work.description).map((line, j) => (
                      <Text key={j} style={{ ...sharedEntryText, marginBottom: 4, textAlign }}>
                        •  {line}
                      </Text>
                    ))}
                  </View>
                )}
                {work.projectUrl && (
                  <Link
                    src={work.projectUrl}
                    style={{ fontSize: bodySize - 1, color: "#0066cc", marginBottom: 4, textDecoration: "none" }}
                  >
                    {work.projectUrl}
                  </Link>
                )}
              </View>
            ))}
          </>
        ) : null,
    },
    education: {
      render: () =>
        visibleEducation.length > 0 ? (
          <>
            <PdfSectionHeader title={L("education")} style={style} />
            {visibleEducation.map((edu, i) => (
              <View key={edu.id || i} style={{ marginBottom: 12, pageBreakInside: "avoid" } as any}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: bodySize, fontWeight: "bold", color: "#111111", flex: 1, paddingRight: 8 }}>
                    {edu.degree || "-"}
                    {edu.field ? ` · ${edu.field}` : ""}
                  </Text>
                  <Text style={{ fontSize: bodySize, color: "#111111" }}>
                    {formatDate(edu.startDate)}
                    {edu.startDate && edu.endDate ? " - " : ""}
                    {formatDate(edu.endDate)}
                  </Text>
                </View>
                <Text style={{ ...italicMuted, marginBottom: 0 }}>{edu.institution}</Text>
                {edu.gpa && (
                  <Text style={{ fontSize: bodySize - 1, color: "#555555", marginTop: 2 }}>
                    GPA: {edu.gpa}
                  </Text>
                )}
              </View>
            ))}
          </>
        ) : null,
    },
    skills: {
      render: () =>
        data.skills.length > 0 ? (
          <>
            <PdfSectionHeader title={L("skills")} style={style} />
            {groupedSkills.map(([category, catSkills]) => (
              <View key={category} style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: bodySize - 1, fontWeight: 600, color: "#111111", marginBottom: 3 }}>
                  {CATEGORY_LABELS_LOOKUP[category]?.[lang] || category}:
                </Text>
                <Text style={{ fontSize: bodySize, color: "#111111", marginBottom: 6, textAlign }}>
                  {catSkills.map((s) => s.name).filter(Boolean).join(", ")}
                </Text>
              </View>
            ))}
            {data.certifications && data.certifications.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: bodySize - 1, fontWeight: "bold", color: "#111111", marginBottom: 4 }}>
                  {lang === "en" ? "Certifications:" : "Sertifikasi:"}
                </Text>
                {data.certifications.map((cert, i) => (
                  <Text key={cert.id || i} style={{ fontSize: bodySize - 1, color: "#111111", marginBottom: 2 }}>
                    •  {cert.name}
                    {cert.issuer ? ` · ${cert.issuer}` : ""}
                    {cert.year ? ` (${cert.year})` : ""}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : null,
    },
    organizations: {
      render: () =>
        visibleOrgs.length > 0 ? (
          <>
            <PdfSectionHeader title={L("organizations")} style={style} />
            {visibleOrgs.map((org, i) => (
              <View key={org.id || i} style={{ marginBottom: 12, pageBreakInside: "avoid" } as any}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: bodySize, fontWeight: "bold", color: "#111111", flex: 1, paddingRight: 8 }}>
                    {org.name || "-"}
                  </Text>
                  <Text style={{ fontSize: bodySize, color: "#111111" }}>
                    {formatDate(org.startDate)}
                    {org.startDate && org.endDate ? " – " : ""}
                    {formatDate(org.endDate)}
                  </Text>
                </View>
                <Text style={{ ...italicMuted, marginBottom: 5 }}>{org.position || "-"}</Text>
                {org.description && (
                  <View style={{ paddingLeft: 14, marginBottom: 8 }}>
                    {bulletsOf(org.description).map((line, j) => (
                      <Text key={j} style={{ ...sharedEntryText, marginBottom: 4, textAlign }}>
                        •  {line}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        ) : null,
    },
    selfEvaluation: {
      render: () =>
        data.selfEvaluation ? (
          <>
            <PdfSectionHeader title={L("selfEvaluation")} style={style} />
            <Text style={{ fontSize: bodySize, color: "#111111", textAlign }}>
              {data.selfEvaluation}
            </Text>
          </>
        ) : null,
    },
  };

  return (
    <Document
      title={`${data.fullName || "CV"} - Resume`}
      author={data.fullName || "AI Career Hub"}
      subject="Curriculum Vitae"
      creator="AI Career Hub"
      producer="AI Career Hub"
    >
      <Page
        size="A4"
        style={{
          padding: marginPt,
          fontFamily: bodyFont,
          color: "#111111",
          fontSize: bodySize,
          lineHeight: lineHeight ?? 1.5,
        }}
      >
        {/* ── HEADER ── */}
        <View
          style={{
            textAlign: headerLayout === "left" ? "left" : "center",
            marginBottom: 25,
          }}
        >
          <Text
            style={{
              fontSize: Math.round(bodySize * 2.2),
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 5,
              color: "#111111",
              fontFamily: headingFont,
            }}
          >
            {data.fullName || L("namePlaceholder")}
          </Text>
          {data.professionalTitle && (
            <Text
              style={{
                fontSize: bodySize + 2,
                fontWeight: "bold",
                color: "#333333",
                marginBottom: 8,
                fontFamily: headingFont,
              }}
            >
              {data.professionalTitle}
            </Text>
          )}
          {data.employmentStatus && (
            <Text
              style={{
                fontSize: bodySize - 1,
                color: "#666666",
                marginBottom: 6,
                fontStyle: "italic",
              }}
            >
              {data.employmentStatus}
            </Text>
          )}
          {contactItems.length > 0 && (
            <Text style={mutedText}>{contactItems.join("  •  ")}</Text>
          )}
          {data.customFields && data.customFields.length > 0 && (
            <Text style={{ ...mutedText, marginTop: 4 }}>
              {data.customFields.map((f) => `${f.label}: ${f.value}`).filter(Boolean).join("  •  ")}
            </Text>
          )}
        </View>

        {/* ── DYNAMIC SECTIONS ── */}
        {order.map((key, idx) => {
          const isPredefined = !!SECTION_RENDER_KEYS[key];
          let content: React.ReactNode = null;

          if (isPredefined) {
            const sr = sectionRenderers[key as SectionKey];
            content = sr?.render() ?? null;
          } else {
            const customSection = data.customSections?.find((cs) => cs.id === key);
            if (customSection) {
              content = (
                <>
                  <PdfSectionHeader title={customSection.title} style={style} />
                  {customSection.contentType === "paragraph" ? (
                    <Text style={{ fontSize: bodySize, color: "#111111" }}>
                      {customSection.content}
                    </Text>
                  ) : (
                    <View style={{ paddingLeft: 14 }}>
                      {bulletsOf(customSection.content).map((line, j) => (
                        <Text key={j} style={{ ...sharedEntryText, marginBottom: 4, textAlign }}>
                          •  {line}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              );
            }
          }

          if (!content) return null;
          return (
            <View key={key} style={{ marginBottom: 20 }}>
              {showDividers && idx > 0 && (
                <View style={{ borderTopWidth: 1, borderTopColor: "#cccccc", marginVertical: 16 }} />
              )}
              {content}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}