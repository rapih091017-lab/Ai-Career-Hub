"use client";

import { useState } from "react";
import LocalizedText from "@/components/ui/LocalizedText";
import type { CvData } from "@/components/cv-templates";
import {
  type AutoFixSuggestion,
  applyApprovedFixes,
} from "@/lib/auto-fix";

interface AutoFixPanelProps {
  cvId: string;
  cvData: CvData;
  onApply: (next: CvData) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  bahasa: "Bahasa",
  bullet: "Bullet",
  kata_kunci: "Kata kunci",
};

function targetLabel(s: AutoFixSuggestion): string {
  if (s.type === "add_skill") return "Keahlian";
  if (s.target === "summary") return "Ringkasan";
  return `Pengalaman ${(s.index ?? 0) + 1}`;
}

export function AutoFixPanel({ cvId, cvData, onApply }: AutoFixPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<AutoFixSuggestion[]>([]);
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "rejected">>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState("");
  const [appliedCount, setAppliedCount] = useState(0);

  const editedValue = (s: AutoFixSuggestion) =>
    edits[s.id] ?? (s.type === "replace_text" ? s.replacement : s.name);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError("");
    setAppliedCount(0);
    try {
      const res = await fetch(`/api/cv-documents/${cvId}/auto-fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvData, jobDescription: cvData.jobDescription ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal memeriksa CV. Coba lagi beberapa saat.");
        return;
      }
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setDecisions({});
      setEdits({});
    } catch {
      setError("Gagal menghubungi layanan AI. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (on: boolean) => {
    setEnabled(on);
    setError("");
    if (on && suggestions.length === 0 && appliedCount === 0) {
      void fetchSuggestions();
    }
  };

  const setDecision = (id: string, d: "accepted" | "rejected" | undefined) => {
    setDecisions((prev) => {
      const next = { ...prev };
      if (d === undefined) delete next[id];
      else next[id] = d;
      return next;
    });
  };

  const handleCopy = async (s: AutoFixSuggestion) => {
    try {
      await navigator.clipboard.writeText(editedValue(s));
      setCopiedId(s.id);
      window.setTimeout(() => setCopiedId((cur) => (cur === s.id ? "" : cur)), 1500);
    } catch {
      // Clipboard tidak tersedia (mis. konteks non-HTTPS) — abaikan, teks tetap bisa disalin manual.
    }
  };

  const accepted = suggestions.filter((s) => decisions[s.id] === "accepted");

  const handleApply = () => {
    const fixes: AutoFixSuggestion[] = [];
    for (const s of accepted) {
      const value = editedValue(s).trim();
      if (!value) continue;
      if (s.type === "replace_text") fixes.push({ ...s, replacement: value });
      else fixes.push({ ...s, name: value });
    }
    if (fixes.length === 0) return;
    onApply(applyApprovedFixes(cvData, fixes));
    setAppliedCount(fixes.length);
    setSuggestions([]);
    setDecisions({});
    setEdits({});
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-green-deep text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              fact_check
            </span>
          </div>
          <div>
            <h3 className="font-label-bold text-on-surface">
              <LocalizedText text="Cek & perbaiki otomatis" />
            </h3>
            <p className="text-sm text-on-surface-variant">
              <LocalizedText text="AI memeriksa bahasa, bullet pengalaman, dan kata kunci — kamu setujui tiap saran sebelum diterapkan." />
            </p>
          </div>
        </div>
        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Cek dan perbaiki otomatis"
          onClick={() => handleToggle(!enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-1 ${enabled ? "bg-primary" : "bg-outline-variant/60"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-base" aria-hidden="true">sync</span>
              <LocalizedText text="AI sedang memeriksa CV-mu..." />
            </p>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-red-500 text-base shrink-0" aria-hidden="true">error</span>
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchSuggestions()}
                  className="text-xs font-bold text-red-700 underline mt-1"
                >
                  <LocalizedText text="Coba lagi" />
                </button>
              </div>
            </div>
          )}

          {!loading && !error && appliedCount > 0 && suggestions.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-green-600 text-base shrink-0" aria-hidden="true">check_circle</span>
              <div className="flex-1">
                <p className="text-sm text-green-800">
                  <LocalizedText text={`${appliedCount} saran diterapkan. Tinjau hasilnya di pratinjau kanan.`} />
                </p>
                <button
                  type="button"
                  onClick={() => void fetchSuggestions()}
                  className="text-xs font-bold text-green-800 underline mt-1"
                >
                  <LocalizedText text="Cek lagi" />
                </button>
              </div>
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && appliedCount === 0 && (
            <p className="text-sm text-on-surface-variant">
              <LocalizedText text="Tidak ada saran perbaikan — CV-mu sudah rapi. Kerja bagus!" />
            </p>
          )}

          {suggestions.map((s) => {
            const decision = decisions[s.id];
            const isAccepted = decision === "accepted";
            const isRejected = decision === "rejected";
            return (
              <div
                key={s.id}
                className={`border rounded-xl p-3 space-y-2 transition-colors ${
                  isAccepted ? "border-primary/60 bg-primary/5" : isRejected ? "border-outline-variant/40 opacity-60" : "border-outline-variant/50"
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                    {CATEGORY_LABEL[s.type === "add_skill" ? "kata_kunci" : s.category] ?? s.category}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant uppercase tracking-wide">
                    {targetLabel(s)}
                  </span>
                </div>

                {s.type === "replace_text" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-on-surface-variant line-through decoration-red-300">{s.original}</p>
                    <textarea
                      rows={2}
                      value={editedValue(s)}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      className="w-full bg-white border border-outline-variant/50 rounded-lg px-2.5 py-1.5 text-sm text-on-surface focus:ring-2 focus:ring-primary resize-none"
                      aria-label="Ubah saran perbaikan"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 text-base" aria-hidden="true">add</span>
                    <input
                      value={editedValue(s)}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      className="flex-1 bg-white border border-outline-variant/50 rounded-lg px-2.5 py-1.5 text-sm text-on-surface focus:ring-2 focus:ring-primary"
                      aria-label="Ubah nama keahlian"
                      maxLength={60}
                    />
                  </div>
                )}

                {s.reason && <p className="text-xs text-on-surface-variant">{s.reason}</p>}

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDecision(s.id, isAccepted ? undefined : "accepted")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      isAccepted ? "bg-primary text-white" : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">check</span>
                    <LocalizedText text="Terima" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision(s.id, isRejected ? undefined : "rejected")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      isRejected ? "bg-surface-container text-on-surface" : "bg-surface-container/60 text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
                    <LocalizedText text="Tolak" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopy(s)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-surface-container/60 text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                      {copiedId === s.id ? "check" : "content_copy"}
                    </span>
                    <LocalizedText text={copiedId === s.id ? "Disalin" : "Salin"} />
                  </button>
                </div>
              </div>
            );
          })}

          {accepted.length > 0 && (
            <button
              type="button"
              onClick={handleApply}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-[0.99] transition-all"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">auto_fix_high</span>
              <LocalizedText text={`Terapkan ${accepted.length} saran yang disetujui`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
