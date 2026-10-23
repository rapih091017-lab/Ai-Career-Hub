import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FeaturedArticle from "@/components/landing/FeaturedArticle";
import { LanguageProvider } from "@/lib/i18n";

const FEATURED_SLUG = "pertanyaan-wawancara-kerja-star-method";

const POST = {
  slug: FEATURED_SLUG,
  title: "Pertanyaan Wawancara Kerja dan Cara Menjawabnya dengan STAR Method",
  excerpt: "Jawaban interview yang kuat punya situasi, tugas, aksi, dan hasil.",
  category: "interview",
  tags: ["interview", "star"],
  publishedAt: "2026-10-12T00:00:00.000Z",
};

/** Ganti fetch global dengan balasan API publik Career Hub. */
function mockFetch(payload: unknown) {
  const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) } as Response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderSection() {
  return render(
    <LanguageProvider>
      <FeaturedArticle />
    </LanguageProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("FeaturedArticle", () => {
  it("menampilkan artikel interview yang dipatok", async () => {
    const fetchMock = mockFetch({ post: POST });
    const { container } = renderSection();

    await waitFor(() => expect(screen.getByText(POST.title)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(`/api/career-hub/${FEATURED_SLUG}`);
    expect(screen.getByText(POST.excerpt)).toBeTruthy();
    expect(screen.getByText("Interview")).toBeTruthy();
    expect(screen.getByRole("link", { name: /baca artikelnya/i }).getAttribute("href")).toBe(
      `/career-hub/${POST.slug}`,
    );
    // Kartu ini lahir setelah fetch, sedangkan RevealOnScroll hanya memindai
    // [data-reveal] sekali saat mount. Kalau atribut itu dipasang lagi,
    // kartunya tertinggal di opacity 0 dan section-nya tampak kosong.
    expect(container.querySelector("[data-reveal]")).toBeNull();
  });

  it("tidak merender section saat artikel tidak ditemukan", async () => {
    mockFetch({});
    const { container } = renderSection();

    await waitFor(() => expect(container.innerHTML).toBe(""));
  });

  it("tidak merender section saat API gagal", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false } as Response)));
    const { container } = renderSection();

    await waitFor(() => expect(container.innerHTML).toBe(""));
  });
});
