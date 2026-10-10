import { describe, it, expect } from "vitest";
import { esc, safeUrl, safeUrlUnescaped, isValidSlug } from "@/lib/portfolio-safety";

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

  it("menerima path relatif yang diawali slash", () => {
    expect(safeUrl("/api/portfolio/assets/abc")).toBe("/api/portfolio/assets/abc");
    expect(safeUrl("/")).toBe("/");
  });

  it("menolak path relatif tanpa slash di depan", () => {
    expect(safeUrl("api/portfolio/assets/abc")).toBe("");
  });

  it("menolak URL protocol-relative yang mencuri origin", () => {
    expect(safeUrl("//evil.com")).toBe("");
    expect(safeUrl("//evil.com/path")).toBe("");
  });

  it("menolak backslash yang di-normalisasi browser jadi slash", () => {
    expect(safeUrl("/\\evil.com")).toBe("");
    expect(safeUrl("/\\evil.com/path")).toBe("");
  });

  it("menolak karakter kontrol yang di-strip browser jadi slash", () => {
    expect(safeUrl("/\t/evil.com")).toBe("");
    expect(safeUrl("/\n/evil.com")).toBe("");
    expect(safeUrl("/\r\n/evil.com")).toBe("");
  });

  it("tetap menerima path aset lokal yang sah", () => {
    const asset = "/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f";
    expect(safeUrl(asset)).toBe(asset);
  });
});

describe("safeUrlUnescaped", () => {
  it("mengembalikan URL apa adanya untuk input sah ber-&", () => {
    const url = "https://example.com/p?utm_source=portofolio&utm_medium=link";
    expect(safeUrlUnescaped(url)).toBe(url);
  });

  it("tidak meng-escape tanda &, berbeda dari safeUrl", () => {
    const url = "/api/portfolio/assets/abc?w=200&h=200";
    expect(safeUrlUnescaped(url)).toBe(url);
    expect(safeUrl(url)).toBe("/api/portfolio/assets/abc?w=200&amp;h=200");
  });

  it("tidak meng-escape karakter HTML di URL yang lolos validasi", () => {
    const url = `https://a.com/?q="><script>`;
    expect(safeUrlUnescaped(url)).toBe(url);
    expect(safeUrl(url)).toBe(`https://a.com/?q=&quot;&gt;&lt;script&gt;`);
  });

  it("tetap memberi prefiks https pada domain telanjang", () => {
    expect(safeUrlUnescaped("linkedin.com/in/teguh")).toBe("https://linkedin.com/in/teguh");
  });

  it("menolak skema terlarang sama seperti safeUrl", () => {
    for (const payload of ["javascript:alert(1)", "data:text/html,<script>1</script>", "vbscript:msgbox(1)"]) {
      expect(safeUrlUnescaped(payload)).toBe("");
      expect(safeUrlUnescaped(payload)).toBe(safeUrl(payload));
    }
  });

  it("menolak protocol-relative, backslash, dan karakter kontrol seperti safeUrl", () => {
    const payloads = [
      "//evil.com",
      "//evil.com/path",
      "/\\evil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r\n/evil.com",
    ];
    for (const payload of payloads) {
      expect(safeUrlUnescaped(payload)).toBe("");
      expect(safeUrlUnescaped(payload)).toBe(safeUrl(payload));
    }
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
