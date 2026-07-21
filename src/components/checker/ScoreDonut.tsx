"use client";

/** Animated circular progress ring */
export function ScoreDonut({ score, color, label }: { score: number; color: string; label: string }) {
  return (
    <div className="relative w-48 h-48 rounded-full flex items-center justify-center p-4 shadow-premium-lg mb-6"
      style={{ background: `conic-gradient(${color} 0% ${score}%, #eaf0ef ${score}% 100%)` }}
    >
      <div className="w-full h-full bg-background rounded-full flex flex-col items-center justify-center shadow-inner">
        <span className="text-5xl font-extrabold" style={{ color }}>{score}%</span>
        <span className="text-sm font-semibold text-on-surface-variant">{label}</span>
      </div>
    </div>
  );
}
