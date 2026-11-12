"use client";

import { newId } from "@/lib/id";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AiLoadingOverlay } from "./AiLoadingOverlay";
import { Field } from "@/components/builder/Field";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";
import { useTranslation } from "@/lib/i18n";
import { OutputLangPicker, baseCvLang, useOutputLang } from "@/components/ai/OutputLangPicker";
import { FieldHelp } from "@/components/builder/FieldHelp";
import { TargetMissingNote } from "@/components/builder/TargetHint";
import type { CustomFieldEntry } from "@/components/cv-templates";

interface SummarySectionProps {
  summary: string;
  fullName: string;
  jobTitle: string;
  professionalTitle?: string;
  employmentStatus?: string;
  customFields?: CustomFieldEntry[];
  skills: string[];
  workHistorySummary?: string;
  eduSummary?: string;
  certSummary?: string[];
  cvId: string;
  onChange: (text: string) => void;
  onEmploymentStatusChange?: (value: string) => void;
  onCustomFieldsChange?: (fields: CustomFieldEntry[]) => void;
  onAISuggest: (texts: { label: string; text: string; description?: string; style?: string }[]) => void;
  onAIRevise: (versions: { conservative: string; improved: string; bold: string }, explanation?: string, tip?: string) => void;
  onError: (message: string) => void;
}

// Nilai disimpan apa adanya di CV (data lama tetap cocok); hanya label opsi yang diterjemahkan.
const EMPLOYMENT_STATUS_OPTIONS: { value: string; key: string }[] = [
  { value: "Mencari Kerja", key: "ai.status-seeking" },
  { value: "Bekerja", key: "ai.status-employed" },
  { value: "Freelance / Freelancer", key: "ai.status-freelance" },
  { value: "Wirausaha", key: "ai.status-business" },
  { value: "Mahasiswa", key: "ai.status-student" },
  { value: "Tidak Aktif Bekerja", key: "ai.status-inactive" },
];

