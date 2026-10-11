"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";

/** Live builder lama sudah diganti satu entry point: /portfolio/build. */
export default function LiveRedirect() {
  const router = useRouter();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const draftId = query.get("draftId");
    router.replace(draftId ? `/portfolio/build/${draftId}` : "/portfolio/build");
  }, [router]);

  return <PortfolioSkeleton message="Membuka editor portfolio" />;
}
