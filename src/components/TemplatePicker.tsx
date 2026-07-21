"use client";

import { useState } from "react";
import { CV_TEMPLATES, type CVTemplate } from "@/lib/templates";
import dynamic from "next/dynamic";

const CvTemplatePreview = dynamic(
  () => import("@/components/CvTemplatePreview"),
  {
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />,
    ssr: false,
  },
);

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string, jobTitle?: string) => void;
  isCreating?: boolean;
  /** 'create' = show job title form (default), 'switch' = apply immediately */
  mode?: "create" | "switch";
  currentTemplateId?: string;
}

export default function TemplatePicker({
  isOpen,
  onClose,
  onSelect,
  isCreating,
  mode = "create",
  currentTemplateId,
}: TemplatePickerProps) {
  const defaultId = CV_TEMPLATES[0]?.id || "industrial-pro";
  const [jobTitle, setJobTitle] = useState("");
  const [selectedId, setSelectedId] = useState(currentTemplateId || defaultId);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleClose = () => {
    setJobTitle("");
    onClose();
  };

  // Switch mode — pick a template to switch to
  if (mode === "switch") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
            <h2 className="font-headline-md text-on-surface">Ganti Template CV</h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-lg text-on-surface-variant">close</span>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-on-surface-variant">Pilih template CV yang sesuai dengan kebutuhanmu.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CV_TEMPLATES.map((template) => (
                <TemplateOption
                  key={template.id}
                  template={template}
                  selected={selectedId === template.id}
                  onSelect={() => setSelectedId(template.id)}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-label-bold hover:bg-surface-container transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onSelect(selectedId);
                  handleClose();
                }}
                disabled={isCreating}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isCreating ? "Menerapkan..." : "Gunakan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create mode — pick template + enter job title
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <h2 className="font-headline-md text-on-surface">Buat CV Baru</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-lg text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Template grid */}
          <div>
            <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-3 block">Pilih Template</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CV_TEMPLATES.map((template) => (
                <TemplateOption
                  key={template.id}
                  template={template}
                  selected={selectedId === template.id}
                  onSelect={() => setSelectedId(template.id)}
                />
              ))}
            </div>
          </div>

          {/* Job Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface-variant">
              Target Posisi <span className="text-outline font-normal">(opsional)</span>
            </label>
            <input
              className="w-full p-3 rounded-xl border border-outline-variant bg-background text-body-md focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(13,115,119,0.1)] transition-all"
              placeholder="Frontend Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
            <p className="text-xs text-outline flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Mengisi posisi membantu AI menyesuaikan konten CV-mu dengan lebih baik
            </p>
          </div>

          {/* Action */}
          <button
            onClick={() => onSelect(selectedId, jobTitle.trim() || undefined)}
            disabled={isCreating}
            className="w-full bg-primary text-on-primary font-label-bold py-3 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Membuat CV...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">auto_awesome</span> Buat CV</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Single template option card with mini preview */
function TemplateOption({ template, selected, onSelect }: {
  template: CVTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative text-left rounded-xl overflow-hidden border-2 transition-all ${
        selected
          ? "border-primary shadow-md"
          : "border-outline-variant/40 hover:border-outline hover:shadow-sm"
      }`}
    >
      {/* Mini preview */}
      <div className="h-28 bg-white overflow-hidden">
        <CvTemplatePreview templateId={template.id} />
      </div>
      {/* Info */}
      <div className="p-3 bg-white border-t border-outline-variant/20">
        <div className="flex items-center justify-between">
          <span className="font-label-bold text-sm text-on-surface">{template.name}</span>
          {selected && (
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          )}
        </div>
        <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">{template.description}</p>
      </div>
    </button>
  );
}
