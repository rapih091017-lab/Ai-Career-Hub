import "@testing-library/jest-dom/vitest";
import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const draftState: { loading: boolean; data: unknown } = { loading: true, data: null };

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace() {}, push() {} }) }));
vi.mock("@/components/AuthGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="guard">{children}</div>,
}));
vi.mock("@/lib/portfolio/usePortfolioDraft", () => ({ usePortfolioDraft: () => draftState }));
vi.mock("@/components/portfolio/PortfolioSkeleton", () => ({ default: () => <p>skeleton</p> }));
vi.mock("@/components/portfolio/builder/BuilderEditor", () => ({ default: () => <p>editor</p> }));

import Page from "@/app/portfolio/build/[draftId]/page";

// Promise yang sudah "fulfilled" dibaca use() tanpa menunda render.
const params = Object.assign(Promise.resolve({ draftId: "d1" }), { status: "fulfilled", value: { draftId: "d1" } });

describe("urutan AuthGuard halaman build/[draftId]", () => {
  beforeEach(() => {
    draftState.loading = true;
    draftState.data = null;
  });

  it("skeleton dirender di dalam AuthGuard", async () => {
    render(<Suspense fallback={null}><Page params={params} /></Suspense>);
    const sk = await screen.findByText("skeleton");
    expect(screen.getByTestId("guard")).toContainElement(sk);
  });

  it("'tidak ditemukan' dirender di dalam AuthGuard", async () => {
    draftState.loading = false;
    render(<Suspense fallback={null}><Page params={params} /></Suspense>);
    const msg = await screen.findByText("Draft tidak ditemukan.");
    expect(screen.getByTestId("guard")).toContainElement(msg);
  });
});
