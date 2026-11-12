import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, screen, cleanup } from "@testing-library/react";
import { useState } from "react";
import { OutputLangPicker } from "@/components/ai/OutputLangPicker";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";
import { ToastProvider } from "@/components/ui/toast";
import type { OutputLang } from "@/lib/ai/output-lang";

function Harness({ cvLang }: { cvLang: OutputLang }) {
  const [v, setV] = useState<OutputLang>(cvLang);
  return <OutputLangPicker value={v} onChange={setV} cvLang={cvLang} />;
}

beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* abaikan */ }
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("OutputLangPicker", () => {
  it("radiogroup aksesibel, catatan muncul saat beda dari bahasa CV", () => {
    render(<Harness cvLang="id" />);
    const group = screen.getByRole("radiogroup", { name: "Bahasa hasil:" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Indonesia" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText(/hasil akan dalam/)).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    expect(screen.getByRole("radio", { name: "English" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("CV-mu berbahasa Indonesia; hasil akan dalam English.")).toBeInTheDocument();
  });
});

describe("Poles AI mengirim outputLang", () => {
  function setupFetch() {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, polished: "Led the team" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }
  const body = (m: ReturnType<typeof setupFetch>) =>
    JSON.parse(((m.mock.calls[0] as unknown[])[1] as RequestInit).body as string);

  it("default ikut cvLang", async () => {
    const fetchMock = setupFetch();
    render(<ToastProvider><AIPolishButton content="Mengelola tim gudang dan stok" onApply={() => {}} cvLang="en" /></ToastProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Poles AI/ }));
    expect(screen.getByRole("radio", { name: "English" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: "Poles teks ini" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(body(fetchMock)).toMatchObject({ outputLang: "en", cvLang: "en" });
  });

  it("pilihan user dikirim dan diingat di localStorage", async () => {
    const fetchMock = setupFetch();
    render(<ToastProvider><AIPolishButton content="Mengelola tim gudang dan stok" onApply={() => {}} /></ToastProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Poles AI/ }));
    expect(screen.getByRole("radio", { name: "Indonesia" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    fireEvent.click(screen.getByRole("button", { name: "Poles teks ini" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(body(fetchMock).outputLang).toBe("en");
    expect(window.localStorage.getItem("ai-output-lang")).toBe("en");
  });
});

describe("OutputLangProvider: satu state di builder", () => {
  it("dua Poles AI berbagi pilihan dan default ikut cvLang provider", async () => {
    const { OutputLangProvider, useOutputLangController } = await import("@/components/ai/OutputLangPicker");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, polished: "x y z" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    function Page() {
      const st = useOutputLangController("en");
      return (
        <OutputLangProvider value={st}>
          <span data-testid="lang">{st.lang}</span>
          <AIPolishButton content="Mengelola tim gudang dan stok" onApply={() => {}} />
        </OutputLangProvider>
      );
    }
    render(<ToastProvider><Page /></ToastProvider>);
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    fireEvent.click(screen.getByRole("button", { name: /Poles AI/ }));
    // Teks kolom berbahasa Indonesia, tapi bahasa CV dari provider = en.
    expect(screen.getByRole("radio", { name: "English" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "Indonesia" }));
    expect(screen.getByTestId("lang")).toHaveTextContent("id");
  });
});

describe("UI fitur AI dalam English", () => {
  it("panel Poles dan pemilih bahasa memakai teks English", async () => {
    const { LanguageProvider } = await import("@/lib/i18n");
    window.localStorage.setItem("lang", "en");
    render(<LanguageProvider><ToastProvider><AIPolishButton content="Mengelola tim gudang dan stok" onApply={() => {}} /></ToastProvider></LanguageProvider>);
    fireEvent.click(await screen.findByRole("button", { name: /AI Polish/ }));
    expect(screen.getByRole("radiogroup", { name: "Output language:" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Polish this text" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    expect(screen.getByText("Your CV is in Indonesian; the result will be in English.")).toBeInTheDocument();
  });
});
