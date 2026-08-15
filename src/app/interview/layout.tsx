import type { Metadata } from "next";
import { POSITION_QUESTIONS } from "@/data/interview-questions";

export const metadata: Metadata = {
  title: "Persiapan Interview - Database Pertanyaan & Jawaban | AI Career Hub",
  description: `${POSITION_QUESTIONS.length} posisi dengan ribuan pertanyaan interview lengkap beserta tips cara menjawab dan contoh jawaban terbaik. Latihan dengan timer, mode acak, dan evaluasi diri. Gratis selamanya.`,
  openGraph: {
    title: "Persiapan Interview - AI Career Hub",
    description:
      "Database pertanyaan interview terlengkap untuk berbagai posisi di Indonesia, lengkap dengan contoh jawaban dan mode latihan.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Persiapan Interview - AI Career Hub",
    description:
      "Database pertanyaan interview terlengkap untuk berbagai posisi di Indonesia.",
  },
  alternates: {
    canonical: "https://aicareerhub.com/interview",
  },
};

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
