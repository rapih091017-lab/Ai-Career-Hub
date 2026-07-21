"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

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
  onAccept: (text: string) => void;
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
  onAccept,
}: AIProposalModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<"conservative" | "improved" | "bold" | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);

  const isSingleSelectSuggest = suggestions != null && suggestions.length > 0 && suggestions.some(function (s) {
    return s.description != null;
  });

  useEffect(function () {
    if (open) {
      setSelectedVersion(null);
      setSelectedSuggestionIndex(null);
    }
  }, [open]);

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
        var text = suggestions.map(function (s) { return s.bullet; }).join("\n");
        onAccept(text);
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
  }

  var buttonLabel = "Gunakan Versi Ini";
  if (mode === "suggest" && !isSingleSelectSuggest) {
    buttonLabel = "Gunakan Semua Saran";
  }

  /* ── Mode context labels ── */
  var modeLabel = mode === "suggest" ? "Gaya Baru" : "Optimasi";
  var modeHint = mode === "suggest"
    ? "Pilih gaya penulisan yang paling cocok — konten fresh dari AI"
    : "Pilih tingkat perbaikan — teks asli akan ditingkatkan secara progresif";
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
                ? "Pilih versi ringkasan yang paling cocok untuk kamu:"
                : "AI menyarankan bullet points berikut berdasarkan posisi dan skill kamu:"}
            </p>
            <div className="space-y-2">
              {suggestions.map(function (s, i) {
                var isSelectable = isSingleSelectSuggest;
                var isSelected = isSelectable && selectedSuggestionIndex === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={function () {
                      if (isSelectable) { setSelectedSuggestionIndex(i); }
                    }}
                    className={
                      "w-full text-left flex gap-3 p-3.5 rounded-xl border transition-all duration-200 " +
                      (isSelected
                        ? "bg-primary/5 border-primary/50 shadow-sm"
                        : "bg-surface-container-low border-outline-variant/30 hover:border-primary/30") +
                      " " + (isSelectable ? "cursor-pointer" : "cursor-default")
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
                <div className="mt-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                  <p className="text-sm text-on-surface-variant italic leading-relaxed">{original}</p>
                </div>
              </details>
            )}

            <div className="grid gap-3">
              {([
                { key: "conservative" as const, label: "Konservatif", desc: "Perbaikan ringan, tetap humble", color: "border-blue-300 bg-blue-50/30", labelColor: "bg-blue-100 text-blue-700", iconColor: "text-blue-600" },
                { key: "improved" as const, label: "Improved", desc: "Lebih impactful, ada metrik", color: "border-amber-300 bg-amber-50/30", labelColor: "bg-amber-100 text-amber-700", iconColor: "text-amber-600" },
                { key: "bold" as const, label: "Bold", desc: "Paling kuat, untuk senior role", color: "border-green-300 bg-green-50/30", labelColor: "bg-green-100 text-green-700", iconColor: "text-green-600" },
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
                        : "border-outline-variant/30 bg-white hover:border-primary/40 hover:shadow-sm hover:bg-primary/[0.02]")
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
                    <p className="text-sm text-on-surface leading-relaxed">{text}</p>
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
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Mengapa Ini Lebih Baik</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{explanation}</p>
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
        <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-all active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            onClick={handleAccept}
            disabled={isDisabled}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
