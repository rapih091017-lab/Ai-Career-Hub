"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { bulletList, splitAiBullets } from "@/lib/bullet-lines";

/* ───────── Types ───────── */

interface SuggestionItem {
  bullet: string;
  actionVerb?: string;
  metric?: string;
  description?: string;
}

interface Versions {
  conservative: string;
  improved: string;
  bold: string;
}

interface AIProposalModalProps {
  open: boolean;
  onClose: () => void;
  mode: "suggest" | "revise";
  title: string;
  suggestions?: SuggestionItem[];
  original?: string;
  versions?: Versions;
  explanation?: string;
  tip?: string;
  /** Versi (mode revise) ditampilkan sebagai daftar poin. */
  asBullets?: boolean;
  /** mode "append" menambah poin terpilih; "replace" mengganti seluruh isi. */
  onAccept: (text: string, mode?: "append" | "replace") => void;
}

/* ───────── Component ───────── */

export default function AIProposalModal({
  open,
  onClose,
  mode,
  title,
  suggestions,
  original,
  versions,
  explanation,
  tip,
  asBullets = false,
  onAccept,
}: AIProposalModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<"conservative" | "improved" | "bold" | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  // Saran poin (multi pilih): default semua dicentang.
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const isSingleSelectSuggest = suggestions != null && suggestions.length > 0 && suggestions.some(function (s) {
    return s.description != null;
  });

  useEffect(function () {
    if (open) {
      setSelectedVersion(null);
      setSelectedSuggestionIndex(null);
      setChecked(new Set((suggestions ?? []).map(function (_, i) { return i; })));
    }
  }, [open, suggestions]);

  function checkedText() {
    return splitAiBullets((suggestions ?? []).filter(function (_, i) { return checked.has(i); }).map(function (s) { return s.bullet; }));
  }

  function handleClose() {
    setSelectedVersion(null);
    setSelectedSuggestionIndex(null);
    onClose();
  }

  function handleAccept() {
    if (mode === "suggest" && suggestions != null) {
      if (isSingleSelectSuggest && selectedSuggestionIndex !== null) {
        onAccept(suggestions[selectedSuggestionIndex].bullet);
      } else {
        onAccept(checkedText(), "append");
      }
    } else if (mode === "revise" && selectedVersion != null && versions != null) {
      onAccept(versions[selectedVersion]);
    }
  }

  var isDisabled = false;
  if (mode === "revise") {
    isDisabled = selectedVersion == null;
  } else if (mode === "suggest" && isSingleSelectSuggest) {
    isDisabled = selectedSuggestionIndex === null;
  } else if (mode === "suggest") {
    isDisabled = checked.size === 0;
  }
  var isMultiSuggest = mode === "suggest" && !isSingleSelectSuggest;

  var buttonLabel = "Pakai versi ini";
  if (isMultiSuggest) {
    buttonLabel = checked.size > 0 ? "Tambahkan " + checked.size + " poin" : "Tambahkan";
  }

  /* ── Mode context labels ── */
  var modeLabel = mode === "suggest" ? "Saran baru" : "Perbaikan";
  var modeHint = mode === "suggest"
    ? "Ditulis dari posisi dan skill kamu. Periksa dulu; isi sendiri bagian dalam [kurung]."
    : "Tiga versi dari teks kamu, dari perubahan paling kecil sampai paling tegas.";
  var modeColors = mode === "suggest"
    ? "bg-amber-100 text-amber-700"
    : "bg-primary/10 text-primary";

  return (
    <Modal open={open} onClose={onClose} title={
      <div className="flex items-center gap-2.5">
        <span>{title}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${modeColors}`}>
          {modeLabel}
        </span>
      </div>
    } size="max-w-2xl">
      <div className="space-y-5 pt-2">
        {/* Mode context line */}
        <p className="text-[11px] text-outline/70 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">info</span>
          {modeHint}
        </p>

        {/* ── Suggest Mode ── */}
        {mode === "suggest" && suggestions != null && suggestions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">
              {isSingleSelectSuggest
                ? "Pilih satu versi ringkasan:"
                : checked.size + " dari " + suggestions.length + " poin dipilih. Tambahkan menaruhnya di bawah deskripsi; Ganti semua menimpa deskripsi."}
            </p>
            {!isSingleSelectSuggest && (
              <button
                type="button"
                onClick={function () {
                  setChecked(checked.size === suggestions.length ? new Set() : new Set(suggestions.map(function (_, i) { return i; })));
                }}
                className="min-h-11 rounded-md px-1 text-xs font-semibold text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-8"
              >
                {checked.size === suggestions.length ? "Kosongkan pilihan" : "Pilih semua"}
              </button>
            )}
            <div className="space-y-2">
              {suggestions.map(function (s, i) {
                var isSelected = isSingleSelectSuggest ? selectedSuggestionIndex === i : checked.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    role={isSingleSelectSuggest ? "radio" : "checkbox"}
                    aria-checked={isSelected}
                    onClick={function () {
                      if (isSingleSelectSuggest) { setSelectedSuggestionIndex(i); return; }
                      setChecked(function (prev) {
                        var next = new Set(prev);
                        if (next.has(i)) next.delete(i); else next.add(i);
                        return next;
                      });
                    }}
                    className={
                      "w-full text-left flex gap-3 p-3.5 rounded-xl border transition-all duration-200 " +
                      (isSelected
                        ? "bg-primary/5 border-primary/50 shadow-sm"
                        : "bg-surface-container-low border-outline-variant/50 hover:border-primary/30") +
                      " cursor-pointer"
                    }
                  >
                    <div className={
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 " +
                      (isSelected ? "bg-primary text-on-primary" : "bg-primary/10 text-primary")
                    }>
                      {isSelected ? (
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface leading-relaxed">{s.bullet}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {s.actionVerb != null && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                            {s.actionVerb}
                          </span>
                        )}
                        {s.metric != null && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            {s.metric}
                          </span>
                        )}
                      </div>
                      {s.description != null && (
                        <p className="text-[11px] text-on-surface-variant italic mt-1.5 leading-snug">{s.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Revise Mode ── */}
        {mode === "revise" && versions != null && (
          <div className="space-y-4">
            {original != null && (
              <details className="group">
                <summary className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider cursor-pointer flex items-center gap-1.5 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm group-open:rotate-90 transition-transform">chevron_right</span>
                  Teks Asli
                </summary>
                <div className="mt-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50">
                  {asBullets ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface-variant leading-relaxed">
                      {bulletList(original).map(function (line, j) {
                        return <li key={j}>{line}</li>;
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-on-surface-variant italic leading-relaxed">{original}</p>
                  )}
                </div>
              </details>
            )}

            <div className="grid gap-3">
              {([
                { key: "conservative" as const, label: "Ringan", desc: "Perubahan kecil, isi tetap sama", color: "border-blue-300 bg-blue-50/30", labelColor: "bg-blue-100 text-blue-700", iconColor: "text-blue-600" },
                { key: "improved" as const, label: "Lebih tegas", desc: "Hasil kerja lebih menonjol", color: "border-amber-300 bg-amber-50/30", labelColor: "bg-amber-100 text-amber-700", iconColor: "text-amber-600" },
                { key: "bold" as const, label: "Paling tegas", desc: "Cocok untuk peran senior", color: "border-green-300 bg-green-50/30", labelColor: "bg-green-100 text-green-700", iconColor: "text-green-600" },
              ]).map(function (item) {
                var text = versions[item.key];
                var isSelected = selectedVersion === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={function () { setSelectedVersion(item.key); }}
                    className={
                      "text-left p-4 rounded-xl border-2 transition-all duration-200 " +
                      (isSelected
                        ? item.color + " border-current shadow-sm"
                        : "border-outline-variant/50 bg-surface-container-lowest hover:border-primary/40 hover:shadow-sm hover:bg-primary/[0.02]")
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full " + item.labelColor}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-on-surface-variant hidden sm:inline">{item.desc}</span>
                      </div>
                      {isSelected && (
                        <span className={"material-symbols-outlined text-sm " + item.iconColor} style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      )}
                    </div>
                    {asBullets ? (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface leading-relaxed">
                        {bulletList(splitAiBullets(text)).map(function (line, j) {
                          return <li key={j}>{line}</li>;
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-on-surface leading-relaxed">{text}</p>
                    )}
                  </button>
                );
              })}
            </div>

            {explanation != null && (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Apa yang berubah</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{versionLabelsInText(explanation)}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tip ── */}
        {tip != null && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
            </svg>
            <p className="text-xs text-amber-800 leading-relaxed">{tip}</p>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 pt-3 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-all active:scale-[0.98]"
          >
            Batal
          </button>
          {isMultiSuggest && (
            <button
              type="button"
              onClick={function () { onAccept(checkedText(), "replace"); }}
              disabled={checked.size === 0}
              className="flex-1 py-2.5 rounded-xl border border-amber-400 bg-amber-50 text-sm font-semibold text-amber-900 hover:bg-amber-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">warning</span>
              Ganti semua
            </button>
          )}
          <button
            type="button"
            onClick={handleAccept}
            disabled={isDisabled}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {buttonLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Penjelasan Optimalkan kadang masih menyebut "Conservative:/Improved:/Bold:"
 * (respons lama atau model tidak patuh). Petakan ke label kartu versi.
 * Hanya bentuk berlabel (diikuti titik dua) yang diganti, isi teks lain tidak.
 */
export function versionLabelsInText(text: string): string {
  const map: Record<string, string> = { conservative: "Ringan", improved: "Lebih tegas", bold: "Paling tegas" };
  return text.replace(/\b(Conservative|Improved|Bold)(\s*):/gi, (_m, w: string, sp: string) => `${map[w.toLowerCase()]}${sp}:`);
}
