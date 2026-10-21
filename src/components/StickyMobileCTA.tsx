"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import MagneticButton from "@/components/MagneticButton";

export default function StickyMobileCTA() {
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 border-t-[2.5px] border-ink bg-paper md:hidden"
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-[13px] font-bold leading-tight text-ink">{t("sticky.cta")}</span>
          <span className="text-[11px] leading-tight text-ink-soft">{t("sticky.cta-sub")}</span>
        </div>
        <MagneticButton>
          <Link
            href="/builder/new"
            className="block shrink-0 whitespace-nowrap rounded-full border-[2.5px] border-ink bg-lime px-5 py-2.5 font-label-bold text-sm text-on-light shadow-[0_3px_0_rgb(var(--c-ink))] transition-all hover:-translate-y-0.5 active:translate-y-0.5"
          >
            {t("hero.cta-start")}
          </Link>
        </MagneticButton>
      </div>
    </motion.div>
  );
}
