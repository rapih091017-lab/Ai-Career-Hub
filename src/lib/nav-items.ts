/**
 * Sumber tunggal untuk isi navigasi.
 *
 * Semua item di sini harus punya route yang benar-benar ada. Test
 * `navigation-integrity.test.ts` membacanya dan memeriksa setiap `href`,
 * supaya link mati seperti `#how-it-works` dulu tidak bisa lolos lagi.
 */

export interface NavItem {
  /** Kunci i18n untuk label, supaya navbar ikut berubah bahasa. */
  labelKey: string;
  /** Fallback kalau kunci i18n belum ada. */
  label?: string;
  href: string;
  /** Ikon material untuk tampilan desktop. */
  icon: string;
  /** Butuh sesi. Item seperti ini ikut membawa tujuan ke halaman login. */
  requiresAuth?: boolean;
  /** Halaman anak yang ikut dianggap aktif (mis. /cv/[id] milik CV Saya). */
  activePrefixes?: string[];
}

export interface NavGroup {
  /** Kunci i18n untuk judul group. */
  labelKey: string;
  label?: string;
  icon: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.group.lamaran",
    label: "Buat Lamaran",
    icon: "description",
    items: [
      { labelKey: "nav.item.dashboard", label: "Dashboard", href: "/dashboard", icon: "dashboard", requiresAuth: true },
      { labelKey: "nav.item.bikin-cv", label: "Bikin CV", href: "/builder/new", icon: "auto_awesome", requiresAuth: true },
      {
        labelKey: "nav.item.my-resumes",
        label: "CV Saya",
        href: "/my-resumes",
        icon: "folder",
        requiresAuth: true,
        activePrefixes: ["/builder/", "/cv/"],
      },
      {
        labelKey: "nav.item.surat",
        label: "Surat Lamaran",
        href: "/surat-lamaran",
        icon: "mail",
        requiresAuth: true,
        activePrefixes: ["/surat-lamaran/"],
      },
      {
        labelKey: "nav.item.checker",
        label: "Checker CV (ATS)",
        href: "/checker",
        icon: "fact_check",
        activePrefixes: ["/checker/"],
      },
      {
        labelKey: "nav.item.linkedin-optimizer",
        label: "LinkedIn Optimizer",
        href: "/linkedin-optimizer",
        icon: "person_search",
        activePrefixes: ["/linkedin-optimizer/"],
      },
      {
        labelKey: "nav.item.interview",
        label: "Latihan Interview",
        href: "/interview",
        icon: "record_voice_over",
        activePrefixes: ["/interview/"],
      },
    ],
  },
  {
    labelKey: "nav.group.portofolio",
    label: "Portofolio",
    icon: "language",
    items: [
      {
        labelKey: "nav.item.portofolio-saya",
        label: "Portofolio Saya",
        href: "/portfolio",
        icon: "language",
        requiresAuth: true,
        activePrefixes: ["/portfolio", "/p/"],
      },
      { labelKey: "nav.item.portofolio-build", label: "Kelola Site", href: "/portfolio/build", icon: "edit_note", requiresAuth: true },
      { labelKey: "nav.item.portofolio-preview", label: "Preview Publik", href: "/portfolio/preview", icon: "visibility", requiresAuth: true },
    ],
  },
  {
    labelKey: "nav.group.karir",
    label: "Cari Kerja",
    icon: "work",
    items: [
      { labelKey: "nav.item.karir", label: "Info Karir", href: "/karir", icon: "campaign" },
      { labelKey: "nav.item.tracker", label: "Tracker Lamaran", href: "/tracker", icon: "checklist", requiresAuth: true },
      { labelKey: "nav.item.career-path", label: "Jalur Karier", href: "/career-path", icon: "stairs", activePrefixes: ["/career-path/"] },
    ],
  },
  {
    labelKey: "nav.group.career-hub",
    label: "Career Hub",
    icon: "school",
    items: [
      { labelKey: "nav.item.career-hub", label: "Career Hub", href: "/career-hub", icon: "menu_book", activePrefixes: ["/career-hub/"] },
      { labelKey: "nav.item.contoh-cv", label: "Contoh CV", href: "/contoh-cv", icon: "description", activePrefixes: ["/contoh-cv/", "/cv-examples"] },
      { labelKey: "nav.item.sinonim", label: "Sinonim Kata", href: "/sinonim", icon: "swap_horiz" },
      { labelKey: "nav.item.faq", label: "FAQ", href: "/faq", icon: "help" },
    ],
  },
];

