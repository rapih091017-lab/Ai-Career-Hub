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