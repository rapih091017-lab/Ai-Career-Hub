"use client";

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

interface Testimonial {
  text: string;
  name: string;
  role: string;
}

interface TestimonialsColumnProps {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}

/* ── Gradient Avatar Placeholder ── */
const avatars = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-700",
  "from-lime-500 to-green-600",
  "from-sky-500 to-indigo-600",
  "from-rose-400 to-red-500",
];

function AvatarPlaceholder({ name, index }: { name: string; index: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const gradient = avatars[index % avatars.length];

  return (
    <div
      className={`h-10 w-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
    >
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  );
}

export default function TestimonialsColumn({
  className,
  testimonials,
  duration = 15,
}: TestimonialsColumnProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className={className}>
      <motion.div
        animate={{ translateY: reducedMotion ? "0%" : "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, name, role }, i) => (
              <div
                className="bg-white p-6 rounded-2xl border border-outline-variant/30 ambient-card-shadow max-w-xs w-full group hover:-translate-y-1 hover:shadow-elevated transition-all duration-300"
                key={`${index}-${i}`}
              >
                <p className="text-body-md text-on-surface-variant mb-4 leading-relaxed">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <AvatarPlaceholder name={name} index={index * testimonials.length + i} />
                  <div className="flex flex-col">
                    <span className="font-label-bold text-on-surface tracking-tight leading-5">
                      {name}
                    </span>
                    <span className="text-label-sm text-on-surface-variant opacity-60">
                      {role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

export type { Testimonial };
