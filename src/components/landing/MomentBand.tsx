"use client";

import { useTranslation } from "@/lib/i18n";

/**
 * Pita lime di tengah halaman: satu kalimat yang menjelaskan gunanya,
 * dibaca sebagai jeda antara janji dan bukti.
 */
export default function MomentBand() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden border-t-[2.5px] border-ink bg-lime py-14 md:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(700px 300px at 20% 0%, rgba(255,255,255,0.36), transparent 70%)" }}
      />
      <div className="shell relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <blockquote
          className="m-0 max-w-[26ch] font-serif font-semibold leading-[1.22] tracking-[-0.02em] text-on-light"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.375rem)" }}
        >
          {t("lp.moment.title")}
        </blockquote>
        <p className="max-w-[24ch] -rotate-2 font-script text-[clamp(1.25rem,1.8vw,1.625rem)] font-bold leading-[1.2] text-on-light/80">
          {t("lp.moment.body")}
        </p>
      </div>
    </section>
  );
}
