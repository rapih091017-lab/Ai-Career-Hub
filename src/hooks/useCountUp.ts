"use client";

import { useEffect, useState, useRef } from "react";
import { useInView, animate } from "motion/react";

export function useCountUp(end: number, duration = 2, decimals = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, end, {
      duration,
      ease: "easeOut",
      onUpdate: (val) => setDisplayValue(Math.round(val)),
    });
    return () => controls.stop();
  }, [inView, end, duration]);

  return { ref, displayValue };
}
