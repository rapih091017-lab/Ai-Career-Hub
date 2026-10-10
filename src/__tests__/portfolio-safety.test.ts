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

  it("menolak mailto dengan injeksi header CRLF yang ter-percent-encode", () => {
    expect(safeUrl("mailto:a@b?subject=x%0D%0ABcc:korban@example.com")).toBe("");
    expect(safeUrl("mailto:a@b?subject=x%0d%0aBcc:korban@example.com")).toBe("");
    expect(safeUrl("mailto:a@b?body=%0ANama:%20Korban")).toBe("");
  });

  it("tetap menerima query mailto yang sah", () => {
    expect(safeUrl("mailto:a@b.com?subject=Hello%20Dunia")).toBe(
      "mailto:a@b.com?subject=Hello%20Dunia",
    );
  });

  it("tetap menerima path aset lokal yang sah", () => {
    const asset = "/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f";
    expect(safeUrl(asset)).toBe(asset);
  });
});

/**
 * Non-string runtime tidak boleh membuat modul ini melempar. `esc()` sudah
 * menerima `unknown`; `safeUrl` harus punya jaminan yang sama supaya pemanggil
 * yang lupa memvalidasi (mis. baris DB lama) dapat hasil "", bukan exception.
 */
describe("safeUrl / safeUrlUnescaped terhadap input non-string", () => {
  const nonStrings: [string, unknown][] = [
    ["undefined", undefined],
    ["null", null],
    ["angka", 42],
    ["boolean", true],
    ["objek", { href: "https://example.com" }],
    ["array", ["https://example.com"]],
  ];

  it.each(nonStrings)("safeUrl mengembalikan string kosong untuk %s", (_label, value) => {
    expect(() => safeUrl(value)).not.toThrow();
    expect(safeUrl(value)).toBe("");
  });

  it.each(nonStrings)("safeUrlUnescaped mengembalikan string kosong untuk %s", (_label, value) => {
    expect(() => safeUrlUnescaped(value)).not.toThrow();
    expect(safeUrlUnescaped(value)).toBe("");
  });
});

/**
 * Invarian yang dijaga wave perbaikan ini: kedua fungsi hanya berbeda di
 * escaping, BUKAN di keputusan terima/tolak. Uji paritas harus menutup kedua
 * sisi — input yang diterima maupun input yang ditolak, di setiap kelas
 * penolakan — kalau tidak ia hanya menguji `"" === ""`.
 */
const PARITY_CORPUS: [string, unknown][] = [
  // Diterima
  ["https", "https://github.com/teguh"],
  ["http", "http://example.com"],
  ["query ber-&", "https://example.com/p?utm_source=portofolio&utm_medium=link"],
  ["karakter HTML di URL sah", 'https://a.com/?q="><script>'],
  ["path relatif", "/api/portfolio/assets/abc"],
  ["path relatif + query", "/api/portfolio/assets/abc?w=200&h=200"],
  ["path relatif uuid", "/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f"],
  ["root", "/"],
  ["domain telanjang + path", "linkedin.com/in/teguh"],
  ["domain telanjang", "example.com"],
  ["mailto", "mailto:teguh@example.com"],
  ["mailto ber-encode", "mailto:a@b.com?subject=Hello%20Dunia"],
  ["tel", "tel:+628123456789"],
  ["huruf besar skema", "HTTPS://EXAMPLE.COM/Portofolio"],
  ["spasi tepi dipangkas", "   https://example.com/spasi   "],
  // Ditolak
  ["javascript:", "javascript:alert(1)"],
  ["data:text/html", "data:text/html,<script>1</script>"],
  ["data:image/png", "data:image/png;base64,iVBORw0KGgo="],
  ["vbscript:", "vbscript:msgbox(1)"],
  ["file:", "file:///etc/passwd"],
  ["mailto CRLF literal", "mailto:a@b.com\r\nBcc: korban@example.com"],
  ["mailto CRLF ter-encode", "mailto:a@b?subject=x%0D%0ABcc:y@z"],
  ["protocol-relative", "//evil.com"],
  ["protocol-relative + path", "//evil.com/path"],
  ["backslash", "/\\evil.com"],
  ["tab", "/\t/evil.com"],
  ["newline", "/\n/evil.com"],
  ["CRLF", "/\r\n/evil.com"],
  ["path relatif tanpa slash", "api/portfolio/assets/abc"],
  ["path relatif dengan dua slash", "//"],
  ["string kosong", ""],
  ["spasi saja", "   "],
  // Non-string
  ["undefined", undefined],
  ["null", null],
  ["angka", 42],
  ["objek", { href: "https://example.com" }],
];

describe("paritas safeUrl vs safeUrlUnescaped", () => {
  it.each(PARITY_CORPUS)(
    "%s: kedua fungsi sepakat terima atau menolak",
    (_label, value) => {
      expect(safeUrl(value) === "").toBe(safeUrlUnescaped(value) === "");
    },
  );

  it("korpus paritas memuat kedua sisi, jangan hanya yang ditolak", () => {
    const accepted = PARITY_CORPUS.filter(([, v]) => safeUrlUnescaped(v) !== "");
    const rejected = PARITY_CORPUS.filter(([, v]) => safeUrlUnescaped(v) === "");
    expect(accepted.length).toBeGreaterThan(0);
    expect(rejected.length).toBeGreaterThan(0);
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

  it.each([
    ["javascript:", "javascript:alert(1)"],
    ["data:text/html", "data:text/html,<script>1</script>"],
    ["data:image/svg+xml", "data:image/svg+xml;base64,PHN2Zz4="],
    ["vbscript:", "vbscript:msgbox(1)"],
    ["mailto CRLF ter-encode", "mailto:a@b?subject=x%0D%0ABcc:y@z"],
  ])("menolak skema terlarang %s seperti safeUrl", (_label, payload) => {
    expect(safeUrlUnescaped(payload)).toBe("");
    expect(safeUrlUnescaped(payload)).toBe(safeUrl(payload));
  });

  it.each([
    ["protocol-relative", "//evil.com"],
    ["protocol-relative + path", "//evil.com/path"],
    ["backslash", "/\\evil.com"],
    ["tab", "/\t/evil.com"],
    ["newline", "/\n/evil.com"],
    ["CRLF", "/\r\n/evil.com"],
  ])("menolak %s seperti safeUrl", (_label, payload) => {
    expect(safeUrlUnescaped(payload)).toBe("");
    expect(safeUrlUnescaped(payload)).toBe(safeUrl(payload));
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
