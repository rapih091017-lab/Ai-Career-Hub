import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";
import { CV_TEXT, STORED_ROW } from "./checker-result.fixture";

/** Bungkus provider yang dipakai halaman checker. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>{children}</ToastProvider>
    </LanguageProvider>
  );
}

/** Hasil segar dari /api/checker/analyze untuk fixture yang sama. */
export function freshResult() {
  return analysisFromFullResult(STORED_ROW.id, STORED_ROW);
}

/** fetch palsu: extract → teks CV, analyze → hasil segar, history → baris tersimpan. */
export function mockFetch() {
  const fn = vi.fn(async (url: string) => {
    const body = url.includes("/extract")
      ? { extractedText: CV_TEXT }
      : url.includes("/analyze")
        ? freshResult()
        : STORED_ROW;
    return { ok: true, status: 200, text: async () => JSON.stringify(body) } as Response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** Menjalankan alur unggah DOCX → analisis sampai layar hasil /checker tampil. */
export async function renderFreshResults(Page: () => ReactNode) {
  mockFetch();
  const view = render(
    <Providers>
      <Page />
    </Providers>,
  );
  const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["x"], "cv.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  fireEvent.change(input, { target: { files: [file] } });
  const jd = view.container.querySelector("textarea") as HTMLTextAreaElement;
  fireEvent.change(jd, { target: { value: "Dibutuhkan Frontend Developer React" } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /Analisis|Analyze|Cek/i }));
  });
  await waitFor(() => expect(view.container.querySelector("#section-hr")).not.toBeNull());
  return view;
}

/** Render /checker/[id] sampai data selesai dimuat. */
export async function renderStoredResults(Page: () => ReactNode) {
  mockFetch();
  const view = render(
    <Providers>
      <Page />
    </Providers>,
  );
  await waitFor(() => expect(view.container.querySelector("#section-hr")).not.toBeNull());
  return view;
}

