import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PortfolioDocument,
  EMPTY_FORM_DATA,
  STATIC_HIDDEN_INITIAL_SELECTORS,
  STATIC_REVEAL_FALLBACK_CSS,
} from "@/components/portfolio/render/PortfolioDocument";
import { DEFAULT_SECTION_ORDER } from "@/components/portfolio/themes";
import PublishedPortfolio from "@/components/portfolio/PublishedPortfolio";
import { portfolioFormDataSchema } from "@/lib/portfolio/schema";
import type { FontSize, SectionId, ThemeId } from "@/components/portfolio/types";
import type { PortfolioData } from "@/components/portfolio-templates/types";

/**
 * Dua API browser yang dipakai section dan belum ada di setup global:
 * `window.matchMedia` (hooks/useReducedMotion) dan `IntersectionObserver`
 * (whileInView dari motion/react). Tanpa keduanya, merender section apa pun
 * gagal di jsdom — bukan karena dokumennya salah.
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
});

const data = {
  formData: {
    heroPhotoUrl: "",
    heroHeadline: "Frontend Developer",
    heroSubHeadline: "",
    heroFirstName: "Teguh",
    heroLastName: "Surya",
    heroBio: "",
    aboutText: "Tentang saya",
    aboutYearsExp: "4",
    aboutProjectsDone: "18",
    aboutClientsHappy: "12",
    skillsMain: "React",
    skillsTools: "",
    skillsLanguages: "",
    contactEmail: "teguh@example.com",
    contactPhone: "",
    contactLinkedin: "",
    contactGithub: "",
  },
  projects: [
    { id: "p1", name: "Website Kantor", description: "D", techStack: "React", link: "" },
  ],
  experiences: [],
  educations: [],
  certifications: [],
  organizations: [],
  hobbies: [],
  testimonials: [],
  extraLinks: [],
} as unknown as PortfolioData;

const kosong = {
  ...data,
  formData: {
    ...data.formData,
    heroFirstName: "",
    heroLastName: "",
    aboutText: "",
  },
  projects: [],
} as unknown as PortfolioData;

function anchors(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll("[data-section-id]")].map((s) =>
    s.getAttribute("data-section-id"),
  );
}

function anchor(container: HTMLElement, id: SectionId): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-section-id="${id}"]`);
  if (!el) throw new Error(`anchor ${id} tidak ada`);
  return el;
}

/** Warna hex bisa muncul apa adanya (SSR) atau sudah dinormalisasi jsdom (rgb). */
function subtreeMent(el: HTMLElement, hex: string): boolean {
  const html = el.innerHTML;
  if (html.includes(hex)) return true;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return html.includes(`rgb(${r}, ${g}, ${b})`) || html.includes(`rgb(${r},${g},${b})`);
}

function staticMarkup(node: React.ReactElement): string {
  return renderToStaticMarkup(node);
}

