/**
 * Konstanta program affiliate (client & server safe).
 * Aturan main: user MENDAFTAR dulu, admin menyetujui, baru link aktif.
 * Link /r/<kode> menanam cookie selama 25 hari; saat user yang direfer
 * pertama kali berhasil membayar, tercatat satu komisi sebesar persentase
 * di bawah dari nilai pembayaran. Payout dikelola manual dari /admin/affiliate.
 */

export const REFERRAL_COOKIE = "ach_ref";
export const REFERRAL_COOKIE_DAYS = 25;

/** Persentase komisi dari nilai pembayaran pertama user yang direfer.
 * Nominal rupiah disnapshot per konversi, jadi mengubah ini tidak
 * mengubah histori lama. */
export const AFFILIATE_REWARD_PERCENT = 10;

/** Masa tunggu sebelum komisi boleh dicairkan, untuk menghindari kasus
 * refund/chargeback dari pembayaran yang sudah tercatat. */
export const PAYOUT_MIN_AGE_DAYS = 14;

/** Kode dibuat dari alfabet tanpa karakter ambigu (tanpa 0/O/1/l/i). */
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateAffiliateCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return code;
}

export function isValidAffiliateCode(code: string): boolean {
  return /^[a-z0-9]{4,30}$/.test(code);
}

/** Bank & e-wallet populer di Indonesia untuk pencairan komisi.
 * Disimpan sebagai label di database supaya admin langsung paham tanpa
 * menerjemahkan kode. */
export const BANK_OPTIONS = [
  { value: "bca", label: "BCA" },
  { value: "mandiri", label: "Mandiri" },
  { value: "bri", label: "BRI" },
  { value: "bni", label: "BNI" },
  { value: "bsi", label: "BSI (Bank Syariah Indonesia)" },
  { value: "cimb", label: "CIMB Niaga" },
  { value: "permata", label: "Permata" },
  { value: "danamon", label: "Danamon" },
  { value: "btn", label: "BTN" },
  { value: "ocbc", label: "OCBC" },
  { value: "maybank", label: "Maybank" },
  { value: "bjb", label: "Bank BJB" },
  { value: "jateng", label: "Bank Jateng" },
  { value: "bpd-diy", label: "Bank BPD DIY" },
  { value: "gopay", label: "GoPay" },
  { value: "ovo", label: "OVO" },
  { value: "dana", label: "DANA" },
  { value: "shopeepay", label: "ShopeePay" },
  { value: "linkaja", label: "LinkAja" },
] as const;

export function isValidBank(value: unknown): value is string {
  return typeof value === "string" && BANK_OPTIONS.some((bank) => bank.value === value);
}

/** Label bank dari kode pilihan (untuk disimpan ke database). */
export function bankLabelFromValue(value: string): string {
  return BANK_OPTIONS.find((bank) => bank.value === value)?.label ?? value;
}

/** Nomor rekening: hanya digit, 8 sampai 20 karakter (spasi/strip diabaikan). */
export function normalizeAccountNumber(value: string): string {
  return value.replace(/[\s-]/g, "");
}
export function isValidAccountNumber(value: unknown): value is string {
  return typeof value === "string" && /^\d{8,20}$/.test(normalizeAccountNumber(value));
}

/** Nama pemilik rekening: huruf, spasi, titik, apostrof, dan tanda hubung. */
export function isValidAccountHolder(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z\u00C0-\u024F.'\- ]{3,100}$/.test(value.trim());
}