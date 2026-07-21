"use client";

import { useState } from "react";
import type { SkillEntry, CertificationEntry } from "@/components/cv-templates";

interface SkillSectionProps {
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  lainnyaContent: string;
  selfEvaluation?: string;
  onSkillChange: (index: number, field: keyof SkillEntry, value: string) => void;
  onSkillRemove: (index: number) => void;
  onSkillAdd: () => void;
  onCertChange: (index: number, field: keyof CertificationEntry, value: string) => void;
  onCertRemove: (index: number) => void;
  onCertAdd: () => void;
  onLainnyaChange: (content: string) => void;
  onSelfEvaluationChange?: (content: string) => void;
}

const CATEGORY_OPTIONS = [
  { value: "technical", label: "Technical" },
  { value: "soft", label: "Soft Skills" },
  { value: "tools", label: "Tools & Platform" },
] as const;

export function SkillSection({
  skills,
  certifications,
  lainnyaContent,
  selfEvaluation = "",
  onSkillChange,
  onSkillRemove,
  onSkillAdd,
  onCertChange,
  onCertRemove,
  onCertAdd,
  onLainnyaChange,
  onSelfEvaluationChange,
}: SkillSectionProps) {
  return (
    <>
      {/* ── Skills with Category ── */}
      <div className="bg-white rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <h3 className="font-label-bold text-on-surface">Keahlian</h3>
            <p className="text-xs text-on-surface-variant">Kelompokkan skill berdasarkan kategori agar CV lebih profesional</p>
          </div>
        </div>

        <div className="space-y-3">
          {skills.map((skill, i) => (
            <div key={skill.id} className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => onSkillChange(i, "name", e.target.value)}
                  className="w-full bg-white border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                  placeholder="Nama Skill"
                />
              </div>
              <select
                value={skill.category || "technical"}
                onChange={(e) => onSkillChange(i, "category", e.target.value)}
                className="bg-white border border-outline-variant/30 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary text-xs min-w-[120px]"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={skill.level}
                onChange={(e) => onSkillChange(i, "level", e.target.value as SkillEntry["level"])}
                className="bg-white border border-outline-variant/30 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary text-xs min-w-[100px]"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                type="button"
                onClick={() => onSkillRemove(i)}
                className="text-error/70 hover:text-error transition-colors shrink-0"
                aria-label="Hapus skill"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onSkillAdd}
            className="w-full border-2 border-dashed border-outline/30 rounded-xl py-3 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-lg">add</span> Tambah Skill
          </button>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-3 text-[10px] text-on-surface-variant pt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Technical</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Soft Skills</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Tools</span>
        </div>
      </div>

      {/* ── Sertifikasi & Lisensi ── */}
      <div className="bg-white rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <div>
            <h3 className="font-label-bold text-on-surface">Sertifikasi & Lisensi</h3>
            <p className="text-xs text-on-surface-variant">Sertifikasi profesional, kursus, atau lisensi yang dimiliki</p>
          </div>
        </div>

        <div className="space-y-3">
          {certifications.map((cert, i) => (
            <div key={cert.id} className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) => onCertChange(i, "name", e.target.value)}
                  className="w-full bg-white border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                  placeholder="Nama Sertifikasi"
                />
              </div>
              <div className="w-32">
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => onCertChange(i, "issuer", e.target.value)}
                  className="w-full bg-white border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                  placeholder="Penerbit"
                />
              </div>
              <div className="w-20">
                <input
                  type="text"
                  value={cert.year}
                  onChange={(e) => onCertChange(i, "year", e.target.value)}
                  className="w-full bg-white border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                  placeholder="Tahun"
                />
              </div>
              <button
                type="button"
                onClick={() => onCertRemove(i)}
                className="text-error/70 hover:text-error transition-colors shrink-0"
                aria-label="Hapus sertifikasi"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onCertAdd}
            className="w-full border-2 border-dashed border-outline/30 rounded-xl py-3 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-lg">add</span> Tambah Sertifikasi
          </button>
        </div>
      </div>

      {/* ── Self Evaluation / Evaluasi Diri ── */}
      <div className="bg-white rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
          </div>
          <div>
            <h3 className="font-label-bold text-on-surface">Evaluasi Diri</h3>
            <p className="text-xs text-on-surface-variant">Tuliskan kekuatan utama, motivasi, atau tujuan kariermu (opsional)</p>
          </div>
        </div>
        {onSelfEvaluationChange ? (
          <textarea
            value={selfEvaluation}
            onChange={(e) => onSelfEvaluationChange(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md"
            rows={3}
            placeholder="Contoh: Pengembang front-end yang bersemangat dengan 3+ tahun pengalaman membangun aplikasi web yang scalable. Terbiasa bekerja dalam tim agile dan berkomitmen pada kode yang bersih dan teruji."
          />
        ) : (
          <textarea
            value={selfEvaluation}
            readOnly
            className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 text-body-md text-outline-variant"
            rows={3}
            placeholder="(Fitur ini akan tersedia setelah update builder)"
          />
        )}
      </div>

      {/* ── Lainnya ── */}
      <div className="bg-white rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>more_horiz</span>
          </div>
          <div>
            <h3 className="font-label-bold text-on-surface">Lainnya</h3>
            <p className="text-xs text-on-surface-variant">Key achievements, penghargaan, atau apapun yang ingin ditambahkan</p>
          </div>
        </div>
        <textarea
          value={lainnyaContent}
          onChange={(e) => onLainnyaChange(e.target.value)}
          className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md"
          rows={4}
          placeholder="Contoh: Meningkatkan efisiensi produksi sebesar 20%, Juara 1 Lomba Inovasi Teknologi Tingkat Nasional"
        />
      </div>
    </>
  );
}
