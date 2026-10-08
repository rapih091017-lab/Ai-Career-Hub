/**
 * Struktur navigasi panel admin.
 *
 * Dikumpulkan di satu tempat supaya sidebar (dan halaman yang ingin
 * menampilkan tautan cepat) selalu sinkron. Ikon memakai Material Symbols
 * yang sudah dipakai di seluruh aplikasi, bukan emoji.
 */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
  /** Ringkasan singkat untuk `title`/tooltip. */
  hint: string;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/admin", label: "Ringkasan", icon: "dashboard", hint: "Statistik harian & tren aktivitas" },
      { href: "/admin/orders", label: "Pesanan", icon: "receipt_long", hint: "Semua checkout Midtrans" },
      { href: "/admin/insights", label: "Insights", icon: "insights", hint: "Funnel user & pemakaian fitur" },
    ],
  },
  {
    title: "Konten & Produk",
    items: [
      { href: "/admin/packages", label: "Paket", icon: "inventory_2", hint: "Harga, nama, dan status paket" },
      { href: "/admin/jobs", label: "Loker", icon: "work", hint: "Lowongan yang tampil di /karir" },
      { href: "/admin/career-path", label: "Jalur Karier", icon: "route", hint: "Jenjang, skill, dan langkah karier" },
    ],
  },
  {
    title: "Program & Sistem",
    items: [
      { href: "/admin/affiliate", label: "Affiliate", icon: "redeem", hint: "Review pendaftar & payout komisi" },
      { href: "/admin/admins", label: "Kelola Admin", icon: "shield_person", hint: "Tambah atau cabut akses admin" },
      { href: "/admin/settings", label: "Pengaturan", icon: "settings", hint: "Kontak & tautan sosial situs" },
    ],
  },
];

/** Label halaman aktif untuk bar navigasi mobile. */
export function adminNavLabel(pathname: string): string {
  const item = ADMIN_NAV.flatMap((group) => group.items)
    .filter((entry) => (entry.href === "/admin" ? pathname === "/admin" : pathname.startsWith(entry.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return item?.label ?? "Admin";
}
