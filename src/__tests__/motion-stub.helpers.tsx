import { createElement, forwardRef, type ReactNode } from "react";

/** Pengganti `motion/react`: elemen biasa tanpa prop animasi. */
export function motionStub() {
  const strip = new Set(["initial", "animate", "exit", "transition", "whileHover", "whileTap", "whileInView", "viewport", "layout", "variants"]);
  const cache = new Map<string, unknown>();
  const motion = new Proxy(
    {},
    {
      get(_t, tag: string) {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            forwardRef<unknown, Record<string, unknown>>(function MotionStub(props, ref) {
              const clean: Record<string, unknown> = { ref };
              for (const [k, v] of Object.entries(props)) if (!strip.has(k)) clean[k] = v;
              return createElement(tag, clean);
            }),
          );
        }
        return cache.get(tag);
      },
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    useReducedMotion: () => true,
  };
}
