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
        a: "Gratis mencakup 2 pembuatan CV dengan AI, 2 analisis kecocokan, 3 penulisan ulang, 3 surat lamaran, 2 ekspor PDF, dan 1 percobaan website portofolio dengan AI per bulan. Dokumen CV disimpan 30 hari.",
      },
      {
        q: "Apa itu “Coba Pro 3 Hari”?",
        a: "Akses Pro selama 3 hari seharga Rp7.000: 10 pembuatan CV dengan AI, 3 analisis kecocokan, penulisan ulang dan surat lamaran tanpa batas, serta ekspor PDF tanpa batas. Paket ini tidak menyertakan website portofolio.",
      },
      {
        q: "Berapa harga paket Portfolio Web?",
        a: "Rp35.000 untuk 30 hari: website portofolio dengan AI tanpa batas, ekspor PDF tanpa batas, penulisan ulang tanpa batas, dan link publik yang bisa dipakai kirim ke recruiter.",
      },
      {
        q: "Kenapa ada paket satuan dan langganan?",
        a: "Paket satuan untuk yang butuh sekali: satu CV, satu analisis, atau satu portofolio. Langganan untuk yang sedang aktif melamar dan butuh kuota berulang. Paket Lamaran menggabungkan ketiganya selama 60 hari.",
      },
      {
        q: "Apakah kuota dihitung ulang tiap bulan?",
        a: "Kuota paket berbayar berlaku selama masa paket. Paket satuan berlaku untuk dokumen yang kamu buat selama masa berlakunya.",
      },
    ],
  },
  {
    category: "Pembayaran",
    faqs: [
      {
        q: "Metode pembayaran apa yang diterima?",
        a: "QRIS, GoPay, OVO, Dana, ShopeePay, dan transfer bank. Semua diproses oleh Midtrans.",
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
        a: "Tidak. Data hanya dibagikan kepada penyedia yang diperlukan agar layanan berjalan: penyedia AI, penyedia hosting, Google untuk login, dan Midtrans untuk pembayaran.",
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
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">FAQ</h1>
          <p className="text-white/80 text-lg">Pertanyaan yang sering diajukan</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {FAQ_GROUPS.map((group) => (
          <section key={group.category}>
            <h2 className="font-headline-md text-lg text-on-surface mb-4">{group.category}</h2>
            <div className="space-y-3">
              {group.faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden"
                >
                  <summary className="px-6 py-4 font-label-bold text-on-surface cursor-pointer hover:bg-surface-container-low transition-colors list-none flex items-center justify-between gap-4">
                    {faq.q}
                    <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform shrink-0">
                      expand_more
                    </span>
                  </summary>
                  <div className="px-6 pb-4">
                    <p className="text-body-md text-on-surface-variant leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section className="pt-8 border-t border-outline-variant/30">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            Jawaban untuk pertanyaan tentang data ada di{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Kebijakan Privasi
            </Link>
            . Kalau belum terjawab, tulis lewat halaman{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Kontak
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}