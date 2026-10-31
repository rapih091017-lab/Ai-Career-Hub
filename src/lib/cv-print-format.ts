import { z } from "zod";
import { DEFAULT_SECTION_ORDER, TEMPLATE_STYLES, type CvData, type CustomSectionEntry, type SectionKey, type TemplateStyle } from "@/components/cv-templates";

/**
 * Format tampilan CV yang dikirim builder ke route PDF. Format masih
 * tersimpan di localStorage, jadi server menerimanya dari klien dan
 * memvalidasinya di sini. Data CV sendiri selalu dibaca dari DB.
 */
export const CvPrintFormatSchema = z.object({
  templateId: z.string().max(50).optional(),
  fontFamily: z.string().max(200).optional(),
  fontSize: z.number().min(6).max(30).optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  showDividers: z.boolean().optional(),
  customPrimaryColor: z.union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{3,8}$/)]).optional(),
  spacingMode: z.enum(["compact", "normal", "spacious"]).optional(),
  headerLayout: z.enum(["centered", "left"]).optional(),
  marginMode: z.enum(["tight", "normal", "wide"]).optional(),
  sectionOrder: z.array(z.string().max(100)).max(60).optional(),
  sectionVisibility: z.record(z.string().max(100), z.boolean()).optional(),
  customSections: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        title: z.string().max(100),
        content: z.string().max(5_000),
        contentType: z.enum(["paragraph", "bullets"]).optional(),
      }),
    )
    // Batas sementara selama section kustom masih dikirim klien (issue 00 memindahkannya ke DB).
    .max(10)
    .optional(),
  showSkillLevel: z.boolean().optional(),
});

export type CvPrintFormat = z.infer<typeof CvPrintFormatSchema>;

export const MARGIN_MM = { tight: 10, normal: 20, wide: 30 } as const;
export const LINE_HEIGHT = { compact: 1.3, normal: 1.5, spacious: 1.8 } as const;

export interface CvRenderProps {
  data: CvData;
  style: TemplateStyle;
  sectionOrder: (SectionKey | string)[];
  showDividers: boolean;
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
      textAlign: format.textAlign ?? "left",
      ...(format.customPrimaryColor ? { primary: format.customPrimaryColor, sectionTitle: format.customPrimaryColor } : {}),
    },
    sectionOrder: (format.sectionOrder ?? [...DEFAULT_SECTION_ORDER, "lainnya"]).filter(
      (key) => visibility[key] !== false,
    ),
    showDividers: format.showDividers ?? false,
    headerLayout: format.headerLayout ?? "centered",
    lineHeight: LINE_HEIGHT[format.spacingMode ?? "normal"],
    lang: data.cvLang === "en" ? "en" : "id",
    showSkillLevel: format.showSkillLevel ?? false,
    marginMm: MARGIN_MM[format.marginMode ?? "normal"],
  };
}
