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
import { DEFAULT_SECTION_ORDER, THEMES } from "@/components/portfolio/themes";
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

describe.each(["interstella", "sherbet"] as const)("tema %s", (themeId) => {
  const rich: PortfolioData = {
    ...data,
    formData: { ...data.formData, heroSubHeadline: "Kampanye dari gagasan sampai layar", heroBio: "Pendekatan kreatif", skillsTools: "Figma", skillsLanguages: "Indonesia", contactPhone: "+628123456", contactLinkedin: "linkedin.com/in/contoh" },
    projects: [{ id: "p1", name: "Proyek contoh", description: "Deskripsi proyek", techStack: "React", link: "https://example.com/proyek?a=1&b=2", repoUrl: "https://example.com/repo", imageUrl: "https://example.com/proyek.jpg", role: "Direktur kreatif" }],
    experiences: [{ id: "e1", company: "Studio contoh", position: "Desainer", startDate: "2024", endDate: "", isPresent: true, description: "Pengalaman contoh" }],
    educations: [{ id: "ed1", institution: "Kampus contoh", degree: "S1", field: "Desain", startDate: "2020", endDate: "", isPresent: true }],
    certifications: [{ id: "c1", name: "Sertifikat contoh", issuer: "Penerbit contoh", year: "2025", url: "https://example.com/sertifikat" }],
    organizations: [{ id: "o1", name: "Komunitas contoh", role: "Anggota", period: "2025", description: "Kegiatan contoh" }],
    hobbies: [{ id: "h1", name: "Fotografi", description: "Minat contoh" }],
    testimonials: [{ id: "t1", name: "Rekan contoh", position: "Desainer", testimonial: "Kutipan untuk pengujian" }],
    extraLinks: [{ id: "x1", label: "Situs pribadi", url: "https://example.com" }],
  };

  it("merender isi seluruh section, gambar, dan tautan yang bisa diaktifkan", () => {
    const { container } = render(<PortfolioDocument data={rich} themeId={themeId} mode="static" />);
    for (const id of DEFAULT_SECTION_ORDER) expect(anchor(container, id).querySelector("section"), id).toBeTruthy();
    expect(container.querySelector("h1")).toHaveTextContent("Kampanye dari gagasan sampai layar");
    expect(anchor(container, "projects").querySelector("img")).toHaveAttribute("src", "https://example.com/proyek.jpg");
    expect(anchor(container, "projects")).toHaveTextContent("Direktur kreatif");
    expect(anchor(container, "certifications")).toHaveTextContent("Penerbit contoh");
    expect(anchor(container, "experience")).toHaveTextContent("Sekarang");
    expect(anchor(container, "education")).toHaveTextContent("Sekarang");
    for (const href of ["mailto:teguh@example.com", "tel:+628123456", "https://linkedin.com/in/contoh", "https://example.com/proyek?a=1&b=2", "https://example.com/repo", "https://example.com/sertifikat"]) {
      const link = Array.from(container.querySelectorAll("a")).find((a) => a.getAttribute("href") === href);
      expect(link, href).toBeTruthy();
      link?.focus();
      expect(link).toHaveFocus();
      const handler = vi.fn((event: MouseEvent) => event.preventDefault());
      link?.addEventListener("click", handler);
      link?.click();
      expect(handler).toHaveBeenCalledOnce();
    }
  });

  it("tidak menciptakan isi atau kontrol pada section kosong", () => {
    const empty: PortfolioData = { formData: { ...EMPTY_FORM_DATA }, projects: [], experiences: [], educations: [], certifications: [], organizations: [], hobbies: [], testimonials: [], extraLinks: [] };
    const { container } = render(<PortfolioDocument data={empty} themeId={themeId} mode="static" />);
    for (const id of DEFAULT_SECTION_ORDER.filter((id) => id !== "hero")) expect(anchor(container, id).querySelector("section"), id).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("menolak skema tautan berbahaya dan tetap dapat diekspor tanpa JS", () => {
    const unsafe: PortfolioData = { ...rich, formData: { ...rich.formData, contactLinkedin: "javascript:alert(1)", contactGithub: "data:text/html,bad" }, projects: [{ ...rich.projects[0], link: "javascript:alert(1)", repoUrl: "data:text/html,bad" }], certifications: [{ ...rich.certifications[0], url: "javascript:alert(1)" }], extraLinks: [{ id: "bad", label: "Tidak aman", url: "javascript:alert(1)" }] };
    const html = renderToStaticMarkup(<PortfolioDocument data={unsafe} themeId={themeId} mode="static" />);
    const host = document.createElement("div");
    host.innerHTML = html;
    expect(host.querySelector('a[href^="javascript:"], a[href^="data:"]')).toBeNull();
    expect(host.querySelector("h1")).toHaveTextContent("Kampanye dari gagasan sampai layar");
    expect(host.querySelector("h1")?.closest('[style*="opacity:0"]')).toBeNull();
    expect(html).not.toContain("NaN");
  });
});

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
    // Warna diambil dari token tema, bukan hex yang ditulis ulang di sini:
    // fixture hex ikut basi setiap palet template disetel ulang.
    const brutalProjects = THEMES.brutal.sectionColors!.projects!;
    const brutalHero = THEMES.brutal.sectionColors!.hero!;
    expect(subtreeMent(anchor(container, "projects"), brutalProjects.primary!)).toBe(true);
    expect(subtreeMent(anchor(container, "hero"), brutalHero.primary!)).toBe(true);
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
    expect(subtreeMent(anchor(container, "projects"), THEMES.glass.sectionColors!.projects!.primary!)).toBe(true);
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

describe("PortfolioDocument sebagai halaman publik", () => {
  it("merender anchor section lengkap di mode static", () => {
    const { container } = render(
      <PortfolioDocument data={data} themeId="glass" mode="static" />,
    );
    expect(anchors(container)).toEqual(DEFAULT_SECTION_ORDER);
    expect(container.querySelector("[data-mode]")?.getAttribute("data-mode")).toBe(
      "static",
    );
  });

  it("meneruskan urutan, visibilitas, dan warna per section", () => {
    const { container } = render(
      <PortfolioDocument
        data={data}
        themeId="glass"
        mode="static"
        sectionOrder={["contact", "projects"]}
        sectionVisibility={{ projects: false }}
        sectionColors={{ contact: { primary: "#0abcde" } }}
      />,
    );
    expect(anchors(container)).toEqual(["contact"]);
    expect(subtreeMent(anchor(container, "contact"), "#0abcde")).toBe(true);
  });
});
