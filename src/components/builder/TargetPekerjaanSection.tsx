"use client";

import { Field } from "@/components/builder/Field";
import { FieldHelp } from "@/components/builder/FieldHelp";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";

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
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-5">
      <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/40">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>
        </div>
        <div>
          <h3 className="font-headline-md text-[18px] text-on-surface">Posisi yang Dilamar</h3>
          <p className="text-body-md text-on-surface-variant mt-0.5">Isi posisi yang kamu incar dulu. Semua fitur AI di builder memakai bagian ini sebagai acuan.</p>
        </div>
      </div>
      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 text-sm text-on-surface-variant space-y-1.5">
        <p className="font-semibold text-on-surface">Bagian ini tidak dicetak di CV</p>
        <p>Judul posisi dan deskripsi lowongan hanya dipakai AI untuk menyesuaikan saran, kata kunci, dan Poles AI dengan lowongan yang kamu lamar.</p>
        <p>
          Teks di bawah nama pada CV diisi lewat <strong className="font-semibold text-on-surface">Jabatan profesional</strong> di Data Diri.
          {onGoToPersonal && (
            <>
              {" "}
              <button type="button" onClick={onGoToPersonal} className="font-semibold text-green-deep underline underline-offset-2 hover:text-primary">
                Buka Data Diri
              </button>
            </>
          )}
        </p>
      </div>
      <Field cvField="jobTitle" help="jobTitle" label="Judul posisi yang dilamar" placeholder="Contoh: Staf Administrasi Keuangan" value={jobTitle} onChange={onJobTitleChange} enableAiPolish fieldName="judul posisi" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
      <div>
        <div className="mb-1.5 flex items-center gap-1">
          <label htmlFor="target-job-description" className="block text-label-bold text-on-surface">Deskripsi lowongan</label>
          <FieldHelp topic="jobDescription" />
        </div>
        <div className="relative">
          <textarea
            id="target-job-description"
            rows={5}
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md pr-24"
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
          <p className="text-[10px] text-on-surface-variant mt-1 text-right">{jobDescription.length}/3000 karakter</p>
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
              <span key={i} className="px-2.5 py-1 bg-surface-container-lowest rounded-full text-[10px] font-medium text-primary border border-primary/20">
                {kw}
              </span>
            ))}
            {aiKeywords.length > 15 && (
              <span className="text-[10px] text-on-surface-variant self-center">+{aiKeywords.length - 15} lainnya</span>
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
