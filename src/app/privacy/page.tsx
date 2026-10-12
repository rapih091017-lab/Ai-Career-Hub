import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | AI Career Hub",
  description:
    "Data apa yang AI Career Hub kumpulkan, ke mana dikirim, berapa lama disimpan, dan hak Anda untuk mengakses atau menghapusnya.",
};

const SECTIONS = [
  {
    title: "Siapa pengelolanya",
    body: [
      "Kebijakan ini menjelaskan cara [ISI: nama badan atau nama resmi produk] (dalam dokumen ini disebut “pengelola data”) mengelola data pribadi Anda di AI Career Hub.",
      "Pertanyaan mengenai kebijakan ini bisa dikirim ke [ISI: email resmi untuk privasi dan hak data].",
    ],
  },
  {
    title: "Data yang kami kumpulkan",
    body: [
      "Data yang Anda berikan sendiri: nama, alamat email, nomor telepon, dan data profil yang Anda isikan sendiri.",
      "Data pekerjaan: riwayat pendidikan, pengalaman kerja, keahlian, deskripsi proyek, serta dokumen CV yang Anda unggah atau tempel.",
      "Data portofolio: foto, tautan sosial, dan isi portofolio yang Anda buat melalui Portfolio Builder.",
      "Data penggunaan: fitur yang Anda pakai, jumlah pemakaian kuota, dan catatan transaksi. Ini dipakai untuk menghitung kuota dan memproses pembayaran.",
      "Data teknis: alamat IP, jenis peramban, dan halaman yang Anda buka.",
    ],
  },
  {
    title: "Pemrosesan AI dan pihak ketiga",
    body: [
      "Untuk menghasilkan CV, cover letter, atau deskripsi proyek, teks yang Anda kirim ke fitur AI diteruskan ke penyedia AI kami, yaitu [ISI: konfirmasi nama penyedia AI dan negara lokasi pemrosesannya — saat ini DeepSeek lewat endpoint OpenAI-compatible].",
      "Kami hanya mengirim potongan teks yang memang dibutuhkan fitur tersebut, bukan seluruh data akun Anda.",
      "Login memakai Google OAuth. Data yang dibagikan ke Google saat login adalah nama, email, dan foto profil, sesuai izin yang Anda berikan di layar persetujuan Google.",
      "Data disimpan di [ISI: nama penyedia hosting dan negara lokasi datanya — saat ini Neon].",
      "Pembayaran diproses oleh Midtrans. Kami tidak menerima atau menyimpan nomor kartu Anda.",
    ],
  },
  {
    title: "Untuk apa data dipakai",
    body: [
      "Menjalankan fitur yang Anda minta: membuat dan menganalisis CV, menulis cover letter, menyusun portofolio, dan latihan interview.",
      "Menghitung kuota pemakaian sesuai paket Anda dan memproses pembelian.",
      "Menjaga keamanan akun, mencegah penyalahgunaan, dan mendeteksi transaksi yang mencurigakan.",
      "Mengirim pembaruan layanan atau penawaran, tetapi hanya jika Anda mengizinkan.",
    ],
  },
  {
    title: "Portofolio yang diterbitkan adalah informasi publik",
    body: [
      "Saat Anda menekan terbitkan, portofolio Anda mendapat slug dan tautan publik yang bisa dibuka siapa pun yang memiliki tautannya, tanpa perlu login.",
      "Isi portofolio yang dipublikasikan tidak dirahasiakan. Jangan masukkan informasi yang tidak boleh dilihat orang lain.",
      "Draft yang belum diterbitkan tidak dapat diakses orang lain.",
      "Tautan publik berhenti aktif setelah masa aktif paket Anda habis atau Anda menonaktifkannya.",
    ],
  },
  {
    title: "Berapa lama data disimpan",
    body: [
      "Data akun dan portofolio: disimpan selama akun Anda aktif.",
      "Dokumen CV dan data portofolio pada paket berbayar: disimpan [ISI: masa simpan setelah paket habis, contoh 30 hari setelah paket berakhir].",
      "Catatan penggunaan dan pembayaran: disimpan sesuai kewajiban pencatatan yang berlaku.",
      "Akun yang tidak aktif selama [ISI: jangka waktu tidak aktif sebelum akun dihapus otomatis] dapat dihapus otomatis.",
    ],
  },
  {
    title: "Berbagi data",
    body: [
      "Kami tidak menjual data pribadi Anda.",
      "Data hanya dibagikan kepada penyedia yang diperlukan agar layanan berjalan: penyedia AI, penyedia hosting, Google untuk login, dan Midtrans untuk pembayaran.",
      "Data dapat disclose kepada pihak lain bila diwajibkan oleh hukum Indonesia atau oleh otoritas yang berwenang.",
    ],
  },
  {
    title: "Hak Anda",
    body: [
      "Mengakses dan mengunduh data yang tersimpan tentang Anda.",
      "Memperbaiki data yang keliru melalui pengaturan akun.",
      "Menghapus akun beserta datanya. Penghapusan tidak dapat dibatalkan.",
      "Menarik persetujuan atas pengiriman data ke penyedia AI atau mitra lain.",
      "Menghentikan langganan berbayar. Masa berjalan yang sudah dibayar tidak dikembalikan, kecuali ada kesepakatan terpisah dengan kami.",
    ],
  },
  {
    title: "Keamanan",
    body: [
      "Password tidak pernah disimpan. Login memakai Google OAuth.",
      "Koneksi ke situs memakai HTTPS.",
      "Akses ke basis data dibatasi pada server aplikasi.",
      "Tidak ada sistem yang bebas dari risiko. Jika Anda menemukan kebocoran data yang berkaitan dengan akun Anda, laporkan ke [ISI: email pengaduan kebocoran].",
    ],
  },
  {
    title: "Perubahan kebijakan",
    body: [
      "Kebijakan ini dapat diperbarui ketika layanan atau regulasi berubah.",
      "Tanggal pembaruan tertera di bagian atas halaman ini. Perubahan besar kami umumkan lewat email atau pemberitahuan di aplikasi sebelum berlaku.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">Kebijakan Privasi</h1>
          <p className="text-white/80 text-lg">Data apa yang kami simpan, ke mana dikirim, dan cara menghapusnya</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-body-md text-on-surface-variant leading-relaxed mb-10">
          Diperbarui: 12 Oktober 2026. Halaman ini masih memuat detail yang harus dilengkapi pemilik produk; bagian
          bertanda <code className="text-on-surface">[ISI: …]</code> diisi sebelum halaman dipakai sebagai rujukan publik.
        </p>

        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <section key={section.title}>
              <h2 className="font-headline-md text-xl text-on-surface mb-3">
                {i + 1}. {section.title}
              </h2>
              <div className="space-y-3">
                {section.body.map((paragraph, j) => (
                  <p key={j} className="text-body-md text-on-surface-variant leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-outline-variant/30">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            Masih ada pertanyaan? Lihat <Link href="/faq" className="text-primary hover:underline">FAQ</Link> atau hubungi
            kami lewat halaman <Link href="/contact" className="text-primary hover:underline">Kontak</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}