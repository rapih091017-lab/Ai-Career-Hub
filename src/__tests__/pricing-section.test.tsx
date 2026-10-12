import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import PricingSection from "@/components/PricingSection";
import { LanguageProvider } from "@/lib/i18n";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function renderWithI18n(node: React.ReactElement) {
  return render(<LanguageProvider>{node}</LanguageProvider>);
}

/**
 * API browser yang dipakai motion/react + TiltCard dan belum ada di setup
 * global jsdom.
 */
beforeAll(() => {
  const w = window as unknown as Record<string, unknown>;
  w.matchMedia = () =>
    ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }) as unknown as MediaQueryList;
  w.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  w.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  w.scrollTo = vi.fn();
});

describe("PricingSection mode satuan", () => {
  it("menampilkan kartu trial Pro 3 hari dengan fitur yang benar", () => {
    renderWithI18n(<PricingSection defaultMode="satuan" />);
    expect(screen.getByText("Coba Pro 3 Hari")).toBeInTheDocument();
    expect(screen.getByText("10x AI generate CV")).toBeInTheDocument();
    expect(screen.getByText("2x analisis ATS")).toBeInTheDocument();
    expect(screen.getByText(/Berlaku 3 hari sejak pembelian/)).toBeInTheDocument();
  });
});

describe("PricingSection mode langganan", () => {
  it("banner Paket Lamaan tampil sebagai hero", () => {
    renderWithI18n(<PricingSection defaultMode="langganan" />);
    expect(screen.getByText("Paket Lamaran")).toBeInTheDocument();
    expect(screen.getByText("Rp49.000")).toBeInTheDocument();
    expect(screen.getByText("Ambil Paket Lamaran")).toBeInTheDocument();
  });

  it("kartu Free mengklaim kuota gratis yang benar-benar didapat", () => {
    renderWithI18n(<PricingSection defaultMode="langganan" />);
    expect(screen.getByText("2x AI CV + 3x polish AI / bulan")).toBeInTheDocument();
    expect(screen.getByText("2x analisis ATS / bulan")).toBeInTheDocument();
    expect(screen.getByText("1x AI portfolio / bulan")).toBeInTheDocument();
  });

  it("kartu portfolio menjanjikan ekspor PDF sesuai batas paket", () => {
    const { container } = renderWithI18n(<PricingSection defaultMode="langganan" />);
    expect(container.textContent ?? "").toContain("Export PDF unlimited");
  });
});
