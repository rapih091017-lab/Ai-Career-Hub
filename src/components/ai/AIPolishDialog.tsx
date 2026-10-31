"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { aiErrorMessage } from "@/components/ai/ai-error-message";

/**
 * AI Polish Button, Inline one-click polish
 * Klik → polish → apply. Tanpa dialog, tanpa side-by-side.
 * Menerima CV context untuk hasil lebih relevan.
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
  size?: "sm" | "md";
  /** Mengembalikan teks sebelum dipoles (tombol Urungkan di toast). Default: onApply. */
  onRevert?: (original: string) => void;
}

export function AIPolishButton({
  content,
  onApply,
  jobTitle,
  skills,
  jobDescription,
  field,
  format,
  onRevert,
  disabled = false,
  size = "sm",
}: AIPolishButtonProps) {
  const [isPolishing, setIsPolishing] = useState(false);
  const { addToast } = useToast();

  const handlePolish = useCallback(async () => {
    if (!content || content.trim().length < 10) {
      addToast({ type: "error", message: "Teks terlalu pendek untuk dioptimasi" });
      return;
    }

    setIsPolishing(true);

    try {
      const response = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          jobTitle,
          // Batas server: maks 50 skill; JD hanya dipakai 500 karakter pertama.
          skills: skills?.slice(0, 50),
          jobDescription: jobDescription?.slice(0, 500),
          field,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(await aiErrorMessage(response, "Gagal memoles teks"));
      }

      const data = await response.json();

      if (data.success && data.polished) {
        const original = content;
        onApply(data.polished);
        addToast({
          type: "success",
          message: "Teks sudah dipoles.",
          duration: 8000,
          action: { label: "Urungkan", onClick: () => (onRevert ?? onApply)(original) },
        });
      } else {
        throw new Error("Response tidak valid");
      }
    } catch (error) {
      console.error("Polish error:", error);
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal memoles teks",
      });
    } finally {
      setIsPolishing(false);
    }
  }, [content, jobTitle, skills, jobDescription, field, format, onApply, onRevert, addToast]);

  const iconSize = size === "sm" ? "text-[14px]" : "text-[18px]";
  const padding = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      type="button"
      onClick={handlePolish}
      disabled={disabled || isPolishing || !content || content.trim().length < 10}
      className={`${padding} rounded-lg transition-all ${
        disabled || isPolishing || !content || content.trim().length < 10
          ? "text-on-surface-variant/50 cursor-not-allowed"
          : "text-green-deep hover:text-primary hover:bg-lime/15 cursor-pointer"
      }`}
      title={
        disabled || !content || content.trim().length < 10
          ? "Isi teks minimal 10 karakter"
          : isPolishing
          ? "Memproses..."
          : "Optimasi dengan AI"
      }
    >
      <span
        className={`material-symbols-outlined ${iconSize} ${isPolishing ? "animate-spin" : ""}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        auto_awesome
      </span>
    </button>
  );
}
