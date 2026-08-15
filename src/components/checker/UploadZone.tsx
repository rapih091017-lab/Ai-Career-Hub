"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

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

  const validateAndSet = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      onFileChange(null);
      addToast({
        type: "error",
        message: "Ukuran file maksimal 10MB. Pilih file yang lebih kecil.",
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
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[16px] py-12 px-6 transition-colors duration-300 ${
          loading
            ? "border-primary bg-primary-fixed/40 animate-pulse"
            : error
              ? "border-red-400 bg-red-50"
              : dragActive
                ? "border-primary bg-primary-fixed/40"
                : "border-primary/30 bg-primary-fixed/20 hover:border-primary/60 hover:bg-primary-fixed/40"
        }`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${loading ? "bg-primary/20 animate-bounce" : "bg-primary/10 group-hover:scale-110 group-active:scale-95"}`}>
          {loading ? (
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <span className="material-symbols-outlined text-primary text-4xl select-none">{file && !error ? "description" : "cloud_upload"}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-on-background text-center mb-1">
          {loading ? "Memproses file..." : file && !error ? file.name : label}
        </p>
        <p className={`text-xs ${error ? "text-red-500" : "text-on-surface-variant"}`}>{error || hint}</p>
      </div>
    </div>
  );
}
