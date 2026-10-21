"use client";

import { useTranslation } from "@/lib/i18n";

/**
 * FAQ tujuh pertanyaan khusus produk. Jawaban panjang memakai Literata
 * karena itu blok bacaan, bukan label antarmuka.
 */

const QA = [
  { q: "lp.faq.q1", a: "lp.faq.a1" },
  { q: "lp.faq.q2", a: "lp.faq.a2" },
  { q: "lp.faq.q3", a: "lp.faq.a3" },
  { q: "lp.faq.q4", a: "lp.faq.a4" },
  { q: "lp.faq.q5", a: "lp.faq.a5" },
  { q: "lp.faq.q6", a: "lp.faq.a6" },
  { q: "lp.faq.q7", a: "lp.faq.a7" },
];

export default function FaqSection() {
  const { t } = useTranslation();

  return (
    <section id="faq" className="section section-rule bg-desk">
      <div className="shell grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24">
          <p className="kicker">{t("lp.faq.kicker")}</p>
          <h2 className="max-w-[13ch] font-display text-headline-lg font-bold text-ink">{t("lp.faq.title")}</h2>
          <p className="mt-4 max-w-[38ch] text-body-md leading-relaxed text-ink-soft">{t("lp.faq.lede")}</p>
        </div>

        <div className="px-0 md:px-6">
          {QA.map((item) => (
            <details key={item.q} className="group border-b border-hairline">
              <summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16.5px] font-bold tracking-[-0.01em] text-ink transition-colors hover:text-green-deep">
                {t(item.q)}
                <span
                  aria-hidden="true"
                  className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-brand-dark text-on-dark transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-[62ch] pb-6 font-serif text-[15.5px] leading-[1.7] text-ink-soft">{t(item.a)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
