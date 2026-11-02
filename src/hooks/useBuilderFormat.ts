"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  DEFAULT_CUSTOM_SECTIONS,
  LEGACY_LAYOUT,
  mergeLocalFormat,
  migrateSavedFormat,
  readSavedFormat,
  sanitizeLayout,
  sectionHasContent,
} from "@/lib/builder-format";
import { DEFAULT_SECTION_ORDER, TEMPLATE_STYLES } from "@/components/cv-templates";
import type { CvData, CvLayout, SectionKey, CustomSectionEntry } from "@/components/cv-templates";

/* ───────── Format & Display Settings ───────── */

interface UseBuilderFormatProps {
  cvId: string;
  cvData: CvData;
  setCvData: React.Dispatch<React.SetStateAction<CvData>>;
  /** true setelah CV selesai dimuat tanpa error; migrasi localStorage baru jalan setelahnya. */
  ready: boolean;
  templateId: string;
  /** Simpan ke server sekarang (autosave flush); dipakai sebelum key localStorage lama dihapus. */
  flush?: () => Promise<boolean>;
}

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

const DEFAULT_VISIBILITY: Record<string, boolean> = {
  summary: true,
  experience: true,
  education: true,
  skills: true,
  certifications: true,
  selfEvaluation: true,
  organizations: true,
};

const MARGIN_VALUES = { tight: 10, normal: 20, wide: 30 } as const;

/** Key localStorage lama (sebelum layout tersimpan di server). */
export const legacyFormatKey = (cvId: string) => `cv_fmt_${cvId}`;

/**
 * Pengaturan tampilan CV. Sumber utama = `cvData.layout` dan
 * `cvData.customSections`, jadi ikut tersimpan oleh autosave. Format lama di
 * localStorage dimigrasi sekali ke cvData lalu key-nya dihapus setelah
 * tersimpan di server.
 */
