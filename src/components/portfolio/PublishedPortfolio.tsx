"use client";

import { THEMES, DEFAULT_THEME_ID } from "./themes";
import PortfolioDocument, {
  type PortfolioSectionColors,
} from "./render/PortfolioDocument";
import type {
  PortfolioData,
  SectionId,
  SectionVisibility,
  ThemeDefinition,
} from "./types";

export interface PublishedPortfolioProps {
  /**
   * `sectionColors` ikut di dalam data karena disimpan di jsonb yang sama;
   * halaman publik harus meneruskannya supaya warna per section sama dengan
   * yang dilihat di builder.
   */
  data: PortfolioData & { sectionColors?: PortfolioSectionColors };
  themeId: string;
  sectionOrder?: SectionId[];
  sectionVisibility?: SectionVisibility;
  showFooter?: boolean;
}

/**
 * Render portfolio publik. Pohon section-nya milik `PortfolioDocument`;
 * file ini hanya pembungkus chrome halaman (footer).
 */
export default function PublishedPortfolio({
  data,
  themeId,
  sectionOrder,
  sectionVisibility,
  showFooter = true,
}: PublishedPortfolioProps) {
  const theme: ThemeDefinition = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const name =
    [data.formData?.heroFirstName, data.formData?.heroLastName]
      .filter(Boolean)
      .join(" ") || "Nama Lengkap";

  return (
    <div>
      <PortfolioDocument
        data={data}
        themeId={theme.id}
        mode="static"
        sectionOrder={sectionOrder}
        sectionVisibility={sectionVisibility}
        sectionColors={data.sectionColors ?? null}
      />

      {showFooter && (
        <footer
          className="text-center py-8"
          style={{
            color: theme.colors.textMuted,
            borderTop: `1px solid ${theme.colors.border}`,
            fontSize: 13,
          }}
        >
          &copy; {new Date().getFullYear()} {name}. Dibuat dengan AI Career Hub
        </footer>
      )}
    </div>
  );
}
