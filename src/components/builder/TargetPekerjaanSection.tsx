"use client";

import { Field } from "@/components/builder/Field";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";

interface TargetPekerjaanSectionProps {
  jobTitle: string;
  jobDescription: string;
  aiKeywords: string[] | null;
  skills?: string[];
  onJobTitleChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
}

export function TargetPekerjaanSection({
  jobTitle,
  jobDescription,
  aiKeywords,
  skills,
  onJobTitleChange,
  onJobDescriptionChange,
}: TargetPekerjaanSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">
      <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>
        </div>
        <div>
          <h3 className="font-headline-md text-[18px] text-on-surface">Posisi yang Dilamar</h3>
          <p className="text-body-md text-on-surface-variant mt-0.5">Masukkan posisi target dan deskripsi pekerjaan agar AI bisa menyesuaikan konten CV-mu.</p>
        </div>
      </div>
      <Field label="Judul Posisi" value={jobTitle} onChange={onJobTitleChange} enableAiPolish fieldName="judul posisi" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <div>
        <label className="block text-label-bold text-on-surface mb-1.5">Deskripsi Pekerjaan</label>
        <div className="relative">
          <textarea
            rows={5}
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md pr-10"
            placeholder="Tempelkan deskripsi pekerjaan yang dilamar..."
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
          <p className="text-[10px] text-outline mt-1 text-right">{jobDescription.length}/3000 karakter</p>
        )}
        <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">info</span>
          AI akan menganalisis deskripsi ini untuk mengoptimalkan kata kunci di CV-mu
        </p>
      </div>
      {/* AI Insight Card */}
      {aiKeywords && aiKeywords.length > 0 && (
        <div className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">travel_explore</span>
            <span className="text-xs font-semibold text-primary">AI Menemukan {aiKeywords.length} Kata Kunci Relevan</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {aiKeywords.slice(0, 15).map((kw, i) => (
              <span key={i} className="px-2.5 py-1 bg-white rounded-full text-[10px] font-medium text-primary border border-primary/20">
                {kw}
              </span>
            ))}
            {aiKeywords.length > 15 && (
              <span className="text-[10px] text-outline self-center">+{aiKeywords.length - 15} lainnya</span>
            )}
          </div>
          <p className="text-[10px] text-on-surface-variant">
            Kata kunci ini akan digunakan AI untuk mengoptimalkan setiap section CV-mu secara otomatis.
          </p>
        </div>
      )}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">psychology</span>
        <p className="text-sm text-on-surface-variant">Dengan mengisi deskripsi pekerjaan, AI dapat menyesuaikan kata kunci, pengalaman, dan skill yang ditampilkan agar lebih relevan dengan posisi yang kamu lamar.</p>
      </div>
    </div>
  );
}
