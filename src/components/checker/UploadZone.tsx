"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";

interface UploadZoneProps {
  file: File | null;
  dragActive: boolean;
  onFileChange: (file: File | null) => void;
  onDragStateChange: (active: boolean) => void;
  label: string;
  hint: string;
  loading?: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadZone({ file, dragActive, onFileChange, onDragStateChange, label, hint, loading, error }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const validateAndSet = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      onFileChange(null);
      addToast({
        type: "error",
        message: t("upload.size-error"),
        duration: 3000,
      });
      return;
    }
    onFileChange(f);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items?.length) onDragStateChange(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    validateAndSet(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    validateAndSet(f);
  };

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        className={`flex flex-col items-center justify-center rounded-[18px] border-2 border-dashed px-6 py-12 transition-colors duration-300 ${
          loading
            ? "border-ink bg-lime/20 animate-pulse"
            : error
              ? "border-error bg-error-container/60"
              : dragActive
                ? "border-ink bg-lime/25"
                : "border-ink/30 bg-desk/60 hover:border-ink hover:bg-lime/10"
        }`}
      >
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform ${loading ? "border-ink/20 bg-lime/50 animate-bounce" : "border-ink/15 bg-paper group-hover:scale-110 group-active:scale-95"}`}>
          {loading ? (
            <svg className="h-8 w-8 animate-spin text-green-deep" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <span className="material-symbols-outlined select-none text-4xl text-green-deep">{file && !error ? "description" : "cloud_upload"}</span>
          )}
        </div>
        <p className="mb-1 max-w-full truncate text-center text-sm font-bold text-ink">
          {loading ? t("upload.processing") : file && !error ? file.name : label}
        </p>
        <p className={`text-center text-xs ${error ? "font-semibold text-error" : "text-ink-soft"}`}>{error || hint}</p>
      </div>
    </div>
  );
}
