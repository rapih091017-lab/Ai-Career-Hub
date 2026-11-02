"use client";

import { motion, AnimatePresence } from "motion/react";
import { AtsScoreRing } from "@/components/builder/AtsScoreRing";
import MagneticButton from "@/components/MagneticButton";
import { PdfExportButton } from "@/components/checker/PdfExportButton";
import { useTranslation } from "@/lib/i18n";
import { CV_FONTS, cvFontValue, resolveCvFont } from "@/lib/cv-fonts";
import { TemplatePopover } from "@/components/builder/TemplatePopover";

const FONT_OPTIONS = [
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Roboto, sans-serif", label: "Roboto" },
];

/** Pilihan font untuk gaya per bagian: hanya font CV (sesuai sanitasi). */
const BLOCK_FONT_OPTIONS = CV_FONTS.map((f) => ({ value: cvFontValue(f), label: f.label }));

const LINE_HEIGHT_OPTIONS = [1, 1.15, 1.3, 1.5, 1.8, 2];

/** Konteks toolbar: tanpa bagian terpilih = gaya global. */
export interface BlockStyleControls {
  targets: { key: string; label: string }[];
  /** Bagian yang sedang diatur; null = semua (global). */
  target: string | null;
  onTargetChange: (key: string | null) => void;
  /** Bagian terpilih punya gaya sendiri. */
  hasStyle: boolean;
  lineHeight: number;
  titleColor: string;
  onLineHeightChange: (v: number | undefined) => void;
  onTitleColorChange: (v: string | undefined) => void;
  onApplyAll: () => void;
  onReset: () => void;
}

interface FormatToolbarProps {
  block: BlockStyleControls;
  cvCompleteness: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
  computeAtsScore: number;
  fontFamily: string;
  fontSize: number;
  textAlign: "left" | "center" | "right" | "justify";
  showDividers: boolean;
  reducedMotion: boolean;
  isPdfExporting: boolean;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onTextAlignChange: (value: "left" | "center" | "right" | "justify") => void;
  onDividersToggle: () => void;
  onOpenSectionOrder: () => void;
  onOpenDisplaySettings: () => void;
  onNavigateToCheckout: () => void;
  onExportPdf: () => Promise<void>;
  templateId: string;
  onTemplateChange: (id: string) => void;
  hasStyleOverrides: boolean;
  onResetStyle: () => void;
}

