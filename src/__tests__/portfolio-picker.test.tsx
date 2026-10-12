import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render } from "@testing-library/react";
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

const THEME_NAMES = ["Glassmorphism", "Neo Brutal", "Editorial Luxe"] as const;

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

  it("page berhenti memakai mockup TEMPLATE_PREVIEWS dan merender via renderer", () => {
    const src = readFileSync(join(process.cwd(), "src/app/portfolio/page.tsx"), "utf8");
    expect(src).not.toContain("TEMPLATE_PREVIEWS");
    expect(src).toContain("PortfolioDocument");
    expect(src).toContain("portfolio.theme.");
  });
});
