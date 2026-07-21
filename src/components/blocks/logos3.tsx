"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useTranslation } from "@/lib/i18n";

/* ─── Trust Badge ─── */
interface TrustBadge {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  color: string;
  iconColor: string;
  glowColor: string;
}

const trustBadges: TrustBadge[] = [
  {
    id: "ats-friendly",
    icon: "fact_check",
    titleKey: "logos.badge-ats-title",
    descKey: "logos.badge-ats-desc",
    color: "bg-primary/10",
    iconColor: "text-primary",
    glowColor: "#6d3bd7",
  },
  {
    id: "ai-powered",
    icon: "auto_awesome",
    titleKey: "logos.badge-ai-title",
    descKey: "logos.badge-ai-desc",
    color: "bg-secondary/10",
    iconColor: "text-secondary",
    glowColor: "#059669",
  },
  {
    id: "instant",
    icon: "bolt",
    titleKey: "logos.badge-instant-title",
    descKey: "logos.badge-instant-desc",
    color: "bg-[#8B5CF6]/10",
    iconColor: "text-[#8B5CF6]",
    glowColor: "#8B5CF6",
  },
  {
    id: "export",
    icon: "file_download",
    titleKey: "logos.badge-export-title",
    descKey: "logos.badge-export-desc",
    color: "bg-emerald-50",
    iconColor: "text-emerald-600",
    glowColor: "#059669",
  },
  {
    id: "free",
    icon: "workspace_premium",
    titleKey: "logos.badge-free-title",
    descKey: "logos.badge-free-desc",
    color: "bg-amber-50",
    iconColor: "text-amber-600",
    glowColor: "#D97706",
  },
  {
    id: "multi-page",
    icon: "description",
    titleKey: "logos.badge-multi-title",
    descKey: "logos.badge-multi-desc",
    color: "bg-sky-50",
    iconColor: "text-sky-600",
    glowColor: "#0284C7",
  },
  {
    id: "portfolio",
    icon: "grid_view",
    titleKey: "logos.badge-portfolio-title",
    descKey: "logos.badge-portfolio-desc",
    color: "bg-rose-50",
    iconColor: "text-rose-600",
    glowColor: "#E11D48",
  },
];

/* ─── Live Activity Feed ─── */
interface Activity {
  name: string;
  actionKey: string;
}

const ACTIVITIES: Activity[] = [
  { name: "Budi S.", actionKey: "logos.action-create" },
  { name: "Sari A.", actionKey: "logos.action-analyze" },
  { name: "Dewi K.", actionKey: "logos.action-update" },
  { name: "Rudi H.", actionKey: "logos.action-portfolio" },
  { name: "Maya S.", actionKey: "logos.action-revise" },
  { name: "Ahmad F.", actionKey: "logos.action-analyze" },
];

const TIME_POOL = ["logos.time-2", "logos.time-3", "logos.time-5", "logos.time-8", "logos.time-11", "logos.time-14"];

function LiveActivityFeed({ inView }: { inView: boolean }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ACTIVITIES.length);
      setTimeOffset((prev) => (prev + 1) % TIME_POOL.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [inView]);

  const activity = ACTIVITIES[index];
  const timeKey = TIME_POOL[timeOffset];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs">
      <AnimatePresence mode="wait">
        <motion.div
          key={index + "-" + timeOffset}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          {/* Pulsing green dot */}
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-green-500 opacity-75 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
          </span>

          {/* Person icon */}
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>

          {/* Name + action */}
          <span className="text-on-surface-variant">
            <span className="font-semibold text-on-surface">{activity.name}</span>
            {" " + t(activity.actionKey)}
          </span>

          {/* Time */}
          <span className="text-outline-variant">—</span>
          <span className="text-outline-variant whitespace-nowrap">
            {t(timeKey)}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Stagger entrance for cards ─── */
const staggerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      type: "spring" as const,
      stiffness: 180,
      damping: 16,
    },
  }),
};

