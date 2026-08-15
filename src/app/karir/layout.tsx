import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Info Karir | AI Career Hub",
  description:
    "Cari lowongan kerja? Kami sedang menyiapkan job board khusus untuk Anda. Sementara itu, jelajahi portal lowongan eksternal.",
};

export default function KarirLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
