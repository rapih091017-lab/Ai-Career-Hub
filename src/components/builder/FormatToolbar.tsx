"use client";

import { motion, AnimatePresence } from "motion/react";
import { AtsScoreRing } from "@/components/builder/AtsScoreRing";
import MagneticButton from "@/components/MagneticButton";
import { PdfExportButton } from "@/components/checker/PdfExportButton";
import { useTranslation } from "@/lib/i18n";

interface FormatToolbarProps {
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
}

export function FormatToolbar({
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
}: FormatToolbarProps) {
  const { t } = useTranslation();
  return (
    <div className="h-auto px-3 md:px-4 py-2 border-b border-outline-variant/30 flex flex-wrap items-center gap-2 bg-white shadow-sm z-20 shrink-0">
      {/* CV Completeness Bar */}
      <div className="flex items-center gap-1.5 shrink-0" title={`CV ${cvCompleteness}% ${t("builder.complete")}`}>
        <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-500 ${
              cvCompleteness >= 100 ? "bg-green-500" : cvCompleteness >= 50 ? "bg-primary" : "bg-amber-500"
            }`}
            style={{ width: `${cvCompleteness}%` }}
          />
        </div>
        <span className="text-[9px] font-bold text-outline w-6 text-right">{cvCompleteness}%</span>
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
              saveStatus === "saved" ? "text-green-700 bg-green-50 border border-green-200" :
              "text-red-700 bg-red-50 border border-red-200 animate-[shake_0.3s_ease-in-out]"
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

      {/* Font family */}
      <select value={fontFamily} onChange={(e) => onFontFamilyChange(e.target.value)}
        className="bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary max-w-[120px]"
      >
        <option value="'Inter', sans-serif">Inter</option>
        <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="'Times New Roman', serif">Times New Roman</option>
        <option value="Roboto, sans-serif">Roboto</option>
      </select>

      {/* Font size */}
      <div className="flex items-center gap-1 bg-surface-container-low rounded-lg px-1.5 py-1">
        <button onClick={() => onFontSizeChange(Math.max(9, fontSize - 1))} className="p-0.5 hover:bg-white rounded text-on-surface-variant" aria-label={t("builder.font-small")}>
          <span className="material-symbols-outlined text-sm">remove</span>
        </button>
        <span className="text-xs font-bold w-6 text-center select-none">{fontSize}pt</span>
        <button onClick={() => onFontSizeChange(Math.min(12, fontSize + 1))} className="p-0.5 hover:bg-white rounded text-on-surface-variant" aria-label={t("builder.font-large")}>
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
      </div>

      {/* Text alignment */}
      <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 gap-0.5">
        {(["left", "center", "right", "justify"] as const).map((align) => (
          <button key={align} onClick={() => onTextAlignChange(align)}
            className={`p-1 rounded ${textAlign === align ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
            title={align === "left" ? t("builder.align-left") : align === "center" ? t("builder.align-center") : align === "right" ? t("builder.align-right") : t("builder.align-justify")}
          >
            <span className="material-symbols-outlined text-sm">{align === "left" ? "format_align_left" : align === "center" ? "format_align_center" : align === "right" ? "format_align_right" : "format_align_justify"}</span>
          </button>
        ))}
      </div>

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

      {/* AI Revision — FAB Style */}
      <MagneticButton>
        <button onClick={onNavigateToCheckout}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md overflow-hidden"
          style={{ background: "linear-gradient(135deg, #00897B, #26A69A)" }}
          title={t("builder.ai-opt-tip")}
        >
          <span className={`absolute inset-0 rounded-lg ${reducedMotion ? "opacity-30" : "animate-ping"} opacity-30`} style={{ background: "linear-gradient(135deg, #00897B, #26A69A)" }} />
          <span className="material-symbols-outlined text-sm relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span className="relative z-10 hidden sm:inline">{t("builder.ai-opt")}</span>
        </button>
      </MagneticButton>

      {/* Export PDF — using shared PdfExportButton */}
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
    </div>
  );
}
