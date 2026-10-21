"use client";

/**
 * Reusable loading skeleton components using Tailwind's built-in animate-pulse.
 * No custom CSS keyframes needed.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={"relative overflow-hidden rounded-lg bg-surface-container-high " + className}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-surface-container-high" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 bg-surface-container-high rounded" />
          <div className="h-3 w-16 bg-surface-container-high rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-surface-container-high rounded" />
        <div className="h-3 w-5/6 bg-surface-container-high rounded" />
        <div className="h-3 w-4/6 bg-surface-container-high rounded" />
      </div>
      <div className="h-9 w-full bg-surface-container-high rounded-lg mt-4" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="animate-pulse min-h-[60vh] flex flex-col items-center justify-center gap-6 p-12">
      <div className="h-5 w-32 bg-surface-container-high rounded-full" />
      <div className="h-14 w-96 bg-surface-container-high rounded" />
      <div className="h-4 w-72 bg-surface-container-high rounded" />
      <div className="flex gap-4 mt-4">
        <div className="h-12 w-40 bg-surface-container-high rounded-xl" />
        <div className="h-12 w-40 bg-surface-container-high rounded-xl" />
      </div>
    </div>
  );
}

export function FeaturesGridSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 space-y-4">
          <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
          <div className="h-5 w-28 bg-surface-container-high rounded" />
          <div className="h-3 w-full bg-surface-container-high rounded" />
          <div className="h-3 w-5/6 bg-surface-container-high rounded" />
          <div className="h-9 w-full bg-surface-container-high rounded-lg mt-4" />
        </div>
      ))}
    </div>
  );
}

export function PricingSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {[1, 2, 3, 4].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
