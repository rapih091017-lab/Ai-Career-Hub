"use client";

import AppFooter from "@/components/AppFooter";
import RevealOnScroll from "@/components/RevealOnScroll";
import PricingSection from "@/components/PricingSection";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import TestimonialMarquee from "@/components/TestimonialMarquee";
import SiteHeader from "@/components/nav/SiteHeader";
import BeforeAfter from "@/components/landing/BeforeAfter";
import CaraKerja from "@/components/landing/CaraKerja";
import CheckerTeaser from "@/components/landing/CheckerTeaser";
import ClosingCta from "@/components/landing/ClosingCta";
import FaqSection from "@/components/landing/FaqSection";
import HeroOrbit from "@/components/landing/HeroOrbit";
import StatsStrip from "@/components/landing/StatsStrip";

/**
 * Landing dibuat pendek dan mengarah ke satu jalur: cek CV gratis, lihat
 * hasilnya, lalu perbaiki di builder. Bikin CV dari nol tetap ada sebagai
 * jalur kedua di hero.
 *
 * Urutan: hero, contoh hasil cek, tiga langkah, sebelum/sesudah, testimoni
 * (plus angka platform dari API publik, keduanya sembunyi bila datanya
 * kosong), harga dan FAQ, penutup.
 */
export default function Home() {
  return (
    <>
      <RevealOnScroll />

      <SiteHeader variant="pill" />

      <main id="isi">
        <HeroOrbit />
        <CheckerTeaser />
        <CaraKerja />
        <BeforeAfter />
        <TestimonialMarquee />
        <StatsStrip />
        <PricingSection />
        <FaqSection />
        <ClosingCta />
      </main>

      <AppFooter variant="full" />
      <StickyMobileCTA />
      {/* Spacer kompensasi sticky mobile CTA agar tidak menimpa footer */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </>
  );
}
