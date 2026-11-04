"use client";

import { useState } from "react";
import { FieldHelp } from "@/components/builder/FieldHelp";
import { extraSectionPlaceholder } from "@/lib/builder-help";
import { QUICK_CUSTOM_TITLES } from "@/lib/section-manager";
import { BulletEditor } from "./BulletEditor";
import { RemoveSectionButton, UnusedSectionCard } from "./SectionControls";
import type { SkillEntry, CertificationEntry } from "@/components/cv-templates";

interface SkillSectionProps {
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  lainnyaContent: string;
  /** Judul Bagian Tambahan di CV (data lama: "Lainnya"). */
  lainnyaTitle?: string;
  onLainnyaTitleChange?: (title: string) => void;
  /** Judul bagian kustom lain, agar pilihan cepat tidak dobel. */
  otherSectionTitles?: string[];
  /** Bentuk isi "Lainnya"; default poin. */
  lainnyaContentType?: "bullets" | "paragraph";
  onLainnyaContentTypeChange?: (mode: "bullets" | "paragraph") => void;
  selfEvaluation?: string;
  onSkillChange: (index: number, field: keyof SkillEntry, value: string) => void;
  onSkillRemove: (index: number) => void;
  onSkillAdd: () => void;
  onCertChange: (index: number, field: keyof CertificationEntry, value: string) => void;
  onCertRemove: (index: number) => void;
  onCertAdd: () => void;
  onLainnyaChange: (content: string) => void;
  onSelfEvaluationChange?: (content: string) => void;
  /** true bila section tidak ikut tampil di CV (disembunyikan / tidak ada di urutan). */
  isSectionHidden?: (key: string) => boolean;
  onShowSection?: (key: string) => void;
  /** Section opsional yang sudah dihapus (tidak dipakai di CV). */
  isSectionUnused?: (key: string) => boolean;
  onRemoveSection?: (key: string) => void;
  onRestoreSection?: (key: string) => void;
  hasSavedContent?: (key: string) => boolean;
  onPurgeSection?: (key: string) => void;
}

export const SKILL_LEVEL_OPTIONS = [
  { value: "beginner", label: "Pemula", desc: "masih belajar dan butuh arahan" },
  { value: "intermediate", label: "Menengah", desc: "bisa mengerjakan sendiri" },
  { value: "advanced", label: "Mahir", desc: "lancar dan bisa membimbing orang lain" },
] as const;

