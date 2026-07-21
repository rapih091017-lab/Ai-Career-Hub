import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hubungi Kami | AI Career Hub",
  description: "Hubungi tim AI Career Hub untuk pertanyaan, dukungan, atau kerja sama.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">Hubungi Kami</h1>
          <p className="text-white/80 text-lg">Tim kami siap membantu Anda</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-headline-md text-xl text-on-surface mb-4">Informasi Kontak</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">mail</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-on-surface">Email</p>
                    <a href="mailto:support@aicareerhub.com" className="text-body-md text-primary hover:underline">support@aicareerhub.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">alternate_email</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-on-surface">Media Sosial</p>
                    <p className="text-body-md text-on-surface-variant">@aicareerhub</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">help</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-on-surface">Bantuan</p>
                    <p className="text-body-md text-on-surface-variant">Kunjungi FAQ atau hubungi kami melalui email untuk respons tercepat.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-8 shadow-soft">
            <h2 className="font-headline-md text-xl text-on-surface mb-4">Respon Cepat</h2>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Kami berkomitmen untuk merespon setiap pertanyaan dalam waktu 1x24 jam pada hari kerja.
              Untuk pertanyaan mendesak, silakan hubungi kami melalui email langsung.
            </p>
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20">
              <p className="text-label-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
                Untuk pertanyaan terkait akun, login, atau pembayaran, sertakan detail akun Anda agar kami dapat membantu lebih cepat.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/privacy" className="text-sm text-primary hover:underline">Kebijakan Privasi</Link>
              <span className="text-outline-variant">|</span>
              <Link href="/terms" className="text-sm text-primary hover:underline">Syarat & Ketentuan</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
