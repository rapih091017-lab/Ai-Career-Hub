"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "@/lib/i18n";

const NAMES = ["Ahmad F.", "Siti N.", "Budi P.", "Dewi K.", "Rudi H.", "Maya S."];

export default function AnimatedNotification({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const randomName = useMemo(() => NAMES[Math.floor(Math.random() * NAMES.length)], []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 max-w-xs bg-white rounded-xl shadow-2xl border border-outline-variant/20 p-4 flex items-start gap-3 cursor-pointer"
          onClick={onClose}
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-on-surface truncate">
              {randomName + " " + t("cta.started-just-now")}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">{t("cta.seconds-ago")}</p>
          </div>
          <button className="text-outline hover:text-on-surface transition-colors shrink-0" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
