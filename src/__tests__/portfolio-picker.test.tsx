import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children?: ReactNode } & Record<string, unknown>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/portfolio",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "authenticated", update: vi.fn() }),
}));

import PortfolioPage from "@/app/portfolio/page";
import FeatureTabs from "@/components/FeatureTabs";
import PortfolioSpotlight from "@/components/PortfolioSpotlight";
import { THEMES } from "@/components/portfolio/themes";
import { LanguageProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";

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

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
  localStorage.clear();
});

const THEME_NAMES = ["Glassmorphism", "Neo Brutal", "Editorial Luxe", "Minimalist", "Kertas Kerja"] as const;

function renderPage() {
  return render(
    <LanguageProvider>
      <ToastProvider>
        <PortfolioPage />
      </ToastProvider>
    </LanguageProvider>,
  );
}

function themeCards(container: HTMLElement): HTMLButtonElement[] {
  return THEME_NAMES.map((name) => {
    const card = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(name),
    );
    expect(card, `kartu tema "${name}" tidak ditemukan`).toBeTruthy();
    return card as HTMLButtonElement;
  });
}

/** Rangka struktur: urutan tag (termasuk duplikat), tanpa atribut dan teks.
 *  Dua mockup berbeda warna punya rangka identik; renderer per tema tidak. */
function skeleton(el: Element): string {
  const tags: string[] = [];
  const walk = (node: Element): void => {
    tags.push(node.tagName.toLowerCase());
    for (const child of Array.from(node.children)) walk(child);
  };
  walk(el);
  return tags.join(">");
}

