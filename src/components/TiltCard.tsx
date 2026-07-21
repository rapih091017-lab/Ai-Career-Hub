"use client";

import { motion } from "motion/react";
import { useTilt, type TiltOptions } from "@/hooks/useTilt";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltOptions?: TiltOptions;
}

export default function TiltCard({
  children,
  className = "",
  tiltOptions = {},
}: TiltCardProps) {
  const tilt = useTilt(tiltOptions);
  const showGlare = tiltOptions.glare !== false;

  return (
    <motion.div
      ref={tilt.ref}
      style={tilt.style}
      onMouseEnter={tilt.onMouseEnter}
      onMouseLeave={tilt.onMouseLeave}
      onMouseMove={tilt.onMouseMove}
      className={"relative " + className}
    >
      {children}
      {showGlare && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)",
            mixBlendMode: "overlay",
          }}
        />
      )}
    </motion.div>
  );
}
