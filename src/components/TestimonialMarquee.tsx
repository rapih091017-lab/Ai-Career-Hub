"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "@/lib/i18n";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  avatarUrl: string | null;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function TestimonialsColumn({ className, items, duration }: { className?: string; items: Testimonial[]; duration: number }) {
  const reduce = useReducedMotion();
  return (
    <div className={className}>
      <motion.ul
        animate={reduce ? undefined : { translateY: "-50%" }}
        transition={reduce ? { duration: 0 } : { duration, repeat: Infinity, ease: "linear" }}
        className="m-0 flex list-none flex-col gap-6 p-0"
      >
        {[0, 1].map((copy) => (
          <React.Fragment key={copy}>
            {items.map((item) => (
              <li
                key={`${copy}-${item.id}`}
                aria-hidden={copy === 1 || undefined}
                className="w-full max-w-xs cursor-default select-none rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-premium-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
              >
                <blockquote className="m-0 p-0">
                  <p className="m-0 text-body-md leading-relaxed text-on-surface-variant">{item.text}</p>
                  <footer className="mt-5 flex items-center gap-3">
                    {item.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.avatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-label-bold text-primary">
                        {initials(item.name)}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-col">
                      <cite className="truncate text-label-bold not-italic text-on-surface">{item.name}</cite>
                      <span className="mt-0.5 truncate text-label-sm text-on-surface-variant">{item.role}</span>
                    </div>
                  </footer>
                </blockquote>
              </li>
            ))}
          </React.Fragment>
        ))}
      </motion.ul>
    </div>
  );
}

/** Marquee testimoni asli. Sembunyi total bila belum ada testimoni terbit:
 * bukti sosial palsu lebih merugikan daripada tidak ada. */
export default function TestimonialMarquee() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    fetch("/api/testimonials")
      .then((response) => (response.ok ? response.json() : { testimonials: [] }))
      .then((data) => setItems(data.testimonials ?? []))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  const third = Math.ceil(items.length / 3);
  const columns = [items.slice(0, third), items.slice(third, third * 2), items.slice(third * 2)];

  return (
    <section aria-labelledby="testimonials-heading" className="relative overflow-hidden bg-surface-container-lowest py-20 md:py-28">
      <div className="relative z-10 mx-auto max-w-7xl px-margin-mobile md:px-gutter">
        <div className="mx-auto mb-14 flex max-w-xl flex-col items-center">
          <h2 id="testimonials-heading" className="text-center font-headline-lg text-on-background">
            {items.length > 3 ? t("testimonials.heading.many") : t("testimonials.heading.few")}
          </h2>
          <p className="mt-3 text-center text-body-md text-on-surface-variant">
            {t("testimonials.heading.sub")}
          </p>
        </div>

        <div
          role="region"
          aria-label={t("testimonials.item.aria")}
          className="mt-4 flex max-h-[760px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
        >
          <TestimonialsColumn items={columns[0]} duration={32} />
          {columns[1].length > 0 && <TestimonialsColumn className="hidden md:block" items={columns[1]} duration={40} />}
          {columns[2].length > 0 && <TestimonialsColumn className="hidden lg:block" items={columns[2]} duration={36} />}
        </div>
      </div>
    </section>
  );
}
