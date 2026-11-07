import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LanguageProvider } from "@/lib/i18n";
import { SectionNav } from "@/components/ui/SectionNav";

afterEach(cleanup);

function setup(items = [
  { id: "a", label: "Skor" },
  { id: "b", label: "Kata kunci", count: 3 },
  { id: "ghost", label: "Tidak dirender" },
]) {
  Element.prototype.scrollIntoView = vi.fn();
  return render(
    <LanguageProvider>
      <SectionNav items={items}>
        <section id="a">A</section>
        <section id="b">B</section>
      </SectionNav>
    </LanguageProvider>,
  );
}

describe("SectionNav", () => {
  it("hanya menampilkan item yang section-nya ada, dengan badge dari data", () => {
    setup();
    const navs = screen.getAllByRole("navigation", { name: "Daftar isi" });
    expect(navs.length).toBe(2);
    const desktop = navs[0];
    expect(within(desktop).queryByText("Tidak dirender")).toBeNull();
    expect(within(desktop).getByText("3")).toBeInTheDocument();
    expect(within(desktop).getAllByRole("link")).toHaveLength(2);
  });

  it("klik item menggulir ke section dan menandai aria-current", () => {
    setup();
    const desktop = screen.getAllByRole("navigation", { name: "Daftar isi" })[0];
    const link = within(desktop).getByRole("link", { name: /Kata kunci/ });
    fireEvent.click(link);
    expect(link).toHaveAttribute("aria-current", "location");
  });

  it("tombol Daftar isi membuka sheet dan Escape menutupnya", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Daftar isi/ }));
    expect(screen.getByRole("dialog", { name: "Daftar isi" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("tanpa section yang dirender, hanya isi yang tampil", () => {
    setup([{ id: "x", label: "X" }]);
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