interface Logos3Props {
  heading?: string;
  className?: string;
}

export default function Logos3({
  heading,
}: Logos3Props) {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  const resolvedHeading =
    heading || t("logos.heading");

  return (
    <section
      ref={sectionRef}
      className="py-16 bg-surface-container-low border-y border-outline-variant/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter flex flex-col items-center text-center">
        {/* Heading */}
        <motion.p
          className="text-center font-label-bold text-on-surface-variant mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {resolvedHeading}
        </motion.p>
      </div>

      {/* Auto-scroll Carousel — Trust Badges (no numbers) */}
      <div className="pt-2 md:pt-4">
        <div className="relative mx-auto flex items-center justify-center lg:max-w-5xl">
          {/* Carousel — z-[1] so it sits above fade edges */}
          <div className="relative z-[1] w-full">
            <Carousel
              opts={{ loop: true, dragFree: true }}
              plugins={[AutoScroll({ playOnInit: true, speed: 0.5 })]}
            >
              <CarouselContent className="ml-0">
                {trustBadges.map((badge, idx) => (                    <CarouselItem
                    key={badge.id}
                    className="flex basis-1/2 justify-center pl-0 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                  >
                    <motion.div
                      custom={idx}
                      variants={staggerVariants}
                      initial="hidden"
                      animate={inView ? "visible" : "hidden"}
                      className="mx-2 md:mx-4"
                    >
                      <div className="group relative w-[140px] sm:w-[160px] md:w-[180px] rounded-2xl border border-outline-variant/20 bg-white p-3 md:p-4 text-center cursor-default
                        shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_6px_16px_-4px_rgba(0,0,0,0.08),0_12px_24px_-6px_rgba(0,0,0,0.04)]
                        hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1),0_12px_28px_-4px_rgba(0,0,0,0.12),0_20px_40px_-8px_rgba(0,0,0,0.06)]
                        [transform-style:preserve-3d] hover:[transform:perspective(600px)_rotateX(2deg)_rotateY(-1deg)_translateY(-8px)_scale(1.02)]
                        transition-[transform,box-shadow] duration-500 ease-out">
                        {/* 3D depth shadow layers */}
                        <div className="absolute -bottom-2 left-[10%] right-[10%] h-4 bg-black/[0.04] rounded-full blur-md group-hover:bg-black/[0.06] group-hover:blur-lg transition-all duration-500" />
                        <div className="absolute -bottom-1 left-[15%] right-[15%] h-2 bg-black/[0.03] rounded-full blur-sm group-hover:bg-black/[0.05] transition-all duration-500" />
                        {/* Hover glow */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse at 50% 0%, ${badge.glowColor}10 0%, transparent 70%)`,
                        }}
                        />

                        {/* Icon */}
                        <div className={`w-10 h-10 mx-auto mb-2.5 rounded-xl ${badge.color} flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300`}>
                          <span
                            className={`material-symbols-outlined text-[20px] ${badge.iconColor}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {badge.icon}
                          </span>
                        </div>

                        {/* Title */}
                        <p className="text-sm font-bold text-on-surface leading-tight mb-1">
                          {t(badge.titleKey)}
                        </p>

                        {/* Description */}
                        <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                          {t(badge.descKey)}
                        </p>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Fade edges — z-[2] but pointer-events-none so they don't block interaction */}
          <div className="absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-surface-container-low via-surface-container-low/80 to-transparent pointer-events-none z-[2]" />
          <div className="absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-surface-container-low via-surface-container-low/80 to-transparent pointer-events-none z-[2]" />
        </div>
      </div>

      {/* Live Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        className="mt-8 pt-6 border-t border-outline-variant/10 max-w-md mx-auto"
      >
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-medium text-on-surface-variant/50 uppercase tracking-wider">
            {t("logos.activity-heading")}
          </span>
        </div>
        <LiveActivityFeed inView={inView} />
      </motion.div>
    </section>
  );
}
