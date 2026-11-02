"use client";

import { useEffect, useState } from "react";

/** Layar lebar (lg) dengan pointer presisi: pratinjau bisa diedit langsung. */
export const INLINE_EDIT_QUERY = "(min-width: 1024px) and (pointer: fine)";

/**
 * true bila teks di pratinjau boleh diedit langsung. Di layar sentuh/kecil
 * tap di pratinjau membuka field di form, jadi tidak bentrok dengan scroll.
 */
export function useInlineEditable(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(INLINE_EDIT_QUERY);
    const update = () => setOk(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return ok;
}
