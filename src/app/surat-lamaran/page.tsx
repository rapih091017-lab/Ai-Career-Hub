"use client";

import { Suspense } from "react";
import SuratLamaranApp from "@/components/cover-letter/SuratLamaranApp";

/**
 * /surat-lamaran — buat surat lamaran / cover letter / motivation letter
 * dari nol (tanpa CV) atau pilih CV yang sudah ada.
 */
export default function SuratLamaranIndex() {
  return (
    <Suspense fallback={null}>
      <SuratLamaranApp cvId={null} />
    </Suspense>
  );
}
