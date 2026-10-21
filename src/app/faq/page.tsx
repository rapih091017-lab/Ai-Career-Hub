import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | AI Career Hub",
  description:
    "Pertanyaan yang sering diajukan tentang CV, portofolio, kuota paket, pembayaran, dan privasi data di AI Career Hub.",
};

const FAQ_GROUPS = [
  {
    category: "Umum",
    faqs: [
      {
        q: "Apa itu AI Career Hub?",
        a: "Satu tempat untuk menyiapkan dokumen lamaran: membuat CV, mengecek kecocokan CV dengan lowongan, menulis surat lamaran, membangun website portofolio, berlatih interview, dan melacak lowongan yang sedang dilamar.",
      },
      {
        q: "Siapa yang cocok memakai layanan ini?",
        a: "Fresh graduate yang baru mulai melamar, professionnel yang berpindah posisi, dan siapa pun yang perlu CV atau portofolio rapi dalam waktu singkat tanpa bantuan desainer.",
      },
      {
        q: "Apakah harus bisa mengedit CV?",
        a: "Bisa. Hasil AI adalah draf. Setiap bagian bisa kamu ubah, hapus, atau tulis ulang sebelum diekspor.",
      },
    ],
  },
  {
    category: "Akun",
    faqs: [
      {
        q: "Bagaimana cara membuat akun?",
        a: "Masuk dengan Google. Kami tidak membuat password, jadi tidak ada password yang perlu diingat atau diretas.",
      },
      {
        q: "Apakah ada aplikasi seluler?",
        a: "Belum ada aplikasi khusus. Situsnya dapat dibuka di ponsel dan portofolio yang kamu terbitkan sudah dirancang untuk layar kecil.",
      },
    ],
  },
  {
    category: "CV & Lowongan",
    faqs: [
      {
        q: "Apa bedanya CV Builder dan CV Checker?",
        a: "Builder menyusun CV dari profil yang kamu isi atau dari catatan mentah, lengkap dengan template ATS. Checker menilai CV yang sudah jadi terhadap deskripsi lowongan: skor kecocokan, keyword yang hilang, dan saran per bagian.",
      },
      {
        q: "Apakah hasil CV benar-benar lolos ATS?",
        a: "Yang bisa kami jamin: file-nya diekspor sebagai teks yang bisa dibaca mesin ATS, bukan gambar, dan strukturnya mengikuti template yang memang dipakai ATS. Hasil seleksi tetap bergantung pada isi, pengalaman, dan posisi yang dilamar.",
      },
      {
        q: "Berapa skor kecocokan yang bagus?",
        a: "Skor membantu melihat bagian yang paling lemah. Nilai exact tidak menjamin apa pun karena tiap perusahaan punyastandar sendiri. Yang berguna adalah daftar keyword yang hilang dan saran per bagiannya.",
      },
      {
        q: "Apakah bahasa CV bisa Bahasa Inggris?",
        a: "Bisa, lewat fitur Sinonim CV dan penulisan ulang. Data profil tetap satu; kamu memilih bahasa untuk dokumen yang sedang dibuat.",
      },
    ],
  },
  {
    category: "Portofolio",
    faqs: [
      {
        q: "Apakah data portofolio harus diisi manual?",
        a: "Tidak wajib. Data yang sudah ada di profil atau CV bisa dipakai sebagai sumber, lalu kamu melengkapinya. Ada bantuan AI untuk menulis deskripsi tiap proyek dari catatan singkat.",
      },
      {
        q: "Kapan tautan publik saya aktif?",
        a: "Tautan publik aktif setelah kamu menekan terbitkan pada paket yang menyertakan Portfolio Web. Draft tidak bisa diakses orang lain sebelum itu.",
      },
      {
        q: "Apakah orang lain bisa melihat draft saya?",
        a: "Tidak. Draft hanya milik akun Anda. Yang publik adalah halaman yang kamu terbitkan sendiri lewat tautannya.",
      },
      {
        q: "Berapa lama tautan publik saya aktif?",
        a: "Sepanjang masa aktif paket. Setelah paket habis, tautan publik berhenti aktif dan draft Anda tetap tersimpan sehingga bisa diterbitkan lagi.",
      },
    ],
  },
  {
    category: "Paket & Kuota",
    faqs: [
      {
        q: "Apa saja yang gratis?",
        a: "Gratis mencakup 1 pembuatan CV dengan AI, 1 analisis kecocokan, 1 penulisan ulang, 1 surat lamaran, dan 1 ekspor PDF per bulan. Website portofolio dengan AI bisa dicoba gratis selama 2 hari sejak akun dibuat. Dokumen CV disimpan 30 hari.",
      },
      {
        q: "Kenapa paket satuan lebih masuk akal daripada langsung langganan?",
        a: "Kalau kamu hanya butuh satu hal, bayarseparuh. Cek CV Rp9.000 untuk 3x cek, Bikin CV Rp19.000 untuk 3x CV, Surat Lamaran Rp9.000 untuk 2x surat. Kalau rutin melamar, paket bulanan jauh lebih murah per hasilnya.",
      },
      {
        q: "Berapa harga paketnya?",
        a: "Paket satuan: Cek CV Rp9.000, Bikin CV Rp19.000, Surat Lamaran Rp9.000, dan Paket Lengkap 1 Lamaran Rp34.000 (3x CV, 3x cek ATS, 2x surat, ekspor PDF tanpa batas). Paket bulanan 30 hari: Lite Rp19.000, Pro Rp39.000, Max Rp79.000. Semua dibayar sekali, tidak ada perpanjangan otomatis.",
      },
      {
        q: "Kenapa ada paket satuan dan bulanan?",
        a: "Paket satuan untuk yang butuh sekali: satu cek CV, satu CV, atau satu surat lamaran. Paket bulanan untuk yang sedang aktif melamar dan butuh kuota berulang. Paket Lengkap 1 Lamaran menggabungkan ketiganya, berlaku 30 hari.",
      },
      {
        q: "Apakah kuota dihitung ulang tiap bulan?",
        a: "Ya. Kuota dihitung per bulan kalender, jadi yang tidak terpakai tidak ikut dikumpulkan ke bulan berikutnya. Paket satuan juga berlaku 30 hari sejak dibayar.",
      },
    ],
  },
  {
    category: "Pembayaran",
    faqs: [
      {
        q: "Metode pembayaran apa yang diterima?",
        a: "QRIS, jadi bisa dibayar dari aplikasi apa pun yang mendukung QRIS. Semua diproses oleh Kasera.",
      },
      {
        q: "Apakah bisa refund?",
        a: "Paket satuan yang sudah dipakai untuk membuat dokumen tidak dapat dikembalikan, karena biaya pemrosesan AI sudah terjadi. Langganan bisa dihentikan kapan saja, dan aksesnya berakhir di akhir periode yang sudah dibayar.",
      },
    ],
  },
  {
    category: "Privasi",
    faqs: [
      {
        q: "Apakah data saya aman?",
        a: "Login memakai Google OAuth, koneksi memakai HTTPS, dan akses basis data hanya dari server aplikasi. Yang Anda kirim ke fitur AI diteruskan ke penyedia AI kami untuk diproses; rinciannya ada di Kebijakan Privasi.",
      },
      {
        q: "Apakah data saya dijual?",
        a: "Tidak. Data hanya dibagikan kepada penyedia yang diperlukan agar layanan berjalan: penyedia AI, penyedia hosting, Google untuk login, dan Kasera untuk pembayaran.",
      },
      {
        q: "Bisakah saya menghapus akun dan data saya?",
        a: "Bisa, dan penghapusan tidak dapat dibatalkan. Penghapusan dilakukan dari pengaturan akun.",
      },
    ],
  },
] as const;

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-evergreen text-on-dark">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 text-on-dark/70 hover:text-lime transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">FAQ</h1>
          <p className="text-on-dark/70 text-lg">Pertanyaan yang sering diajukan</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-0">
        {FAQ_GROUPS.map((group) => (
          <section key={group.category} className="py-8 first:pt-0 last:pb-0">
            <h2 className="font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep mb-2">{group.category}</h2>
            <div>
              {group.faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group border-b border-hairline bg-paper"
                >
                  <summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-bold text-ink hover:text-green-deep transition-colors">
                    {faq.q}
                    <span
                      aria-hidden="true"
                      className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-brand-dark text-on-dark transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="max-w-[62ch] pb-6">
                    <p className="font-serif text-[15.5px] leading-[1.7] text-ink-soft">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section className="py-8 border-t border-hairline">
          <p className="text-body-md text-ink-soft leading-relaxed">
            Jawaban untuk pertanyaan tentang data ada di{" "}
            <Link href="/privacy" className="font-bold text-green-deep underline decoration-lime decoration-[3px] underline-offset-4">
              Kebijakan Privasi
            </Link>
            . Kalau belum terjawab, tulis lewat halaman{" "}
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