"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import MagneticButton from "@/components/MagneticButton";

export default function StickyMobileCTA() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-lg border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-on-surface">{t("sticky.cta")}</span>
          <span className="text-[10px] text-on-surface-variant">{t("sticky.cta-sub")}</span>
        </div>
        <MagneticButton>
          <Link
            href={session ? "/dashboard" : "/login"}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-label-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all block"
          >
            {t("hero.cta-start")}
          </Link>
        </MagneticButton>
      </div>
    </motion.div>
  );
}
