/**
 * Perilaku daftar otomatis untuk textarea deskripsi.
 *
 * Fungsi murni tanpa DOM supaya bisa diuji langsung: dari teks sebelum cursor,
 * tentukan apa yang harus disisipkan saat pengguna menekan Enter.
 *
 * Yang ditangani:
 * - `1.` lalu Enter -> baris berikutnya jadi `2.`
 * - `- ` atau `* ` lalu Enter -> baris berikutnya jadi `- `
 * - `a.` / `(1)` -> melanjutkan pola huruf/angka yang sedang berjalan
 * - Enter di baris yang hanya berisi penanda -> keluar dari daftar
 * - Enter dua kali di baris kosong -> keluar dari daftar
 * - Indentasi diawalkan spasi ikut dipertahankan
 */

export interface ListContinuation {
  /** Teks yang disisipkan, tanpa baris baru. `null` berarti tidak ada apa-apa. */
  insert: string;
  /** Berapa karakter carets harus digeser ke kanan dari posisi akhir insert. */
  caretOffset: number;
  /** True kalau baris baru memang Keluar dari daftar. */
  endsList: boolean;
}

/** Penanda yang hanya berisi nomornya, tanpa teks: "3." atau "1)". */
const ORDERED_RE = /^(\s*)(\d{1,3})([.)])\s*$/;
/** Penanda dengan teks: "1.ografia" -> "2. " */
const ORDERED_WITH_TEXT_RE = /^(\s*)(\d{1,3})([.)])\s+\S/;
/** Penanda huruf tanpa teks: "a. " */
const LETTER_RE = /^(\s*)([a-zA-Z])([.)])\s*$/;
/** Penanda huruf dengan teks: "a. alpha" -> "b. " */
const LETTER_WITH_TEXT_RE = /^(\s*)([a-zA-Z])([.)])\s+\S/;
/** Penanda bullet tanpa teks: "- " */
const BULLET_RE = /^(\s*)([-*•])\s*$/;
/** Penanda bullet dengan teks: "- alpha" -> "- " */
const BULLET_WITH_TEXT_RE = /^(\s*)([-*•])\s+\S/;
/** Penanda angka dalam kurung tanpa teks: "(1) " */
const PAREN_NUMBER_RE = /^(\s*)\((\d{1,3})\)\s*$/;
/** Penanda angka dalam kurung dengan teks: "(1) alpha" -> "(2) " */
const PAREN_NUMBER_WITH_TEXT_RE = /^(\s*)\((\d{1,3})\)\s+\S/;

const NO_CHANGE: ListContinuation = { insert: "", caretOffset: 0, endsList: false };

function nextLetter(letter: string): string {
  // "z" tidak punya lanjutan wajar, jadi berhenti di z.
  const code = letter.toLowerCase().charCodeAt(0);
  if (code >= 122 /* z */) return letter;
  return String.fromCharCode(code + 1);
}

export function listContinuation(textBeforeCursor: string): ListContinuation {
  // Hanya baris terakhir yang dihitung: menekan Enter di tengah daftar
  // tidak boleh ikut memperbarui penomoran.
  const lineStart = textBeforeCursor.lastIndexOf("\n") + 1;
  const line = textBeforeCursor.slice(lineStart);
  const indent = (line.match(/^\s*/) ?? [""])[0];

  // Baris penanda tanpa teks: mengetik "1." lalu Enter berarti baris ini
  // selesai, jadi baris berikutnya justru keluar dari daftar.
  if (ORDERED_RE.test(line) || LETTER_RE.test(line) || BULLET_RE.test(line) || PAREN_NUMBER_RE.test(line)) {
    return { insert: "", caretOffset: 0, endsList: true };
  }

  const ordered = line.match(ORDERED_WITH_TEXT_RE);
  if (ordered) {
    const [, lead, number, delimiter] = ordered;
    const next = String(Number(number) + 1);
    return { insert: `\n${lead}${next}${delimiter} `, caretOffset: lead.length + next.length + delimiter.length + 1, endsList: false };
  }

  const letter = line.match(LETTER_WITH_TEXT_RE);
  if (letter) {
    const [, lead, char, delimiter] = letter;
    const next = nextLetter(char);
    return { insert: `\n${lead}${next}${delimiter} `, caretOffset: lead.length + next.length + delimiter.length + 1, endsList: false };
  }

  const parenNumber = line.match(PAREN_NUMBER_WITH_TEXT_RE);
  if (parenNumber) {
    const [, lead, number] = parenNumber;
    const next = String(Number(number) + 1);
    return { insert: `\n${lead}(${next}) `, caretOffset: lead.length + next.length + 3, endsList: false };
  }

  const bullet = line.match(BULLET_WITH_TEXT_RE);
  if (bullet) {
    const [, lead] = bullet;
    return { insert: `\n${lead}- `, caretOffset: lead.length + 2, endsList: false };
  }

  return NO_CHANGE;
}

/**
 * Perilaku tombol Backspace: menghapus penanda daftar sendirinya membuat
 * baris kembali jadi teks biasa, bukan sekadar spasi yang tidak terlihat.
 */
export function backspaceClearsListMarker(textBeforeCursor: string): boolean {
  const lineStart = textBeforeCursor.lastIndexOf("\n") + 1;
  const line = textBeforeCursor.slice(lineStart);
  return (
    ORDERED_RE.test(line) ||
    LETTER_RE.test(line) ||
    BULLET_RE.test(line) ||
    PAREN_NUMBER_RE.test(line)
  );
}