import type { Metadata } from "next";
import SiteHeader from "@/components/nav/SiteHeader";
import AppFooter from "@/components/AppFooter";
import GuideCenter from "@/components/guide/GuideCenter";
import { GUIDE_DICT } from "@/lib/i18n-dict/guide";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: GUIDE_DICT["guide.page.meta-title"].id,
  description: GUIDE_DICT["guide.page.meta-desc"].id,
  alternates: { canonical: `${SITE_URL}/panduan` },
  openGraph: {
    title: GUIDE_DICT["guide.page.meta-title"].id,
    description: GUIDE_DICT["guide.page.meta-desc"].id,
    url: `${SITE_URL}/panduan`,
  },
};

export default function PanduanPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <SiteHeader variant="pill" />
      <main id="isi" className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter">
        <GuideCenter />
      </main>
      <AppFooter bordered />
    </div>
  );
}
