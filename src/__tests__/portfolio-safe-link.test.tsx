import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SafeLink, SafeImg } from "@/components/portfolio/render/SafeLink";

describe("SafeLink", () => {
  it("merender tautan https tanpa perubahan", () => {
    render(
      <SafeLink href="https://github.com/teguh" mode="static">Repo</SafeLink>,
    );
    expect(screen.getByRole("link", { name: "Repo" })).toHaveAttribute(
      "href",
      "https://github.com/teguh",
    );
  });

  it("tidak menghasilkan href untuk javascript: di mode static", () => {
    render(<SafeLink href="javascript:alert(1)" mode="static">Jahat</SafeLink>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Jahat")).toBeInTheDocument();
  });

  it("memberi prefiks https pada domain telanjang", () => {
    render(
      <SafeLink href="linkedin.com/in/teguh" mode="static">LinkedIn</SafeLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://linkedin.com/in/teguh",
    );
  });

  it("memperingatkan editor saat tautan ditolak", () => {
    render(<SafeLink href="data:text/html,x" mode="editor">Fail</SafeLink>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/tautan ditolak/i)).toBeInTheDocument();
  });

  it("membuka tautan eksternal di tab baru dengan rel aman", () => {
    render(
      <SafeLink href="https://example.com" mode="static" target="_blank">Ext</SafeLink>,
    );
    const a = screen.getByRole("link");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("merender mailto dan tel", () => {
    render(
      <>
        <SafeLink href="mailto:teguh@example.com" mode="static">Mail</SafeLink>
        <SafeLink href="tel:+628123456789" mode="static">Tel</SafeLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "Mail" })).toHaveAttribute(
      "href",
      "mailto:teguh@example.com",
    );
    expect(screen.getByRole("link", { name: "Tel" })).toHaveAttribute(
      "href",
      "tel:+628123456789",
    );
  });

  it("tidak meng-escape ganda tanda & pada query string", () => {
    render(
      <SafeLink
        href="https://example.com/p?utm_source=portofolio&utm_medium=link"
        mode="static"
      >
        Kampanye</SafeLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://example.com/p?utm_source=portofolio&utm_medium=link",
    );
  });

  it("menyerialkan atribut href dengan satu tingkat escape", () => {
    const { container } = render(
      <SafeLink href="https://example.com/p?a=1&b=2" mode="static">Sekali</SafeLink>,
    );
    const html = container.innerHTML;
    expect(html).toContain("&amp;");
    expect(html).not.toContain("&amp;amp;");
  });

  it("memangkas spasi di sekitar URL", () => {
    render(
      <SafeLink href="   https://example.com/spasi   " mode="static">Spasi</SafeLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/spasi");
  });

  it("mempertahankan huruf besar pada skema dan host", () => {
    render(
      <SafeLink href="HTTPS://EXAMPLE.COM/Portofolio" mode="static">Upper</SafeLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "HTTPS://EXAMPLE.COM/Portofolio",
    );
  });

  it("memberi rel aman pada tautan relatif yang dibuka di tab baru", () => {
    render(
      <SafeLink href="/p/teguh" mode="static" target="_blank">Relatif</SafeLink>,
    );
    const a = screen.getByRole("link");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("memberi rel aman pada tautan eksternal tanpa target eksplisit", () => {
    render(<SafeLink href="https://example.com" mode="static">Eksternal</SafeLink>);
    expect(screen.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("menolak mailto dengan injeksi header CRLF", () => {
    render(
      <SafeLink href="mailto:teguh@example.com\r\nBcc: korban@example.com" mode="static">
        Injeksi</SafeLink>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Injeksi")).toBeInTheDocument();
  });

  it("menolak bypass relative-url dengan backslash, tab, dan protocol-relative", () => {
    for (const payload of ["/\\evil.com", "/\t/evil.com", "//evil.com"]) {
      const { unmount } = render(
        <SafeLink href={payload} mode="static">Bypass</SafeLink>,
      );
      expect(screen.queryByRole("link")).toBeNull();
      unmount();
    }
  });

  it("tidak crash saat href undefined walau tipenya string", () => {
    render(
      <SafeLink href={undefined as unknown as string} mode="static">Kosong</SafeLink>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Kosong")).toBeInTheDocument();
  });

  it("menandai tautan ditolak dengan token desain, tanpa warna atau rounded literal", () => {
    const { container } = render(
      <SafeLink href="vbscript:msgbox(1)" mode="editor">VBS</SafeLink>,
    );
    const badge = screen.getByText(/tautan ditolak/i);
    expect(badge.className).toContain("bg-error-container");
    expect(badge.className).toContain("text-on-error-container");
    expect(container.innerHTML).not.toMatch(/rounded|red-\d|#[0-9a-f]{3,6}/i);
  });
});

describe("SafeImg", () => {
  it("merender gambar yang diizinkan", () => {
    render(
      <SafeImg src="/api/portfolio/assets/abc" mode="static" alt="Foto Teguh" width={200} height={200} />,
    );
    expect(screen.getByAltText("Foto Teguh")).toBeInTheDocument();
  });

  it("mengganti gambar dengan skema terlarang menjadi placeholder", () => {
    render(<SafeImg src="javascript:alert(1)" mode="static" alt="X" width={100} height={100} />);
    expect(screen.queryByAltText("X")).toBeNull();
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });

  it("menampilkan placeholder saat src kosong", () => {
    render(<SafeImg src="" mode="static" alt="Kosong" width={10} height={10} />);
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });

  it("menerima data URI gambar raster untuk export mandiri", () => {
    const src = "data:image/png;base64,iVBORw0KGgo=";
    render(<SafeImg src={src} mode="static" alt="Inlined" />);
    expect(screen.getByAltText("Inlined")).toHaveAttribute("src", src);
  });

  it("menolak data URI svg karena bisa membawa skrip", () => {
    render(
      <SafeImg
        src="data:image/svg+xml,<svg onload='alert(1)'/>"
        mode="static"
        alt="Svg"
        width={50}
        height={50}
      />,
    );
    expect(screen.queryByAltText("Svg")).toBeNull();
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });

  it("menolak data URI non-gambar", () => {
    render(
      <SafeImg src="data:text/html;base64,PHNjcmlwdD4=" mode="static" alt="Html" />,
    );
    expect(screen.queryByAltText("Html")).toBeNull();
  });

  it("tidak meng-escape ganda tanda & pada src query", () => {
    render(
      <SafeImg src="/api/portfolio/assets/abc?w=200&h=200" mode="static" alt="Query" />,
    );
    expect(screen.getByAltText("Query")).toHaveAttribute(
      "src",
      "/api/portfolio/assets/abc?w=200&h=200",
    );
  });

  it("menampilkan placeholder di mode editor juga", () => {
    render(<SafeImg src="vbscript:x" mode="editor" alt="Edit" />);
    expect(screen.queryByAltText("Edit")).toBeNull();
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });

  it("tidak crash saat src undefined walau tipenya string", () => {
    render(<SafeImg src={undefined as unknown as string} mode="static" alt="Undefined" />);
    expect(screen.queryByAltText("Undefined")).toBeNull();
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });
});