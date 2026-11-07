import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldHelp } from "@/components/builder/FieldHelp";
import { PORTFOLIO_HELP } from "@/lib/portfolio-help";

describe("bantuan field portofolio", () => {
  it("FieldHelp menerima isi langsung selain kunci builder CV", () => {
    render(<FieldHelp topic={PORTFOLIO_HELP.heroBio} />);
    expect(screen.getByRole("button", { name: "Bantuan: Bio singkat" })).toBeInTheDocument();
  });

  it("FieldHelp dengan kunci builder CV tetap seperti semula", () => {
    render(<FieldHelp topic="summary" />);
    expect(screen.getByRole("button", { name: /Bantuan: Ringkasan profesional/ })).toHaveAttribute("data-field-help", "summary");
  });

  it("contoh tanpa klaim ATS/HR dan tanpa angka karangan", () => {
    for (const h of Object.values(PORTFOLIO_HELP)) {
      const text = [h.what, h.good, h.weak, h.weakWhy].join(" ");
      expect(text).not.toMatch(/\bATS\b|\bHR\b|perekrut|recruiter/i);
      // Angka hanya boleh lewat placeholder seperti [angka].
      expect(text.replace(/\[[^\]]+\]/g, "")).not.toMatch(/\d/);
    }
  });
});
