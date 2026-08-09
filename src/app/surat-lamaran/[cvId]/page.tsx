"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import SuratLamaranApp from "@/components/cover-letter/SuratLamaranApp";

function SuratLamaranPage() {
  const params = useParams();
  // Route segment: /surat-lamaran/[cvId] — key params adalah "cvId", bukan "id"
  const cvId = (params.cvId as string) ?? null;
  return <SuratLamaranApp cvId={cvId} />;
}

export default function SuratLamaranPageWrapper() {
  return (
    <Suspense fallback={null}>
      <SuratLamaranPage />
    </Suspense>
  );
}