export function FormatToolbar({
  block,
  cvCompleteness,
  saveStatus,
  lastSaved,
  computeAtsScore,
  fontFamily,
  fontSize,
  textAlign,
  showDividers,
  reducedMotion,
  isPdfExporting,
  onFontFamilyChange,
  onFontSizeChange,
  onTextAlignChange,
  onDividersToggle,
  onOpenSectionOrder,
  onOpenDisplaySettings,
  onNavigateToCheckout,
  onExportPdf,
  templateId,
  onTemplateChange,
  hasStyleOverrides,
  onResetStyle,
}: FormatToolbarProps) {
  // Font dari template (bukan salah satu pilihan) tetap ditampilkan apa adanya.
  const sectionMode = block.target !== null;
  const fontOptions = sectionMode ? BLOCK_FONT_OPTIONS : FONT_OPTIONS;
  const fontKnown = fontOptions.some((o) => o.value === fontFamily);
  const sizeMin = sectionMode ? 8 : 9;
  const sizeMax = sectionMode ? 14 : 12;
  const targetLabel = block.targets.find((x) => x.key === block.target)?.label ?? "";
  const { t } = useTranslation();
  return (
    <div className="relative h-auto px-3 md:px-4 py-2 border-b border-outline-variant/50 flex flex-wrap items-center gap-2 bg-surface-container-lowest shadow-sm z-20 shrink-0">
      {/* CV Completeness Bar */}
      <div className="flex items-center gap-1.5 shrink-0" title={`CV ${cvCompleteness}% ${t("builder.complete")}`}>
        <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-500 ${
              cvCompleteness >= 100 ? "bg-green/100" : cvCompleteness >= 50 ? "bg-primary" : "bg-amber-500"
            }`}
            style={{ width: `${cvCompleteness}%` }}
          />
        </div>
        <span className="text-[9px] font-bold text-on-surface-variant w-6 text-right">{cvCompleteness}%</span>
      </div>

      {/* Auto-save status */}
      <AnimatePresence>
        {saveStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 shadow-sm ${
              saveStatus === "saving" ? "text-amber-700 bg-amber-50 border border-amber-200" :
              saveStatus === "saved" ? "text-green-deep bg-green/10 border border-green/25" :
              "text-on-error-container bg-error-container border border-error/30 animate-[shake_0.3s_ease-in-out]"
            }`}
          >
            <span className={`material-symbols-outlined text-[14px] ${saveStatus === "saving" ? "animate-spin" : ""}`}>
              {saveStatus === "saving" ? "sync" : saveStatus === "saved" ? "check_circle" : "error"}
            </span>
            <span>
              {saveStatus === "saving" ? t("builder.saving-short") : saveStatus === "saved" ? t("builder.saved") : t("builder.save-error")}
            </span>
            {saveStatus === "saved" && lastSaved && (
              <span className="text-[9px] text-green-600/60 font-normal ml-0.5">
                {lastSaved.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ATS Score */}
      <AtsScoreRing score={computeAtsScore} />

      {/* Template */}
      <TemplatePopover templateId={templateId} onSelect={onTemplateChange} hasOverrides={hasStyleOverrides} onResetStyle={onResetStyle} />

      {/* Pilih bagian: tanpa pilihan = gaya global. Juga satu-satunya cara memilih di layar sentuh. */}
      <label className="flex items-center gap-1 text-xs text-on-surface-variant">
        <span className="whitespace-nowrap">Atur bagian:</span>
        <select
          value={block.target ?? ""}
          onChange={(e) => block.onTargetChange(e.target.value || null)}
          className="bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary max-w-[150px]"
        >
          <option value="">Semua</option>
          {block.targets.map((x) => (
            <option key={x.key} value={x.key}>{x.label}</option>
          ))}
        </select>
      </label>

      {/* Font family */}
      <select value={fontFamily} onChange={(e) => onFontFamilyChange(e.target.value)} aria-label="Font"
        className="bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary max-w-[120px]"
      >
        {!fontKnown && <option value={fontFamily}>{resolveCvFont(fontFamily).label}{sectionMode ? "" : " (template)"}</option>}
        {fontOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Font size */}
      <div className="flex items-center gap-1 bg-surface-container-low rounded-lg px-1.5 py-1">
        <button onClick={() => onFontSizeChange(Math.max(sizeMin, fontSize - 1))} className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant" aria-label={t("builder.font-small")}>
          <span className="material-symbols-outlined text-sm">remove</span>
        </button>
        <span className="text-xs font-bold w-6 text-center select-none">{fontSize}pt</span>
        <button onClick={() => onFontSizeChange(Math.min(sizeMax, fontSize + 1))} className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant" aria-label={t("builder.font-large")}>
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
      </div>

      {/* Text alignment */}
      <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 gap-0.5">
        {(["left", "center", "right", "justify"] as const).map((align) => {
          const label =
            align === "left"
              ? t("builder.align-left")
              : align === "center"
                ? t("builder.align-center")
                : align === "right"
                  ? t("builder.align-right")
                  : t("builder.align-justify");
          return (
            <button key={align} onClick={() => onTextAlignChange(align)}
              className={`p-1.5 rounded ${textAlign === align ? "bg-surface-container-lowest shadow-sm" : "hover:bg-surface-container-highest/60"}`}
              title={label}
              aria-label={label}
            >
              <span className="material-symbols-outlined text-sm">{align === "left" ? "format_align_left" : align === "center" ? "format_align_center" : align === "right" ? "format_align_right" : "format_align_justify"}</span>
            </button>
          );
        })}
      </div>

      {sectionMode && (
        <>
          <select
            value={String(block.lineHeight)}
            onChange={(e) => block.onLineHeightChange(Number(e.target.value))}
            aria-label="Jarak baris bagian ini"
            title="Jarak baris"
            className="bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary"
          >
            {!LINE_HEIGHT_OPTIONS.includes(block.lineHeight) && <option value={String(block.lineHeight)}>{block.lineHeight}</option>}
            {LINE_HEIGHT_OPTIONS.map((v) => (
              <option key={v} value={String(v)}>Baris {v}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-on-surface-variant" title="Warna judul bagian">
            <input
              type="color"
              value={block.titleColor}
              onChange={(e) => block.onTitleColorChange(e.target.value)}
              aria-label="Warna judul bagian ini"
              className="h-7 w-7 cursor-pointer rounded border border-outline-variant/50 bg-transparent p-0"
            />
          </label>
        </>
      )}

      {/* Divider toggle */}
      <button onClick={onDividersToggle}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${showDividers ? "bg-primary/10 text-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant"}`}
        title={t("builder.dividers-tip")}
      >
        <span className="material-symbols-outlined text-sm">horizontal_rule</span>
        <span className="hidden sm:inline">{t("builder.dividers")}</span>
      </button>

      {/* Section order */}
      <button onClick={onOpenSectionOrder}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-variant transition-colors"
        title={t("builder.section-order-tip")}
      >
        <span className="material-symbols-outlined text-sm">reorder</span>
        <span className="hidden sm:inline">{t("builder.section-order")}</span>
      </button>

      {/* Display Settings */}
      <button onClick={onOpenDisplaySettings}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-variant transition-colors"
        title={t("builder.display-tip")}
      >
        <span className="material-symbols-outlined text-sm">palette</span>
        <span className="hidden sm:inline">{t("builder.display")}</span>
      </button>

      {/* AI Revision, FAB Style */}
      <MagneticButton>
        <button onClick={onNavigateToCheckout}
          className="relative flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 rounded-full border-[2.5px] border-ink bg-lime text-xs font-bold text-on-light shadow-[0_2px_0_rgb(var(--c-ink))] overflow-hidden"
          title={t("builder.ai-opt-tip")}
        >
          <span className="material-symbols-outlined text-sm relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span className="relative z-10 hidden sm:inline">{t("builder.ai-opt")}</span>
        </button>
      </MagneticButton>

      {/* Export PDF, using shared PdfExportButton */}
      <div className="ml-auto">
        <PdfExportButton
          targetRef={{ current: null }}
          mode="builder"
          onBuilderExport={onExportPdf}
          externalLoading={isPdfExporting}
          label="PDF"
          fileName="CV.pdf"
        />
      </div>

      {sectionMode && (
        <div className="flex w-full flex-wrap items-center gap-2 border-t border-outline-variant/40 pt-2 text-xs">
          <span className="font-semibold text-on-surface">Mengatur: {targetLabel}</span>
          <span className="text-on-surface-variant">{block.hasStyle ? "Gaya khusus bagian ini" : "Masih ikut gaya global"}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" onClick={block.onApplyAll} disabled={!block.hasStyle}
              className="min-h-9 rounded-lg bg-surface-container-low px-2.5 font-medium text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              Terapkan ke semua
            </button>
            <button type="button" onClick={block.onReset} disabled={!block.hasStyle}
              className="min-h-9 rounded-lg bg-surface-container-low px-2.5 font-medium text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              Reset bagian ini
            </button>
            <button type="button" onClick={() => block.onTargetChange(null)}
              className="min-h-9 rounded-lg px-2.5 font-medium text-on-surface-variant hover:bg-surface-variant"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}