"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Lebar A4 dalam px CSS (96 dpi). */
const A4_PX = (210 * 96) / 25.4;

/**
 * Mengecilkan halaman A4 agar muat di lebar kontainer (layar kecil) tanpa
 * scroll horizontal. transform: scale tidak mengecilkan kotak layout, jadi
 * kotak luar diberi lebar & tinggi hasil skala secara eksplisit. Ukuran asli
 * isi (mm/pt) tidak berubah, jadi pemenggalan halaman tetap sama dengan PDF.
 */
export function FitA4({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerH, setInnerH] = useState(0);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      // Lebar konten induk (clientWidth termasuk padding, jadi dikurangi).
      const parent = outer.parentElement ?? outer;
      const cs = getComputedStyle(parent);
      const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setScale(avail > 0 ? Math.min(1, avail / A4_PX) : 1);
      setInnerH(inner.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    if (outer.parentElement) ro.observe(outer.parentElement);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      style={{
        width: A4_PX * scale,
        height: innerH ? innerH * scale : undefined,
        margin: "0 auto",
        // clip: tidak bisa digulir oleh fokus di dalam pratinjau.
        overflow: "clip",
      }}
    >
      <div
        ref={innerRef}
        className="a4-preview"
        style={{ width: "210mm", transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
