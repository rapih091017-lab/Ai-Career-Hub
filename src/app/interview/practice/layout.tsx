import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Mode Latihan Interview - Timer & Pertanyaan Acak | AI Career Hub",
  description:
    "Latihan interview dengan timer, pertanyaan acak, dan evaluasi diri. Simulasikan wawancara sungguhan dan tingkatkan kesiapanmu sebelum hari H.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/interview/practice`,
  },
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
