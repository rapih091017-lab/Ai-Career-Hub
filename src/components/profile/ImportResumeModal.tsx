"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";
import { extractPdfTextClient, renderPdfPagesToBlobs } from "@/lib/pdf-extract-client";
import { runClientOcr, type OcrMsgs } from "@/lib/ocr-client";

/** Struktur hasil ekstraksi AI, kompatibel dengan form halaman /profile. */
export interface ImportedProfile {
  personalInfo: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    linkedin: string;
    portfolioUrl: string;
    summary: string;
  };
  workHistory: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    isPresent?: boolean;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    isPresent?: boolean;
  }>;
  organisations: Array<{
    id: string;
    name: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    isPresent?: boolean;
  }>;
  skills: Array<{ id: string; name: string; level: "beginner" | "intermediate" | "advanced" }>;
  certifications: Array<{ id: string; name: string; issuer: string; year: string }>;
}

interface ImportResumeModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (profile: ImportedProfile) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ImportResumeModal({ open, onClose, onImported }: ImportResumeModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState<"reading" | "parsing" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ImportedProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ocrMsgs: OcrMsgs = {
    preparing: t("checker.ocr.preparing"),
    core: t("checker.ocr.core"),
    lang: t("checker.ocr.lang"),
    init: t("checker.ocr.init"),
    reading: (p: number) => t("checker.ocr.reading").replace("{p}", String(p)),
    page: (i: number, total: number) =>
      t("checker.ocr.page").replace("{i}", String(i)).replace("{total}", String(total)),
  };

  useEffect(() => {
    if (!open) return;
    setText("");
    setFileName("");
    setBusy(null);
    setNote("");
    setError("");
    setProfile(null);
  }, [open]);

  /** Baca file apa pun menjadi teks: PDF (klien, lalu OCR otomatis bila scan),
   * gambar (OCR), DOCX (server). Semua langkah berjalan otomatis. */
  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      addToast({ type: "error", message: t("upload.size-error") });
      return;
    }
    setError("");
    setProfile(null);
    setFileName(file.name);
    setBusy("reading");

    const name = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(name);

    try {
      let extracted = "";

      if (isPdf) {
        setNote(t("checker.extract.reading-file"));
        try {
          extracted = await extractPdfTextClient(file);
        } catch (err) {
          console.error("[profile-import] ekstraksi PDF klien gagal:", err);
        }
        if (extracted.length < 50) {
          setNote(t("checker.extract.auto-ocr"));
          const blobs = await renderPdfPagesToBlobs(file, 5);
          if (blobs.length > 0) {
            extracted = await runClientOcr(blobs, setNote, ocrMsgs);
          }
        }
        if (extracted.trim().length < 20) {
          // Fallback terakhir: server (pdfjs + pdf-parse).
          setNote(t("checker.extract.server-fallback"));
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/checker/extract", { method: "POST", body: formData });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.extractedText) {
            extracted = data.extractedText as string;
          } else {
            throw new Error(data?.message || t("profile.import.err-read"));
          }
        }
      } else if (isImage) {
        setNote(t("checker.ocr.reading-image"));
        extracted = await runClientOcr([file], setNote, ocrMsgs);
        if (extracted.trim().length < 20) {
          throw new Error(t("profile.import.err-read"));
        }
      } else {
        // DOCX dan lainnya diproses server.
        setNote(t("checker.extract.server-fallback"));
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/checker/extract", { method: "POST", body: formData });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.extractedText) {
          extracted = data.extractedText as string;
        } else {
          throw new Error(data?.message || t("profile.import.err-read"));
        }
      }

      setText(extracted.trim());
    } catch (err: any) {
      setError(err?.message || t("profile.import.err-read"));
    } finally {
      setBusy(null);
      setNote("");
    }
  };

  const handleExtract = async () => {
    if (text.trim().length < 50) {
      setError(t("profile.import.missing"));
      return;
    }
    setError("");
    setProfile(null);
    setBusy("parsing");
    try {
      const res = await fetch("/api/profile/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || t("profile.import.err-parse"));
      }
      setProfile(data.profile as ImportedProfile);
    } catch (err: any) {
      setError(err?.message || t("profile.import.err-generic"));
    } finally {
      setBusy(null);
    }
  };

  const handleApply = () => {
    if (!profile) return;
    onImported(profile);
    addToast({ type: "success", message: t("profile.import.applied") });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t("profile.import.title")} size="max-w-xl">
      <div className="space-y-4">
        <p className="text-label-sm text-on-surface-variant">{t("profile.import.desc")}</p>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-label-bold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              upload_file
            </span>
            {t("profile.import.upload")}
          </button>
          {fileName ? (
            <span className="truncate text-label-sm text-on-surface-variant">{fileName}</span>
          ) : null}
        </div>

        <p className="text-center text-label-sm text-on-surface-variant">{t("profile.import.or")}</p>

        <div className="space-y-1.5">
          <label className="text-label-bold text-on-surface">{t("profile.import.paste-label")}</label>
          <textarea
            className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("profile.import.paste-placeholder")}
          />
          <p className="text-label-sm text-on-surface-variant">{t("profile.import.linkedin-hint")}</p>
        </div>

        {busy ? (
          <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-2.5">
            <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-label-bold text-primary">
              {note || (busy === "parsing" ? t("profile.import.parsing") : t("profile.import.extracting"))}
            </span>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-error-container/50 px-3 py-2 text-label-bold text-on-error-container">
            {error}
          </p>
        ) : null}

        {profile ? (
          <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <p className="text-label-bold text-primary">{t("profile.import.preview-title")}</p>
            <p className="text-body-md font-semibold text-on-surface">
              {profile.personalInfo.fullName || t("profile.import.no-name")}
            </p>
            {profile.personalInfo.email ? (
              <p className="text-label-sm text-on-surface-variant">{profile.personalInfo.email}</p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                {profile.workHistory.length} {t("profile.import.preview-experience")}
              </span>
              <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                {profile.education.length} {t("profile.import.preview-education")}
              </span>
              <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                {profile.skills.length} {t("profile.import.preview-skills")}
              </span>
              {profile.certifications.length > 0 ? (
                <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                  {profile.certifications.length} {t("profile.import.preview-certs")}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleApply}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-label-bold text-on-primary transition-opacity hover:opacity-90"
            >
              {t("profile.import.apply")}
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-label-bold text-on-surface-variant hover:bg-surface-container"
          >
            {t("tracker.form.cancel")}
          </button>
          <button
            type="button"
            onClick={handleExtract}
            disabled={busy !== null || text.trim().length < 50}
            className="rounded-lg bg-primary px-4 py-2.5 text-label-bold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("profile.import.extract-btn")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
