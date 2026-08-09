"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Field } from "@/components/builder/Field";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";
import { AiLoadingOverlay } from "./AiLoadingOverlay";
import type { WorkEntry } from "@/components/cv-templates";

interface WorkCardProps {
  work: WorkEntry;
  index: number;
  isCollapsed: boolean;
  skills: string[];
  cvId: string;
  totalItems: number;
  /** CV context for AI Polish */
  jobTitle?: string;
  jobDescription?: string;
  onToggleCollapse: (id: string) => void;
  onUpdate: (index: number, field: keyof WorkEntry, value: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  onAISuggest: (title: string, suggestions: any[], onAccept: (text: string) => void) => void;
  onAIRevise: (title: string, original: string, versions: any, explanation: string, tip: string, onAccept: (text: string) => void) => void;
  onError: (message: string) => void;
  onUpdateDescription: (index: number, text: string) => void;
}

export function WorkCard({
  work,
  index,
  isCollapsed,
  skills,
  cvId,
  totalItems,
  jobTitle,
  jobDescription,
  onToggleCollapse,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onAISuggest,
  onAIRevise,
  onError,
  onUpdateDescription,
}: WorkCardProps) {
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [aiReviseLoading, setAiReviseLoading] = useState(false);

  const handleSuggest = async () => {
    setAiSuggestLoading(true);
    try {
      const res = await fetch(`/api/cv-documents/${cvId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "suggest",
          position: work.position,
          company: work.company,
          description: work.description || "",
          skills,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.message || "Gagal mendapatkan saran AI.");
      } else {
        const bullets = data.suggestions?.map((s: any) => s.bullet) || [];
        if (bullets.length > 0) {
          onAISuggest(
            `Saran AI · ${work.position || "Posisi " + (index + 1)}`,
            data.suggestions,
            (text: string) => {
              onUpdate(index, "description", text);
            }
          );
        }
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
          section: "workHistory",
          sectionIndex: index,
          field: "description",
          currentText: work.description || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.message || "Terjadi kesalahan saat menghubungi AI.");
      } else {
        onAIRevise(
          `Optimalkan · ${work.position || "Posisi " + (index + 1)}`,
          work.description,
          data.versions,
          data.explanation,
          data.tip,
          (text: string) => {
            onUpdateDescription(index, text);
          }
        );
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    } finally {
      setAiReviseLoading(false);
    }
  };

  const isHidden = work.visible === false;

  return (
    <div className={`bg-white rounded-xl p-6 shadow-soft relative group transition-opacity duration-200 ${isHidden ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag handle */}
          <div className="shrink-0 cursor-grab active:cursor-grabbing text-outline-variant hover:text-on-surface transition-colors p-1 rounded">
            <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
          </div>
          <button
            type="button"
            onClick={() => onToggleCollapse(work.id)}
            className="shrink-0 p-1 hover:bg-surface-container rounded transition-colors"
            aria-label={isCollapsed ? "Perluas detail" : "Ciutkan detail"}
          >
            <span
              className="material-symbols-outlined text-[18px] text-outline transition-transform duration-200"
              style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
          <div className="min-w-0">
            <h3 className="font-label-bold text-on-surface truncate">{work.position || "Pengalaman " + (index + 1)}</h3>
            {work.company && <p className="text-xs text-outline truncate">{work.company}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Visibility toggle — dedicated boolean handler */}
          <button
            type="button"
            onClick={() => onToggleVisibility(index)}
            className={`transition-colors p-0.5 rounded ${isHidden ? "text-outline-variant" : "text-primary hover:text-primary/80"}`}
            title={isHidden ? "Tampilkan di CV" : "Sembunyikan dari CV"}
            aria-label={isHidden ? "Tampilkan" : "Sembunyikan"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isHidden ? "visibility_off" : "visibility"}
            </span>
          </button>
          {index > 0 && (
            <button type="button" onClick={() => onMoveUp(index)}
              className="text-outline hover:text-primary transition-colors p-0.5"
              aria-label="Pindah ke atas"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            </button>
          )}
          {index < totalItems - 1 && (
            <button type="button" onClick={() => onMoveDown(index)}
              className="text-outline hover:text-primary transition-colors p-0.5"
              aria-label="Pindah ke bawah"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-error/70 hover:text-error transition-colors"
            aria-label="Hapus pengalaman"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              <Field label="Posisi Jabatan" value={work.position} onChange={(v) => onUpdate(index, "position", v)} enableAiPolish fieldName="position" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
              <Field label="Perusahaan" value={work.company} onChange={(v) => onUpdate(index, "company", v)} enableAiPolish fieldName="company" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
              <Field label="Deskripsi Perusahaan (opsional)" value={work.companyDescription || ""} onChange={(v) => onUpdate(index, "companyDescription", v)} />
              <Field label="Lokasi" value={work.location} onChange={(v) => onUpdate(index, "location", v)} />
              <Field label="Link Proyek / Portofolio (opsional)" value={work.projectUrl || ""} onChange={(v) => onUpdate(index, "projectUrl", v)} placeholder="https://github.com/..." />
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                <Field label="Pencapaian Utama (opsional)" value={work.achievement || ""} onChange={(v) => onUpdate(index, "achievement", v)} placeholder="Contoh: Meningkatkan penjualan 30% dalam 6 bulan" enableAiPolish fieldName="achievement" jobTitle={jobTitle} skills={skills} jobDescription={jobDescription} />
                <p className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs" aria-hidden="true">info</span>
                  Soroti pencapaian dengan angka/metrik · ini yang paling dilihat HR!
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Mulai" type="month" value={work.startDate} onChange={(v) => onUpdate(index, "startDate", v)} />
                <Field label="Selesai" type="month" value={work.endDate} onChange={(v) => onUpdate(index, "endDate", v)} disabled={work.isCurrent} />
              </div>
              <label className="relative flex items-center gap-2.5 cursor-pointer select-none mt-2 group">
                <input
                  type="checkbox"
                  checked={work.isCurrent ?? false}
                  onChange={(e) => {
                    onUpdate(index, "isCurrent", e.target.checked as any);
                    if (e.target.checked) onUpdate(index, "endDate", "");
                  }}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-md border-2 border-outline-variant bg-white flex items-center justify-center transition-colors duration-200 peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 group-hover:border-primary/60">
                  {work.isCurrent && (
                    <span className="material-symbols-outlined text-sm text-white" aria-hidden="true">check</span>
                  )}
                </div>
                <span className="text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Saya masih bekerja di sini</span>
              </label>
              <div>
                <label className="block text-label-bold text-on-surface mb-1.5">Deskripsi</label>
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
                          label={aiSuggestLoading ? "AI sedang menyusun saran" : "AI sedang mengoptimalkan"}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <textarea
                    rows={3}
                    value={work.description}
                    onChange={(e) => onUpdate(index, "description", e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md transition-all duration-300 pr-10"
                    placeholder="Jelaskan tanggung jawab dan pencapaianmu...&#10;Tip: Gunakan bullet points (satu poin per baris)"
                    maxLength={2500}
                    disabled={aiSuggestLoading || aiReviseLoading}
                  />
                  {/* AI Polish inline button */}
                  {work.description && !aiSuggestLoading && !aiReviseLoading && (
                    <span className="absolute right-2 top-2">
                      <AIPolishButton
                        content={work.description}
                        onApply={(text) => onUpdate(index, "description", text)}
                        jobTitle={jobTitle}
                        skills={skills}
                        jobDescription={jobDescription}
                        field="deskripsi pengalaman kerja"
                        size="sm"
                      />
                    </span>
                  )}
                  {work.description && !aiSuggestLoading && !aiReviseLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute bottom-3 left-3"
                    >
                      <span className={`text-[10px] font-medium ${work.description.length > 2300 ? "text-amber-600" : "text-outline"}`}>
                        {work.description.length}/2500 | {work.description.split(/\s+/).filter(Boolean).length} kata
                      </span>
                    </motion.div>
                  )}
                  <div className="flex justify-end mt-2.5">
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
                        title="Generate bullet points achievement-based dari AI"
                      >
                        <span className={`material-symbols-outlined text-[14px] transition-all duration-500 ${
                          aiSuggestLoading ? "animate-spin text-amber-500" : ""
                        }`} style={{ fontVariationSettings: aiSuggestLoading ? "'FILL' 0" : "'FILL' 1" }}>
                          {aiSuggestLoading ? "sync" : "auto_awesome"}
                        </span>
                        <span>
                          {aiSuggestLoading ? "Menyusun saran..." : "Saran AI"}
                        </span>
                      </motion.button>

                      <motion.button
                        type="button"
                        disabled={aiSuggestLoading || aiReviseLoading}
                        onClick={handleRevise}
                        whileTap={{ scale: aiReviseLoading ? 1 : 0.96 }}
                        className={`relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 ${
                          aiReviseLoading
                            ? "bg-primary/80 text-white cursor-wait animate-[pulse-ring_1.5s_ease-in-out_infinite]"
                            : "bg-primary text-white shadow-sm hover:brightness-110 active:brightness-90"
                        } disabled:opacity-40`}
                        title="Optimalkan teks dengan AI"
                      >
                        <span className={`material-symbols-outlined text-[14px] transition-all duration-500 ${
                          aiReviseLoading ? "animate-spin" : ""
                        }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {aiReviseLoading ? "sync" : "spark"}
                        </span>
                        <span>
                          {aiReviseLoading ? "Mengoptimalkan..." : "Optimalkan"}
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
