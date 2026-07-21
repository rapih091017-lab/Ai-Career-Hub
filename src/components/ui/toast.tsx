"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/* ── Types ── */

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

/* ── Context ── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ── Icons ── */

const ICONS: Record<Toast["type"], string> = {
  success: "check_circle",
  error: "error",
  info: "info",
  warning: "warning",
};

const COLORS: Record<Toast["type"], string> = {
  success:
    "bg-green-50 border-green-200 text-green-800 [--icon-clr:#16a34a]",
  error: "bg-red-50 border-red-200 text-red-800 [--icon-clr:#dc2626]",
  info: "bg-sky-50 border-sky-200 text-sky-800 [--icon-clr:#0284c7]",
  warning:
    "bg-amber-50 border-amber-200 text-amber-800 [--icon-clr:#d97706]",
};

/* ── Provider ── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">): string => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      const ms = toast.duration ?? 4000;
      if (ms > 0) {
        setTimeout(() => removeToast(id), ms);
      }
      return id;
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={cn(
                "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-premium-md backdrop-blur-sm min-w-[280px] max-w-[420px]",
                COLORS[t.type],
              )}
            >
              <span
                className="material-symbols-outlined text-lg shrink-0 mt-0.5 select-none"
                style={{ color: "var(--icon-clr)", fontVariationSettings: "'FILL' 1" }}
              >
                {ICONS[t.type]}
              </span>
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
