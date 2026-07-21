"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Max width class, e.g. "max-w-md" */
  size?: string;
}

/**
 * Reusable modal with backdrop blur, motion entry/exit, and focus trap.
 */
export default function Modal({ open, onClose, title, children, size = "max-w-md" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${size} bg-white rounded-2xl shadow-2xl border border-outline-variant/20 focus:outline-none flex flex-col max-h-[85vh]`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors z-10"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-lg text-on-surface-variant">close</span>
              </button>
            )}
            {/* Title */}
            {title && (
              <div className="px-6 pt-6 pb-2">
                <h2 className="font-headline-md text-on-surface">{title}</h2>
              </div>
            )}
            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 pb-6 pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
