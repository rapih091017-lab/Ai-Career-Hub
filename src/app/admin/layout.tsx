import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Panel Admin",
  robots: { index: false, follow: false },
};

/** Sidebar + guard admin dipasang sekali di sini agar tidak diulang tiap halaman. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
