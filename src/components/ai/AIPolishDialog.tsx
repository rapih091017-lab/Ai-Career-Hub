"use client";

import { useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { Popover } from "@/components/ui/popover";
import { UNDO_BLOCKED_MESSAGE, useUndoGuard } from "@/hooks/useUndoGuard";
import { aiErrorMessage } from "@/components/ai/ai-error-message";
import { TargetMissingNote } from "@/components/builder/TargetHint";
import { OutputLangPicker, baseCvLang, useOutputLang } from "@/components/ai/OutputLangPicker";

export const POLISH_EXPLANATION =
  "Poles AI merapikan kalimat di kolom ini agar lebih jelas dan sesuai target pekerjaan. Fakta dan angka tidak ditambah.";

const MIN_LENGTH = 10;

/**
 * Tombol "Poles AI": klik membuka panel berisi penjelasan, lalu hasil sebelum/sesudah.
 * Teks baru dipakai hanya setelah user menekan "Pakai"; setelah itu masih bisa diurungkan.
 */
interface AIPolishButtonProps {
  content: string;
  onApply: (polishedContent: string) => void;
  jobTitle?: string;
  skills?: string[];
  jobDescription?: string;
  field?: string;
  /** Bentuk field deskripsi; menentukan format keluaran AI (poin per baris / satu paragraf). */
  format?: "bullets" | "paragraph";
  disabled?: boolean;
  /** Bahasa CV; tanpa ini ditebak dari isi kolom. Default pemilih bahasa hasil. */
  cvLang?: "id" | "en";
  /** "sm": ikon + label kecil. "icon": hanya ikon (kolom sempit), penjelasan tetap di panel. */
  size?: "sm" | "md" | "icon";
  /** Mengembalikan teks sebelum dipoles (tombol Urungkan di toast). Default: onApply. */
  onRevert?: (original: string) => void;
}

type PolishState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; original: string; polished: string }
  | { kind: "error"; message: string };

export function AIPolishButton({
  content,
  onApply,
  jobTitle,
  skills,
  jobDescription,
  field,
  format,
  onRevert,
  cvLang,
  disabled = false,
  size = "sm",
}: AIPolishButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PolishState>({ kind: "idle" });
  const { addToast } = useToast();
  const undoGuard = useUndoGuard(content);
  // Permintaan yang masih berjalan saat panel ditutup diabaikan hasilnya.
  const requestId = useRef(0);

  const { lang: outputLang, setLang: setOutputLang, cvLang: cvBase } = useOutputLang(baseCvLang(cvLang, content));

  const tooShort = !content || content.trim().length < MIN_LENGTH;

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v);
    if (!v) {
      requestId.current++;
      setState({ kind: "idle" });
    }
  }, []);

  const runPolish = useCallback(async () => {
    if (tooShort) return;
    const id = ++requestId.current;
    const original = content;
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: original.trim(),
          jobTitle,
          // Batas server: maks 50 skill; JD hanya dipakai 500 karakter pertama.
          skills: skills?.slice(0, 50),
          jobDescription: jobDescription?.slice(0, 500),
          field,
          format,
          outputLang,
          cvLang,
        }),
      });
      if (!response.ok) throw new Error(await aiErrorMessage(response, "Gagal memoles teks"));
      const data = await response.json();
      if (!data.success || typeof data.polished !== "string" || !data.polished.trim()) throw new Error("Hasil Poles AI kosong. Coba lagi.");
      if (id !== requestId.current) return;
      setState({ kind: "result", original, polished: data.polished });
    } catch (error) {
      if (id !== requestId.current) return;
      console.error("Polish error:", error);
      setState({ kind: "error", message: error instanceof Error ? error.message : "Gagal memoles teks" });
    }
  }, [tooShort, content, jobTitle, skills, jobDescription, field, format, outputLang, cvLang]);

  const accept = (original: string, polished: string) => {
    // Kolom diubah selama panel terbuka: hasil berdasar teks lama, jangan menimpa.
    if (content !== original) {
      addToast({ type: "info", message: "Teks di kolom sudah berubah. Poles ulang agar hasilnya sesuai." });
      handleOpenChange(false);
      return;
    }
    onApply(polished);
    const unchanged = undoGuard.markApplied();
    handleOpenChange(false);
    addToast({
      type: "success",
      message: "Hasil Poles AI dipakai.",
      duration: 8000,
      action: {
        label: "Urungkan",
        onClick: () => {
          // Teks sudah diedit lagi setelah dipoles: jangan ditimpa.
          if (!unchanged()) {
            addToast({ type: "info", message: UNDO_BLOCKED_MESSAGE });
            return;
          }
          (onRevert ?? onApply)(original);
        },
      },
    });
  };

  const iconOnly = size === "icon";
  const loading = state.kind === "loading";

  return (
    <Popover
      label="Poles AI"
      open={open}
      onOpenChange={handleOpenChange}
      trigger={(props) => (
        <button
          type="button"
          {...props}
          disabled={disabled}
          aria-label={iconOnly ? "Poles AI" : undefined}
          className={`inline-flex min-h-7 items-center gap-1 rounded-lg px-1.5 text-[11px] font-semibold transition-colors ${
            disabled ? "cursor-not-allowed text-on-surface-variant/50" : "text-green-deep hover:bg-lime/15 hover:text-primary"
          } ${open ? "bg-lime/20" : ""}`}
        >
          <span className={`material-symbols-outlined ${size === "md" ? "text-[18px]" : "text-[15px]"} ${loading ? "animate-spin" : ""}`} aria-hidden="true">
            {loading ? "sync" : "edit_note"}
          </span>
          {!iconOnly && <span className="whitespace-nowrap">Poles AI</span>}
        </button>
      )}
    >
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-on-surface-variant">{POLISH_EXPLANATION}</p>

        {state.kind === "result" ? (
          <div className="space-y-2" aria-live="polite">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Sebelum</p>
              <p className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-container-low p-2 text-xs text-on-surface-variant">{state.original}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-green-deep">Sesudah</p>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-green-deep/30 bg-lime/10 p-2 text-xs text-on-surface">{state.polished}</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => handleOpenChange(false)} className="min-h-9 rounded-lg px-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container">
                Batal
              </button>
              <button type="button" onClick={() => accept(state.original, state.polished)} className="min-h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:brightness-110">
                Pakai
              </button>
            </div>
          </div>
        ) : (
          <>
            {state.kind === "error" && (
              <p role="alert" className="rounded-lg bg-error-container px-2 py-1.5 text-xs text-on-error-container">{state.message}</p>
            )}
            {!tooShort && <OutputLangPicker value={outputLang} onChange={setOutputLang} cvLang={cvBase} disabled={loading} />}
            {tooShort ? (
              <p className="text-xs font-medium text-on-surface">Tulis minimal {MIN_LENGTH} karakter dulu, lalu poles.</p>
            ) : (
              <button
                type="button"
                onClick={runPolish}
                disabled={loading}
                className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Memoles..." : state.kind === "error" ? "Coba lagi" : "Poles teks ini"}
              </button>
            )}
            <TargetMissingNote />
          </>
        )}
      </div>
    </Popover>
  );
}
