"use client";

/**
 * Cincin skor.
 *
 * Warna datang sebagai CSS var dari scoreColor(), dan jalur sisa memakai
 * token surface, bukan hex terang. Versi lama memakai `#eaf0ef` mati, jadi
 * di mode gelap cincinnya menyala seperti elemen dari halaman lain.
 * Bentuknya juga ikut bahasa tema: garis tinta 2,5px dan bayangan offset,
 * bukan bayangan blur.
 */
export function ScoreDonut({ score, color, label }: { score: number; color: string; label: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div
      className="relative mb-6 flex h-52 w-52 items-center justify-center rounded-full border-[2.5px] border-ink p-3 shadow-hard"
      style={{
        background: `conic-gradient(${color} 0% ${clamped}%, rgb(var(--c-surface-container-highest)) ${clamped}% 100%)`,
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-ink/10 bg-paper">
        <span className="font-display text-5xl font-bold leading-none tracking-tight" style={{ color }}>
          {score}%
        </span>
        <span className="mt-2 max-w-[8rem] text-center text-[10.5px] font-extrabold uppercase leading-tight tracking-[0.06em] text-ink-soft">
          {label}
        </span>
      </div>
    </div>
  );
}