export function SummarySection({
  summary,
  fullName,
  jobTitle,
  professionalTitle,
  employmentStatus = "",
  customFields = [],
  skills,
  workHistorySummary,
  eduSummary,
  certSummary,
  cvId,
  onChange,
  onEmploymentStatusChange,
  onCustomFieldsChange,
  onAISuggest,
  onAIRevise,
  onError,
}: SummarySectionProps) {
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const { t } = useTranslation();
  const [aiReviseLoading, setAiReviseLoading] = useState(false);
  // Di builder state bersama dari OutputLangProvider; tebakan teks hanya cadangan.
  const { lang: outputLang, setLang: setOutputLang, cvLang: cvBase } = useOutputLang(baseCvLang(undefined, summary));

  const handleSuggest = async () => {
    setAiSuggestLoading(true);
    try {
      const res = await fetch(`/api/cv-documents/${cvId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "suggest",
          section: "summary",
          currentText: summary,
          fullName,
          jobTitle,
          professionalTitle,
          skills,
          workHistorySummary,
          eduSummary,
          certSummary,
          outputLang,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.message || t("ai.suggest-failed"));
      } else if (data.suggestions?.length > 0) {
        onAISuggest(
          data.suggestions.map((s: any) => ({
            label: s.label,
            text: s.text,
            description: s.description,
            style: s.style,
          }))
        );
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    } finally {
      setAiSuggestLoading(false);
    }
  };

  const handleRevise = async () => {
    setAiReviseLoading(true);
    try {
      const res = await fetch(`/api/cv-documents/${cvId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "revise",
          section: "summary",
          currentText: summary,
          fullName,
          jobTitle,
          professionalTitle,
          skills,
          workHistorySummary,
          eduSummary,
          certSummary,
          outputLang,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.message || t("ai.summary-optimize-failed"));
      } else if (data.versions) {
        onAIRevise(data.versions, data.explanation, data.tip);
      } else {
        onError(t("ai.optimize-empty"));
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    } finally {
      setAiReviseLoading(false);
    }
  };

  const addCustomField = () => {
    if (!onCustomFieldsChange) return;
    const newField: CustomFieldEntry = {
      id: newId("cf"),
      label: "",
      value: "",
    };
    onCustomFieldsChange([...customFields, newField]);
  };

  const updateCustomField = (index: number, field: keyof CustomFieldEntry, value: string) => {
    if (!onCustomFieldsChange) return;
    const updated = [...customFields];
    updated[index] = { ...updated[index], [field]: value };
    onCustomFieldsChange(updated);
  };

  const removeCustomField = (index: number) => {
    if (!onCustomFieldsChange) return;
    onCustomFieldsChange(customFields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      {/* Employment Status */}
      <div data-cv-field="employmentStatus">
        <div className="mb-1.5 flex items-center gap-1">
          <label htmlFor="cv-employment-status" className="block text-label-bold text-on-surface">{t("ai.status-label")}</label>
          <FieldHelp topic="employmentStatus" />
        </div>
        <select
          id="cv-employment-status"
          value={employmentStatus}
          onChange={(e) => onEmploymentStatusChange?.(e.target.value)}
          className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary text-body-md"
        >
          <option value="">{t("ai.status-pick")}</option>
          {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="relative" data-cv-field="summary">
        <div className="mb-1.5 flex items-center gap-1">
          <label htmlFor="cv-summary" className="block text-label-bold text-on-surface">{t("display.sec-summary")}</label>
          <FieldHelp topic="summary" />
        </div>
        
        {/* Textarea container with loading overlay */}
        <div className="relative">
          <AnimatePresence>
            {(aiSuggestLoading || aiReviseLoading) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AiLoadingOverlay
                  label={aiSuggestLoading ? t("ai.suggest-loading") : t("ai.optimize-loading")}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <textarea
            id="cv-summary"
            rows={4}
            value={summary}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md transition-all duration-300 pr-24"
            placeholder={t("ai.summary-ph")}
            maxLength={1000}
            disabled={aiSuggestLoading || aiReviseLoading}
          />
          {/* AI Polish inline button */}
          {summary && !aiSuggestLoading && !aiReviseLoading && (
            <span className="absolute right-2 top-2">
              <AIPolishButton
                content={summary}
                onApply={onChange}
                jobTitle={jobTitle}
                skills={skills}
                jobDescription={undefined}
                field="ringkasan profesional"
                size="sm"
              />
            </span>
          )}
          {summary && !aiSuggestLoading && !aiReviseLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-3 left-3"
            >
              <span className={`text-[10px] font-medium ${summary.length > 900 ? "text-amber-600" : "text-on-surface-variant"}`}>
                {summary.length}/1000
              </span>
            </motion.div>
          )}
        </div>

        {summary && (
          <div className="flex flex-col items-end mt-3 gap-1.5">
            <OutputLangPicker value={outputLang} onChange={setOutputLang} cvLang={cvBase} disabled={aiSuggestLoading || aiReviseLoading} />
            <div className="flex items-center gap-1.5">
              <motion.button
                type="button"
                disabled={aiSuggestLoading || aiReviseLoading}
                onClick={handleSuggest}
                whileTap={{ scale: aiSuggestLoading ? 1 : 0.96 }}
                className={`relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-300 ${
                  aiSuggestLoading
                    ? "border-amber-300 bg-amber-100 text-amber-800 cursor-wait animate-[breathe_1.5s_ease-in-out_infinite]"
                    : "border-amber-200 bg-amber-50 text-amber-700 shadow-sm hover:bg-amber-100 hover:text-amber-800 active:bg-amber-200"
                } disabled:opacity-40`}
                title={t("ai.suggest-summary-title")}
              >
                <span className={`material-symbols-outlined text-[14px] transition-all duration-500 ${
                  aiSuggestLoading ? "animate-spin text-amber-500" : ""
                }`} style={{ fontVariationSettings: aiSuggestLoading ? "'FILL' 0" : "'FILL' 1" }}>
                  {aiSuggestLoading ? "sync" : "auto_awesome"}
                </span>
                <span>
                  {aiSuggestLoading ? t("ai.suggesting") : t("ai.suggest")}
                </span>
              </motion.button>

              <motion.button
                type="button"
                disabled={aiSuggestLoading || aiReviseLoading}
                onClick={handleRevise}
                whileTap={{ scale: aiReviseLoading ? 1 : 0.96 }}
                className={`relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 ${
                  aiReviseLoading
                    ? "bg-primary/80 text-on-primary cursor-wait animate-[pulse-ring_1.5s_ease-in-out_infinite]"
                    : "bg-primary text-on-primary shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                } disabled:opacity-40`}
                title={t("ai.optimize-summary-title")}
              >
                {aiReviseLoading && (
                  <span className="material-symbols-outlined text-[14px] animate-spin" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                    sync
                  </span>
                )}
                <span>
                  {aiReviseLoading ? t("ai.optimizing") : t("ai.optimize")}
                </span>
              </motion.button>
            </div>
            <TargetMissingNote className="text-right" />
          </div>
        )}
        {!summary && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5"
          >
            <p className="text-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">info</span>
              {t("ai.summary-empty")}
            </p>
          </motion.div>
        )}
      </div>

      {/* Custom Fields */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
            </div>
            <div>
              <h3 className="flex items-center gap-1 font-label-bold text-on-surface">{t("ai.custom-title")}<FieldHelp topic="customFields" /></h3>
              <p className="text-xs text-on-surface-variant">{t("ai.custom-desc")}</p>
            </div>
          </div>
        </div>

        {customFields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
            <div className="w-28">
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateCustomField(i, "label", e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                placeholder={t("ai.custom-label-ph")}
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={field.value}
                onChange={(e) => updateCustomField(i, "value", e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                placeholder={t("ai.custom-value-ph")}
              />
            </div>
            <button
              type="button"
              onClick={() => removeCustomField(i)}
              className="text-error/70 hover:text-error transition-colors shrink-0"
              aria-label={t("ai.custom-remove")}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addCustomField}
          className="w-full border-2 border-dashed border-outline/30 rounded-xl py-3 flex items-center justify-center gap-2 text-body-md text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors duration-200"
        >
          <span className="material-symbols-outlined text-lg">add</span> {t("ai.custom-add")}
        </button>
      </div>
    </div>
  );
}