describe("PortfolioDocument", () => {
  it("memberi id pada setiap section supaya anchor hero bekerja", () => {
    const { container } = render(
      <PortfolioDocument data={data} themeId="glass" mode="static" />,
    );
    const ids = anchors(container);
    expect(ids).toContain("hero");
    expect(ids).toContain("projects");
    expect(ids).toContain("contact");
  });

  it("menghormati sectionOrder", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["contact", "hero"]}
      />,
    );
    const ids = anchors(container);
    expect(ids[0]).toBe("contact");
    expect(ids[1]).toBe("hero");
    expect(ids).toHaveLength(2);
  });

  it("tidak merender section yang disembunyikan", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["hero", "projects"]}
        sectionVisibility={{ hero: true, projects: false }}
      />,
    );
    expect(container.querySelector('[data-section-id="projects"]')).toBeNull();
    expect(container.querySelector('[data-section-id="hero"]')).not.toBeNull();
  });

  it("memanggil onSectionClick di mode editor", () => {
    const onSectionClick = vi.fn();
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="editor"
        onSectionClick={onSectionClick}
      />,
    );
    anchor(container, "hero").click();
    expect(onSectionClick).toHaveBeenCalledWith("hero");
  });

  it("tidak melempar error untuk data kosong", () => {
    expect(() =>
      render(<PortfolioDocument data={kosong} themeId="brutal" mode="static" />),
    ).not.toThrow();
  });

  /* ─── Ketahanan data yang masuk dari JSON mentah ─── */

  it("tidak melempar error saat formData dan seluruh array hilang", () => {
    const rusak = {} as PortfolioData;
    let ids: (string | null)[] = [];
    expect(() => {
      const { container } = render(
        <PortfolioDocument data={rusak} themeId="glass" mode="editor" />,
      );
      ids = anchors(container);
    }).not.toThrow();
    expect(ids).toEqual(DEFAULT_SECTION_ORDER);
  });

  it("lengkap terhadap field form yang didefinisikan schema", () => {
    // Jaga agar EMPTY_FORM_DATA tidak tertinggal dari schema: field baru di
    // portfolioFormDataSchema tanpa pasangan di sini akan sampai ke section
    // sebagai undefined, dan section seperti SkillsSection memanggil
    // `.split()` padsanya.
    expect(Object.keys(EMPTY_FORM_DATA).sort()).toEqual(
      Object.keys(portfolioFormDataSchema.shape).sort(),
    );
  });

  it("membuang id section yang tidak dikenal", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["hero", "galaksi", "contact"] as SectionId[]}
      />,
    );
    expect(anchors(container)).toEqual(["hero", "contact"]);
  });

  it("merender section duplikat sekali dan tidak mengulang atribut id", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["hero", "hero", "contact"]}
      />,
    );
    expect(anchors(container)).toEqual(["hero", "contact"]);
    expect(container.querySelectorAll("#hero")).toHaveLength(1);
    expect(container.querySelectorAll('[id="contact"]')).toHaveLength(1);
  });

  it("memakai DEFAULT_SECTION_ORDER saat sectionOrder kosong atau tidak ada", () => {
    const kosongOrder = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={[]}
      />,
    );
    expect(anchors(kosongOrder.container)).toEqual(DEFAULT_SECTION_ORDER);
  });

  it("menampilkan section yang tidak disebut di peta visibilitas", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["hero", "contact"]}
        sectionVisibility={{ contact: false }}
      />,
    );
    expect(anchors(container)).toEqual(["hero"]);
  });

  it("tetap merender stats saat about disembunyikan", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["about", "stats"]}
        sectionVisibility={{ about: false, stats: true }}
      />,
    );
    expect(anchors(container)).toEqual(["stats"]);
    expect(anchor(container, "stats").textContent).toContain("4");
  });

  it("menjaga target anchor meski sectionnya tidak merender apa pun", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="editor"
        sectionOrder={["testimonials"]}
      />,
    );
    const wrapper = anchor(container, "testimonials");
    expect(wrapper.id).toBe("testimonials");
    expect(wrapper.querySelector("section")).toBeNull();
  });

  it("memakai tema glass saat themeId tidak dikenal", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId={"tema-hantu" as ThemeId}
        mode="static"
        sectionOrder={["hero"]}
      />,
    );
    expect(container.querySelector("[data-theme]")?.getAttribute("data-theme")).toBe(
      "glass",
    );
  });

  it("memakai fontSize medium saat nilainya di luar tiga yang diizinkan", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        fontSize={"raksasa" as FontSize}
      />,
    );
    expect(container.querySelector("[data-font-size]")?.getAttribute("data-font-size")).toBe(
      "medium",
    );
  });

  it("menyerap fontSize yang sah ke custom property yang sama dengan builder", () => {
    const { container } = render(
      <PortfolioDocument data={data} themeId="glass" mode="static" fontSize="large" />,
    );
    const root = container.querySelector("[data-font-size]") as HTMLElement;
    expect(root.style.getPropertyValue("--p-font-size-base")).toBe("18px");
    expect(root.style.getPropertyValue("--p-font-size-h2")).toBe("1.75rem");
  });

  /* ─── Pemisyahan editor vs static ─── */

  it("tidak memasang onSectionClick di mode static", () => {
    const onSectionClick = vi.fn();
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        onSectionClick={onSectionClick}
      />,
    );
    anchor(container, "hero").click();
    expect(onSectionClick).not.toHaveBeenCalled();
  });

  it("menjaga satu section yang melempar agar dokumen lain tetap tampil", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const rusak = {
        ...data,
        extraLinks: [null],
      } as unknown as PortfolioData;
      const { container } = render(
        <PortfolioDocument
          data={rusak}
          themeId="glass"
          mode="editor"
          sectionOrder={["hero", "contact"]}
        />,
      );
      expect(anchors(container)).toEqual(["hero", "contact"]);
      expect(anchor(container, "contact").textContent).toContain("gagal");
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("tidak membocorkan pesan kegagalan ke halaman publik", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const rusak = { ...data, extraLinks: [null] } as unknown as PortfolioData;
      const { container } = render(
        <PortfolioDocument
          data={rusak}
          themeId="glass"
          mode="static"
          sectionOrder={["contact"]}
        />,
      );
      expect(anchor(container, "contact").textContent).toBe("");
    } finally {
      errorSpy.mockRestore();
    }
  });

  /* ─── Warna per section ─── */

  it("menerapkan sectionColors hanya pada section itu", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionColors={{ projects: { primary: "#123456", accent: "#654321" } }}
      />,
    );
    expect(subtreeMent(anchor(container, "projects"), "#123456")).toBe(true);
    expect(subtreeMent(anchor(container, "hero"), "#123456")).toBe(false);
  });

  it("membawa warna bawaan tema sebagai nilai awal tiap section", () => {
    const { container } = render(
      <PortfolioDocument data={data} themeId="brutal" mode="static" />,
    );
    // projects bawaan brutal: primary #3366FF, hero #FF3366
    expect(subtreeMent(anchor(container, "projects"), "#3366ff")).toBe(true);
    expect(subtreeMent(anchor(container, "hero"), "#ff3366")).toBe(true);
  });

  it("menolak override warna yang bisa menyuntik deklarasi CSS lain", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["projects"]}
        sectionColors={{
          projects: {
            primary: "red;background:url(https://contoh.example/pixel.gif)",
            accent: "}body{display:none",
            text: "rgb(1, 2, 3)",
          } as unknown as Record<string, string>,
        }}
      />,
    );
    const html = anchor(container, "projects").innerHTML;
    expect(html).not.toContain("contoh.example");
    expect(html).not.toContain("display:none");
    // nilai yang benar-benar aman tetap dipakai, bawaan tema tetap utuh
    expect(html).toContain("rgb(1, 2, 3)");
    expect(subtreeMent(anchor(container, "projects"), "#6dd5fa")).toBe(true);
  });

  it("mengabaikan kunci override yang bukan warna milik tema", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["projects"]}
        sectionColors={{
          projects: { warnaLain: "#ff0000" } as unknown as Record<string, string>,
        }}
      />,
    );
    expect(anchor(container, "projects").innerHTML).not.toContain("#ff0000");
  });

  /* ─── Server rendering ─── */

  it("menyisipkan penjaga noscript hanya di mode static", () => {
    const statis = staticMarkup(
      <PortfolioDocument data={data} themeId="glass" mode="static" />,
    );
    expect(statis).toContain("<noscript>");
    expect(statis).toContain("opacity: 1 !important");

    const editor = staticMarkup(
      <PortfolioDocument data={data} themeId="glass" mode="editor" />,
    );
    expect(editor).not.toContain("<noscript>");
  });

  it("menjaga setiap section tersembunyi motion agar penjaga noscript menutupinya", () => {
    // Dua bentuk serialisasi harus sama-sama tertangkap: markup hasil
    // renderToStaticMarkup (`opacity:0;...`, tanpa spasi) dan hasil render
    // klien (`opacity: 0; ...;`, dengan spasi dan titik koma akhir).
    const { container: diDom } = render(
      <PortfolioDocument data={data} themeId="glass" mode="static" />,
    );
    const markup = [
      staticMarkup(<PortfolioDocument data={data} themeId="glass" mode="static" />),
      diDom.innerHTML,
    ];

    const inlineOpacityIsZero = (el: Element) =>
      /(^|;)\s*opacity\s*:\s*0\s*(;|$)/.test(el.getAttribute("style") ?? "");

    for (const source of markup) {
      const host = document.createElement("div");
      host.innerHTML = source;

      const tersembunyi = [...host.querySelectorAll("*")].filter(inlineOpacityIsZero);
      expect(tersembunyi.length).toBeGreaterThan(0);

      const tidakTertangkap = tersembunyi.filter(
        (el) => !STATIC_HIDDEN_INITIAL_SELECTORS.some((sel) => el.matches(sel)),
      );
      expect(tidakTertangkap.map((el) => el.outerHTML.slice(0, 90))).toEqual([]);
    }
  });

  it("tidak pernah membatalkan opacity dekoratif saat menyalin gaya motion", () => {
    const html = staticMarkup(
      <PortfolioDocument data={data} themeId="glass" mode="static" />,
    );
    const host = document.createElement("div");
    host.innerHTML = html;
    const dekoratif = [...host.querySelectorAll("[style*='opacity:0.0']")];
    expect(dekoratif.length).toBeGreaterThan(0);
    const keliruTertangkap = dekoratif.filter((el) =>
      STATIC_HIDDEN_INITIAL_SELECTORS.some((sel) => el.matches(sel)),
    );
    expect(keliruTertangkap).toEqual([]);
  });

  it("menghasilkan penjaga noscript dari satu daftar selektor", () => {
    for (const sel of STATIC_HIDDEN_INITIAL_SELECTORS) {
      expect(STATIC_REVEAL_FALLBACK_CSS).toContain(sel);
    }
  });

  it("merender isi yang terbaca di HTML statis: nama dan isi project ikut masuk", () => {
    const html = staticMarkup(
      <PortfolioDocument data={data} themeId="glass" mode="static" />,
    );
    expect(html).toContain("Teguh Surya");
    expect(html).toContain("Website Kantor");
  });
});

