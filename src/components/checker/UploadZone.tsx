"use client";

import { useRef, useState } from "react";

interface UploadZoneProps {
  file: File | null;
  dragActive: boolean;
  onFileChange: (file: File | null) => void;
  onDragStateChange: (active: boolean) => void;
  label: string;
  hint: string;
}

export function UploadZone({ file, dragActive, onFileChange, onDragStateChange, label, hint }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileChange(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileChange(f);
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
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[16px] py-12 px-6 transition-colors duration-300 ${
          dragActive
            ? "border-primary bg-primary-fixed/40"
            : "border-primary/30 bg-primary-fixed/20 hover:border-primary/60 hover:bg-primary-fixed/40"
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-active:scale-95">
          <span className="material-symbols-outlined text-primary text-4xl select-none">cloud_upload</span>
        </div>
        <p className="text-sm font-semibold text-on-background text-center mb-1">
          {file ? file.name : label}
        </p>
        <p className="text-xs text-on-surface-variant">{hint}</p>
      </div>
    </div>
  );
}
