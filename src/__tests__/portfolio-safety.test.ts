import { describe, it, expect } from "vitest";
import { esc, safeUrl, isValidSlug } from "@/lib/portfolio-safety";

describe("esc", () => {
  it("meng-escape karakter HTML berbahaya", () => {
    expect(esc(`<script>alert("x")</script>`)).toBe(
      `&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;`,
    );
  });

  it("meng-escape ampersand & apostrophe", () => {
    expect(esc(`Tom & Jerry's`)).toBe(`Tom &amp; Jerry&#39;s`);
  });

  it("menangani null/undefined dengan aman", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
    expect(esc(0)).toBe("0");
  });
});

describe("safeUrl", () => {
  it("memblokir javascript: URL", () => {
    expect(safeUrl('javascript:alert(1)')).toBe("");
  });

  it("memblokir protokol aneh lain", () => {
    expect(safeUrl("data:text/html,<script>1</script>")).toBe("");
    expect(safeUrl("vbscript:msgbox(1)")).toBe("");
  });

  it("mengizinkan http/https/mailto/tel", () => {
    expect(safeUrl("https://github.com/user")).toBe("https://github.com/user");
    expect(safeUrl("http://example.com")).toBe("http://example.com");
    expect(safeUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(safeUrl("tel:+62812")).toBe("tel:+62812");
  });

  it("menambahkan https:// untuk domain tanpa protokol", () => {
    expect(safeUrl("linkedin.com/in/teguh")).toBe("https://linkedin.com/in/teguh");
  });

  it("meng-escape nilai yang lolos validasi", () => {
    expect(safeUrl(`https://a.com/?q="><script>`)).toBe(`https://a.com/?q=&quot;&gt;&lt;script&gt;`);
  });
});

describe("isValidSlug", () => {
  it("menerima slug valid", () => {
    expect(isValidSlug("teguh-surya")).toBe(true);
    expect(isValidSlug("teguh123")).toBe(true);
  });

  it("menolak slug terlalu pendek / karakter ilegal", () => {
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("Teguh")).toBe(false); // huruf besar
    expect(isValidSlug("teguh_surya")).toBe(false); // underscore
    expect(isValidSlug("teguh.surya")).toBe(false); // titik
    expect(isValidSlug("1")).toBe(false);
  });

  it("menolak kata terlarang", () => {
    expect(isValidSlug("admin")).toBe(false);
    expect(isValidSlug("dashboard")).toBe(false);
    expect(isValidSlug("p")).toBe(false);
    expect(isValidSlug("pricing")).toBe(false);
  });
});
