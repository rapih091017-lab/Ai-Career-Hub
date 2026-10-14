import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PricingSection from "@/components/PricingSection";
import { LanguageProvider } from "@/lib/i18n";
import { CURRENT_PACKAGES } from "@/lib/package-catalog-static";

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

/** Katalog yang dikembalikan API, sesuai bentuk yang dipakai komponen. */
const catalogResponse = {
  packages: Object.values(CURRENT_PACKAGES).map((p) => ({
    key: p.id,
    id: p.id,
    name: p.name,
    price: p.price,
    periodDays: p.periodDays,
    monthly: p.monthly ?? false,
    maxActivePortfolios: p.maxActivePortfolios,
    limits: p.limits,
  })),
};

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

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/packages")) {
        return { ok: true, json: async () => catalogResponse } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    }),
  );
});

describe("PricingSection mode satuan", () => {
  it("menampilkan lima paket satuan dengan harga dari katalog", async () => {
    renderWithI18n(<PricingSection defaultMode="satuan" />);
    for (const name of ["Cek CV", "Bikin CV", "Surat Lamaran", "Portfolio Web", "Paket Lengkap 1 Lamaran"]) {
      expect((await screen.findAllByText(name)).length).toBeGreaterThan(0);
    }
    expect((await screen.findAllByText("Rp9.000")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Rp34.000")).length).toBeGreaterThan(0);
  });

  it("daftar isi kartu mengikuti kuota paket, bukan teks statis", async () => {
    renderWithI18n(<PricingSection defaultMode="satuan" />);
    // Bikin CV: 3x generate, 5x revisi, PDF tanpa batas.
    expect((await screen.findAllByText("3x AI CV Builder")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("5x AI Smart Revision")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Unduh PDF tanpa batas")).length).toBeGreaterThan(0);
  });

  it("tidak ada harga paket lama yang masih tampil", async () => {
    const { container } = renderWithI18n(<PricingSection defaultMode="satuan" />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("Rp49.000");
    expect(text).not.toContain("Rp119.000");
  });
});

describe("PricingSection mode bulanan", () => {
  it("menampilkan Gratis, Lite, Pro, dan Max", async () => {
    renderWithI18n(<PricingSection defaultMode="langganan" />);
    expect(await screen.findAllByText(/Gratis/)).not.toHaveLength(0);
    expect((await screen.findAllByText("Lite")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Pro")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Max")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Rp39.000")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Rp79.000")).length).toBeGreaterThan(0);
  });

  it("Pro dan Max menulis batas wajar model mendalam apa adanya", async () => {
    const { container } = renderWithI18n(<PricingSection defaultMode="langganan" />);
    expect(container.textContent ?? "").toContain("60 analisis mendalam");
  });

  it("tidak ada klaim fitur yang belum ada", async () => {
    const { container } = renderWithI18n(<PricingSection defaultMode="langganan" />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("Hemat 30%");
    expect(text).not.toContain("bulk");
  });
});