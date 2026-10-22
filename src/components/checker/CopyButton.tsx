"use client";

import { useEffect, useRef, useState } from "react";
import { copyToClipboard, findPlaceholders, sanitizeCopyText } from "@/lib/checker/copy";

interface CopyButtonProps {
  /** Teks yang disalin; diproses sanitizeCopyText dulu supaya polos dan siap tempel. */
  text: string;
  label?: string;
  onCopied?: () => void;
}

/**
 * Tombol salin untuk satu teks saran. Yang disalin adalah teks polos hasil
 * sanitizeCopyText, bukan mentah — tujuannya ditempel langsung ke CV.
 * Placeholder sengaja tidak ditangkap diam-diam: bila masih ada, pengguna
 * diberi tahu supaya tidak mengirim "[angka]" apa adanya.
 */
export function CopyButton({ text, label = "Salin", onCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeholders = findPlaceholders(text);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async () => {
    const ok = await copyToClipboard(sanitizeCopyText(text));
    if (!ok) return;
    setCopied(true);
    onCopied?.();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
      <button
        type="button"
        onClick={handleClick}
        aria-label={copied ? "Tersalin ✓" : label}
        className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink/20 px-2 py-1 text-xs font-bold text-ink transition-colors hover:border-ink hover:bg-surface-container-low active:scale-[0.97]"
      >
        <span className="material-symbols-outlined select-none text-[13px]" aria-hidden="true">
          {copied ? "check" : "content_copy"}
        </span>
        {copied ? "Tersalin ✓" : label}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Tersalin ✓" : ""}
      </span>
      {placeholders.length > 0 && (
        <span className="w-full rounded-lg border border-tertiary/50 bg-tertiary-container px-2 py-1 text-left text-xs font-semibold leading-snug text-on-tertiary-container">
          Masih ada bagian {placeholders.join(", ")}, ganti dengan data aslimu sebelum dikirim.
        </span>
      )}
    </span>
  );
}
