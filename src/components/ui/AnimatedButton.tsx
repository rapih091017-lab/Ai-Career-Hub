"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "emerald" | "ghost" | "secondary";

interface AnimatedButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Show the continuous shimmer sweep overlay */
  shimmer?: boolean;
  /** Pulse the icon continuously */
  pulseIcon?: boolean;
  /** Bounce the right icon continuously */
  bounceArrow?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-premium-md hover:shadow-premium-lg",
  emerald:
    "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-premium-md hover:shadow-premium-lg",
  ghost:
    "bg-white text-on-surface border border-outline-variant/30 shadow-premium-sm hover:shadow-premium-md hover:-translate-y-0.5",
  secondary:
    "bg-on-background text-white shadow-premium-md hover:shadow-premium-lg",
};

/**
 * AnimatedButton — reusable CTA button with optional
 * shimmer overlay, icon pulse, and arrow bounce animations.
 *
 * Variants:
 * - primary  → solid primary bg
 * - emerald  → gradient emerald bg (for practice / free)
 * - ghost    → white card-style
 * - secondary → dark bg
 */
export function AnimatedButton({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  icon,
  iconRight,
  shimmer = false,
  pulseIcon = false,
  bounceArrow = false,
  disabled = false,
  type = "button",
  fullWidth = false,
}: AnimatedButtonProps) {
  const baseClasses =
    `relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold active:scale-[0.97] transition-all ${
      fullWidth ? "w-full" : ""
    } ${variantStyles[variant]} ${disabled ? "opacity-60 pointer-events-none" : "hover:brightness-110"} ${className}`.trim();

  const content = (
    <>
      {/* Shimmer overlay */}
      {shimmer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1,
          }}
        />
      )}

      {/* Left icon with optional pulse */}
      {icon && (
        <motion.span
          className="relative z-10 flex items-center"
          animate={pulseIcon ? { scale: [1, 1.12, 1] } : undefined}
          transition={
            pulseIcon
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          {icon}
        </motion.span>
      )}

      {/* Label */}
      <span className="relative z-10">{children}</span>

      {/* Right icon with optional bounce */}
      {iconRight && (
        <motion.span
          className="relative z-10 flex items-center"
          animate={bounceArrow ? { x: [0, 3, 0] } : undefined}
          transition={
            bounceArrow
              ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          {iconRight}
        </motion.span>
      )}
    </>
  );

  // Render as Link if href is provided
  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        aria-disabled={disabled}
      >
        {content}
      </Link>
    );
  }

  // Render as button
  return (
    <button
      type={type}
      onClick={onClick}
      className={baseClasses}
      disabled={disabled}
    >
      {content}
    </button>
  );
}
