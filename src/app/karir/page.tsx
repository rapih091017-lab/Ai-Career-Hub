import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Info Karir | AI Career Hub",
  description: "Cari lowongan kerja? Kami sedang menyiapkan job board khusus untuk Anda. Sementara itu, jelajahi portal lowongan eksternal.",
};

const EXTERNAL_PORTALS = [
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/jobs/",
    description: "Jaringan profesional terbesar, ribuan lowongan dari perusahaan multinasional hingga startup.",
    icon: "⬡",
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    label: "linkedin.com/jobs",
  },
  {
    name: "Glints",
    url: "https://glints.com/id/opportunities/jobs",
    description: "Platform karir populer untuk fresh graduate dan profesional muda di Indonesia & Asia.",
    icon: "✦",
    color: "bg-amber-50 border-amber-200",
    textColor: "text-amber-700",
    label: "glints.com",
  },
  {
    name: "Jobstreet",
    url: "https://www.jobstreet.co.id/",
    description: "Portal lowongan terpercaya dengan ribuan posisi dari berbagai industri di Indonesia.",
    icon: "◆",
    color: "bg-red-50 border-red-200",
    textColor: "text-red-700",
    label: "jobstreet.co.id",
  },
  {
    name: "Karir.com",
    url: "https://www.karir.com/",
    description: "Platform pencarian kerja yang fokus pada pasar tenaga kerja Indonesia.",
    icon: "●",
    color: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    label: "karir.com",
  },
  {
    name: "Indeed",
    url: "https://id.indeed.com/",
    description: "Mesin pencari lowongan global dengan agregasi dari ribuan sumber dan perusahaan.",
    icon: "⬢",
    color: "bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-700",
    label: "id.indeed.com",
  },
  {
    name: "TechInAsia",
    url: "https://www.techinasia.com/jobs",
    description: "Lowongan khusus industri teknologi dan startup di Asia Tenggara.",
    icon: "▲",
    color: "bg-emerald-50 border-emerald-200",
    textColor: "text-emerald-700",
    label: "techinasia.com/jobs",
  },
];

export default function KarirPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary text-white">
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-xs font-bold tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Segera Hadir
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold mb-3">Pusat Info Karir</h1>
          <p className="text-white/80 text-lg max-w-xl">
            Kami sedang menyiapkan job board khusus untuk membantu Anda menemukan lowongan yang tepat.
            Pantau terus halaman ini untuk update terbaru!
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/builder/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              Siapkan CV-mu Sekarang
            </Link>
            <Link
              href="/interview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 text-white font-bold rounded-xl hover:bg-white/25 active:scale-[0.97] transition-all border border-white/20"
            >
              <span className="material-symbols-outlined text-lg">record_voice_over</span>
              Latihan Interview
            </Link>
          </div>
        </div>
      </div>

      {/* ── Coming Soon Detail ── */}
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <section className="mb-16">
          <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
              </div>
              <div>
                <h2 className="font-headline-md text-xl text-on-surface mb-2">Apa yang Akan Hadir?</h2>
                <p className="text-body-md text-on-surface-variant leading-relaxed mb-4">
                  Tim kami sedang membangun fitur Job Board yang akan membantu kamu menemukan 
                  lowongan pekerjaan terbaru yang sesuai dengan profil dan preferensimu.
                </p>
                <ul className="space-y-3">
                  {[
                    { icon: "search", text: "Rekomendasi lowongan berdasarkan skill & pengalaman" },
                    { icon: "notifications", text: "Notifikasi real-time saat lowongan baru diposting" },
                    { icon: "bolt", text: "Lamaran cepat · kirim CV langsung dari platform" },
                    { icon: "auto_awesome", text: "AI Match · skor kecocokan CV dengan lowongan" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                      <span className="text-sm text-on-surface">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── External Job Portals ── */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary text-xs font-bold tracking-wider rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">link</span>
              Sumber Terpercaya
            </span>
            <h2 className="font-headline-md text-xl text-on-surface mb-2">Portal Lowongan Eksternal</h2>
            <p className="text-body-md text-on-surface-variant">
              Sambil menunggu job board kami rilis, Anda bisa mencari lowongan di portal-portal berikut:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXTERNAL_PORTALS.map((portal) => (
              <a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-2xl p-5 border ${portal.color} ${portal.textColor} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{portal.icon}</span>
                  <h3 className="font-label-bold text-on-surface group-hover:text-primary transition-colors">{portal.name}</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{portal.description}</p>
                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  {portal.label}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-gradient-to-br from-primary/5 via-primary/[0.02] to-secondary/5 rounded-2xl p-8 md:p-10 border border-primary/10 text-center">
          <div className="max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <h2 className="font-headline-md text-xl text-on-surface mb-2">Siap Melamar?</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Sembari menunggu job board rilis, gunakan CV Builder kami untuk membuat CV 
              ATS-friendly yang siap dikirim ke perusahaan impianmu.
            </p>
            <Link
              href="/builder/new"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Buat CV Baru
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
