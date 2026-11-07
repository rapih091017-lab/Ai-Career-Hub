import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/lib/i18n";
import LinkedInOptimizerPage from "@/app/linkedin-optimizer/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/nav/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/AppFooter", () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("input LinkedIn optimizer", () => {
  it("resume dipilih lewat tab; teks tempel dikirim hanya dari tab Tempel teks", async () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (url.includes("analyze") ? { id: "lo9" } : []),
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(<LanguageProvider><LinkedInOptimizerPage /></LanguageProvider>);

    expect(screen.getByRole("tab", { name: "Unggah PDF" })).toHaveAttribute("aria-selected", "true");
    fireEvent.change(screen.getByLabelText(/Mau dikenal sebagai apa/), { target: { value: "Data Analyst" } });
    fireEvent.click(screen.getByRole("tab", { name: "Tempel teks" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Salin seluruh isi resume/ }), { target: { value: "Resume saya" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Optimalkan Profil LinkedIn/ }));
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/linkedin-optimizer/lo9"));
    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes("analyze")) as unknown as [string, RequestInit];
    expect(JSON.parse(call[1].body as string).resumeText).toBe("Resume saya");
  });
});
