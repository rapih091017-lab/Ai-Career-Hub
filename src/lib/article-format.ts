/**
 * Penanda format ringan untuk isi artikel.
 *
 * Isi disimpan sebagai teks biasa dengan penanda sederhana, bukan HTML.
 * Alasannya: HTML yang disimpan berarti setiap baris baru harus disanitasi saat
 * ditampilkan, dan satu kesalahan penyanitasi jadi celah XSS. Dengan penanda
 * teks,risiko itu nol, artikel tetap bisa disalin ke editor lain, dan artikel
 * lama yang tidak memakai penanda baru tetap tampil seperti sebelumnya.
 *
 * Didukung:
 * - `## Judul` dan `# Judul` → judul
 * - `**tebal**` → tebal
 * - `1. ` / `2. ` berurutan → daftar bernomor
 * - `- ` atau `* ` → daftar bullet
 * - `@center ` / `@right ` → paragraf rata tengah atau kanan
 * - `> ` → kutipan
 */

export type BlockKind = "heading" | "paragraph" | "quote" | "list";

export interface ListItem {
  kind: "ordered" | "bullet";
  text: string;
}

export interface ArticleBlock {
  kind: BlockKind;
  /** Isi paragraf, sudah dipangkas dari penanda format (tanpa `**` dsb). */
  text?: string;
  /** Baris kapital untuk pengurutan manual. */
  level?: 1 | 2 | 3;
  /** Rata paragraf. */
  align?: "left" | "center" | "right";
  /** Isi daftar bernomor/bullet. */
  items?: ListItem[];
}

const ALIGN_PREFIX: Record<string, ArticleBlock["align"]> = {
  "@center": "center",
  "@right": "right",
};

const ORDERED_ITEM_RE = /^(\s*)(\d{1,3})[.)]\s+(.*)$/;
const BULLET_ITEM_RE = /^(\s*)([-*•])\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const HEADING_RE = /^(#{1,3})\s+(.*)$/;

export interface InlineToken {
  bold: boolean;
  value: string;
}

/**
 * Pecah `**teks tebal**` jadi potongan biasa dan potongan tebal.
 *
 * Sengaja tanpa JSX supaya modul ini murni dan bisa diuji tanpa React.
 */
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ bold: false, value: text.slice(lastIndex, match.index) });
    }
    tokens.push({ bold: true, value: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ bold: false, value: text.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Pecah isi artikel menjadi blok.
 *
 * Baris kosong memisahkan paragraf. Baris berurutan yang diawali `1.` atau
 * `-` dikumpulkan menjadi satu blok daftar, jadi mengetik Enter di tengah
 * daftar tidak memecahnya.
 */
export function parseArticleBlocks(content: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const paragraphs = content.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    const rawLines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);
    if (rawLines.length === 0) continue;

    // Kumpulkan daftar bernomor/bullet yang berurutan.
    const items: ListItem[] = [];
    let remaining: string[] = [];
    let listKind: ListItem["kind"] | null = null;

    for (const line of rawLines) {
      const ordered = line.match(ORDERED_ITEM_RE);
      const bullet = line.match(BULLET_ITEM_RE);
      if (ordered) {
        if (listKind && listKind !== "ordered") {
          blocks.push({ kind: "list", items });
          items.length = 0;
        }
        listKind = "ordered";
        items.push({ kind: "ordered", text: ordered[3] });
        continue;
      }
      if (bullet) {
        if (listKind && listKind !== "bullet") {
          blocks.push({ kind: "list", items });
          items.length = 0;
        }
        listKind = "bullet";
        items.push({ kind: "bullet", text: bullet[3] });
        continue;
      }
      // Baris biasa: tutup daftar yang sedang berjalan.
      if (items.length > 0) {
        blocks.push({ kind: "list", items });
        items.length = 0;
        listKind = null;
      }
      remaining.push(line);
    }
    if (items.length > 0) blocks.push({ kind: "list", items });

    // Sisa baris diperlakukan sebagai satu blok (judul / kutipan / paragraf).
    if (remaining.length === 0) continue;
    const first = remaining[0];
    const heading = first.match(HEADING_RE);
    const quote = first.match(QUOTE_RE);

    let text = remaining.join(" ");
    let align: ArticleBlock["align"] | undefined;
    // Rata paragraf ditulis sebagai penanda di awal baris pertama.
    for (const [prefix, value] of Object.entries(ALIGN_PREFIX)) {
      if (text.toLowerCase().startsWith(prefix)) {
        align = value;
        text = text.slice(prefix.length).trim();
        break;
      }
    }

    if (heading) {
      blocks.push({
        kind: "heading",
        text: heading[2].trim(),
        level: heading[1].length as 1 | 2 | 3,
        align,
      });
    } else if (quote) {
      blocks.push({ kind: "quote", text: quote[1].trim(), align });
    } else {
      blocks.push({ kind: "paragraph", text, align });
    }
  }

  return blocks;
}