"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface ConfirmAction {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmModalProps {
  confirm: ConfirmAction | null;
  onClose: () => void;
}

export function ConfirmModal({ confirm, onClose }: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirm) {
      // Focus the confirm button when modal opens
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  }, [confirm]);

  useEffect(() => {
    if (!confirm) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        confirm.onCancel?.();
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [confirm, onClose]);

  if (!confirm) return null;

  const isDanger = confirm.variant === "danger";

  return (
    <AnimatePresence>
      {confirm && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => {
              confirm.onCancel?.();
              onClose();
            }}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="relative bg-white rounded-2xl shadow-premium-xl border border-outline-variant/50 p-6 w-[90vw] max-w-sm mx-4"
          >
            {/* Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                isDanger
                  ? "bg-red-50"
                  : "bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-xl",
                  isDanger ? "text-red-600" : "text-primary",
                )}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isDanger ? "delete" : "help"}
              </span>
            </div>

            <h3
              id="confirm-title"
              className="font-label-bold text-on-surface text-lg mb-1"
            >
              {confirm.title}
            </h3>
            <p
              id="confirm-message"
              className="text-sm text-on-surface-variant mb-6"
            >
              {confirm.message}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  confirm.onCancel?.();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-all"
              >
                {confirm.cancelLabel || "Batal"}
              </button>
              <button
                ref={confirmRef}
                onClick={() => {
                  confirm.onConfirm();
                  onClose();
                }}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97]",
                  isDanger
                    ? "bg-red-600 hover:bg-red-700 shadow-sm"
                    : "bg-primary hover:brightness-110 shadow-sm",
                )}
              >
                {confirm.confirmLabel || (isDanger ? "Hapus" : "Ya")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
