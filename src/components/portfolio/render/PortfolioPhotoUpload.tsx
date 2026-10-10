"use client";

import { useRef, useState } from "react";
import {
  ALLOWED_MIME,
  MAX_ASSET_BYTES,
  dimensionWarning,
  fitsDimensionBudget,
} from "@/lib/portfolio/assets";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  className?: string;
};

export default function PortfolioPhotoUpload({
  value,
  onChange,
  label,
  hint,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setNotice(null);

    if (file.size > MAX_ASSET_BYTES) {
      setError(
        `Ukuran maksimal 4 MB. Berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/portfolio/assets", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengunggah gambar");
        return;
      }
      onChange(json.url as string);
      if (json.width && json.height && !fitsDimensionBudget(json.width, json.height)) {
        setNotice(dimensionWarning(json.width, json.height));
      }
    } catch {
      setError("Gagal mengunggah gambar. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <span className="mb-1 block text-sm font-medium text-on-surface">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden>upload</span>
          {busy ? "Mengunggah" : "Pilih gambar"}
        </button>
        <span className="truncate text-xs text-on-surface-variant">
          {value ? value : "Belum ada gambar"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME.join(",")}
        onChange={onPick}
        className="sr-only"
        aria-label={label}
      />
      {hint ? <p className="mt-1 text-xs text-on-surface-variant">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
      {notice ? <p className="mt-1 text-xs text-amber-700">{notice}</p> : null}
    </div>
  );
}
