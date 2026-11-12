import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StatsStrip, { STATS_THRESHOLDS, visibleStats } from "@/components/landing/StatsStrip";
import { LanguageProvider } from "@/lib/i18n";

describe("StatsStrip", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hanya angka yang melewati ambang yang tampil", () => {
    const items = visibleStats({ totalUsers: STATS_THRESHOLDS.users, totalCvs: 1500, totalAnalyses: 999 });
    expect(items.map((i) => i.key)).toEqual(["cvs", "users"]);
  });

  it("kurang dari dua yang lolos: seluruh baris disembunyikan", () => {
    expect(visibleStats({ totalUsers: 10, totalCvs: 5000, totalAnalyses: 3 })).toEqual([]);
  });

  it("tidak merender rata-rata skor ATS walau API mengirimnya", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ totalUsers: 800, totalCvs: 2000, totalAnalyses: 3000, avgAtsScore: 77 }) })));
    const { container } = render(
      <LanguageProvider>
        <StatsStrip />
      </LanguageProvider>,
    );
    await waitFor(() => expect(container.querySelectorAll("dl > div")).toHaveLength(3));
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("data kecil: tidak ada apa pun yang dirender", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ totalUsers: 3, totalCvs: 4, totalAnalyses: 5, avgAtsScore: 90 }) })));
    const { container } = render(
      <LanguageProvider>
        <StatsStrip />
      </LanguageProvider>,
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(container.querySelector("section")).toBeNull();
  });
});
