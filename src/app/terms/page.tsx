import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | AI Career Hub",
  description: "Syarat dan ketentuan penggunaan layanan AI Career Hub.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">Syarat & Ketentuan</h1>
          <p className="text-white/80 text-lg">Terakhir diperbarui: 17 Juli 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">1. Penerimaan Ketentuan</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Dengan menggunakan layanan AI Career Hub, Anda menyetujui syarat dan ketentuan ini. Jika Anda tidak
              setuju dengan bagian mana pun dari ketentuan ini, Anda tidak boleh menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">2. Deskripsi Layanan</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              AI Career Hub menyediakan alat berbasis AI untuk analisis CV, pembuatan CV, pembuatan portofolio,
              dan pengembangan karir. Kami berhak untuk memodifikasi atau menghentikan layanan kapan saja
              dengan pemberitahuan sebelumnya.
            </p>
          </section>

          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">3. Akun Pengguna</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda. Setiap aktivitas yang
              terjadi di bawah akun Anda adalah tanggung jawab Anda. Harap beri tahu kami segera jika terjadi
              akses tidak sah ke akun Anda.
            </p>
          </section>

          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">4. Paket Berbayar</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Paket premium yang dibeli tidak dapat dikembalikan (non-refundable) kecuali ditentukan lain.
              Pembayaran diproses melalui pihak ketiga (Midtrans) dan tunduk pada ketentuan mereka.
            </p>
          </section>

          <section>
            <h2 className="font-headline-md text-xl text-on-surface mb-3">5. Kontak</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Pertanyaan terkait syarat dan ketentuan dapat ditujukan ke halaman{' '}
              <Link href="/contact" className="text-primary hover:underline">Kontak</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