describe("PublishedPortfolio", () => {
  it("merender lewat PortfolioDocument: anchor section ikut terbawa", () => {
    const { container } = render(
      <PublishedPortfolio data={data} themeId="glass" />,
    );
    expect(anchors(container)).toEqual(DEFAULT_SECTION_ORDER);
    expect(container.querySelector("[data-mode]")?.getAttribute("data-mode")).toBe(
      "static",
    );
  });

  it("meneruskan urutan, visibilitas, dan warna per section", () => {
    const { container } = render(
      <PublishedPortfolio
        data={{ ...data, sectionColors: { contact: { primary: "#0abcde" } } } as unknown as PortfolioData}
        themeId="glass"
        sectionOrder={["contact", "projects"]}
        sectionVisibility={{ projects: false }}
      />,
    );
    expect(anchors(container)).toEqual(["contact"]);
    expect(subtreeMent(anchor(container, "contact"), "#0abcde")).toBe(true);
  });

  it("menyembunyikan footer saat showFooter dimatikan", () => {
    const { container, rerender } = render(
      <PublishedPortfolio data={data} themeId="glass" />,
    );
    expect(container.querySelector("footer")).not.toBeNull();
    rerender(<PublishedPortfolio data={data} themeId="glass" showFooter={false} />);
    expect(container.querySelector("footer")).toBeNull();
  });
});
