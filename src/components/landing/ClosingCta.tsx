"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * Penutup: satu blok besar berisi ajakan bertindak, sedikit miring supaya
 * halaman tidak berakhir dengan blok yang terlalu rata-rata.
 */
export default function ClosingCta() {
  const { t } = useTranslation();

  return (
    <section id="cta" className="section section-rule bg-desk">
      <div className="shell">
        <div
          data-reveal
          className="relative mx-auto w-full max-w-[1040px] -rotate-1 rounded-[44px] border-[2.5px] border-edge bg-stage px-6 py-12 text-center text-on-dark shadow-[12px_12px_0_rgb(var(--c-lime))] md:px-16 md:py-20">
          <h2
            className="font-display font-bold text-on-dark"
            style={{ fontSize: "clamp(2.75rem, 6vw, 5.25rem)", lineHeight: 0.98, letterSpacing: "-0.035em" }}
          >
            <span className="block">{t("lp.closing.title-a")}</span>
            <span className="block">{t("lp.closing.title-b")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[44ch] font-script text-[clamp(1.375rem,2vw,1.625rem)] font-bold text-on-dark/80">
            {t("lp.closing.script")}
          </p>
          <p className="mx-auto mt-4 max-w-[44ch] text-[18px] leading-relaxed text-on-dark/80">{t("lp.closing.body")}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <Link
              href="/builder/new"
              className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-full border-[2.5px] border-on-dark bg-lime px-6 font-display text-[15.5px] font-bold text-on-light shadow-[4px_4px_#fff] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_#fff]"
            >
              {t("lp.closing.cta-primary")}
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/checkout"
              className="inline-flex min-h-[48px] items-center gap-2 text-[15px] font-bold text-on-dark underline decoration-lime decoration-[3px] underline-offset-5 transition-colors hover:text-lime"
            >
              {t("lp.closing.cta-secondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
