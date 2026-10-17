import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CareerHubPostForm from "@/components/career-hub/CareerHubPostForm";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Admin harus bisa tahu apakah artikelnya sudah aman di server.
 *
 * Toast saja tidak cukup karena hilang dalam beberapa detik, dan form yang
 * tidak berubah tampilan setelah disimpan membuat admin tidak tahu apakah
 * aksi tadi berhasil. Test ini menutup keduanya: toast muncul, dan baris
 * status berubah sesuai keadaan isian.
 */

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const POST = {
  id: "artikel-1",
  title: "CV Kamu Tidak Dibuang Robot",
  slug: "cv-ats-yang-sebenarnya",
  excerpt: "Ringkasan singkat.",
  content: "Isi artikel.",
  category: "cv-ats",
  tags: ["ATS", "CV"],
  coverImageUrl: null,
  status: "published",
};

function renderForm(postId?: string) {
  return render(
    <ToastProvider>
      <CareerHubPostForm postId={postId} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  push.mockClear();
  vi.restoreAllMocks();
});

describe("form artikel Career Hub memberitahu hasil simpan", () => {
  it("artikel baru dimulai dengan stating belum disimpan", async () => {
    renderForm();
    expect(await screen.findByText(/belum disimpan/i)).toBeInTheDocument();
  });

  it("artikel yang dimuat dinyatakan sudah tersimpan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [POST] }) }),
    );
    renderForm("artikel-1");
    expect(await screen.findByText(/semua perubahan tersimpan/i)).toBeInTheDocument();
  });

  it("menyimpan draf menampilkan toast dan mengubah baris status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [POST] }) }),
    );
    renderForm("artikel-1");
    await screen.findByText(/semua perubahan tersimpan/i);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ post: { ...POST, status: "draft" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    fireEvent.click(screen.getByRole("button", { name: /simpan draf/i }));

    await waitFor(() => expect(screen.getByText("Draf disimpan.")).toBeInTheDocument());
    expect(await screen.findByText(/semua perubahan tersimpan sebagai draf/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("menerbitkan artikel baru memberi tahu artikel tayang dan membuka halamannya", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ post: { ...POST, id: "baru-1" } }) });
    vi.stubGlobal("fetch", fetchMock);
    renderForm();

    await screen.findByText(/belum disimpan/i);
    fireEvent.click(screen.getByRole("button", { name: /terbitkan/i }));

    await waitFor(() => expect(screen.getByText("Artikel diterbitkan.")).toBeInTheDocument());
    expect(push).toHaveBeenCalledWith("/admin/career-hub/baru-1");
  });

  it("mengedit artikel yang sudah tayang menyebut perubahan, bukan tayang baru", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [POST] }) }),
    );
    renderForm("artikel-1");
    await screen.findByText(/semua perubahan tersimpan/i);

    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ post: POST }) });
    vi.stubGlobal("fetch", fetchMock);

    fireEvent.click(screen.getByRole("button", { name: /terbitkan/i }));
    await waitFor(() => expect(screen.getByText("Perubahan disimpan.")).toBeInTheDocument());
  });

  it("mengetik lagi setelah simpan langsung menyatakan belum tersimpan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [POST] }) }),
    );
    renderForm("artikel-1");
    await screen.findByText(/semua perubahan tersimpan/i);

    fireEvent.change(screen.getByLabelText(/^judul/i), { target: { value: "Judul revisi" } });
    expect(await screen.findByText(/ada perubahan yang belum disimpan/i)).toBeInTheDocument();
  });

  it("kegagalan simpan tetap menampilkan pesan error, bukan toast sukses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [POST] }) }),
    );
    renderForm("artikel-1");
    await screen.findByText(/semua perubahan tersimpan/i);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Kolom "category" tidak valid.' }),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /terbitkan/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent('Kolom "category" tidak valid.');
    expect(screen.queryByText("Artikel diterbitkan.")).not.toBeInTheDocument();
  });
});