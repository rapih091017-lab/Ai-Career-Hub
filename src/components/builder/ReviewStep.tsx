"use client";

import type { CvData } from "@/components/cv-templates";

interface ReviewStepProps {
  cvData: CvData;
  sectionCompletion: boolean[];
  customSections: { id: string; content?: string }[];
}

export function ReviewStep({ cvData, sectionCompletion, customSections }: ReviewStepProps) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-label-bold text-on-surface">Ringkasan CV</h3>
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`w-5 h-1 rounded-full transition-colors duration-500 ${
                    sectionCompletion[idx] ? "bg-primary" : "bg-outline-variant/50"
                  } ml-0.5 first:ml-0`}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-primary">
              {sectionCompletion.filter(Boolean).length}/6
            </span>
          </div>
        </div>
        <div className="space-y-2 text-body-md">
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Profil:</span>
            <span className="text-outline">{cvData.fullName || "\u2014"}</span>
          </p>
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Pengalaman Kerja:</span>
            <span className="text-outline">{cvData.workHistory.length} posisi</span>
          </p>
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Pendidikan:</span>
            <span className="text-outline">{cvData.education.length} institusi</span>
          </p>
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Organisasi:</span>
            <span className="text-outline">{cvData.organisations.length} organisasi</span>
          </p>
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Skill:</span>
            <span className="text-outline">{cvData.skills.length} keahlian</span>
          </p>
        </div>
      </div>
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
        <span
          className="material-symbols-outlined text-primary shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          task_alt
        </span>
        <p className="text-sm text-on-surface-variant">
          Pastikan semua data sudah lengkap sebelum menyimpan. Kamu bisa kembali ke step sebelumnya kapan saja.
        </p>
      </div>
    </div>
  );
}
