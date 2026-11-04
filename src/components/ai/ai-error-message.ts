/**
 * Ubah respons gagal dari /api/ai/polish dan /api/ai/grammar jadi kalimat
 * untuk toast. Route membalas { error: KODE, message: kalimat }.
 */
export async function aiErrorMessage(response: Response, fallback: string): Promise<string> {
  let message: string | undefined;
  try {
    const data = (await response.json()) as { message?: unknown };
    if (typeof data.message === "string" && data.message.trim()) message = data.message;
  } catch {
    // Body bukan JSON: pakai kalimat per status di bawah.
  }

  switch (response.status) {
    case 401:
      return "Sesi login kamu sudah habis. Masuk lagi, lalu coba sekali lagi.";
    case 429:
      return message ?? "Terlalu banyak permintaan. Tunggu satu menit, lalu coba lagi.";
    case 400:
      return message ?? "Teksnya belum bisa diproses. Periksa isinya, lalu coba lagi.";
    default:
      return message ?? fallback;
  }
}
