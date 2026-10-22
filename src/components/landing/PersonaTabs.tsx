"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

/**
 * Tiga persona dengan alur sebelum dan sesudah. Ini contoh cara pakai,
 * bukan ulasan pengguna, jadi 반드시 diberi label di bawah tab.
 */

const PERSONAS = [
  { key: "p1", name: "lp.persona.p1.name", sub: "lp.persona.p1.sub", before: "lp.persona.p1.before", ask: "lp.persona.p1.ask", after: "lp.persona.p1.after" },
  { key: "p2", name: "lp.persona.p2.name", sub: "lp.persona.p2.sub", before: "lp.persona.p2.before", ask: "lp.persona.p2.ask", after: "lp.persona.p2.after" },
  { key: "p3", name: "lp.persona.p3.name", sub: "lp.persona.p3.sub", before: "lp.persona.p3.before", ask: "lp.persona.p3.ask", after: "lp.persona.p3.after" },
];

const NOTES = [
  { title: "lp.persona.n1.title", desc: "lp.persona.n1.desc" },
  { title: "lp.persona.n2.title", desc: "lp.persona.n2.desc" },
  { title: "lp.persona.n3.title", desc: "lp.persona.n3.desc" },
];

export default function PersonaTabs() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const persona = PERSONAS[active];

  return (
    <section id="persona" className="section section-rule bg-desk">
      <div className="shell">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div data-reveal>
            <p className="kicker">{t("lp.persona.kicker")}</p>
            <h2 className="max-w-[15ch] font-display text-headline-lg font-bold text-ink">
              {t("lp.persona.title")}
            </h2>
            <p className="mt-4 max-w-[42ch] text-body-md leading-relaxed text-ink-soft">
              {t("lp.persona.lede")}
            </p>

            <div role="tablist" aria-label={t("lp.persona.kicker")} className="mt-7 flex flex-wrap gap-2">
              {PERSONAS.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  id={`persona-tab-${item.key}`}
                  aria-selected={active === index}
                  aria-controls={`persona-panel-${item.key}`}
                  onClick={() => setActive(index)}
                  className={[
                    "min-h-[44px] rounded-full border-2 border-edge px-4 text-[14.5px] font-bold transition-all",
                    active === index
                      ? "-translate-x-0.5 -translate-y-0.5 bg-evergreen text-on-dark shadow-hard-ink-sm"
                      : "bg-paper text-ink hover:-translate-x-0.5 hover:-translate-y-0.5",
                  ].join(" ")}
                >
                  {t(item.name)}
                </button>
              ))}
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{t("lp.persona.disclaimer")}</p>
          </div>

          <div
            role="tabpanel"
            id={`persona-panel-${persona.key}`}
            aria-labelledby={`persona-tab-${persona.key}`}
            data-reveal
            className="overflow-hidden rounded-[24px] border-[2.5px] border-edge bg-paper shadow-hard"
          >
            <div className="flex items-center gap-3 border-b-2 border-edge bg-evergreen px-4 py-3 text-on-dark">
              <span aria-hidden="true" className="h-7 w-7 rounded-full border-2 border-on-dark bg-lime" />
              <div>
                <p className="text-[14px] font-bold">{t(persona.name)}</p>
                <p className="text-[12px] text-on-dark/70">{t(persona.sub)}</p>
              </div>
            </div>

            <div key={persona.key} className="grid gap-3 p-5 animate-ach-persona-in md:p-6">
              <div>
                <p className="font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-ink-soft">
                  SEBELUM
                </p>
                <p className="mt-2 max-w-[86%] rounded-2xl rounded-bl-sm border-[1.5px] border-edge/40 bg-paper px-4 py-3 text-[15px] font-semibold leading-[1.45] text-ink">
                  {t(persona.before)}
                </p>
              </div>
              <div className="flex justify-end">
                {/* Balon tanya tetap lime di malam, tapi bukan lime 60%: di
                    atas panel gelap campuran 60% jadi hijau keruh. */}
                <p className="max-w-[86%] rounded-2xl rounded-br-sm border-[1.5px] border-on-light bg-lime/60 px-4 py-3 text-[15px] font-semibold leading-[1.45] text-on-light dark:bg-lime/90">
                  {t(persona.ask)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-ink-soft">
                  SESUDAH
                </p>
                <p className="mt-2 max-w-[86%] rounded-2xl rounded-bl-sm border-[1.5px] border-edge bg-evergreen px-4 py-3 text-[15px] font-semibold leading-[1.45] text-on-dark">
                  {t(persona.after)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {NOTES.map((note, index) => (
            <div
              key={note.title}
              data-reveal
              style={{ ["--reveal-delay" as string]: `${index * 0.07}s` }}
              className="rounded-xl border-2 border-dashed border-edge/55 bg-paper p-5"
            >
              <h3 className="font-display text-[16px] font-bold text-ink">{t(note.title)}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{t(note.desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