export function useBuilderFormat({ cvId, cvData, setCvData, ready, templateId, flush }: UseBuilderFormatProps) {
  const template = TEMPLATE_STYLES[templateId] ?? TEMPLATE_STYLES["industrial-pro"];
  const layout: CvLayout = cvData.layout ?? LEGACY_LAYOUT;

  const fontFamily = layout.fontFamily ?? template.bodyFont;
  const fontSize = layout.fontSize ?? template.bodySize;
  const textAlign = layout.textAlign ?? template.textAlign ?? "left";
  const showDividers = layout.showDividers ?? false;
  const dividers = useMemo(() => layout.dividers ?? {}, [layout.dividers]);
  const customPrimaryColor = layout.primaryColor ?? "";
  const spacingMode = layout.spacingMode ?? "normal";
  const headerLayout = layout.headerLayout ?? "centered";
  const marginMode = layout.marginMode ?? "normal";
  const showSkillLevel = layout.showSkillLevel ?? false;
  const sectionOrder = useMemo<(SectionKey | string)[]>(
    () => layout.sectionOrder ?? [...DEFAULT_SECTION_ORDER, "lainnya"],
    [layout.sectionOrder],
  );
  const sectionVisibility = useMemo(
    () => ({ ...DEFAULT_VISIBILITY, ...(layout.sectionVisibility ?? {}) }),
    [layout.sectionVisibility],
  );
  const customSections = cvData.customSections ?? DEFAULT_CUSTOM_SECTIONS;

  const setters = useMemo(() => {
    /** Setter satu field layout; menerima nilai atau fungsi seperti useState. */
    const mk =
      <T>(read: (l: CvLayout) => T, write: (l: CvLayout, v: T) => CvLayout): SetState<T> =>
      (v) =>
        setCvData((prev) => {
          const base = prev.layout ?? { ...LEGACY_LAYOUT };
          const next = typeof v === "function" ? (v as (p: T) => T)(read(base)) : v;
          return { ...prev, layout: write(base, next) };
        });
    return {
      setFontFamily: mk<string>(
        (l) => l.fontFamily ?? template.bodyFont,
        (l, v) => ({ ...l, fontFamily: v }),
      ),
      setFontSize: mk<number>(
        (l) => l.fontSize ?? template.bodySize,
        (l, v) => ({ ...l, fontSize: v }),
      ),
      setTextAlign: mk<"left" | "center" | "right" | "justify">(
        (l) => l.textAlign ?? "left",
        (l, v) => ({ ...l, textAlign: v }),
      ),
      // Toggle global = "semua garis on/off": override per section ikut dihapus.
      setShowDividers: mk<boolean>(
        (l) => l.showDividers ?? false,
        (l, v) => ({ ...l, showDividers: v, dividers: {} }),
      ),
      setDividers: mk<Record<string, boolean>>(
        (l) => l.dividers ?? {},
        (l, v) => ({ ...l, dividers: v }),
      ),
      setCustomPrimaryColor: mk<string>(
        (l) => l.primaryColor ?? "",
        (l, v) => {
          const { primaryColor: _old, ...rest } = l;
          return v ? { ...rest, primaryColor: v } : rest;
        },
      ),
      setSpacingMode: mk<"compact" | "normal" | "spacious">(
        (l) => l.spacingMode ?? "normal",
        (l, v) => ({ ...l, spacingMode: v }),
      ),
      setHeaderLayout: mk<"centered" | "left">(
        (l) => l.headerLayout ?? "centered",
        (l, v) => ({ ...l, headerLayout: v }),
      ),
      setMarginMode: mk<"tight" | "normal" | "wide">(
        (l) => l.marginMode ?? "normal",
        (l, v) => ({ ...l, marginMode: v }),
      ),
      setShowSkillLevel: mk<boolean>(
        (l) => l.showSkillLevel ?? false,
        (l, v) => ({ ...l, showSkillLevel: v }),
      ),
      setSectionOrder: mk<(SectionKey | string)[]>(
        (l) => l.sectionOrder ?? [...DEFAULT_SECTION_ORDER, "lainnya"],
        (l, v) => ({ ...l, sectionOrder: v }),
      ),
      setSectionVisibility: mk<Record<string, boolean>>(
        (l) => ({ ...DEFAULT_VISIBILITY, ...(l.sectionVisibility ?? {}) }),
        (l, v) => ({ ...l, sectionVisibility: v }),
      ),
    };
  }, [setCvData, template]);
  const {
    setFontFamily,
    setFontSize,
    setTextAlign,
    setShowDividers,
    setDividers,
    setCustomPrimaryColor,
    setSpacingMode,
    setHeaderLayout,
    setMarginMode,
    setShowSkillLevel,
    setSectionOrder,
    setSectionVisibility,
  } = setters;

  const setCustomSections: SetState<CustomSectionEntry[]> = useCallback(
    (v) =>
      setCvData((prev) => {
        const cur = prev.customSections ?? DEFAULT_CUSTOM_SECTIONS;
        return { ...prev, customSections: typeof v === "function" ? v(cur) : v };
      }),
    [setCvData],
  );

  /** Tambah/hapus garis di atas satu section (nilai efektif dibalik). */
  const toggleDivider = useCallback(
    (key: string) =>
      setCvData((prev) => {
        const l = prev.layout ?? { ...LEGACY_LAYOUT };
        const current = l.dividers?.[key] ?? l.showDividers ?? false;
        return { ...prev, layout: { ...l, dividers: { ...(l.dividers ?? {}), [key]: !current } } };
      }),
    [setCvData],
  );

  /** Hapus override global (font, ukuran, rata, warna) → kembali ke gaya template. */
  const resetToTemplateStyle = useCallback(
    () =>
      setCvData((prev) => {
        const { fontFamily: _f, fontSize: _s, textAlign: _t, primaryColor: _c, ...rest } = prev.layout ?? { ...LEGACY_LAYOUT };
        return { ...prev, layout: rest };
      }),
    [setCvData],
  );

  /* ── Modal states ── */
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [showSectionOrderModal, setShowSectionOrderModal] = useState(false);

  /* ── PDF Export state ── */
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  /* ── Migrasi sekali dari localStorage ── */
  const migratedFor = useRef<string | null>(null);
  const [pendingKeyRemoval, setPendingKeyRemoval] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || migratedFor.current === cvId) return;
    migratedFor.current = cvId;
    const key = legacyFormatKey(cvId);
    const raw = readSavedFormat(key);
    if (!raw) return;
    const saved = migrateSavedFormat(raw);
    const merged = mergeLocalFormat(cvData, saved);
    if (!merged) {
      // Tidak ada yang perlu dipindah (sudah sama dengan server): buang key tanpa PUT.
      try {
        localStorage.removeItem(key);
      } catch {
        /* storage tidak bisa diakses */
      }
      return;
    }
    // Dihitung ulang dari state terbaru di updater; server menang untuk nilai yang sudah dipilih.
    setCvData((prev) => mergeLocalFormat(prev, saved) ?? prev);
    setPendingKeyRemoval(key);
    // cvData sengaja tidak jadi dependensi: migrasi hanya sekali per CV.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cvId, setCvData]);

  // Key lama baru dihapus setelah layout hasil migrasi tersimpan di server.
  useEffect(() => {
    if (!pendingKeyRemoval || !flush) return;
    let alive = true;
    void flush().then((ok) => {
      if (!alive || !ok) return;
      try {
        localStorage.removeItem(pendingKeyRemoval);
      } catch {
        /* storage tidak bisa diakses */
      }
      setPendingKeyRemoval(null);
    });
    return () => {
      alive = false;
    };
  }, [pendingKeyRemoval, flush]);

  /* ── Computed margin & page dimensions ── */
  const marginPadding = MARGIN_VALUES[marginMode];
  const contentAreaMm = 297 - 2 * marginPadding; // A4 height minus top+bottom margin

  return {
    // Font
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    textAlign,
    setTextAlign,
    showDividers,
    setShowDividers,
    dividers,
    setDividers,
    toggleDivider,
    resetToTemplateStyle,
    // Color
    customPrimaryColor,
    setCustomPrimaryColor,
    // Spacing
    spacingMode,
    setSpacingMode,
    headerLayout,
    setHeaderLayout,
    marginMode,
    setMarginMode,
    // Section
    sectionOrder,
    setSectionOrder,
    sectionVisibility,
    setSectionVisibility,
    customSections,
    setCustomSections,
    showSkillLevel,
    setShowSkillLevel,
    // Modals
    showDisplaySettings,
    setShowDisplaySettings,
    showSectionOrderModal,
    setShowSectionOrderModal,
    // PDF
    isPdfExporting,
    setIsPdfExporting,
    // Computed
    MARGIN_VALUES,
    marginPadding,
    contentAreaMm,
  };
}
