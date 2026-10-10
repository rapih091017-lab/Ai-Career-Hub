"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface DemoResult {
  score: number;
  tips: string[];
}

/** Heuristik cepat di browser, bukan skor ATS penuh. Tujuannya memberi rasa
 * "produknya bekerja" sebelum daftar, lalu mengarahkan ke checker. */
function quickEstimate(text: string, t: (key: string) => string): DemoResult {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const hasNumbers = /\d/.test(text);
  const hasEmail = /\S+@\S+\.\S+/.test(text);
  const hasSections = /(pengalaman|pendidikan|skill|experience|education|project|proyek)/i.test(text);
  const hasActionVerbs = /(mengelola|membuat|meningkatkan|mengembangkan|led|managed|built|improved|kelola|bangun)/i.test(text);

  let score = 30;
  const tips: string[] = [];
  if (words >= 40) score += 20; else tips.push(t("hero.demo.tip-short"));
  if (hasSections) score += 15; else tips.push(t("hero.demo.tip-sections"));
  if (hasActionVerbs) score += 10; else tips.push(t("hero.demo.tip-verbs"));
  if (hasNumbers) score += 10; else tips.push(t("hero.demo.tip-numbers"));
  if (hasEmail) score += 5; else tips.push(t("hero.demo.tip-contact"));

  return { score: Math.min(score, 88), tips: tips.slice(0, 3) };
}

export default function HeroCvDemo() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [result, setResult] = useState<DemoResult | null>(null);

  const run = () => {
    if (text.trim().length < 20) return;
    setResult(quickEstimate(text, t));
  };

  return (
    <div className="max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/90 p-4 shadow-premium-sm backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          search_insights
        </span>
        <span className="text-xs font-medium text-on-surface-variant">{t("hero.demo.title")}</span>
      </div>

      <label htmlFor="hero-demo-input" className="sr-only">
        {t("hero.demo.input-label")}
      </label>
      <textarea
        id="hero-demo-input"
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t("hero.demo.placeholder")}
        maxLength={1200}
        className="w-full resize-none rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus-visible:outline-2 focus-visible:outline-primary"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={text.trim().length < 20}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden>bolt</span>
          {t("hero.demo.run")}
        </button>
        <span className="text-[10px] leading-tight text-on-surface-variant">{t("hero.demo.free")}</span>
      </div>

      <AnimatePresence>
        {result ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-outline-variant/30 pt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">{t("hero.demo.estimate-label")}</span>
                <motion.span
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduce ? 0 : 0.4 }}
                  className="font-bold text-primary"
                >
                  {result.score}%
                </motion.span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                  initial={{ width: reduce ? `${result.score}%` : "0%" }}
                  animate={{ width: `${result.score}%` }}
                  transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.15, ease: "easeOut" }}
                />
              </div>

              <ul className="mt-3 space-y-1.5">
                {result.tips.map((tip, index) => (
                  <motion.li
                    key={tip}
                    initial={reduce ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduce ? 0 : 0.5 + index * 0.18 }}
                    className="flex items-start gap-2 text-[11px] leading-snug text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined mt-0.5 text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
                      tips_and_updates
                    </span>
                    {tip}
                  </motion.li>
                ))}
                {result.tips.length === 0 ? (
                  <motion.li initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.5 }} className="text-[11px] text-on-surface-variant">
                    {t("hero.demo.good")}
                  </motion.li>
                ) : null}
              </ul>

              <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.9 }}>
                <Link
                  href="/checker"
                  className="mt-3 inline-flex min-h-11 items-center gap-1 text-label-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {t("hero.demo.full-cta")}
                  <span className="material-symbols-outlined text-[16px]" aria-hidden>arrow_forward</span>
                </Link>
              </motion.div>
              <p className="mt-2 text-[10px] text-outline">{t("hero.demo.disclaimer")}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
