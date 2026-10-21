import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang Kami | AI Career Hub",
  description:
    "AI Career Hub adalah satu tempat untuk membuat CV ATS, mengecek kecocokan lowongan, menulis surat lamaran, membuat website portofolio, dan berlatih interview.",
};

const CAPABILITIES = [
  {
    title: "CV Builder",
    body: "Lima template ATS-friendly. AI bisa menyusun kalimat dari catatan yang kamu ketik mentah, lalu kamu memeriksa dan mengubah setiap bagian sebelum diekspor ke PDF.",
  },
  {
    title: "CV Checker",
    body: "Tempel CV dan deskripsi lowongan, lalu dapatkan skor kecocokan, keyword yang hilang, dan saran per bagian. Skornya alat bantu penilaian, bukan jaminan hasil seleksi.",
  },
  {
    title: "Portfolio Web",
    body: "Data CV yang sudah ada diubah menjadi website portofolio dengan tautan publik. Empat tema desain, bantuan AI untuk menulis deskripsi proyek, ekspor PDF, dan tampilan yang rapi di ponsel.",
  },
  {
    title: "Surat Lamaran",
    body: "Cover letter dan motivation letter yang mengambil data dari CV, jadi tidak perlu mengisi ulang profil untuk tiap lamaran.",
  },
  {
    title: "Persiapan Interview",
    body: "Ribuan pertanyaan latihan yang disusun per posisi, dengan mode latihan berpengatur waktu. Soalnya spesifik pada posisi yang dituju, bukan daftar pertanyaan umum.",
  },
  {
    title: "Pelacak Lamaran",
    body: "Papan kanban untuk menyimpan lowongan, memindahkan tahap, dan menautkan CV serta surat yang dipakai untuk lamaran itu.",
  },
  {
    title: "AI Career Hub",
    body: "Kumpulan lowongan pilihan, contoh CV per posisi, dan jalur karier yang bisa dibaca untuk memahami arah bidang yang sedang dituju.",
  },
];

const PRINCIPLES = [
  {
    title: "Kamu yang memutuskan",
    body: "AI menyusun, kamu memeriksa. Tidak ada isi yang terkirim ke recruiter tanpa kamu setujui.",
  },
  {
    title: "Skor selalu dijelaskan",
    body: "Setiap skor disertai alasan dan apa yang perlu diperbaiki, supaya bisa dipakai untuk belajar, bukan sekadar angka.",
  },
  {
    title: "Data tersimpan di akunmu",
    body: "Draft disimpan di server supaya bisa dilanjutkan di perangkat lain, dan bisa kamu hapus kapan saja.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-evergreen text-paper">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 text-paper/70 hover:text-lime transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Tentang AI Career Hub</h1>
          <p className="text-paper/70 text-lg">
            Satu tempat untuk dokumen lamaran, portofolio, dan latihan interview
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-0">
        <section className="py-10 first:pt-0">
          <p className="kicker">Kenapa kami membuat ini</p>
          <h2 className="font-display text-xl text-ink">Satu profil, semua dokumen lamaran</h2>
          <p className="mt-4 max-w-[62ch] font-serif text-[16.5px] leading-[1.7] text-ink-soft">
            Melamar kerja berarti banyak pekerjaan administratif yang berulang: menulis CV, menyesuaikan isi untuk tiap
            lowongan, membuat surat, menyusun portofolio, lalu berlatih interview. Sebagian besar pekerjaan itu bukan
            menulis, melainkan menyalin dan menyesuaikan.
          </p>
          <p className="max-w-[62ch] font-serif text-[16.5px] leading-[1.7] text-ink-soft mt-3">
            AI Career Hub mengurangi pekerjaan tersebut. Satu profil diisi sekali, lalu bantuan AI mengubahnya menjadi
            CV, surat lamaran, website portofolio, dan latihan yang spesifik untuk lowongan yang sedang kamu incar.
          </p>
        </section>

        <section className="py-10 border-t border-hairline">
          <p className="kicker">Yang bisa kamu lakukan</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((item) => (
              <div key={item.title} className="card-hard bg-paper p-5">
                <h3 className="font-display text-base text-ink mb-1">{item.title}</h3>
                <p className="text-[14px] text-ink-soft leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10 border-t border-hairline">
          <p className="kicker">Cara kami menjaga agar tidak berlebihan</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="card-hard bg-paper p-5">
                <h3 className="font-display text-base text-ink mb-1">{item.title}</h3>
                <p className="text-[14px] text-ink-soft leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10 border-t border-hairline">
          <p className="kicker">Cara kami dibiayai</p>
          <p className="max-w-[62ch] font-serif text-[16.5px] leading-[1.7] text-ink-soft">
            Fitur dasar tetap gratis: kamu bisa membuat CV dengan bantuan AI, mengecek kecocokan lowongan, menulis
            surat lamaran, dan mencoba satu website portofolio per bulan tanpa biaya. Paket berbayar tersedia sesuai
            kebutuhan, satu kali pakai untuk satu dokumen atau langganan dengan kuota lebih besar. Kami tidak menjual
            data pengguna.
          </p>
        </section>

        <section className="py-10 border-t border-hairline">
          <p className="kicker">Ada yang perlu dijelaskan?</p>
          <p className="text-body-md text-ink-soft leading-relaxed">
            Data yang kami simpan dijelaskan di{" "}
            <Link href="/privacy" className="font-bold text-green-deep underline decoration-lime decoration-[3px] underline-offset-4">
              Kebijakan Privasi
            </Link>
            . Pertanyaan yang sering muncul ada di{" "}
            <Link href="/faq" className="font-bold text-green-deep underline decoration-lime decoration-[3px] underline-offset-4">
              FAQ
            </Link>
            , atau bisa ditulis lewat halaman{" "}
            <Link href="/contact" className="font-bold text-green-deep underline decoration-lime decoration-[3px] underline-offset-4">
              Kontak
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}