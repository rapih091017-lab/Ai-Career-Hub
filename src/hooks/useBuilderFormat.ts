"use client";

import { useState, useEffect } from "react";
import { migrateSavedFormat, readSavedFormat } from "@/lib/builder-format";
import { DEFAULT_SECTION_ORDER } from "@/components/cv-templates";
import type { SectionKey, CustomSectionEntry } from "@/components/cv-templates";

/* ───────── Format & Display Settings ───────── */

interface UseBuilderFormatProps {
  cvId: string;
}

export function useBuilderFormat({ cvId }: UseBuilderFormatProps) {
  const FORMAT_KEY = `cv_fmt_${cvId}`;

  /* ── Editorial / Display Settings ── */
  const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");
  const [fontSize, setFontSize] = useState(11);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [showDividers, setShowDividers] = useState(false);
  const [customPrimaryColor, setCustomPrimaryColor] = useState("");
  const [spacingMode, setSpacingMode] = useState<"compact" | "normal" | "spacious">("normal");
  const [headerLayout, setHeaderLayout] = useState<"centered" | "left">("centered");
  const [marginMode, setMarginMode] = useState<"tight" | "normal" | "wide">("normal");

  const [sectionOrder, setSectionOrder] = useState<(SectionKey | string)[]>([
    ...DEFAULT_SECTION_ORDER,
    "lainnya",
  ]);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    summary: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
    selfEvaluation: true,
    organizations: true,
  });
  // Level skill tidak dirender kecuali user menyalakannya (keputusan K3).
  const [showSkillLevel, setShowSkillLevel] = useState(false);
  const [customSections, setCustomSections] = useState<CustomSectionEntry[]>([
    { id: "lainnya", title: "Lainnya", content: "", contentType: "bullets" },
  ]);

  /* ── Modal states ── */
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [showSectionOrderModal, setShowSectionOrderModal] = useState(false);

  /* ── PDF Export state ── */
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  // Key format yang sudah selesai dimuat. Selama belum sama dengan FORMAT_KEY,
  // effect simpan dilewati agar nilai default tidak menimpa localStorage
  // sebelum format tersimpan sempat dibaca.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  /* ── Save formatting to localStorage on change ── */
  useEffect(() => {
    if (loadedKey !== FORMAT_KEY) return;
    try {
      localStorage.setItem(
        FORMAT_KEY,
        JSON.stringify({
          fontFamily,
          fontSize,
          textAlign,
          showDividers,
          sectionOrder,
          customPrimaryColor,
          spacingMode,
          headerLayout,
          sectionVisibility,
          customSections,
          marginMode,
          showSkillLevel,
        }),
      );
    } catch {
      /* quota, silent */
    }
  }, [
    fontFamily,
    fontSize,
    textAlign,
    showDividers,
    sectionOrder,
    FORMAT_KEY,
    loadedKey,
    customPrimaryColor,
    spacingMode,
    headerLayout,
    sectionVisibility,
    marginMode,
    customSections,
    showSkillLevel,
  ]);

  /* ── Load formatting from localStorage on mount ── */
  useEffect(() => {
    // Nilai invalid dibuang; urutan section lama dimigrasi (certifications,
    // selfEvaluation, dan section bawaan yang hilang disisipkan kembali).
    const parsed = migrateSavedFormat(readSavedFormat(FORMAT_KEY));
    if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
    if (parsed.fontSize) setFontSize(parsed.fontSize);
    if (parsed.textAlign) setTextAlign(parsed.textAlign);
    if (parsed.showDividers !== undefined) setShowDividers(parsed.showDividers);
    if (parsed.sectionOrder) setSectionOrder(parsed.sectionOrder);
    if (parsed.customPrimaryColor !== undefined) setCustomPrimaryColor(parsed.customPrimaryColor);
    if (parsed.spacingMode) setSpacingMode(parsed.spacingMode);
    if (parsed.headerLayout) setHeaderLayout(parsed.headerLayout);
    if (parsed.sectionVisibility) setSectionVisibility(parsed.sectionVisibility);
    if (parsed.customSections) setCustomSections(parsed.customSections);
    if (parsed.marginMode) setMarginMode(parsed.marginMode);
    if (parsed.showSkillLevel !== undefined) setShowSkillLevel(parsed.showSkillLevel);
    setLoadedKey(FORMAT_KEY);
  }, [FORMAT_KEY]);

  /* ── Computed margin & page dimensions ── */
  const MARGIN_VALUES = { tight: 10, normal: 20, wide: 30 } as const;
  const marginPadding = MARGIN_VALUES[marginMode];
  const contentAreaMm = 297 - 2 * marginPadding; // A4 height minus top+bottom margin

  return {
    // Font
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    textAlign, setTextAlign,
    showDividers, setShowDividers,
    // Color
    customPrimaryColor, setCustomPrimaryColor,
    // Spacing
    spacingMode, setSpacingMode,
    headerLayout, setHeaderLayout,
    marginMode, setMarginMode,
    // Section
    sectionOrder, setSectionOrder,
    sectionVisibility, setSectionVisibility,
    customSections, setCustomSections,
    showSkillLevel, setShowSkillLevel,
    // Modals
    showDisplaySettings, setShowDisplaySettings,
    showSectionOrderModal, setShowSectionOrderModal,
    // PDF
    isPdfExporting, setIsPdfExporting,
    // Computed
    MARGIN_VALUES,
    marginPadding,
    contentAreaMm,
  };
}
