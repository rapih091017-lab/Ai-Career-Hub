"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const pageTitles: Record<string, { id: string; en: string }> = {
  "/dashboard": { id: "Dashboard", en: "Dashboard" },
  "/checker": { id: "Cek Skor CV", en: "Check CV Score" },
  "/builder/new": { id: "Buat CV Baru", en: "Create New CV" },
  "/portfolio": { id: "Portofolio", en: "Portfolio" },
  "/portfolio/build": { id: "Buat Portofolio", en: "Build Portfolio" },
  "/portfolio/preview": { id: "Pratinjau Portofolio", en: "Portfolio Preview" },
  "/portfolio/live": { id: "Portofolio Live", en: "Live Portfolio" },
  "/profile": { id: "Profil", en: "Profile" },
  "/login": { id: "Masuk", en: "Sign In" },
  "/settings": { id: "Pengaturan", en: "Settings" },
  "/settings/profile": { id: "Pengaturan Profil", en: "Profile Settings" },
  "/settings/billing": { id: "Tagihan", en: "Billing" },
  "/settings/security": { id: "Keamanan", en: "Security" },
  "/settings/payment-history": { id: "Riwayat Pembayaran", en: "Payment History" },
  "/admin": { id: "Admin Panel", en: "Admin Panel" },
};

const pageDescriptions: Record<string, { id: string; en: string }> = {
  "/dashboard": { id: "Kelola CV dan pantau progress kariermu dalam satu dashboard.", en: "Manage your CVs and track career progress in one dashboard." },
  "/checker": { id: "Analisis CV-mu dengan AI dan dapatkan skor ATS lengkap dengan rekomendasi perbaikan.", en: "Analyze your CV with AI and get a complete ATS score with improvement suggestions." },
  "/builder/new": { id: "Buat CV ATS-friendly dengan bantuan AI, pilih template profesional dan isi data langkah demi langkah.", en: "Create an ATS-friendly CV with AI assistance, choose professional templates and fill data step by step." },
  "/portfolio": { id: "Buat portofolio website profesional dalam hitungan menit, tampilkan karya terbaikmu.", en: "Build a professional portfolio website in minutes, showcase your best work." },
  "/portfolio/build": { id: "Bangun portofolio website dengan template dan editor yang mudah digunakan.", en: "Build a portfolio website with easy-to-use templates and editor." },
  "/portfolio/preview": { id: "Pratinjau portofolio website sebelum dipublikasikan.", en: "Preview your portfolio website before publishing." },
  "/portfolio/live": { id: "Lihat portofolio websitemu yang sudah live.", en: "View your published portfolio website." },
  "/profile": { id: "Atur data diri, foto profil, dan preferensi akun AI Career Hub.", en: "Manage your personal data, profile photo, and AI Career Hub account preferences." },
  "/login": { id: "Masuk atau daftar akun AI Career Hub untuk mulai membuat CV dan portofolio.", en: "Sign in or create your AI Career Hub account to start building CVs and portfolios." },
  "/settings": { id: "Atur preferensi akun, langganan, dan keamanan akun.", en: "Manage account preferences, subscription, and security settings." },
  "/settings/profile": { id: "Ubah data diri dan preferensi profil akunmu.", en: "Edit your personal data and profile preferences." },
  "/settings/billing": { id: "Kelola tagihan, metode pembayaran, dan riwayat transaksi.", en: "Manage billing, payment methods, and transaction history." },
  "/settings/security": { id: "Atur keamanan akun, ganti password, dan kelola sesi login.", en: "Manage account security, change password, and manage login sessions." },
  "/settings/payment-history": { id: "Lihat riwayat pembayaran dan unduh invoice.", en: "View payment history and download invoices." },
};

export default function TitleUpdater() {
  const pathname = usePathname();
  const { lang } = useTranslation();

  useEffect(() => {
    const siteName = "AI Career Hub";
    const isEnglish = lang === "en";

    // Find best matching page title
    let pageKey = pathname;
    // Match nested routes (e.g., /builder/[id] → /builder, /portfolio/build → /portfolio/build)
    const matchedKey = Object.keys(pageTitles).find((key) => {
      if (key === pathname) return true;
      // Match parent route for nested pages
      if (pathname.startsWith(key + "/") && key !== "/") return true;
      return false;
    });
    if (matchedKey) pageKey = matchedKey;

    const titleData = pageTitles[pageKey];
    const descData = pageDescriptions[pageKey];

    if (titleData) {
      const pageTitle = isEnglish ? titleData.en : titleData.id;
      document.title = `${pageTitle} | ${siteName}`;
    } else if (pathname.startsWith("/builder/")) {
      document.title = isEnglish ? `CV Builder | ${siteName}` : `Pembuat CV | ${siteName}`;
    } else if (pathname.startsWith("/cv/")) {
      document.title = isEnglish ? `CV Detail | ${siteName}` : `Detail CV | ${siteName}`;
    } else if (pathname.startsWith("/portfolio/")) {
      document.title = isEnglish ? `Portfolio | ${siteName}` : `Portofolio | ${siteName}`;
    } else {
      document.title = isEnglish
        ? "AI Career Hub - Build Your Dream Career with AI"
        : "AI Career Hub - Bangun Karier Impianmu dengan AI";
    }

    if (descData) {
      const desc = isEnglish ? descData.en : descData.id;
      document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", desc);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", desc);
    }

    // Per-page OG image — all pages use same base OG image for now
    const ogImage = "/og-image.png";
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", ogImage);
    document.querySelector('meta[name="twitter:image"]')?.setAttribute("content", ogImage);

    // Per-page canonical URL
    const canonicalUrl = `https://aicareerhub.com${pathname}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
  }, [pathname, lang]);

  return null;
}
