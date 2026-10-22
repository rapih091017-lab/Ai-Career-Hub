"use client";

import AppFooter from "@/components/AppFooter";
import PortfolioSpotlight from "@/components/PortfolioSpotlight";
import RevealOnScroll from "@/components/RevealOnScroll";
import PricingSection from "@/components/PricingSection";
import ScrollProgress from "@/components/ScrollProgress";
import ScrollSectionIndicator from "@/components/ScrollSectionIndicator";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import SiteHeader from "@/components/nav/SiteHeader";
import BentoFeatures from "@/components/landing/BentoFeatures";
import BeforeAfter from "@/components/landing/BeforeAfter";
import CaraKerja from "@/components/landing/CaraKerja";
import CheckerTeaser from "@/components/landing/CheckerTeaser";
import ClosingCta from "@/components/landing/ClosingCta";
import FaqSection from "@/components/landing/FaqSection";
import HeroOrbit from "@/components/landing/HeroOrbit";
import LevelStrip from "@/components/landing/LevelStrip";
import MomentBand from "@/components/landing/MomentBand";
import PersonaTabs from "@/components/landing/PersonaTabs";
import StatsStrip from "@/components/landing/StatsStrip";

/**
 * Landing mengikuti susunan section dari tema Evergreen + Lime:
 * hero, cek CV, moment, cara kerja, fitur, persona, pintu masuk, harga,
 * portofolio, simulasi CV, angka platform, FAQ, penutup.
 *
 * Yang tetap memakai komponen aplikasi: navbar (bentuknya sama, warnanya
 * mengikuti tema), blok harga (PricingSection, sumber data resminya),
 * generator portofolio, dan footer.
 */
export default function Home() {
  return (
    <>
      <ScrollProgress />
      <ScrollSectionIndicator />
      <RevealOnScroll />

      <SiteHeader variant="pill" />

      <main id="isi">
        <HeroOrbit />
        <CheckerTeaser />
        <MomentBand />
        <CaraKerja />
        <BentoFeatures />
        <PersonaTabs />
        <LevelStrip />
        <PricingSection />
        <PortfolioSpotlight />
        <BeforeAfter />
        <StatsStrip />
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
