import { HeroSkeleton, FeaturesGridSkeleton, PricingSkeleton } from "@/components/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-gutter py-8">
        <HeroSkeleton />
        <div className="mt-24">
          <FeaturesGridSkeleton />
        </div>
        <div className="mt-24">
          <PricingSkeleton />
        </div>
      </div>
    </div>
  );
}
