import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
let status: "authenticated" | "unauthenticated" = "authenticated";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next-auth/react", () => ({ getSession: async () => (status === "authenticated" ? { user: { id: "u1" } } : null) }));

import { FixInBuilderButton } from "@/components/checker/FixInBuilderButton";
import { CHECKER_CV_TEXT_KEY, CHECKER_HANDOFF_TTL_MS, CHECKER_SOURCE_KEY, readCheckerCvText } from "@/lib/checker/builder-handoff";
import { LanguageProvider } from "@/lib/i18n";

const CV = "Budi Santoso\nStaf Administrasi di PT Contoh 2021-2024\nMengelola arsip dan jadwal rapat.";

function renderButton(text: string | null) {
  return render(
    <LanguageProvider>
      <FixInBuilderButton cvText={text} />
    </LanguageProvider>,
  );
}

describe("Perbaiki di builder", () => {
  beforeEach(() => {
    push.mockClear();
    sessionStorage.clear();
    status = "authenticated";
  });

  it("menitipkan teks CV lalu membuka builder dengan sumber checker", () => {
    renderButton(CV);
    fireEvent.click(screen.getByRole("button", { name: /Perbaiki di builder/ }));
    expect(JSON.parse(sessionStorage.getItem(CHECKER_CV_TEXT_KEY)!).text).toBe(CV);
    expect(readCheckerCvText()).toBe(CV);
    return waitFor(() => expect(push).toHaveBeenCalledWith("/builder/new?from=checker"));
  });

  it("tamu diarahkan login dulu lalu kembali ke builder", () => {
    status = "unauthenticated";
    renderButton(CV);
    fireEvent.click(screen.getByRole("button", { name: /Perbaiki di builder/ }));
    expect(readCheckerCvText()).toBe(CV);
    return waitFor(() => expect(push).toHaveBeenCalledWith(`/login?next=${encodeURIComponent("/builder/new?from=checker")}`));
  });

  it("titipan lebih dari 30 menit dibuang beserta alamat asalnya", () => {
    renderButton(CV);
    fireEvent.click(screen.getByRole("button", { name: /Perbaiki di builder/ }));
    expect(readCheckerCvText(Date.now() + CHECKER_HANDOFF_TTL_MS + 1000)).toBeNull();
    expect(sessionStorage.getItem(CHECKER_CV_TEXT_KEY)).toBeNull();
    expect(sessionStorage.getItem(CHECKER_SOURCE_KEY)).toBeNull();
  });

  it("titipan format lama (teks mentah) ditolak dan dihapus", () => {
    sessionStorage.setItem(CHECKER_CV_TEXT_KEY, CV);
    expect(readCheckerCvText()).toBeNull();
    expect(sessionStorage.getItem(CHECKER_CV_TEXT_KEY)).toBeNull();
  });

  it("tanpa teks CV tombol tidak tampil", () => {
    renderButton(null);
    expect(screen.queryByRole("button", { name: /Perbaiki di builder/ })).toBeNull();
  });

  it("builder memakai teks itu sebagai rawText dan mencatat builder_start source=checker", () => {
    const src = readFileSync(join(process.cwd(), "src/app/builder/new/page.tsx"), "utf8");
    expect(src).toContain('searchParams.get("from") === "checker"');
    expect(src).toContain('rawText, source: "checker"');
    expect(src).toContain('track("builder_start", { source: rawText ? "checker" : "new" })');
    // Titipan dihapus dari sessionStorage begitu disalin ke state.
    expect(src).toContain("clearCheckerHandoff()");
  });
});
