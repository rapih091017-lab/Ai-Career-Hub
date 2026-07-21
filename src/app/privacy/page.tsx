import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | AI Career Hub",
  description: "Pelajari bagaimana AI Career Hub mengelola dan melindungi data pribadi Anda.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">Kebijakan Privasi</h1>
          <p className="text-white/80 text-lg">Terakhir diperbarui: 17 Juli 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Kami mengumpulkan informasi yang Anda berikan secara langsung saat menggunakan layanan AI Career Hub, termasuk:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-body-md text-on-surface-variant">
              <li>Data profil: nama, alamat email, nomor telepon</li>
              <li>Data CV/Resume: riwayat pekerjaan, pendidikan, keahlian, dan informasi karir lainnya</li>
              <li>Dokumen yang Anda unggah untuk analisis CV</li>
              <li>Informasi pembayaran untuk transaksi premium</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">2. Penggunaan Informasi</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Informasi Anda digunakan untuk:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-body-md text-on-surface-variant">
              <li>Menyediakan dan meningkatkan layanan analisis CV dan CV builder</li>
              <li>Menghasilkan saran AI yang dipersonalisasi untuk pengembangan karir</li>
              <li>Memproses transaksi dan mengelola akun Anda</li>
              <li>Mengirimkan pembaruan terkait layanan dan penawaran (dengan persetujuan Anda)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">3. Keamanan Data</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi data
              pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau perusakan.
            </p>
          </section>

          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">4. Hak Anda</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Anda memiliki hak untuk mengakses, memperbaiki, atau menghapus data pribadi Anda kapan saja
              melalui pengaturan akun atau dengan menghubungi tim dukungan kami.
            </p>
          </section>

          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">5. Kontak</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui halaman{' '}
              <Link href="/contact" className="text-primary hover:underline">Kontak</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
