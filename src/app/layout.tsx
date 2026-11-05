import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/react";
import ScrollProgress from "@/components/ScrollProgress";
import TitleUpdater from "@/components/TitleUpdater";
import { SITE_URL } from "@/lib/site-url";
import { LanguageProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  title: {
    default: "AI Career Hub - Bangun Karier Impianmu dengan AI",
    template: "%s | AI Career Hub",
  },
  description:
    "Satu platform untuk membuat CV ATS-friendly, mengecek skor resume, dan membangun portofolio profesional secara instan, semuanya dengan AI.",
  keywords: [
    "buat CV online", "CV ATS friendly", "pembuat CV AI", "cek skor CV",
    "portofolio website gratis", "AI career hub", "resume checker Indonesia",
    "CV builder AI", "karir impian", "lamaran kerja",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "id_ID",
    alternateLocale: "en_US",
    siteName: "AI Career Hub",
    title: "AI Career Hub - Bangun Karier Impianmu dengan AI",
    description:
      "Satu platform untuk membuat CV, mengecek skor resume, dan membangun portofolio profesional secara instan.",
    url: siteUrl,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Career Hub - Bangun Karier Impianmu dengan AI",
    description:
      "Satu platform untuk membuat CV, mengecek skor resume, dan membangun portofolio profesional secara instan.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Situs ini satu URL dengan pengalih bahasa di sisi klien, jadi tidak ada
  // hreflang terpisah. Sebelumnya blok `languages` menunjuk ke /en yang 404.
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* suppressHydrationWarning: skrip inline menambah class icons-pending
       sebelum hydration supaya Material Symbols tidak tampil sebagai teks. */
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" />
        {/*
          Enam family tema (Evergreen + Lime): Stack Sans Headline untuk
          display, Inter untuk UI, Literata untuk bacaan panjang, Caveat
          untuk kicker, Atkinson Hyperlegible Next untuk teks yang harus
          gampang dibaca, dan mono sistem untuk label mikro.
        */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Caveat:wght@400;600;700&family=Inter:wght@400;500;600;700;800&family=Literata:wght@400;500;600;700&family=Stack+Sans+Headline:wght@400;500;600;700&display=swap" />
        {/*
          Ikon Material Symbols disembunyikan sampai font ikon siap, supaya
          ligatur tidak sempat tampil sebagai teks mentah. Ada jaring
          pengaman 2,5 detik kalau font gagal dimuat.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;d.classList.add('icons-pending');function done(){d.classList.remove('icons-pending')}try{if(document.fonts&&document.fonts.load){document.fonts.load('16px "Material Symbols Outlined"').then(done).catch(done);setTimeout(done,2500)}else{done()}}catch(e){done()}})();`,
          }}
        />
        {/*
          Tema dipasang sebelum cat pertama supaya tidak ada kedipan terang
          saat pengguna memilih mode gelap. Pilihan disimpan di localStorage;
          tanpa pilihan, tema mengikuti preferensi sistem.

          Skrip yang sama menandai `data-reveal-ready` (dipakai CSS animasi
          masuk) dan memulihkan saklar animasi sebelum cat pertama, supaya
          blok yang menunggu reveal tidak sempat tampil lalu melompat.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;d.dataset.revealReady='';try{var c=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=(c==='light'||c==='dark')?c:(m?'dark':'light');d.dataset.theme=t;d.dataset.themeChoice=(c==='light'||c==='dark')?c:'system';d.style.colorScheme=t;if(localStorage.getItem('motion')==='off')d.dataset.motion='off'}catch(e){d.dataset.theme='light';d.dataset.themeChoice='system'}})();`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "name": "AI Career Hub",
                "applicationCategory": "CareerApplication",
                "operatingSystem": "Web",
                "description": "Satu platform untuk membuat CV ATS-friendly, mengecek skor resume, dan membangun portofolio profesional secara instan.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "IDR",
                  "priceValidUntil": "2027-12-31",
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "ratingCount": "500",
                  "bestRating": "5",
                },
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Beranda", "item": siteUrl },
                  { "@type": "ListItem", "position": 2, "name": "Dashboard", "item": `${siteUrl}/dashboard` },
                  { "@type": "ListItem", "position": 3, "name": "Buat CV", "item": `${siteUrl}/builder/new` },
                ],
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Apa bedanya beli satuan dan berlangganan?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Beli satuan bayar sekali untuk satu hasil. Berlangganan lebih hemat jika sering pakai karena dapat akses fitur lebih banyak.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Apa yang dimaksud CV lolos ATS?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "ATS adalah software penyaring CV otomatis. CV AI Career Hub dibuat dalam format PDF teks yang bisa dibaca mesin ATS.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Bisa cancel langganan kapan saja?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Bisa. Tidak ada kontrak atau denda. Cancel lewat dashboard, langganan aktif sampai akhir periode.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Metode pembayaran apa yang tersedia?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "QRIS, GoPay, OVO, Dana, ShopeePay, dan transfer bank (BCA, Mandiri, BRI, BNI). Semua diproses via Midtrans.",
                    },
                  },
                ],
              },
            ],
          }),
        }} />
      </head>
      <body className="bg-background text-on-background antialiased">
        <SessionProvider>
          <LanguageProvider>
            <ScrollProgress />
            <TitleUpdater />
            <ToastProvider>
              {children}
              <Analytics />
            </ToastProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