describe("picker tema: thumbnail nyata + deskripsi per tema", () => {
  it("dua kartu tema merender struktur HTML berbeda, bukan cuma warna", () => {
    const { container } = renderPage();
    const [glass, brutal, luxe] = themeCards(container);

    const skelGlass = skeleton(glass.firstElementChild as Element);
    const skelBrutal = skeleton(brutal.firstElementChild as Element);
    const skelLuxe = skeleton(luxe.firstElementChild as Element);

    expect(skelGlass).not.toBe(skelBrutal);
    expect(skelBrutal).not.toBe(skelLuxe);
    expect(skelGlass).not.toBe(skelLuxe);
  });

  it("tiap kartu punya deskripsi satu baris (i18n) dan tema default ditandai", () => {
    const { container } = renderPage();
    const [glass, brutal, luxe] = themeCards(container);

    expect(glass.textContent).toContain("Kaca buram");
    expect(brutal.textContent).toContain("Kotak tajam");
    expect(luxe.textContent).toContain("Serif besar");

    expect(glass.textContent).toContain("Tema bawaan");
    expect(brutal.textContent).not.toContain("Tema bawaan");
    expect(luxe.textContent).not.toContain("Tema bawaan");
  });

  it("thumbnail di dalam <button> tidak menyisakan elemen interaktif aktif", () => {
    const { container } = renderPage();
    const [glass] = themeCards(container);

    const thumb = glass.querySelector("[aria-hidden='true'][inert]");
    expect(thumb, "wrapper thumbnail harus inert agar anchor di dalamnya tidak jadi nested interactive").toBeTruthy();
    const stray = Array.from(glass.querySelectorAll("a, button, input, select, textarea")).filter(
      (el) => !thumb!.contains(el),
    );
    expect(stray, `elemen interaktif di luar area inert: ${stray.map((el) => el.tagName).join(", ")}`).toHaveLength(0);
  });

  it("thumbnail membingkas section yang berbeda strukturnya, bukan hero", () => {
    const { container } = renderPage();
    const [glass] = themeCards(container);

    const viewport = glass.querySelector("[data-thumb-viewport]");
    expect(viewport, "thumbnail butuh viewport berlabel agar bisa diuji").toBeTruthy();

    // Hero disembunyikan hanya di dalam thumbnail: dialah area yang paling
    // seragam antar tema, sehingga crop selalu tampak "tidak berubah".
    const rules = (viewport as HTMLElement).querySelector("style")?.textContent ?? "";
    expect(rules).toMatch(/data-section-id="hero"\]\s*\{\s*display:\s*none/);

    // Sisanya harus benar-benar terisi, kalau tidak crop jadi kosong.
    const sections = Array.from(viewport!.querySelectorAll("[data-section-id]")).map((s) =>
      s.getAttribute("data-section-id"),
    );
    expect(sections.length).toBeGreaterThanOrEqual(3);
    expect(sections).toContain("about");
    expect(sections).toContain("experience");
  });

  it(" skala dan tinggi thumbnail cukup besar untuk membaca pembeda tema", () => {
    const { container } = renderPage();
    const [glass] = themeCards(container);

    const viewport = glass.querySelector("[data-thumb-viewport]") as HTMLElement | null;
    const inner = viewport?.querySelector("[data-thumb-scale]") as HTMLElement | null;
    expect(inner, "wrapper berskala harus berlabel").toBeTruthy();
    expect(inner!.style.transform).toBe("scale(0.8)");
    expect(viewport!.style.height).toBe("220px");
  });

  it("lima tema tampil: glass, brutal, luxe, minimal, dan kertas kerja", () => {
    const { container } = renderPage();
    const [glass, brutal, luxe, minimalist, workbench] = themeCards(container);

    expect(glass).toBeTruthy();
    expect(minimalist.textContent).toContain("ruang kosong lega");
    expect(workbench.textContent).toContain("garis tinta");
    expect(workbench.textContent).not.toContain("Tema bawaan");
    // Tema bawaan tetap Glass, bukan tema baru.
    expect(glass.textContent).toContain("Tema bawaan");
    expect(minimalist.textContent).not.toContain("Tema bawaan");
    expect(luxe.textContent).not.toContain("Tema bawaan");
    expect(brutal.textContent).not.toContain("Tema bawaan");
  });

  it("kelima kartu thumbnail punya struktur berbeda satu sama lain", () => {
    const { container } = renderPage();
    const cards = themeCards(container);
    const skels = cards.map((c) => skeleton(c.firstElementChild as Element));
    expect(new Set(skels).size).toBe(cards.length);
  });

  it("Interstella tampil dengan deskripsi, thumbnail berisi, dan bisa dipilih", () => {
    const { container } = renderPage();
    const card = Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes("Interstella"));
    expect(card).toBeTruthy();
    expect(card).toHaveTextContent("Panggung agensi gelap");
    expect(card?.querySelector('[data-section-id="about"] section')).toHaveTextContent("[Ceritakan bidang kerja");
    if (!card) throw new Error("Kartu Interstella tidak ditemukan");
    fireEvent.click(card);
    expect(container.querySelector('a[href="/portfolio/preview?template=interstella"]')).toBeTruthy();
  });

  it("Sherbet punya thumbnail berisi dan pilihan yang membuka preview Sherbet", () => {
    const { container } = renderPage();
    const card = Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes("Sherbet"));
    expect(card).toBeTruthy();
    expect(card).toHaveTextContent("Pastel peach dan mint");
    expect(card?.querySelector('[data-section-id="about"] section')).toHaveTextContent("[Ceritakan gaya konten");
    if (!card) throw new Error("Kartu Sherbet tidak ditemukan");
    fireEvent.click(card);
    expect(container.querySelector('a[href="/portfolio/preview?template=sherbet"]')).toBeTruthy();
  });

  it("landing menampilkan semua tema dengan tautan preview yang sesuai", async () => {
    const { container, getByRole } = render(<LanguageProvider><FeatureTabs /></LanguageProvider>);
    fireEvent.click(getByRole("button", { name: /Portfolio/ }));
    await waitFor(() => {
      for (const theme of Object.values(THEMES)) {
        const link = container.querySelector(`a[href="/portfolio/preview?template=${theme.id}"]`);
        expect(link, theme.id).toHaveTextContent(theme.name);
        expect(link).toHaveTextContent(/.+/);
        expect(link?.textContent).not.toContain("portfolio.theme.");
      }
    });
  });

  it("spotlight landing menampilkan nama semua tema dari katalog", () => {
    const { container } = render(<LanguageProvider><PortfolioSpotlight /></LanguageProvider>);
    for (const theme of Object.values(THEMES)) expect(container).toHaveTextContent(theme.name);
  });

  it("page berhenti memakai mockup TEMPLATE_PREVIEWS dan merender via renderer", () => {
    const src = readFileSync(join(process.cwd(), "src/app/portfolio/page.tsx"), "utf8");
    expect(src).not.toContain("TEMPLATE_PREVIEWS");
    expect(src).toContain("PortfolioDocument");
    expect(src).toContain("portfolio.theme.");
  });
});
