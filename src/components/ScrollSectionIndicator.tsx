"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";

const SECTION_IDS = ["hero", "templates", "features", "pricing", "testimonials", "cta-footer"];

export default function ScrollSectionIndicator() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(Math.min(progress, 1));

      // Find active section
      let currentIdx = 0;
      for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTION_IDS[i]);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) {
          currentIdx = i;
          break;
        }
      }
      setActiveIndex(currentIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const labelKeys: Record<string, string> = {
    hero: "progress.hero",
    templates: "progress.hero",
    features: "progress.features",
    pricing: "progress.pricing",
    testimonials: "progress.testimonials",
    "cta-footer": "progress.cta",
  };

  return (
    <nav
      className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-3"
      aria-label="Section navigation"
    >
      {/* Progress line */}
      <div className="relative w-px h-32 bg-outline-variant/30 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full bg-primary rounded-full"
          style={{ height: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Dots */}
      {SECTION_IDS.map((sectionId, idx) => (
        <button
          key={sectionId}
          onClick={() => scrollToSection(sectionId)}
          className="relative group flex items-center justify-center"
          aria-label={`Scroll to ${sectionId}`}
        >
          <motion.div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? "bg-primary scale-125 shadow-md"
                : "bg-outline-variant/40 hover:bg-outline-variant/70"
            }`}
            animate={{ scale: idx === activeIndex ? 1.3 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
          {/* Label tooltip */}
          <span className="absolute right-full mr-3 px-2 py-1 bg-white border border-outline-variant/30 rounded-lg text-[10px] font-medium text-on-surface-variant whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm pointer-events-none">
            {t(labelKeys[sectionId] || sectionId)}
          </span>
        </button>
      ))}
    </nav>
  );
}
