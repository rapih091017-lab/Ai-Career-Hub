"use client";

import { useRef, useCallback } from "react";
import { useMotionValue, useSpring } from "motion/react";

export interface TiltOptions {
  maxAngle?: number;
  scale?: number;
  glare?: boolean;
}

export interface TiltReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  style: Record<string, unknown>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseMove: (e: React.MouseEvent) => void;
}

export function useTilt(options: TiltOptions = {}): TiltReturn {
  const maxAngle = options.maxAngle ?? 8;
  const scaleVal = options.scale ?? 1.01;

  const ref = useRef<HTMLDivElement | null>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scaleMotion = useMotionValue(1);

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });
  const springScale = useSpring(scaleMotion, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rotateY.set(((e.clientX - cx) / (rect.width / 2)) * maxAngle);
      rotateX.set(-((e.clientY - cy) / (rect.height / 2)) * maxAngle);
      scaleMotion.set(scaleVal);
    },
    [maxAngle, scaleVal, rotateX, rotateY, scaleMotion]
  );

  const handleMouseEnter = useCallback(() => {
    scaleMotion.set(scaleVal);
  }, [scaleVal, scaleMotion]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    scaleMotion.set(1);
  }, [rotateX, rotateY, scaleMotion]);

  return {
    ref,
    style: {
      rotateX: springRotateX,
      rotateY: springRotateY,
      scale: springScale,
      transformStyle: "preserve-3d",
      perspective: "800px",
    },
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseMove: handleMouseMove,
  };
}
