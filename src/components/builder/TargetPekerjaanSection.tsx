"use client";

import { Field } from "@/components/builder/Field";
import { FieldHelp } from "@/components/builder/FieldHelp";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";
import { fill, useTranslation } from "@/lib/i18n";

interface TargetPekerjaanSectionProps {
  jobTitle: string;
  jobDescription: string;
  aiKeywords: string[] | null;
  skills?: string[];
  onJobTitleChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
  /** Pindah ke langkah Data Diri (untuk mengisi Jabatan profesional). */
  onGoToPersonal?: () => void;
}

export function TargetPekerjaanSection({
  jobTitle,
  jobDescription,
  aiKeywords,
  skills,
  onJobTitleChange,
  onJobDescriptionChange,
  onGoToPersonal,
}: TargetPekerjaanSectionProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-5">
      <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/40">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>
        </div>
        <div>
          <h3 className="font-headline-md text-[18px] text-on-surface">{t("target.title")}</h3>
          <p className="text-body-md text-on-surface-variant mt-0.5">{t("target.desc")}</p>
        </div>
      </div>
      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 text-sm text-on-surface-variant space-y-1.5">
        <p className="font-semibold text-on-surface">{t("target.not-printed")}</p>
        <p>{t("target.not-printed-body")}</p>
        <p>
          {t("target.title-hint-a")} <strong className="font-semibold text-on-surface">{t("target.title-hint-b")}</strong> {t("target.title-hint-c")}
          {onGoToPersonal && (
            <>
              {" "}
              <button type="button" onClick={onGoToPersonal} className="font-semibold text-green-deep underline underline-offset-2 hover:text-primary">
                {t("target.open-personal")}
              </button>
            </>
          )}
        </p>
      </div>
      <Field cvField="jobTitle" help="jobTitle" label={t("target.job-title")} placeholder={t("target.job-title-ph")} value={jobTitle} onChange={onJobTitleChange} enableAiPolish fieldName="judul posisi" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <div>
        <div className="mb-1.5 flex items-center gap-1">
          <label htmlFor="target-job-description" className="block text-label-bold text-on-surface">{t("target.jd")}</label>
          <FieldHelp topic="jobDescription" />
        </div>
        <div className="relative">
          <textarea
            id="target-job-description"
            rows={5}
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md pr-24"
            placeholder={t("target.jd-ph")}
            maxLength={3000}
          />
          {jobDescription && (
            <span className="absolute right-2 top-2">
              <AIPolishButton
                content={jobDescription}
                onApply={onJobDescriptionChange}
                jobTitle={jobTitle}
                skills={skills}
                jobDescription={jobDescription}
                field="deskripsi pekerjaan"
                size="sm"
              />
            </span>
          )}
        </div>
        {jobDescription && (
          <p className="text-[10px] text-on-surface-variant mt-1 text-right">{fill(t("target.chars"), { n: jobDescription.length, max: 3000 })}</p>
        )}
        <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">info</span>
          {t("target.jd-note")}
        </p>
      </div>
      {/* AI Insight Card */}
      {aiKeywords && aiKeywords.length > 0 && (
        <div className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">travel_explore</span>
            <span className="text-xs font-semibold text-primary">{fill(t("target.kw-found"), { n: aiKeywords.length })}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {aiKeywords.slice(0, 15).map((kw, i) => (
              <span key={i} className="px-2.5 py-1 bg-surface-container-lowest rounded-full text-[10px] font-medium text-primary border border-primary/20">
                {kw}
              </span>
            ))}
            {aiKeywords.length > 15 && (
              <span className="text-[10px] text-on-surface-variant self-center">{fill(t("target.kw-more"), { n: aiKeywords.length - 15 })}</span>
            )}
          </div>
          <p className="text-[10px] text-on-surface-variant">
            {t("target.kw-note")}
          </p>
        </div>
      )}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">psychology</span>
        <p className="text-sm text-on-surface-variant">{t("target.footer")}</p>
      </div>
    </div>
  );
}