/** Catatan di kartu form: data ada, tapi section tidak tampil di CV. */
export function HiddenSectionNotice({ onShow }: { onShow?: () => void }) {
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <span className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">visibility_off</span>
        Bagian ini disembunyikan dari CV.
      </span>
      {onShow && (
        <button
          type="button"
          onClick={onShow}
          className="rounded-md px-2 py-1 font-semibold text-amber-900 underline underline-offset-2 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
        >
          Tampilkan
        </button>
      )}
    </div>
  );
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
  lainnyaTitle = "Lainnya",
  onLainnyaTitleChange,
  otherSectionTitles = [],
  lainnyaContentType = "bullets",
  onLainnyaContentTypeChange,
  selfEvaluation = "",
  onSkillChange,
  onSkillRemove,
  onSkillAdd,
  onCertChange,
  onCertRemove,
  onCertAdd,
  onLainnyaChange,
  onSelfEvaluationChange,
  isSectionHidden,
  onShowSection,
  isSectionUnused,
  onRemoveSection,
  onRestoreSection,
  hasSavedContent,
  onPurgeSection,
}: SkillSectionProps) {
  const unusedCard = (key: string, label: string) => (
    <UnusedSectionCard
      label={label}
      onRestore={() => onRestoreSection!(key)}
      hasContent={!!hasSavedContent?.(key)}
      onPurge={onPurgeSection ? () => onPurgeSection(key) : undefined}
    />
  );
  const unused = (key: string) => !!isSectionUnused?.(key) && !!onRestoreSection;
  const takenTitles = new Set(otherSectionTitles.map((x) => x.trim().toLowerCase()));
  const removeBtn = (key: string, label: string) =>
    onRemoveSection ? <RemoveSectionButton label={label} onRemove={() => onRemoveSection(key)} /> : null;
  const hiddenNotice = (key: string, hasData: boolean) =>
    hasData && isSectionHidden?.(key) ? (
      <HiddenSectionNotice onShow={onShowSection ? () => onShowSection(key) : undefined} />
    ) : null;

  return (
    <>
      {/* ── Skills with Category ── */}
      <div data-cv-field="skills" className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <h3 className="flex items-center gap-1 font-label-bold text-on-surface">Keahlian<FieldHelp topic="skills" /></h3>
            <p className="text-xs text-on-surface-variant">Kelompokkan skill berdasarkan kategori agar CV lebih profesional</p>
          </div>
        </div>
        {hiddenNotice("skills", skills.some((s) => s.name.trim()))}

        <div className="space-y-3">
          {skills.map((skill, i) => (
            <div key={skill.id} className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => onSkillChange(i, "name", e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                  placeholder="Nama Skill"
                />
              </div>
              <select
                value={skill.category || "technical"}
                onChange={(e) => onSkillChange(i, "category", e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary text-xs min-w-[120px]"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                aria-label="Level keahlian"
                value={skill.level ?? ""}
                onChange={(e) => onSkillChange(i, "level", e.target.value as SkillEntry["level"])}
                className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary text-xs min-w-[100px]"
              >
                <option value="">Pilih level</option>
                {SKILL_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} title={opt.desc}>{opt.label}</option>
                ))}
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
            className="w-full border-2 border-dashed border-outline/30 rounded-xl py-3 flex items-center justify-center gap-2 text-body-md text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-lg">add</span> Tambah Skill
          </button>
        </div>

        <p className="text-[11px] text-on-surface-variant">
          {SKILL_LEVEL_OPTIONS.map((o) => `${o.label}: ${o.desc}.`).join(" ")} Level hanya tampil di CV bila diaktifkan di Pengaturan Tampilan.
        </p>

        {/* Color legend */}
        <div className="flex items-center gap-3 text-[10px] text-on-surface-variant pt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Technical</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Soft Skills</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Tools</span>
        </div>
      </div>

      {/* ── Sertifikasi & Lisensi ── */}
      {unused("certifications") ? (
        unusedCard("certifications", "Sertifikasi")
      ) : (
      <div data-cv-field="certifications" className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <div>
            <h3 className="flex items-center gap-1 font-label-bold text-on-surface">Sertifikasi & Lisensi<FieldHelp topic="certifications" /></h3>
            <p className="text-xs text-on-surface-variant">Sertifikasi profesional, kursus, atau lisensi yang dimiliki</p>
          </div>
          {removeBtn("certifications", "Sertifikasi")}
        </div>
        {hiddenNotice("certifications", certifications.some((c) => c.name.trim()))}

        <div className="space-y-3">
          {certifications.map((cert, i) => (
            <div key={cert.id} className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) => onCertChange(i, "name", e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                  placeholder="Nama Sertifikasi"
                />
              </div>
              <div className="w-32">
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => onCertChange(i, "issuer", e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
                  placeholder="Penerbit"
                />
              </div>
              <div className="w-20">
                <input
                  type="text"
                  value={cert.year}
                  onChange={(e) => onCertChange(i, "year", e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary text-body-md"
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
            className="w-full border-2 border-dashed border-outline/30 rounded-xl py-3 flex items-center justify-center gap-2 text-body-md text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-lg">add</span> Tambah Sertifikasi
          </button>
        </div>
      </div>
      )}

      {/* ── Self Evaluation / Evaluasi Diri ── */}
      {unused("selfEvaluation") ? (
        unusedCard("selfEvaluation", "Evaluasi Diri")
      ) : (
      <div data-cv-field="selfEvaluation" className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-green" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
          </div>
          <div>
            <h3 className="flex items-center gap-1 font-label-bold text-on-surface">Evaluasi Diri<FieldHelp topic="selfEvaluation" /></h3>
            <p className="text-xs text-on-surface-variant">Tuliskan kekuatan utama, motivasi, atau tujuan kariermu (opsional)</p>
          </div>
          {removeBtn("selfEvaluation", "Evaluasi Diri")}
        </div>
        {hiddenNotice("selfEvaluation", !!selfEvaluation.trim())}
        {onSelfEvaluationChange ? (
          <textarea
            value={selfEvaluation}
            onChange={(e) => onSelfEvaluationChange(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md"
            rows={3}
            placeholder="Contoh: Teliti dalam pekerjaan angka: terbiasa mengecek ulang laporan sebelum dikirim ke atasan."
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
      )}

      {/* ── Bagian Tambahan (id "lainnya") ── */}
      {unused("lainnya") ? (
        unusedCard("lainnya", lainnyaTitle.trim() || "Bagian Tambahan")
      ) : (
      <div data-cv-field="customSections.lainnya" className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>more_horiz</span>
          </div>
          <div>
            <h3 className="flex items-center gap-1 font-label-bold text-on-surface">Bagian Tambahan<FieldHelp topic="extraSection" /></h3>
            <p className="text-xs text-on-surface-variant">Untuk hal penting yang tidak masuk bagian lain.</p>
          </div>
          {removeBtn("lainnya", lainnyaTitle.trim() || "Bagian Tambahan")}
        </div>
        {hiddenNotice("lainnya", !!lainnyaContent.trim())}
        {onLainnyaTitleChange && (
          <div>
            <label htmlFor="extra-section-title" className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Judul di CV
            </label>
            <input
              id="extra-section-title"
              value={lainnyaTitle}
              maxLength={100}
              onChange={(e) => onLainnyaTitleChange(e.target.value)}
              placeholder="Mis. Penghargaan"
              className="w-full rounded-lg border-none bg-surface-container-low px-3 py-2 font-label-bold text-on-surface focus:ring-2 focus:ring-primary"
            />
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Pilihan cepat judul">
              {QUICK_CUSTOM_TITLES.filter((q) => !takenTitles.has(q.toLowerCase())).map((q) => {
                const active = lainnyaTitle.trim().toLowerCase() === q.toLowerCase();
                return (
                  <button
                    key={q}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onLainnyaTitleChange(q)}
                    className={`inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-medium sm:min-h-8 ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/60 text-on-surface hover:border-primary hover:text-primary"
                    }`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <BulletEditor
          label={`Isi bagian ${lainnyaTitle.trim() || "Bagian Tambahan"}`}
          value={lainnyaContent}
          onChange={onLainnyaChange}
          mode={lainnyaContentType}
          onModeChange={onLainnyaContentTypeChange}
          placeholder={extraSectionPlaceholder(lainnyaTitle)}
          maxLength={5000}
        />
      </div>
      )}
    </>
  );
}
