"use client";

/**
 * AiLoadingOverlay — animated shimmer overlay shown on textarea/card
 * while AI is processing. Reusable across SummarySection and WorkCard.
 * Parent controls visibility with AnimatePresence.
 */

export function AiLoadingOverlay({ label = "AI sedang menganalisis" }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 rounded-xl overflow-hidden pointer-events-none">
      {/* Shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent bg-[length:200%_100%] animate-[shimmer-slow_2s_ease-in-out_infinite]" />
      
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />

      {/* Loading indicator at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Progress bar */}
        <div className="h-0.5 bg-primary/10 overflow-hidden">
          <div className="h-full w-1/3 bg-primary/40 rounded-full animate-[loading-bar_1.8s_ease-in-out_infinite]" />
        </div>
        
        {/* Label with thinking dots */}
        <div className="flex items-center justify-center gap-1.5 py-2 px-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary/70">
            {label}
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-primary/60 animate-[thinking-dots_1.4s_ease-in-out_infinite]" />
              <span className="w-1 h-1 rounded-full bg-primary/60 animate-[thinking-dots_1.4s_ease-in-out_0.2s_infinite]" />
              <span className="w-1 h-1 rounded-full bg-primary/60 animate-[thinking-dots_1.4s_ease-in-out_0.4s_infinite]" />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
