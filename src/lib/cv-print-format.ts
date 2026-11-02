import { DEFAULT_SECTION_ORDER, TEMPLATE_STYLES, type CvData, type CustomSectionEntry, type SectionKey, type TemplateStyle } from "@/components/cv-templates";
import { DEFAULT_CUSTOM_SECTIONS, LEGACY_LAYOUT } from "@/lib/builder-format";

/**
 * Format tampilan CV untuk renderer. Dibentuk dari `CvData.layout` (lihat
 * `cvPrintFormatFromData`), jadi pratinjau dan PDF di server membaca
 * sumber yang sama: data CV di DB.
 */
export interface CvPrintFormat {
  templateId?: string;
  fontFamily?: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  showDividers?: boolean;
  dividers?: Record<string, boolean>;
  customPrimaryColor?: string;
  spacingMode?: "compact" | "normal" | "spacious";
  headerLayout?: "centered" | "left";
  marginMode?: "tight" | "normal" | "wide";
  sectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;
  removedSections?: string[];
  customSections?: CustomSectionEntry[];
  showSkillLevel?: boolean;
}

/**
 * Format renderer dari data CV. CV tanpa `layout` (data lama) memakai
 * LEGACY_LAYOUT, nilai yang dulu selalu dipakai builder, supaya tampilannya
 * tidak berubah. Field layout yang kosong mengikuti gaya template.
 */
export function cvPrintFormatFromData(data: CvData, templateId?: string): CvPrintFormat {
  const l = data.layout ?? LEGACY_LAYOUT;
  return {
    templateId,
    fontFamily: l.fontFamily,
    fontSize: l.fontSize,
    textAlign: l.textAlign,
    showDividers: l.showDividers,
    dividers: l.dividers,
    customPrimaryColor: l.primaryColor,
    spacingMode: l.spacingMode,
    headerLayout: l.headerLayout,
    marginMode: l.marginMode,
    sectionOrder: l.sectionOrder,
    sectionVisibility: l.sectionVisibility,
    removedSections: l.removedSections,
    customSections: data.customSections ?? DEFAULT_CUSTOM_SECTIONS,
    showSkillLevel: l.showSkillLevel,
  };
}

export const MARGIN_MM = { tight: 10, normal: 20, wide: 30 } as const;
export const LINE_HEIGHT = { compact: 1.3, normal: 1.5, spacious: 1.8 } as const;

export interface CvRenderProps {
  data: CvData;
  style: TemplateStyle;
  sectionOrder: (SectionKey | string)[];
  showDividers: boolean;
  dividers?: Record<string, boolean>;
  headerLayout: "centered" | "left";
  lineHeight: number;
  lang: "id" | "en";
  showSkillLevel: boolean;
}

/**
 * Satu-satunya tempat format builder diubah menjadi props renderer.
 * Dipakai pratinjau dan server PDF, jadi keduanya tidak bisa berbeda.
 */
export function cvRenderProps(data: CvData, format: CvPrintFormat, fallbackTemplateId?: string): CvRenderProps & { marginMm: number } {
  const templateId =
    format.templateId && TEMPLATE_STYLES[format.templateId] ? format.templateId : fallbackTemplateId;
  const base = TEMPLATE_STYLES[templateId ?? ""] || TEMPLATE_STYLES["industrial-pro"];
  const font = format.fontFamily || base.bodyFont;
  const visibility = format.sectionVisibility ?? {};
  const customSections: CustomSectionEntry[] | undefined = format.customSections ?? data.customSections;
  return {
    data: { ...data, customSections },
    style: {
      ...base,
      bodySize: format.fontSize ?? base.bodySize,
      bodyFont: font,
      headingFont: font,
      textAlign: format.textAlign ?? base.textAlign ?? "left",
      ...(format.customPrimaryColor ? { primary: format.customPrimaryColor, sectionTitle: format.customPrimaryColor } : {}),
    },
    sectionOrder: (format.sectionOrder ?? [...DEFAULT_SECTION_ORDER, "lainnya"]).filter(
      // Bagian yang dihapus tidak dirender walau isinya masih tersimpan.
      (key) => visibility[key] !== false && !format.removedSections?.includes(key),
    ),
    showDividers: format.showDividers ?? false,
    dividers: format.dividers,
    headerLayout: format.headerLayout ?? "centered",
    lineHeight: LINE_HEIGHT[format.spacingMode ?? "normal"],
    lang: data.cvLang === "en" ? "en" : "id",
    showSkillLevel: format.showSkillLevel ?? false,
    marginMm: MARGIN_MM[format.marginMode ?? "normal"],
  };
}
