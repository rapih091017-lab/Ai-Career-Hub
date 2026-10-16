/**
 * Penanda format ringan untuk isi artikel.
 *
 * Isi disimpan sebagai teks biasa dengan penanda sederhana, bukan HTML.
 * Alasannya: HTML yang disimpan berarti setiap baris baru harus disanitasi saat
 * ditampilkan, dan satu kesalahan penyanitasi jadi celah XSS. Dengan penanda
 * teks, risiko itu nol, artikel tetap bisa disalin ke editor lain, dan artikel
 * lama yang tidak memakai penanda baru tetap tampil seperti sebelumnya.
 *
 * Didukung:
 * - `# ` / `## ` / `### ` → judul
 * - `**tebal**` → tebal
 * - `1. ` atau `1) ` → daftar bernomor (dimulai dari angka yang diketik)
 * - `- ` / `* ` / `• ` → daftar bullet
 * - `@center ` / `@right ` → paragraf rata tengah atau kanan
 * - `> ` → kutipan
 *
 * Setiap baris adalah satu blok. Editor memakai Enter untuk baris baru, dan
 * penomoran otomatis juga memakai Enter — bukan baris kosong. Kalau artikel
 * hanya dipecah berdasarkan baris kosong, seluruh isi menyatu jadi satu paragraf.
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
  /** Angka awal daftar bernomor, mis. daftar yang dimulai dari "3." */
  start?: number;
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

/** Ambil penanda rata di awal baris, lalu buang dari teksnya. */
function takeAlignment(text: string): { text: string; align?: ArticleBlock["align"] } {
  const lower = text.toLowerCase();
  for (const [prefix, value] of Object.entries(ALIGN_PREFIX)) {
    if (lower.startsWith(prefix)) {
      return { text: text.slice(prefix.length).trim(), align: value };
    }
  }
  return { text };
}

/**
 * Pecah isi artikel menjadi blok.
 *
 * Satu baris = satu blok, kecuali baris-baris daftar yang berurutan yang
 * dikumpulkan jadi satu blok daftar supaya mengetik Enter di tengah daftar
 * tidak memecahnya.
 */
export function parseArticleBlocks(content: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const lines = content.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const ordered = line.match(ORDERED_ITEM_RE);
    const bullet = line.match(BULLET_ITEM_RE);

    if (ordered || bullet) {
      const last = blocks[blocks.length - 1];
      const kind: ListItem["kind"] = ordered ? "ordered" : "bullet";
      const text = (ordered ? ordered[3] : bullet![3]).trim();
      // Baris daftar yang berurutan melanjutkan daftar sebelumnya. Kalau tidak,
      // mengetik Enter di tengah daftar akan memecahnya jadi beberapa daftar.
      if (last?.kind === "list" && last.items?.[0]?.kind === kind) {
        last.items.push({ kind, text });
        continue;
      }
      const block: ArticleBlock = { kind: "list", items: [{ kind, text }] };
      if (ordered) block.start = Number(ordered[2]);
      blocks.push(block);
      continue;
    }

    const quote = line.match(QUOTE_RE);
    if (quote) {
      const { text, align } = takeAlignment(quote[1]);
      blocks.push({ kind: "quote", text, align });
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      const { text, align } = takeAlignment(heading[2].trim());
      blocks.push({ kind: "heading", text, level: heading[1].length as 1 | 2 | 3, align });
      continue;
    }

    const { text, align } = takeAlignment(line);
    blocks.push({ kind: "paragraph", text, align });
  }

  return blocks;
}