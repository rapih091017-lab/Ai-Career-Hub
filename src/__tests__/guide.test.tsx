import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { GUIDE_DICT } from "@/lib/i18n-dict/guide";
import { FEATURE_TEXT_PARTS, GLOSSARY, GUIDE_FEATURES, tourKeyFor } from "@/lib/guide-features";
import { FeatureGuide } from "@/components/guide/FeatureGuide";
import { HowToUse } from "@/components/guide/HowToUse";
import { Term } from "@/components/guide/Term";
import { GuidedEmptyState } from "@/components/guide/GuidedEmptyState";
import GuideCenter from "@/components/guide/GuideCenter";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// Huruf/kata khas Indonesia yang tidak boleh muncul di mode en.
const INDONESIAN = /\b(yang|dan|untuk|dengan|belum|lewati|berikutnya|selesai|kamu|panduan|cara pakai|istilah|lowongan)\b/i;

function wrap(lang: "id" | "en", node: ReactNode) {
  localStorage.setItem("lang", lang);
  return render(<LanguageProvider>{node}</LanguageProvider>);
}

beforeEach(() => localStorage.clear());

describe("kamus panduan", () => {
  it("tiap fitur punya semua teks, tur punya judul & isi, glosarium lengkap", () => {
    for (const f of GUIDE_FEATURES) {
      for (const part of FEATURE_TEXT_PARTS) expect(GUIDE_DICT[`guide.f.${f.id}.${part}`], `${f.id}.${part}`).toBeTruthy();
      for (const s of f.tour ?? []) {
        expect(GUIDE_DICT[s.title], s.title).toBeTruthy();
        expect(GUIDE_DICT[s.body], s.body).toBeTruthy();
      }
      if (f.tour) expect(f.tour.length).toBeGreaterThanOrEqual(3);
    }
    for (const g of GLOSSARY) {
      expect(GUIDE_DICT[`glossary.${g}.term`]).toBeTruthy();
      expect(GUIDE_DICT[`glossary.${g}.def`]).toBeTruthy();
    }
  });

  it("tanpa em dash, tanpa janji lolos ATS, dan teks en tidak berbahasa Indonesia", () => {
    for (const [key, v] of Object.entries(GUIDE_DICT)) {
      expect(v.id + v.en, key).not.toMatch(/—/);
      expect(v.id, key).not.toMatch(/lolos ATS|dijamin|pasti diterima/i);
      expect(v.en, key).not.toMatch(/guaranteed|pass the ATS/i);
      expect(v.en, key).not.toMatch(INDONESIAN);
    }
  });
});

describe("FeatureGuide (tur generik)", () => {
  it("muncul sekali, bisa dilewati, dan dibuka ulang lewat tombol Panduan", () => {
    const { unmount } = wrap("id", <FeatureGuide id="tracker" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Panduan 1 dari 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Panduan lengkap" })).toHaveAttribute("href", "/panduan#tracker");
    fireEvent.click(screen.getByRole("button", { name: "Lewati" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(tourKeyFor("tracker"))).toBe("1");
    unmount();

    // Kunjungan berikutnya: tidak muncul sendiri.
    wrap("id", <FeatureGuide id="tracker" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Buka tur singkat fitur ini" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
    expect(screen.getByText("Panduan 2 dari 3")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("menunggu ready sebelum muncul", () => {
    const { rerender } = wrap("id", <FeatureGuide id="checker" ready={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<LanguageProvider><FeatureGuide id="checker" ready /></LanguageProvider>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("mode en: tidak ada teks Indonesia di tur", () => {
    wrap("en", <FeatureGuide id="dashboard" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Guide 1 of 4");
    expect(dialog.textContent).not.toMatch(INDONESIAN);
  });
});

describe("HowToUse", () => {
  it("tiga langkah, bisa dilipat, status diingat", () => {
    const { unmount } = wrap("id", <HowToUse id="checker" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan cara pakai" }));
    expect(localStorage.getItem("guide_howto_checker_collapsed")).toBe("1");
    unmount();
    wrap("id", <HowToUse id="checker" />);
    expect(screen.getByRole("button", { name: "Tampilkan cara pakai" })).toHaveAttribute("aria-expanded", "false");
  });

  it("mode en tanpa teks Indonesia", () => {
    const { container } = wrap("en", <HowToUse id="letter" />);
    expect(container.textContent).toContain("How to use");
    expect(container.textContent).not.toMatch(INDONESIAN);
  });
});

describe("Term", () => {
  it("tap membuka definisi, Escape menutup", () => {
    wrap("id", <Term id="ats" />);
    const btn = screen.getByRole("button", { name: "ATS" });
    fireEvent.click(btn);
    expect(screen.getByRole("dialog", { name: "Arti istilah ATS" }).textContent).toMatch(/Applicant Tracking System/);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mode en", () => {
    wrap("en", <Term id="keyword" />);
    fireEvent.click(screen.getByRole("button", { name: "Keyword" }));
    const d = screen.getByRole("dialog");
    expect(d.textContent).not.toMatch(INDONESIAN);
  });
});

describe("GuidedEmptyState", () => {
  it("menjelaskan isi daftar dan memberi tombol langkah pertama", () => {
    let clicked = 0;
    render(
      <GuidedEmptyState icon="work" title="Kosong" desc="Penjelasan" action={{ label: "Mulai", onClick: () => clicked++ }} secondary={{ label: "Lain", href: "/checker" }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mulai" }));
    expect(clicked).toBe(1);
    expect(screen.getByRole("link", { name: "Lain" })).toHaveAttribute("href", "/checker");
    expect(screen.getByText("Penjelasan")).toBeInTheDocument();
  });
});

describe("/panduan", () => {
  it("render bahasa Indonesia: semua fitur, tombol buka & tur", () => {
    wrap("id", <GuideCenter />);
    expect(screen.getByRole("heading", { level: 1, name: "Panduan memakai AI Career Hub" })).toBeInTheDocument();
    for (const f of GUIDE_FEATURES) expect(document.getElementById(f.id)).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "Buka fitur" })).toHaveLength(GUIDE_FEATURES.length);
    localStorage.setItem(tourKeyFor("tracker"), "1");
    const card = document.getElementById("tracker")!;
    fireEvent.click(card.querySelector("button:last-of-type") as HTMLElement);
    expect(localStorage.getItem(tourKeyFor("tracker"))).toBeNull();
    expect(push).toHaveBeenCalledWith("/tracker");
  });

  it("render bahasa Inggris tanpa teks Indonesia", () => {
    const { container } = wrap("en", <GuideCenter />);
    expect(screen.getByRole("heading", { level: 1, name: "How to use AI Career Hub" })).toBeInTheDocument();
    // Nama fitur & merek (mis. "Career Hub") boleh; kalimat Indonesia tidak.
    expect(container.textContent).not.toMatch(INDONESIAN);
  });
});
