/**
 * Penyimpanan skor STAR terakhir per pertanyaan (localStorage).
 * Dipakai kartu pertanyaan dan mode practice untuk menampilkan badge skor.
 */

const KEY_PREFIX = "star-score:";

export function saveStarScore(questionId: string, score: number): void {
  try {
    localStorage.setItem(KEY_PREFIX + questionId, String(score));
  } catch {
    // localStorage bisa diblokir (mode privat); badge saja yang hilang.
  }
}

export function readStarScore(questionId: string): number | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + questionId);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function starScoreLabel(score: number): string {
  return score.toFixed(1);
}

/** Ambil skor terakhir dari server (sinkron lintas perangkat). Mengembalikan
 * null bila belum login, belum ada skor, atau request gagal. */
export async function fetchRemoteStarScore(questionId: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/interview/star?questionId=${encodeURIComponent(questionId)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.score === "number" ? data.score : null;
  } catch {
    return null;
  }
}