"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "@/lib/i18n";

const MENU_ITEMS = [
  { labelKey: "settings.profile", icon: "person", href: "/profile" },
  { labelKey: "settings.security", icon: "lock", href: "/settings/security" },
  { labelKey: "settings.billing", icon: "credit_card", href: "/settings/billing" },
  { labelKey: "settings.payment-history", icon: "receipt_long", href: "/settings/payment-history" },
  { labelKey: "settings.checkout-history", icon: "shopping_cart_checkout", href: "/settings/billing/checkout-history" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />
        <main className="pt-24 pb-32 px-margin-mobile md:px-gutter flex justify-center">
          <div className="w-full max-w-[1100px] flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-soft border border-outline-variant/30 overflow-hidden sticky top-28">
                <div className="p-5 border-b border-outline-variant/30">
                  <h2 className="font-headline-md text-lg text-on-surface">{t("settings.title")}</h2>
                  <p className="text-label-sm text-on-surface-variant mt-0.5">{t("settings.subtitle")}</p>
                </div>
                <nav className="p-2 space-y-1">
                  {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-bold transition-all ${
                          isActive
                            ? "bg-primary-fixed text-primary"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                        <span className="text-sm">{t(item.labelKey)}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
