"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { signOut } from "next-auth/react";

interface LogoutConfirmModalProps {
  open: boolean;
  onClose: () => void;
}

function LogoutIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        className="stroke-red-200"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <motion.path
        d="M18 16L26 24L18 32"
        className="stroke-red-500"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeInOut" }}
      />
      <motion.path
        d="M26 24H12"
        className="stroke-red-500"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.5, ease: "easeInOut" }}
      />
      <motion.path
        d="M22 14H32V34H22"
        className="stroke-red-400"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.6, ease: "easeInOut" }}
      />
    </svg>
  );
}

export default function LogoutConfirmModal({ open, onClose }: LogoutConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.8 }}
            role="alertdialog"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden"
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-600" />

            <div className="p-7 pt-8">
              {/* Icon */}
              <motion.div
                className="flex justify-center mb-5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-50 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-red-100 border border-red-200 flex items-center justify-center">
                    <LogoutIcon />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h3
                id="logout-title"
                className="text-center font-headline-md text-xl text-on-surface mb-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                Yakin ingin keluar?
              </motion.h3>

              {/* Description */}
              <motion.p
                id="logout-description"
                className="text-center text-sm text-on-surface-variant leading-relaxed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Kamu akan logout dari akun ini. Jangan khawatir, data CV dan progresmu tetap aman saat kamu login kembali.
              </motion.p>

              {/* User session info */}
              <motion.div
                className="mt-5 p-3 rounded-2xl bg-surface-container border border-outline-variant/20 flex items-center gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">info</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Setelah logout kamu akan diarahkan ke halaman login. Pastikan semua perubahan sudah tersimpan.
                </p>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="mt-6 flex gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Cancel */}
                <button
                  ref={cancelRef}
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl border border-outline-variant/50 text-sm font-semibold text-on-surface bg-white hover:bg-surface-container-high hover:border-outline-variant transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  Batal
                </button>

                {/* Confirm Logout */}
                <button
                  ref={confirmRef}
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-sm font-semibold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:brightness-110 transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-red-500 focus-visible:outline-offset-2 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Keluar
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
