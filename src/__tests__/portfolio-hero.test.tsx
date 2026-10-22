import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import type { PortfolioFormData } from "@/components/portfolio/types";
import { THEMES } from "@/components/portfolio/themes";

let activeThemeId = "glass";

vi.mock("@/components/portfolio/PortfolioCanvas", () => ({
  usePortfolioTheme: () => THEMES[activeThemeId],
}));

import HeroSection from "@/components/portfolio/sections/HeroSection";

beforeAll(() => {
  const w = window as unknown as Record<string, unknown>;
  w.matchMedia = () =>
    ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  w.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
});

const DATA = {
  heroFirstName: "Maya",
  heroLastName: "Chen",
  heroHeadline: "UI/UX Designer",
  heroSubHeadline: "Crafting human-centered experiences",
  heroBio: "Masalah rumit jadi produk yang enak dipakai.",
  heroPhotoUrl: "",
} as unknown as PortfolioFormData;

function renderHero(themeId: string) {
  activeThemeId = themeId;
  return render(<HeroSection data={DATA} />);
}

describe("hero per tema", () => {
  it("hero minimal: lingkaran, nama raksasa, bio, tanpa layar penuh", () => {
    const { container } = renderHero("minimalist");

    expect(container.querySelector("[data-hero-variant='minimalist']")).toBeTruthy();
    expect(container.textContent).toContain("Maya Chen");
    expect(container.textContent).toContain("UI/UX Designer");
    expect(container.textContent).toContain("Masalah rumit");
    expect(container.querySelector("[data-hero-circle]")).toBeTruthy();

    const html = container.innerHTML;
    expect(html).not.toContain("100vh");
    expect(html).not.toContain("100dvh");
    expect(html).not.toContain("h-screen");
  });

  it("tanpa foto, hero minimal tetap menampilkan lingkaran berisi inisial", () => {
    const { container } = renderHero("minimalist");
    const circle = container.querySelector("[data-hero-circle]")!;
    expect(circle.textContent).toContain("MC");
  });

  it("lingkaran memakai token radii, bukan borderRadius literal", () => {
    const { container } = renderHero("minimalist");
    const circle = container.querySelector("[data-hero-circle]") as HTMLElement;
    expect(circle.style.borderRadius).toBe(THEMES.minimalist.radii.circle);
  });

  it("hero workbench: nama, daftar isi, dan penanda lime tanpa blur", () => {
    const { container } = renderHero("workbench");

    expect(container.querySelector("[data-hero-variant='workbench']")).toBeTruthy();
    expect(container.textContent).toContain("Maya");
    expect(container.textContent).toContain("Tentang");
    expect(container.textContent).toContain("Masalah rumit");
    // Tema ini sengaja tanpa blur/backdrop-filter: identitasnya kertas + garis tinta.
    expect(container.innerHTML).not.toContain("backdrop-filter");
  });

  it("tiga tema lama tetap punya varian hero masing-masing", () => {
    expect(renderHero("glass").container.querySelector("[data-hero-variant='glass']")).toBeTruthy();
    expect(renderHero("brutal").container.querySelector("[data-hero-variant='brutal']")).toBeTruthy();
    expect(renderHero("luxe").container.querySelector("[data-hero-variant='luxe']")).toBeTruthy();
  });

  it("hero luxe tidak memakai kartu berbingkai nor bayangan (spec §5)", () => {
    const { container } = renderHero("luxe");
    expect(container.querySelector("[data-hero-frame='card']")).toBeNull();
  });

  it("hero glass menaruh foto penuh dengan scrim (spec §5)", () => {
    activeThemeId = "glass";
    const { container } = render(
      <HeroSection data={{ ...DATA, heroPhotoUrl: "https://example.com/photo.jpg" } as PortfolioFormData} />,
    );
    expect(container.querySelector("[data-hero-scrim]")).toBeTruthy();
  });
});
