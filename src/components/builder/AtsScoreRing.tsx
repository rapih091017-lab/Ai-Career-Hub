"use client";

export function AtsScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 16; // r=16
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1 shrink-0">
      <div className="relative w-6 h-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle className="stroke-current text-primary/20" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
          <circle
            className="stroke-current text-primary"
            cx="18" cy="18" fill="none" r="16"
            strokeDasharray={circumference.toFixed(2)}
            strokeDashoffset={offset.toFixed(2)}
            strokeLinecap="round" strokeWidth="3"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-primary">{score}%</span>
      </div>
    </div>
  );
}
