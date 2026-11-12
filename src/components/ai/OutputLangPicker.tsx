"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { detectLang, type OutputLang } from "@/lib/ai/output-lang";
import { fill, useTranslation } from "@/lib/i18n";

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

export interface OutputLangState {
  /** Bahasa hasil yang dipakai saat memanggil AI. */
  lang: OutputLang;
  setLang: (v: OutputLang) => void;
  /** Bahasa CV (dasar default dan catatan perbedaan). */
  cvLang: OutputLang;
}

/**
 * Sumber state bahasa hasil: pilihan terakhir di perangkat ini, kalau belum
 * pernah memilih ikut bahasa CV. Disimpan di localStorage (boleh gagal).
 */
export function useOutputLangController(cvLang: OutputLang): OutputLangState {
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

  return useMemo(() => ({ lang, setLang, cvLang }), [lang, setLang, cvLang]);
}

const OutputLangContext = createContext<OutputLangState | null>(null);

/** Builder memasang satu state untuk semua fitur AI di halaman. */
export function OutputLangProvider({ value, children }: { value: OutputLangState; children: ReactNode }) {
  return <OutputLangContext.Provider value={value}>{children}</OutputLangContext.Provider>;
}

/**
 * State bahasa hasil. Di dalam OutputLangProvider memakai state bersama;
 * di luar itu (mis. portofolio) memakai state lokal dari fallbackCvLang.
 */
export function useOutputLang(fallbackCvLang: OutputLang): OutputLangState {
  const local = useOutputLangController(fallbackCvLang);
  return useContext(OutputLangContext) ?? local;
}

interface OutputLangPickerProps {
  value: OutputLang;
  onChange: (v: OutputLang) => void;
  /** Bahasa CV; bila beda dari value, tampil catatan kecil. */
  cvLang: OutputLang;
  disabled?: boolean;
}

/** Pilihan segmented "Bahasa hasil: Indonesia | English". */
export function OutputLangPicker({ value, onChange, cvLang, disabled = false }: OutputLangPickerProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const options: { v: OutputLang; label: string }[] = [
    { v: "id", label: "Indonesia" },
    { v: "en", label: "English" },
  ];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span id={labelId} className="text-[11px] font-semibold text-on-surface-variant">
          {t("ai.lang-label")}
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
          {fill(t("ai.lang-note"), { cv: t(`ai.lang-cv-${cvLang}`), out: t(`ai.lang-out-${value}`) })}
        </p>
      )}
    </div>
  );
}
