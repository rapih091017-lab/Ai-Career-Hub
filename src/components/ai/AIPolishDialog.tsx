"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast";

/**
 * AI Polish Button — Inline one-click polish
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
  disabled?: boolean;
  size?: "sm" | "md";
}

export function AIPolishButton({
  content,
  onApply,
  jobTitle,
  skills,
  jobDescription,
  field,
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
          skills,
          jobDescription,
          field,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memoles teks");
      }

      const data = await response.json();

      if (data.success && data.polished) {
        onApply(data.polished);
        addToast({ type: "success", message: "Teks berhasil dioptimasi!" });
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
  }, [content, jobTitle, skills, jobDescription, field, onApply, addToast]);

  const iconSize = size === "sm" ? "text-[14px]" : "text-[18px]";
  const padding = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      type="button"
      onClick={handlePolish}
      disabled={disabled || isPolishing || !content || content.trim().length < 10}
      className={`${padding} rounded-lg transition-all ${
        disabled || isPolishing || !content || content.trim().length < 10
          ? "text-gray-300 cursor-not-allowed"
          : "text-purple-500 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
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
