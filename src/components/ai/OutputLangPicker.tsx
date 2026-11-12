"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { OUTPUT_LANG_NAME, detectLang, type OutputLang } from "@/lib/ai/output-lang";

const STORAGE_KEY = "ai-output-lang";

function readStored(): OutputLang | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "id" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

/** Bahasa CV dari cvLang; tanpa itu ditebak dari teks, lalu "id". */
export function baseCvLang(cvLang?: unknown, text?: string | null): OutputLang {
  if (cvLang === "id" || cvLang === "en") return cvLang;
  return detectLang(text) ?? "id";
}

/**
 * Bahasa hasil AI: pilihan terakhir di perangkat ini, kalau belum pernah
 * memilih ikut bahasa CV. Pilihan disimpan di localStorage (boleh gagal).
 */
export function useOutputLang(cvLang: OutputLang) {
  const [lang, setLangState] = useState<OutputLang>(cvLang);
  const [chosen, setChosen] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setLangState(stored);
      setChosen(true);
    }
  }, []);

  useEffect(() => {
    if (!chosen) setLangState(cvLang);
  }, [cvLang, chosen]);

  const setLang = useCallback((v: OutputLang) => {
    setLangState(v);
    setChosen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // Penyimpanan diblokir: pilihan tetap berlaku sampai halaman ditutup.
    }
  }, []);

  return [lang, setLang] as const;
}

interface OutputLangPickerProps {
  value: OutputLang;
  onChange: (v: OutputLang) => void;
  /** Bahasa CV; bila beda dari value, tampil catatan kecil. */
  cvLang: OutputLang;
  disabled?: boolean;
}

const CV_LANG_LABEL: Record<OutputLang, string> = { id: "Indonesia", en: "Inggris" };

/** Pilihan segmented "Bahasa hasil: Indonesia | English". */
export function OutputLangPicker({ value, onChange, cvLang, disabled = false }: OutputLangPickerProps) {
  const labelId = useId();
  const options: { v: OutputLang; label: string }[] = [
    { v: "id", label: "Indonesia" },
    { v: "en", label: "English" },
  ];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span id={labelId} className="text-[11px] font-semibold text-on-surface-variant">
          Bahasa hasil:
        </span>
        <div role="radiogroup" aria-labelledby={labelId} className="inline-flex rounded-lg border border-outline-variant p-0.5">
          {options.map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={value === o.v}
              disabled={disabled}
              onClick={() => onChange(o.v)}
              className={`min-h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                value === o.v ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {value !== cvLang && (
        <p className="text-[11px] text-on-surface-variant">
          CV-mu berbahasa {CV_LANG_LABEL[cvLang]}; hasil akan dalam {OUTPUT_LANG_NAME[value]}.
        </p>
      )}
    </div>
  );
}
