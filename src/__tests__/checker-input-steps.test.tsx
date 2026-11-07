import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CheckerPage from "@/app/checker/page";
import { Providers, mockFetch } from "./checker-result-render.helpers";

vi.mock("motion/react", async () => (await import("./motion-stub.helpers")).motionStub());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/checker",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/nav/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/AppFooter", () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("input cek CV", () => {
  it("dua langkah bernomor dan tab Unggah | Tempel teks selalu terlihat", () => {
    render(<Providers><CheckerPage /></Providers>);
    expect(screen.getByRole("group", { name: /CV/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Lowongan \(opsional\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Unggah" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Tempel teks" })).toBeInTheDocument();
    expect(screen.getByText(/Kosong: kata kunci lowongan tidak dinilai/)).toBeInTheDocument();
  });

  it("tempel teks tanpa lowongan tetap dianalisis dengan peran dari chip", async () => {
    const fetchMock = mockFetch();
    render(<Providers><CheckerPage /></Providers>);
    fireEvent.click(screen.getByRole("tab", { name: "Tempel teks" }));
    fireEvent.change(screen.getByLabelText(/Atau tempel teks CV/), { target: { value: "Frontend Developer di PT Maju" } });
    fireEvent.click(screen.getByRole("radio", { name: "Fresh Graduate" }));
    expect(screen.getByText(/Education 25%/)).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Analisis CV Sekarang/ }));
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.jobDescription).toBe("");
    expect(body.roleCategory).toBe("fresh_graduate");
  });
});
