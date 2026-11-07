import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import CheckerPage from "@/app/checker/page";
import CheckerDetailPage from "@/app/checker/[id]/page";
import { renderFreshResults, renderStoredResults } from "./checker-result-render.helpers";

// Animasi motion diganti elemen biasa supaya HTML tidak bergantung waktu.
vi.mock("motion/react", async () => (await import("./motion-stub.helpers")).motionStub());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "fx1" }),
  usePathname: () => "/checker",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/nav/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/AppFooter", () => ({ default: () => null }));

/** Spasi di antara tag (sisa indentasi JSX) tidak tampil di flex, jadi dinormalkan. */
function html(el: Element | null | undefined) {
  return (el?.innerHTML ?? "").replace(/>\s+</g, "><");
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("render hasil cek CV dari fixture", () => {
  it("/checker (hasil segar) tetap sama", async () => {
    const view = await renderFreshResults(CheckerPage);
    await expect(html(view.container.querySelector("main"))).toMatchFileSnapshot(
      "./__snapshots__/checker-result-fresh.html",
    );
  });

  it("/checker/[id] (hasil tersimpan) tetap sama", async () => {
    const view = await renderStoredResults(CheckerDetailPage);
    await expect(html(view.container.querySelector("main"))).toMatchFileSnapshot(
      "./__snapshots__/checker-result-stored.html",
    );
  });
});
