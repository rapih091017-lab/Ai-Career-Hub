"use client";

import Modal from "@/components/Modal";
import { fill, useTranslation } from "@/lib/i18n";

interface DisplaySettingsModalProps {
  open: boolean;
  customPrimaryColor: string;
  spacingMode: "compact" | "normal" | "spacious";
  headerLayout: "centered" | "left";
  marginMode: "tight" | "normal" | "wide";
  sectionVisibility: Record<string, boolean>;
  showSkillLevel: boolean;
  onClose: () => void;
  onPrimaryColorChange: (color: string) => void;
  onSpacingModeChange: (mode: "compact" | "normal" | "spacious") => void;
  onHeaderLayoutChange: (layout: "centered" | "left") => void;
  onMarginModeChange: (mode: "tight" | "normal" | "wide") => void;
  onSectionVisibilityChange: (key: string, visible: boolean) => void;
  onShowSkillLevelChange: (show: boolean) => void;
}

const SECTION_LABELS: Record<string, string> = {
  summary: "display.sec-summary",
  selfEvaluation: "selfeval.title",
  experience: "display.sec-experience",
  education: "edu.title",
  skills: "skill.title",
  certifications: "cert.short",
  organizations: "display.sec-org",
  lainnya: "skill.extra-title",
};

const SPACING_OPTIONS = [
  { value: "compact" as const, label: "display.spacing-compact", desc: "display.spacing-compact-desc" },
  { value: "normal" as const, label: "display.normal", desc: "display.spacing-normal-desc" },
  { value: "spacious" as const, label: "display.loose", desc: "display.spacing-loose-desc" },
];

const MARGIN_OPTIONS = [
  { value: "tight" as const, label: "display.margin-tight", desc: "display.margin-tight-desc" },
  { value: "normal" as const, label: "display.normal", desc: "display.margin-normal-desc" },
  { value: "wide" as const, label: "display.loose", desc: "display.margin-wide-desc" },
];

const PRESET_COLORS = [
  { label: "Teal", value: "#0d7377" },
  { label: "Navy", value: "#1e3a5f" },
  { label: "Slate", value: "#475569" },
  { label: "Rose", value: "#9d174d" },
  { label: "Indigo", value: "#4338ca" },
  { label: "Emerald", value: "#065f46" },
  { label: "Amber", value: "#92400e" },
  { label: "Default", value: "" },
];

export function DisplaySettingsModal({
  open,
  customPrimaryColor,
  spacingMode,
  headerLayout,
  marginMode,
  sectionVisibility,
  showSkillLevel,
  onClose,
  onPrimaryColorChange,
  onSpacingModeChange,
  onHeaderLayoutChange,
  onMarginModeChange,
  onSectionVisibilityChange,
  onShowSkillLevelChange,
}: DisplaySettingsModalProps) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t("display.title")} size="max-w-lg">
      <div className="space-y-6">
        {/* Warna Primer */}
        <div>
          <label className="block text-label-bold text-on-surface mb-2">{t("display.color")}</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value || "default"}
                onClick={() => onPrimaryColorChange(preset.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  customPrimaryColor === preset.value
                    ? "border-on-surface scale-110 shadow-md"
                    : "border-outline-variant hover:scale-105"
                }`}
                style={{ backgroundColor: preset.value || "#e8e4ed" }}
                title={preset.label}
                aria-label={fill(t("display.color-aria"), { name: preset.label })}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs text-on-surface-variant">{t("display.custom")}</label>
            <input
              type="color"
              value={customPrimaryColor || "#0d7377"}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-outline-variant"
            />
            {customPrimaryColor && (
              <button
                onClick={() => onPrimaryColorChange("")}
                className="text-[10px] text-on-surface-variant underline hover:text-on-surface"
              >
                {t("display.reset")}
              </button>
            )}
          </div>
        </div>

        {/* Spacing */}
        <div>
          <label className="block text-label-bold text-on-surface mb-2">{t("display.spacing")}</label>
          <div className="grid grid-cols-3 gap-2">
            {SPACING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSpacingModeChange(opt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  spacingMode === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant hover:border-primary/30 text-on-surface-variant"
                }`}
              >
                <p className="text-xs font-semibold">{t(opt.label)}</p>
                <p className="text-[9px] mt-0.5 opacity-70">{t(opt.desc)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Margin Kertas */}
        <div>
          <label className="block text-label-bold text-on-surface mb-2">{t("display.margin")}</label>
          <div className="grid grid-cols-3 gap-2">
            {MARGIN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onMarginModeChange(opt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  marginMode === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant hover:border-primary/30 text-on-surface-variant"
                }`}
              >
                <p className="text-xs font-semibold">{t(opt.label)}</p>
                <p className="text-[9px] mt-0.5 opacity-70">{t(opt.desc)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Header Layout */}
        <div>
          <label className="block text-label-bold text-on-surface mb-2">{t("display.header")}</label>
          <div className="flex gap-2">
            {[
              { value: "centered" as const, label: t("display.center"), icon: "format_align_center" },
              { value: "left" as const, label: t("display.left"), icon: "format_align_left" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onHeaderLayoutChange(opt.value)}
                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  headerLayout === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant hover:border-primary/30 text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                <span className="text-xs font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Level keahlian */}
        <div>
          <label className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-surface-container-low cursor-pointer">
            <input
              type="checkbox"
              checked={showSkillLevel}
              onChange={(e) => onShowSkillLevelChange(e.target.checked)}
              className="peer sr-only"
            />
            <div className="mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 border-outline-variant bg-surface-container-lowest flex items-center justify-center transition-colors duration-200 peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
              {showSkillLevel && (
                <span className="material-symbols-outlined text-sm text-white" aria-hidden="true">check</span>
              )}
            </div>
            <span>
              <span className="block text-body-md text-on-surface">{t("display.skill-level")}</span>
              <span className="block text-xs text-on-surface-variant">{t("display.skill-level-desc")}</span>
            </span>
          </label>
        </div>

        {/* Visibilitas Section */}
        <div>
          <label className="block text-label-bold text-on-surface mb-2">{t("display.visibility")}</label>
          <div className="space-y-1.5">
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container-low cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={sectionVisibility[key] !== false}
                  onChange={(e) => onSectionVisibilityChange(key, e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-md border-2 border-outline-variant bg-surface-container-lowest flex items-center justify-center transition-colors duration-200 peer-checked:bg-primary peer-checked:border-primary">
                  {sectionVisibility[key] !== false && (
                    <span className="material-symbols-outlined text-sm text-white" aria-hidden="true">check</span>
                  )}
                </div>
                <span className="text-body-md text-on-surface">{t(label)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}