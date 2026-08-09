import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/react";
import ScrollProgress from "@/components/ScrollProgress";
import TitleUpdater from "@/components/TitleUpdater";
import { LanguageProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const siteUrl = "https://aicareerhub.com";

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
  alternates: {
    canonical: siteUrl,
    languages: {
      id: siteUrl,
      en: siteUrl + "/en",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" />
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
                  { "@type": "ListItem", "position": 1, "name": "Beranda", "item": "https://aicareerhub.com" },
                  { "@type": "ListItem", "position": 2, "name": "Dashboard", "item": "https://aicareerhub.com/dashboard" },
                  { "@type": "ListItem", "position": 3, "name": "Buat CV", "item": "https://aicareerhub.com/builder/new" },
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
      <body
        className={`${GeistSans.variable} ${plusJakartaSans.variable} bg-background text-on-background antialiased`}
      >
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
