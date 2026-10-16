/** Batas yang sama dengan sisi server di career-hub-schemas.ts. */
const MAX_TAG_LENGTH = 40;
const MAX_TAGS = 12;

/**
 * Pecah input tag admin menjadi daftar tag.
 *
 * Admin mengetik tag satu per satu, tapi juga sering menempelkan daftar dari
 * catatan atau pesan: "lowongan palsu, penipuan kerja, tips aman". Kalau
 * input itu dipakai apa adanya, database menyimpan satu tag berisi koma —
 * halaman tag publik lalu memakai nama aneh dan URL yang tidak bisa dibuka.
 *
 * Hasil juga dibatasi ke 12 tag dan 40 karakter per tag supaya tidak pernah
 * ditolak server dengan pesan yang tidak menjelaskan.
 */
export function parseTagInput(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((part) => part.trim().replace(/^#/, "").slice(0, MAX_TAG_LENGTH))
    .filter((tag) => tag.length > 0)
    .filter((tag, index, all) => all.findIndex((other) => other.toLowerCase() === tag.toLowerCase()) === index)
    .slice(0, MAX_TAGS);
}

/** Gabungkan tag lama dengan input baru tanpa menghasilkan duplikat. */
export function mergeTags(existing: string[], input: string, limit = MAX_TAGS): string[] {
  const seen = new Set(existing.map((tag) => tag.toLocaleLowerCase()));
  const added = parseTagInput(input).filter((tag) => {
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...existing, ...added].slice(0, limit);
}