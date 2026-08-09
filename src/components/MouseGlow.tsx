"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useSpring } from "motion/react";

interface MouseGlowProps {
  /** Color of the glow gradient */
  color?: string;
  /** Size of the glow in px (default: 300) */
  size?: number;
  /** Opacity of the glow (default: 0.03) */
  opacity?: number;
  /** Blur radius (default: 80) */
  blur?: number;
  /** Class name for the container */
  className?: string;
  /** Which side of the cursor the glow follows (default: "center") */
  align?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export default function MouseGlow({
  color = "#0d7377",
  size = 300,
  opacity = 0.04,
  blur = 100,
  className = "",
  align = "center",
}: MouseGlowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const springX = useSpring(0, { stiffness: 100, damping: 30 });
  const springY = useSpring(0, { stiffness: 100, damping: 30 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      // Offset based on alignment
      const offsets: Record<string, [number, number]> = {
        center: [-size / 2, -size / 2],
        "top-left": [0, 0],
        "top-right": [-size, 0],
        "bottom-left": [0, -size],
        "bottom-right": [-size, -size],
      };
      const [ox, oy] = offsets[align] || offsets.center;
      x += ox;
      y += oy;

      springX.set(x);
      springY.set(y);
      setIsVisible(true);
    },
    [size, align, springX, springY]
  );

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div ref={containerRef} className={"relative " + className}>
      <motion.div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          x: springX,
          y: springY,
          width: size,
          height: size,
          background: `radial-gradient(circle at center, ${color} ${opacity}, transparent 70%)`,
          filter: `blur(${blur}px)`,
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />
    </div>
  );
}
