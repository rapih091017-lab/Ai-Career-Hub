"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * Teaser checker. Tidak menghitung skor: yang ditampilkan contoh keluaran
 * dengan label jelas, lalu arahkan ke /checker untuk hasil sebenarnya.
 */

export default function CheckerTeaser() {
  const { t } = useTranslation();

  return (
    <section id="cek-cv" className="section section-rule bg-paper">
      <div className="shell grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div data-reveal>
          <p className="kicker">{t("lp.checker.kicker")}</p>
          <h2 className="max-w-[17ch] font-display text-headline-lg font-bold text-ink">
            {t("lp.checker.title")}
          </h2>
          <p className="mt-4 max-w-[46ch] text-body-md leading-relaxed text-ink-soft">
            {t("lp.checker.lede")}
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-green" />
                {t("lp.checker.checked-title")}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{t("lp.checker.checked-desc")}</p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-outline" />
                {t("lp.checker.not-title")}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{t("lp.checker.not-desc")}</p>
            </div>
          </div>
        </div>

        {/* Contoh keluaran. Bingkainya pakai `edge` (tinta di siang, garis
            hijau redup di malam) supaya tidak jadi kotak bergaris putih. */}
        <div
          data-reveal
          className="rounded-[18px] border-[2.5px] border-edge bg-paper p-6 shadow-hard md:p-8"
        >
          <p className="font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-ink-soft">
            {t("lp.checker.mock-title")}
          </p>

          <div className="mt-4 flex items-baseline justify-between gap-3">
            <span className="font-display text-[34px] font-bold leading-none tracking-tight text-ink">70%</span>
            <span className="text-[12px] font-bold text-ink-soft">{t("lp.checker.mock-note")}</span>
          </div>

          {/* Bar mengisi setelah kartunya masuk layar, bukan sejak halaman
              dimuat: gerakan itu yang memberi tahu angka 70% baru dihitung. */}
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-ink/10">
            <span
              className="reveal-fill block h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #3f8f77, #c9ff5c)",
                ["--fill" as string]: "70%",
              }}
            />
          </div>

          <ul className="mt-5 grid gap-2">
            {[
              "Nama, email, dan nomor telepon kebaca mesin",
              "Ada ringkasan pengalaman di bagian atas",
              "Setiap bullet pengalaman punya kata kerja aksi",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-soft">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-block h-4 w-4 flex-none rounded-full border-[1.5px] border-on-light bg-lime"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/checker"
            className="mt-6 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-on-light bg-lime px-4 font-display text-[16px] font-bold text-on-light shadow-[0_5px_#0a0f0d] transition-transform hover:-translate-y-0.5 hover:shadow-[0_7px_#0a0f0d]"
          >
            {t("lp.checker.cta")}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
