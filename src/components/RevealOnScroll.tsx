"use client";

import { useEffect } from "react";

/**
 * Menyalakan animasi masuk untuk semua `[data-reveal]` di halaman.
 *
 * Dipasang sekali di landing, bukan per section: satu IntersectionObserver
 * untuk seluruh halaman jauh lebih murah daripada satu observer per kartu,
 * dan atribut `data-reveal` di markup tetap bisa dibaca sebagai niat desain
 * ("blok ini muncul saat dibaca").
 *
 * Elemen dilepas dari observer setelah muncul — animasi masuk hanya sekali,
 * supaya halaman tidak berkedip setiap kali pengguna naik-turun.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (nodes.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionOff = () => document.documentElement.dataset.motion === "off";

    if (reduce.matches || motionOff()) {
      nodes.forEach((node) => node.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      // Blok dianggap masuk setelah 12% bagian bawah layar terlewati, jadi
      // animasinya mulai saat blok benar-benar terbaca, bukan saat ujungnya
      // menyentuh tepi bawah.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return null;
}
