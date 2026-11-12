import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { SITE_URL } from "@/lib/site-url";

const TITLE = "AI Career Hub - Tahu kenapa CV-mu belum dipanggil, lalu perbaiki";
const DESCRIPTION =
  "Cek CV gratis: skor per bagian, kata kunci lowongan yang belum muncul, dan contoh kalimat pengganti. Lalu perbaiki di builder dari teks CV yang sama dan unduh PDF-nya.";

/**
 * Metadata khusus halaman depan, mengikuti janji hero. Field lain (robots,
 * keywords, metadataBase) tetap dari layout. openGraph dan twitter ditulis
 * lengkap karena Next mengganti seluruh objeknya, bukan menggabungkan.
 */
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "id_ID",
    alternateLocale: "en_US",
    siteName: "AI Career Hub",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function Home() {
  return <LandingPage />;
}
