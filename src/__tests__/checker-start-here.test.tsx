import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { LanguageProvider } from "@/lib/i18n";
import { StartHereCard, pickStartSteps } from "@/components/checker/StartHereCard";
import { useDoneState } from "@/lib/useDoneState";
import { Collapsible } from "@/components/ui/Collapsible";
import type { QuickSummary } from "@/components/checker/types";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const QS: QuickSummary = {
  verdict: "V",
  top_strengths: [],
  top_fixes: [
    { id: "a", title: "Sedang 10", target_section: "checklist", impact: "Sedang", est_minutes: 10 },
    { id: "b", title: "Tinggi tanpa menit", target_section: "hr", impact: "Tinggi" },
    { id: "c", title: "Tinggi 5", target_section: "keyword", impact: "Tinggi", est_minutes: 5, copy_text: "Teks" },
    { id: "d", title: "Rendah 1", target_section: "skor", impact: "Rendah", est_minutes: 1 },
  ],
};

describe("pickStartSteps", () => {
  it("urut dampak Tinggi→Sedang→Rendah lalu menit naik, maksimal 3", () => {
    const steps = pickStartSteps(QS, null);
    expect(steps.map((s) => s.title)).toEqual(["Tinggi 5", "Tinggi tanpa menit", "Sedang 10"]);
    expect(steps[0].anchor).toBe("section-keyword");
  });

  it("fallback ke rencana aksi tanpa dampak atau menit", () => {
    const steps = pickStartSteps(null, { quick_wins: ["Satu", " "], short_term: ["Dua"], long_term: ["Tiga"] });
    expect(steps.map((s) => s.title)).toEqual(["Satu", "Dua"]);
    expect(steps.every((s) => s.impact === undefined && s.est_minutes === undefined)).toBe(true);
  });

  it("tanpa data menghasilkan daftar kosong dan kartu tidak dirender", () => {
    expect(pickStartSteps(null, null)).toEqual([]);
    const { result } = renderHook(() => useDoneState(null));
    const { container } = render(
      <LanguageProvider>
        <StartHereCard steps={[]} done={result.current} />
      </LanguageProvider>,
    );
    expect(container.innerHTML).toBe("");
  });
});

function Harness({ storageKey }: { storageKey: string | null }) {
  const done = useDoneState(storageKey);
  return (
    <LanguageProvider>
      <StartHereCard steps={pickStartSteps(QS, null)} done={done} />
    </LanguageProvider>
  );
}

describe("StartHereCard + useDoneState", () => {
  it("menampilkan menit hanya bila ada, tombol salin bila copy_text, dan progres", () => {
    render(<Harness storageKey={null} />);
    expect(screen.getByText("±5 menit")).toBeInTheDocument();
    expect(screen.getAllByText(/^±\d+ menit$/)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Salin teks/ })).toHaveLength(1);
    expect(screen.getByText("0 dari 3 sudah diperbaiki")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Sudah diperbaiki" })[0]);
    expect(screen.getByText("1 dari 3 sudah diperbaiki")).toBeInTheDocument();
  });

  it("centang tersimpan per id hasil dan dibaca lagi setelah mount ulang", async () => {
    const first = render(<Harness storageKey="checker_done:r1" />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("checkbox", { name: "Sudah diperbaiki" })[1]);
    });
    expect(JSON.parse(localStorage.getItem("checker_done:r1") ?? "[]")).toEqual(["start:fix-b"]);
    first.unmount();
    render(<Harness storageKey="checker_done:r1" />);
    expect(await screen.findByText("1 dari 3 sudah diperbaiki")).toBeInTheDocument();
  });

  it("localStorage yang melempar error tidak memecahkan halaman", () => {
    const real = Storage.prototype.getItem;
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key: string) {
      if (key.startsWith("checker_done:")) throw new Error("diblokir");
      return real.call(this, key);
    });
    render(<Harness storageKey="checker_done:r2" />);
    expect(screen.getByText("0 dari 3 sudah diperbaiki")).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe("Collapsible", () => {
  it("default tertutup dengan ringkasan satu baris", () => {
    const { container } = render(
      <Collapsible id="x" title="Judul" summary="2 temuan">
        <p>Isi</p>
      </Collapsible>,
    );
    const details = container.querySelector("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(screen.getByText("2 temuan")).toBeInTheDocument();
  });
});
