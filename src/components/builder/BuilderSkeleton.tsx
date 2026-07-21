"use client";

import { motion } from "motion/react";
import { Skeleton, CardSkeleton } from "@/components/LoadingSkeleton";
import MagneticButton from "@/components/MagneticButton";
import AppHeader from "@/components/AppHeader";
import { useRouter } from "next/navigation";

/* ─── Loading Skeleton ─── */
export function BuilderLoadingSkeleton() {
  return (
    <>
      <AppHeader />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="w-full lg:w-1/2 overflow-y-auto p-6 space-y-6"
        >
          {/* Stepper skeleton */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            className="flex items-center gap-2 mb-8"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center">
                {i > 1 && <Skeleton className="h-0.5 w-6 mx-1" />}
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            ))}
          </motion.div>
          {/* Section title skeleton */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            className="flex items-center gap-3 mb-6"
          >
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </motion.div>
          {/* Form card skeleton */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}><CardSkeleton /></motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}><CardSkeleton /></motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}><CardSkeleton /></motion.div>
        </motion.div>
        {/* Right Panel Skeleton */}
        <div className="w-full lg:w-1/2 bg-surface-dim/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg ml-auto" />
          </div>
          <Skeleton className="w-full h-[600px] rounded-xl" />
        </div>
      </div>
    </>
  );
}

/* ─── Error State ─── */
interface BuilderErrorStateProps {
  message: string;
}

export function BuilderErrorState({ message }: BuilderErrorStateProps) {
  const router = useRouter();

  return (
    <>
      <AppHeader />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-error">Error</p>
          <p className="text-sm text-outline">{message}</p>
          <MagneticButton>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm"
            >
              Kembali ke Dashboard
            </button>
          </MagneticButton>
        </div>
      </div>
    </>
  );
}
