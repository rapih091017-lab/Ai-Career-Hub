"use client";

import { useTranslation } from "@/lib/i18n";

interface StepperProps {
  steps: string[];
  activeStep: number;
  setActiveStep: (step: number) => void;
  sectionCompletion: boolean[];
  sectionMeta: { title: string; desc: string; icon: string }[];
  /** Id langkah (untuk penanda tur `data-tour="step-<id>"`). */
  stepIds?: readonly string[];
  /** true = bagian langkah ini dihapus dari CV; langkah tetap ada, berstatus "Tidak dipakai". */
  unusedSteps?: boolean[];
}

export function StepperSteps({ steps, activeStep, setActiveStep, sectionCompletion, sectionMeta, stepIds, unusedSteps }: StepperProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center min-w-max mx-auto" style={{ maxWidth: 960 }}>
      {steps.map((label, i) => {
        const isPast = i < activeStep;
        const isActive = i === activeStep;
        const isUnused = !!unusedSteps?.[i];
        const isCompleted = (sectionCompletion[i] ?? false) && !isActive && !isUnused;

        return (
          <div key={label} className="flex items-center">
            {/* Connector line before (except first) */}
            {i > 0 && (
              <div
                className={`h-0.5 w-6 md:w-10 shrink-0 transition-colors ${
                  i <= activeStep ? "bg-primary" : "bg-outline-variant"
                }`}
              />
            )}
            {/* Step circle + label */}
            <button
              type="button"
              data-tour={stepIds ? `step-${stepIds[i]}` : undefined}
              aria-current={isActive ? "step" : undefined}
              onClick={() => setActiveStep(i)}
              title={isUnused ? `${label}: ${t("builder.step-unused")}` : sectionMeta[i]?.desc || ""}
              className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1 rounded-lg transition-colors shrink-0 hover:bg-surface-container-low"
            >
              <div
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold shrink-0 transition-all ${
                  isUnused && !isActive
                    ? "border border-dashed border-outline-variant text-on-surface-variant/70"
                    : isCompleted
                    ? "bg-primary text-on-primary shadow-sm"
                    : isActive
                    ? "bg-primary text-on-primary shadow-md scale-110"
                    : isPast
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-sm md:text-base text-white" aria-hidden="true">check</span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  isActive
                    ? "text-primary font-semibold"
                    : isPast
                    ? "text-primary font-medium"
                    : "text-on-surface-variant"
                } hidden sm:inline`}
              >
                {label}
                {isUnused && <span className="ml-1 font-normal text-on-surface-variant/80">· {t("builder.step-unused")}</span>}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function BottomNav({
  steps,
  activeStep,
  setActiveStep,
  sectionCompletion,
  handleSave,
  isSaving,
  sectionMeta,
  unusedSteps,
}: StepperProps & { handleSave: () => void; isSaving: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant/50 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] z-30">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3">
        {/* Section Quick-Jump Dock */}
        <div className="hidden sm:flex items-center justify-center gap-1 mb-3">
          {steps.map((label, i) => {
            const isUnused = !!unusedSteps?.[i];
            const isFilled = sectionCompletion[i] && !isUnused;
            const isActive = i === activeStep;
            return (
              <button
                key={label}
                onClick={() => setActiveStep(i)}
                title={isUnused ? `${label}: ${t("builder.step-unused")}` : label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive ? "bg-primary text-on-primary shadow-sm" :
                  isFilled ? "bg-green/10 text-green-deep hover:bg-green/20" :
                  isUnused ? "border border-dashed border-outline-variant text-on-surface-variant/70 hover:bg-surface-container-low" :
                  "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className={`material-symbols-outlined text-[14px] ${isFilled && !isActive ? "text-green" : ""}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isFilled ? "check_circle" : isUnused ? "remove_circle_outline" : sectionMeta[i]?.icon}
                </span>
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Prev / Next / Save row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button type="button" onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline/30 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
                <span className="hidden sm:inline">{t("builder.prev")}</span>
                <kbd className="hidden md:inline-flex text-[8px] font-bold text-on-surface-variant bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/50">Ctrl+←</kbd>
              </button>
            )}
          </div>

          {/* Mobile quick-jump */}
          <div className="flex sm:hidden items-center gap-1">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                  i === activeStep ? "bg-primary text-on-primary scale-110" :
                  sectionCompletion[i] ? "bg-green/15 text-green-deep" :
                  "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {sectionCompletion[i] ? "\u2713" : i + 1}
              </button>
            ))}
          </div>

          <div>
            {activeStep < steps.length - 1 ? (
              <button type="button" onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:-translate-y-0.5 transition-[filter,transform] active:scale-95"
              >
                <span className="hidden sm:inline">{t("builder.next")}</span>
                <kbd className="hidden md:inline-flex text-[8px] font-bold text-on-surface-variant bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/50">Ctrl+→</kbd>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            ) : (
              <button type="button" onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:-translate-y-0.5 transition-[filter,transform,opacity] disabled:opacity-50 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {isSaving ? t("builder.saving") : t("builder.save")}
                <kbd className="hidden md:inline-flex text-[8px] font-bold text-on-surface-variant bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/50">Ctrl+Enter</kbd>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}