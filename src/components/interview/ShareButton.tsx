"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export function ShareButton({
  label = "Bagikan",
  iconOnly = false,
  className = "",
}: {
  label?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast({
        type: "success",
        message: "Link disalin ke clipboard!",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({
        type: "error",
        message: "Gagal menyalin link",
      });
    }
  };

  if (iconOnly) {
    return (
      <button
        onClick={handleShare}
        className={`w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center transition-colors ${className}`}
        title={copied ? "Tersalin!" : label}
        aria-label={copied ? "Tersalin!" : label}
      >
        <span
          className={`material-symbols-outlined text-outline transition-all ${
            copied ? "text-green-500 scale-110" : ""
          }`}
          style={copied ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {copied ? "check" : "share"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-outline-variant/40 bg-white text-on-surface-variant hover:border-primary/30 hover:text-primary transition-all active:scale-[0.97] ${className}`}
      title={copied ? "Tersalin!" : label}
    >
      <span className="material-symbols-outlined text-[12px]">{copied ? "check" : "share"}</span>
      {copied ? "Tersalin!" : label}
    </button>
  );
}
