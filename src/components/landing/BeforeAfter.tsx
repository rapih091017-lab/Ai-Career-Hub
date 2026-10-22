"use client";

import Link from "next/link";
import { motion } from "motion/react";
import TiltCard from "@/components/TiltCard";
import { useTranslation } from "@/lib/i18n";
import { slideUp, staggerContainer, staggerItemUp } from "@/lib/animationVariants";

/**
 * Simulasi struktur CV sebelum dan sesudah dirapikan.
 * Nilainya ilustrasi, bukan hasil pengguna, dan itu ditulis di bagian
 * bawah kedua kartu.
 */
export default function BeforeAfter() {
  const { t } = useTranslation();

  return (
    <section className="section section-rule bg-desk">
      <div className="shell">
        <motion.div
          className="text-center"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-on-light bg-lime px-4 py-1.5 text-[12px] font-bold tracking-wide text-on-light">
            {t("before-after.badge")}
          </span>
          <h2 className="font-display text-headline-lg font-bold text-ink">{t("before-after.title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-body-md text-ink-soft">{t("before-after.subtitle")}</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-12"
        >
          <motion.div variants={staggerItemUp} className="[perspective:800px]">
            <TiltCard tiltOptions={{ maxAngle: 3, scale: 1.005, glare: false }}>
              <div className="group relative overflow-hidden rounded-2xl border-2 border-error/50 bg-paper shadow-hard">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-error" />
                <div className="p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-edge bg-error/10 text-error">
                        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                          close
                        </span>
                      </div>
                      <div>
                        <span className="text-[14px] font-bold text-error">{t("before-after.before-label")}</span>
                        <p className="text-[12px] font-medium text-error">{t("before-after.example")}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-error/40 px-3 py-1 text-[12px] font-bold text-error">
                      {t("before-after.fail-label")}
                    </span>
                  </div>

                  <div className="space-y-3 opacity-70">
                    <div className="h-5 w-3/4 rounded-[6px] bg-ink/10" />
                    <div className="h-3 w-full rounded-[6px] bg-ink/5" />
                    <div className="h-3 w-5/6 rounded-[6px] bg-ink/5" />
                    <div className="h-3 w-4/6 rounded-[6px] bg-ink/5" />
                    <div className="border-t border-edge/25 pt-3">
                      <div className="mb-2 h-4 w-1/3 rounded-[6px] bg-ink/10" />
                      <div className="h-3 w-full rounded-[6px] bg-ink/5" />
                      <div className="h-3 w-3/4 rounded-[6px] bg-ink/5" />
                    </div>
                    <div className="border-t border-edge/25 pt-3">
                      <div className="mb-2 h-4 w-1/4 rounded-[6px] bg-ink/10" />
                      <div className="flex flex-wrap gap-1.5">
                        {["HTML", "CSS", "JS"].map((skill) => (
                          <span key={skill} className="rounded-[6px] bg-ink/5 px-2.5 py-1 text-[12px] font-medium text-ink-soft">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="font-medium text-ink-soft">{t("before-after.ats-label")}</span>
                      <span className="font-bold text-error">45%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-error/15">
                      <motion.div
                        className="h-full rounded-full bg-error"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "45%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>

          <motion.div variants={staggerItemUp} className="[perspective:800px]">
            <TiltCard tiltOptions={{ maxAngle: 3, scale: 1.005, glare: false }}>
              <div className="group relative overflow-hidden rounded-2xl border-2 border-green/60 bg-paper shadow-hard">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-green" />
                <div className="p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-edge bg-green/15 text-green-deep">
                        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                          check
                        </span>
                      </div>
                      <div>
                        <span className="text-[14px] font-bold text-green-deep">{t("before-after.after-label")}</span>
                        <p className="text-[12px] font-medium text-green-deep">{t("before-after.example")}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-green/50 px-3 py-1 text-[12px] font-bold text-green-deep">
                      {t("before-after.pass-label")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="h-5 w-3/4 rounded-[6px] bg-green/20" />
                    <div className="h-3 w-full rounded-[6px] bg-green/10" />
                    <div className="h-3 w-5/6 rounded-[6px] bg-green/10" />
                    <div className="h-3 w-4/6 rounded-[6px] bg-green/10" />
                    <div className="border-t border-green/25 pt-3">
                      <div className="mb-2 h-4 w-1/3 rounded-[6px] bg-green/20" />
                      <div className="h-3 w-full rounded-[6px] bg-green/10" />
                      <div className="h-3 w-3/4 rounded-[6px] bg-green/10" />
                      <div className="h-3 w-5/6 rounded-[6px] bg-green/10" />
                    </div>
                    <div className="border-t border-green/25 pt-3">
                      <div className="mb-2 h-4 w-1/4 rounded-[6px] bg-green/20" />
                      <div className="flex flex-wrap gap-1.5">
                        {["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker"].map((skill) => (
                          <span key={skill} className="rounded-[6px] bg-green/10 px-2.5 py-1 text-[12px] font-medium text-green-deep">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="font-medium text-ink-soft">{t("before-after.ats-label")}</span>
                      <span className="font-bold text-green-deep">92%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-green/15">
                      <motion.div
                        className="h-full rounded-full bg-green"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "92%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-10 text-center"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="inline-flex flex-col items-center gap-4 rounded-2xl border-2 border-edge bg-paper px-8 py-5 sm:flex-row sm:gap-8">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[24px] text-green-deep"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                trending_up
              </span>
              <span className="font-label-bold text-ink">{t("before-after.difference")}</span>
            </div>
            <div className="hidden h-8 w-px bg-hairline sm:block" />
            <div className="flex flex-wrap justify-center gap-3 text-left">
              {["before-after.bullet1", "before-after.bullet2", "before-after.bullet3"].map((key) => (
                <div key={key} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-green-deep"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="text-[12px] text-ink-soft">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/checker"
              className="inline-flex min-h-[54px] items-center gap-2 rounded-full border-[2.5px] border-on-light bg-lime px-7 font-display text-[15.5px] font-bold text-on-light shadow-hard-ink-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              {t("before-after.cta")}
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
