import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TEMPLATE_STYLES } from "@/components/cv-templates";
import { TEMPLATE_BLURBS, TemplatePopover } from "@/components/builder/TemplatePopover";

describe("pilih template di toolbar", () => {
  it("setiap template punya kalimat penjelas tanpa klaim ATS", () => {
    for (const id of Object.keys(TEMPLATE_STYLES)) {
      expect(TEMPLATE_BLURBS[id]).toBeTruthy();
      expect(TEMPLATE_BLURBS[id]).not.toMatch(/ATS|lolos|dijamin/i);
    }
  });

  it("galeri berisi 5 template; pilih memanggil onSelect; reset nonaktif tanpa override", () => {
    const onSelect = vi.fn();
    render(<TemplatePopover templateId="industrial-pro" onSelect={onSelect} hasOverrides={false} onResetStyle={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /template/i }));
    const cards = screen.getAllByRole("button", { pressed: false }).concat(screen.getAllByRole("button", { pressed: true }));
    expect(cards.filter((b) => b.closest("li"))).toHaveLength(5);
    fireEvent.click(screen.getByText("Executive Serif"));
    expect(onSelect).toHaveBeenCalledWith("executive-serif");
    expect(screen.getByRole("button", { name: "Kembalikan ke gaya template" })).toBeDisabled();
  });
});
