/**
 * Sinonim CV: daftar kurasi "frasa lemah" dan pengganti yang lebih kuat.
 * Disusun sendiri oleh tim (bukan salinan dari produk lain). Bahasa Indonesia
 * dan Inggris dipisah karena penggantinya berbeda per bahasa.
 *
 * Prinsip isi: pengganti harus tetap jujur dan spesifik. Saran di sini
 * mengubah gaya penulisan, bukan menambah fakta.
 */

export interface SynonymEntry {
  /** Frasa yang sering membuat poin CV terdengar lemah atau generik. */
  weak: string;
  /** Pengganti yang lebih kuat atau lebih spesifik. */
  alternatives: string[];
}

export const RESUME_SYNONYMS: Record<"id" | "en", SynonymEntry[]> = {
  id: [
    { weak: "bertanggung jawab atas", alternatives: ["memimpin", "mengelola", "mengawal", "memegang tanggung jawab"] },
    { weak: "membantu", alternatives: ["mendukung", "mempercepat", "memfasilitasi", "mendorong"] },
    { weak: "membuat", alternatives: ["membangun", "merancang", "mengembangkan", "menciptakan"] },
    { weak: "mengerjakan", alternatives: ["mengeksekusi", "menggarap", "menuntaskan", "menyelesaikan"] },
    { weak: "menangani", alternatives: ["mengelola", "mengoordinasikan", "mengatasi", "menyelesaikan"] },
    { weak: "ikut serta dalam", alternatives: ["berkontribusi pada", "berperan dalam", "terlibat aktif dalam"] },
    { weak: "ditugaskan untuk", alternatives: ["memimpin", "menginisiasi", "menjalankan"] },
    { weak: "bertugas", alternatives: ["menjalankan", "mengoperasikan", "mengelola"] },
    { weak: "melakukan", alternatives: ["menjalankan", "menerapkan", "mengeksekusi"] },
    { weak: "memberikan", alternatives: ["menyampaikan", "menghadirkan", "menyediakan"] },
    { weak: "mengurus", alternatives: ["mengelola", "mengatur", "mengoordinasikan"] },
    { weak: "mengatur", alternatives: ["mengoordinasikan", "merancang", "mengelola"] },
    { weak: "belajar", alternatives: ["menguasai", "mendalami", "mempelajari lalu menerapkan"] },
    { weak: "mencoba", alternatives: ["menjajaki", "menguji", "menginisiasi"] },
    { weak: "berhasil", alternatives: ["mencapai", "merealisasikan", "menuntaskan"] },
    { weak: "sangat baik", alternatives: ["unggul", "melampaui target", "konsisten di atas rata-rata"] },
    { weak: "banyak", alternatives: ["signifikan", "beragam", "sejumlah besar"] },
    { weak: "mempelajari", alternatives: ["menguasai", "mendalami", "menyerap"] },
    { weak: "kerja sama tim", alternatives: ["berkolaborasi lintas fungsi", "mendorong kolaborasi tim"] },
    { weak: "cepat beradaptasi", alternatives: ["menguasai alur kerja baru dalam waktu singkat", "menyesuaikan proses dengan cepat"] },
    { weak: "pekerja keras", alternatives: ["konsisten memenuhi tenggat", "disiplin pada target"] },
    { weak: "ide kreatif", alternatives: ["gagasan yang diterapkan", "solusi orisinal yang dieksekusi"] },
    { weak: "memperbaiki masalah", alternatives: ["mendiagnosis dan mengatasi", "menyelesaikan akar masalah"] },
    { weak: "mengikuti pelatihan", alternatives: ["menyelesaikan pelatihan dan menerapkan hasilnya", "menguasai materi pelatihan"] },
  ],
  en: [
    { weak: "responsible for", alternatives: ["led", "managed", "owned", "directed"] },
    { weak: "helped", alternatives: ["supported", "enabled", "facilitated", "drove"] },
    { weak: "worked on", alternatives: ["built", "developed", "delivered", "shipped"] },
    { weak: "made", alternatives: ["created", "designed", "established", "produced"] },
    { weak: "handled", alternatives: ["managed", "coordinated", "resolved", "oversaw"] },
    { weak: "assisted", alternatives: ["supported", "facilitated", "contributed to"] },
    { weak: "participated in", alternatives: ["contributed to", "collaborated on", "supported"] },
    { weak: "tasked with", alternatives: ["led", "owned", "executed"] },
    { weak: "duties included", alternatives: ["led", "managed", "delivered"] },
    { weak: "in charge of", alternatives: ["led", "directed", "oversaw"] },
    { weak: "utilized", alternatives: ["used", "applied", "worked with"] },
    { weak: "leveraged", alternatives: ["used", "applied", "built on"] },
    { weak: "facilitated", alternatives: ["led", "coordinated", "ran"] },
    { weak: "demonstrated", alternatives: ["showed", "proved", "delivered"] },
    { weak: "various", alternatives: ["several", "multiple", "diverse"] },
    { weak: "team player", alternatives: ["collaborated across teams", "supported shared goals"] },
    { weak: "hard worker", alternatives: ["consistently met deadlines", "delivered results under pressure"] },
    { weak: "good communication skills", alternatives: ["presented clearly to stakeholders", "aligned teams through clear updates"] },
    { weak: "detail-oriented", alternatives: ["maintained high accuracy", "audited details and corrected errors"] },
    { weak: "quick learner", alternatives: ["mastered new tools within weeks", "ramped up fast on new systems"] },
    { weak: "creative thinker", alternatives: ["proposed ideas that shipped", "turned concepts into working solutions"] },
    { weak: "problem solver", alternatives: ["diagnosed and fixed issues", "resolved root causes"] },
  ],
};
