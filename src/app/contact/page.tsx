import { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings.server";

export const metadata: Metadata = {
  title: "Hubungi Kami | AI Career Hub",
  description: "Hubungi tim AI Career Hub untuk pertanyaan, dukungan, atau kerja sama.",
};

// Kontak dibaca dari pengaturan situs (dapat diubah admin) sehingga halaman
// tidak boleh di-cache statis.
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();
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
                    <a href={`mailto:${settings.contact_email}`} className="text-body-md text-primary hover:underline">{settings.contact_email}</a>
                  </div>
                </div>
                {settings.contact_whatsapp ? (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary">chat</span>
                    </div>
                    <div>
                      <p className="font-label-bold text-on-surface">WhatsApp</p>
                      <a
                        href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body-md text-primary hover:underline"
                      >
                        {settings.contact_whatsapp}
                      </a>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">alternate_email</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-on-surface">Media Sosial</p>
                    <p className="text-body-md text-on-surface-variant">{settings.social_handle}</p>
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