"use client";

import { useState, useRef } from "react";

interface PhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function PhotoUpload({ value, onChange, label = "Foto Profil" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal upload");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Gagal mengupload foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    } else {
      setError("Hanya file gambar yang diizinkan");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUrlInput = (url: string) => {
    onChange(url);
    setError("");
  };

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium text-on-surface-variant mb-1">{label}</label>

      {/* Preview + Upload Area */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all ${
          dragOver
            ? "border-primary bg-primary/5"
            : value
            ? "border-primary/30 bg-primary/5"
            : "border-outline-variant bg-surface-container-low hover:border-primary/30 hover:bg-primary/5"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className="w-full h-40 object-cover rounded-xl"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all text-sm"
              aria-label="Hapus foto"
            >
              ✕
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-8 flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-on-surface-variant">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span className="text-xs text-on-surface-variant font-medium">
                  Klik atau tarik foto ke sini
                </span>
                <span className="text-[10px] text-on-surface-variant/60">
                  PNG, JPG, WebP. Maks 5MB
                </span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* URL Input (fallback) */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleUrlInput(e.target.value)}
            placeholder="Atau masukkan URL foto..."
            className="w-full px-3 py-2 rounded-lg border text-xs bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