/**
 * Bagian menu akun, di dalam menu avatar.
 *
 * Dulu jadi grup "Akun" di navbar. Empat dari lima isinya jarang dibuka, jadi
 * lebih hemat ruang di navbar kalau disembunyikan sampai orang memang menekan
 * avatarnya. Checkout ikut ke sini karena halaman itu selalu butuh sesi:
 * /api/payments/* membalas 401 untuk tamu, jadi tidak ada yang bisa dibeli tanpa
 * masuk lebih dulu.
 *
 * Tagihan diletakkan paling atas supaya jalur perpanjangan paket tidak ikut
 * tenggelam bersama menu profil.
 */
export interface NavSection {
  /** Judul bagian, dipakai sebagai pemisah di menu avatar. */
  labelKey?: string;
  label?: string;
  items: NavItem[];
}

export const ACCOUNT_MENU: NavSection[] = [
  {
    items: [
      { labelKey: "nav.item.profile", label: "Profil", href: "/settings/profile", icon: "person", requiresAuth: true },
      { labelKey: "nav.item.security", label: "Keamanan", href: "/settings/security", icon: "lock", requiresAuth: true },
    ],
  },
  {
    labelKey: "nav.section.tagihan",
    label: "Tagihan",
    items: [
      { labelKey: "nav.item.checkout", label: "Checkout & Top Up", href: "/checkout", icon: "shopping_cart", requiresAuth: true },
      { labelKey: "nav.item.billing", label: "Tagihan & Paket", href: "/settings/billing", icon: "receipt_long", requiresAuth: true },
      {
        labelKey: "nav.item.payment-history",
        label: "Riwayat Bayar",
        href: "/settings/payment-history",
        icon: "history",
        requiresAuth: true,
      },
    ],
  },
  {
    labelKey: "nav.section.affiliate",
    label: "Afiliasi",
    items: [
      { labelKey: "nav.item.affiliate", label: "Referral & Afiliasi", href: "/affiliate", icon: "redeem", requiresAuth: true },
    ],
  },
];

/**
 * Link menuju section landing. Tidak ada route-nya sendiri, jadi tidak masuk
 * ke group manapun.
 *
 * "Checkout" sengaja tidak ada di sini: dari halaman depan, orang belum punya
 * alasan untuk langsung membayar. Urutannya lihat fitur dulu (Cara Kerja),
 * baru lihat harganya (Harga).
 */
export const LANDING_LINKS: NavItem[] = [
  { labelKey: "nav.pricing", label: "Harga", href: "/#pricing", icon: "sell" },
  { labelKey: "nav.cara-kerja", label: "Cara Kerja", href: "/#cara-kerja", icon: "route" },
];

/** Teks bar pengumuman di bawah navbar. */
export const ANNOUNCEMENT = {
  textKey: "nav.announce",
  text: "Lowongan MT & Staff baru tiap minggu",
  href: "/karir",
} as const;

/** Semua item dari grup navbar dan menu akun — dipakai test dan pencarian. */
export function allNavItems(): NavItem[] {
  return [...NAV_GROUPS.flatMap((group) => group.items), ...ACCOUNT_MENU.flatMap((s) => s.items)];
}

/**
 * Halaman beranda yang boleh jadi tujuan setelah login.
 *
 * Dipakai supaya item yang butuh sesi tidak membuat tamu mendarat di halaman
 * yang akan memantulkan mereka balik ke login.
 */
export function isNavActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (!item.activePrefixes) return false;
  return item.activePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}