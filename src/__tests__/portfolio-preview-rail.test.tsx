import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children?: ReactNode } & Record<string, unknown>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/portfolio/preview",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "u1" } }, status: "authenticated", update: vi.fn() }),
}));

import PortfolioPreviewPage from "@/app/portfolio/preview/page";
import { LanguageProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import { THEMES } from "@/components/portfolio/themes";

/** API browser yang dipakai motion/react dan hooks/useReducedMotion. */
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
});

const FORM = {
  heroPhotoUrl: "",
  heroHeadline: "Product Designer",
  heroSubHeadline: "Rapi di atas kertas",
  heroFirstName: "Bagas",
  heroLastName: "Prakoso",
  heroBio: "Menyusun alur produk dari sketsa sampai rilis.",
  aboutText: "Sepuluh tahun menyusun produk digital.",
  aboutYearsExp: "10",
  aboutProjectsDone: "24",
  aboutClientsHappy: "18",
  skillsMain: "Figma, Research",
  skillsTools: "FigJam",
  skillsLanguages: "Indonesia",
  contactEmail: "bagas@example.com",
  contactPhone: "",
  contactLinkedin: "",
  contactGithub: "",
};

const DRAFT = {
  draftId: "draft-1",
  data: {
    formData: FORM,
    projects: [
      { id: "p1", name: "Proyek contoh", description: "Deskripsi", techStack: "Figma", link: "" },
    ],
    experiences: [],
    educations: [],
    certifications: [],
    organizations: [],
    hobbies: [],
    testimonials: [],
    extraLinks: [],
  },
};

beforeEach(() => {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/portfolio/publish")) {
      return { ok: true, json: async () => ({ published: false }) } as unknown as Response;
    }
    return { ok: true, json: async () => DRAFT } as unknown as Response;
  }) as unknown as typeof fetch;
});

function renderPreview() {
  return render(
    <LanguageProvider>
      <ToastProvider>
        <PortfolioPreviewPage />
      </ToastProvider>
    </LanguageProvider>,
  );
}

describe("rail template di halaman preview", () => {
  it("menampilkan semua tema dan menandai satu tema aktif", async () => {
    const { container } = renderPreview();
    const rail = await waitFor(
      () => {
        const aside = container.querySelector("aside");
        expect(aside?.querySelectorAll("button").length).toBe(Object.keys(THEMES).length);
        return aside as HTMLElement;
      },
      { timeout: 30000 },
    );

    const buttons = Array.from(rail.querySelectorAll("button"));
    for (const theme of Object.values(THEMES)) {
      expect(buttons.some((b) => b.textContent?.includes(theme.name)), theme.name).toBe(true);
    }
    expect(buttons.filter((b) => b.getAttribute("aria-pressed") === "true")).toHaveLength(1);
    const label = rail.getAttribute("aria-label");
    expect(label).toBeTruthy();
    expect(rail.querySelector("p")?.textContent).toBe(label);
  }, 40000);

  it("memilih tema di rail mengganti dokumen yang tampil", async () => {
    const { container, getByRole } = renderPreview();
    await waitFor(
      () => expect(container.querySelectorAll("aside button").length).toBe(Object.keys(THEMES).length),
      { timeout: 30000 },
    );

    fireEvent.click(getByRole("button", { name: /Interstella/ }));
    await waitFor(() =>
      expect(container.querySelector('[data-mode="editor"][data-theme="interstella"]')).toBeTruthy(),
    );
    expect(getByRole("button", { name: /Interstella/ })).toHaveAttribute("aria-pressed", "true");
  }, 40000);

  it("preview di rail hanya memuat hero, bukan seluruh section", async () => {
    const { container } = renderPreview();
    await waitFor(
      () => expect(container.querySelectorAll("aside button").length).toBe(Object.keys(THEMES).length),
      { timeout: 30000 },
    );

    const railDoc = container.querySelector("aside [data-mode='static']");
    expect(railDoc).toBeTruthy();
    expect(railDoc?.querySelector('[data-section-id="hero"] section')).toBeTruthy();
    expect(railDoc?.querySelector('[data-section-id="about"] section')).toBeNull();
    expect(railDoc?.querySelector('[data-section-id="projects"] section')).toBeNull();
  }, 40000);

  it("id section tiap preview tidak bertabrakan dengan dokumen utama", async () => {
    const { container } = renderPreview();
    await waitFor(
      () => expect(container.querySelectorAll("aside button").length).toBe(Object.keys(THEMES).length),
      { timeout: 30000 },
    );

    const ids = Array.from(container.querySelectorAll("[data-section-id]")).map((el) => el.id);
    expect(ids.length).toBeGreaterThan(Object.keys(THEMES).length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelector('[data-mode="editor"] [data-section-id="hero"]')?.id).toBe("hero");
  }, 40000);
});
