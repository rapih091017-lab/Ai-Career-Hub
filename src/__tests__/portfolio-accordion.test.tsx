import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccordionItem } from "@/components/portfolio/builder/BuilderEditor";
import DateField from "@/components/portfolio/DateField";

describe("AccordionItem (builder portfolio)", () => {
  it("tombol header bertipe button dan mengumumkan status expanded", () => {
    const onToggle = vi.fn();
    render(
      <AccordionItem id="about" icon="person" title="Tentang" isOpen={false} onToggle={onToggle}>
        <p>isi</p>
      </AccordionItem>,
    );
    const btn = screen.getByRole("button", { name: /Tentang/ });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith("about");
  });

  it("saat terbuka, panel terbuka penuh tanpa batas max-height", () => {
    const { container } = render(
      <AccordionItem id="experience" icon="work" title="Pengalaman" isOpen={true} onToggle={() => {}}>
        <p>isi</p>
      </AccordionItem>,
    );
    const wrapper = container.querySelector("[style*='grid-template-rows']") as HTMLElement;
    expect(screen.getByRole("button", { name: /Pengalaman/ })).toHaveAttribute("aria-expanded", "true");
    expect(wrapper.style.gridTemplateRows).toBe("1fr");
    const inner = wrapper.firstElementChild as HTMLElement;
    expect(inner.style.overflow).toBe("visible");
  });

  it("saat terbuka, kartu tidak memotong dropdown tanggal yang keluar dari kartu", () => {
    const { container } = render(
      <AccordionItem id="experience" icon="work" title="Pengalaman" isOpen={true} onToggle={() => {}}>
        <p>isi</p>
      </AccordionItem>,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).not.toMatch(/overflow-hidden/);
  });

  it("dropdown tanggal yang terbuka tidak terpotong leluhur mana pun", () => {
    const { container } = render(
      <AccordionItem id="experience" icon="work" title="Pengalaman" isOpen={true} onToggle={() => {}}>
        <DateField label="Mulai" value="" onChange={() => {}} />
      </AccordionItem>,
    );

    fireEvent.click(screen.getByText("Pilih tanggal"));

    const picker = container.querySelector("[class*='z-50']") as HTMLElement | null;
    expect(picker, "picker tanggal tidak terbuka setelah field diklik").not.toBeNull();

    // jsdom tidak memuat stylesheet Tailwind, jadi kelas diperiksa di samping
    // nilai computed: keduanya bisa memotong anak yang berposisi absolute.
    for (let el: HTMLElement | null = picker; el; el = el.parentElement) {
      const label = `${el.tagName.toLowerCase()}.${el.className}`;
      expect(el.className, `${label} memakai overflow-hidden`).not.toMatch(/overflow-(hidden|clip)/);
      const style = getComputedStyle(el);
      expect(
        [style.overflow, style.overflowX, style.overflowY],
        `${label} memotong dropdown`,
      ).not.toContain("hidden");
    }
  });

  it("saat tertutup, panel mengecil ke 0fr dan overflow disembunyikan", () => {
    const { container } = render(
      <AccordionItem id="skills" icon="stars" title="Skill" isOpen={false} onToggle={() => {}}>
        <p>isi</p>
      </AccordionItem>,
    );
    const wrapper = container.querySelector("[style*='grid-template-rows']") as HTMLElement;
    expect(wrapper.style.gridTemplateRows).toBe("0fr");
    const inner = wrapper.firstElementChild as HTMLElement;
    expect(inner.style.overflow).toBe("hidden");
  });
});
