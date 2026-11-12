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
