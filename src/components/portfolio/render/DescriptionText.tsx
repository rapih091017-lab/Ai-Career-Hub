/**
 * Deskripsi project/pengalaman. Isian BulletEditor menyimpan satu poin per
 * baris; pre-line menjaga baris itu di portofolio terbit dan ekspor. Teks
 * satu baris tampil sama persis seperti sebelumnya.
 */
export function DescriptionText({ text }: { text: string }) {
  return <span style={{ whiteSpace: "pre-line" }}>{text}</span>;
}
