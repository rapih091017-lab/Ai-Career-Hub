"use client";

import { useState, useEffect } from "react";

export interface CoverLetterQuota {
  used: number;
  limit: number | "unlimited" | false;
  remaining: number;
  isUnlimited: boolean;
}

/**
 * Ambil kuota Surat Lamaran / Cover Letter dari /api/usage.
 * Dipakai di ReviewStep builder & halaman surat-lamaran untuk menampilkan
 * sisa kuota gratis ("2/3") atau status unlimited untuk Premium.
 */
export function useCoverLetterQuota(): CoverLetterQuota | null {
  const [quota, setQuota] = useState<CoverLetterQuota | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/usage")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        const limit: number | "unlimited" | false = data?.limits?.cover_letter ?? 3;
        const used: number = data?.usage?.coverLetters ?? 0;
        if (cancelled) return;
        setQuota({
          used,
          limit,
          remaining: limit === "unlimited" || limit === false ? 0 : Math.max(0, limit - used),
          isUnlimited: limit === "unlimited",
        });
      })
      .catch(() => {
        if (!cancelled) setQuota(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return quota;
}
