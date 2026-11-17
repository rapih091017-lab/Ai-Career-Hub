"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Term } from "@/components/guide/Term";
import { GLOSSARY, GUIDE_FEATURES, resetTourSeen, type GuideFeature } from "@/lib/guide-features";
import { useTranslation } from "@/lib/i18n";

/** Isi halaman /panduan: satu kartu per fitur, glosarium, dan catatan harga. */
export default function GuideCenter() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-[960px]">
      <header className="max-w-2xl">
        <p className="kicker">{t("guide.page.kicker")}</p>
        <h1 className="font-display text-headline-lg font-bold text-ink">{t("guide.page.title")}</h1>
        <p className="mt-3 text-body-md leading-relaxed text-ink-soft">{t("guide.page.lede")}</p>
      </header>

      <section className="mt-8 rounded-[14px] border-2 border-ink bg-lime/30 p-5">
        <h2 className="font-display text-lg font-bold text-ink">{t("guide.page.start-title")}</h2>
        <p className="mt-1 text-body-md text-ink-soft">{t("guide.page.start-body")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/checker" className="inline-flex min-h-11 items-center rounded-full border-[2.5px] border-ink bg-lime px-5 font-bold text-on-light shadow-[0_3px_0_rgb(var(--c-ink))]">
            {t("guide.f.checker.name")}
          </Link>
          <Link href="/builder/new" className="inline-flex min-h-11 items-center rounded-full border-2 border-ink/40 bg-paper px-5 font-bold text-ink">
            {t("guide.f.builder.name")}
          </Link>
        </div>
      </section>

      <nav aria-label={t("guide.page.toc")} className="mt-8">
        <h2 className="text-sm font-bold text-ink">{t("guide.page.toc")}</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {GUIDE_FEATURES.map((f) => (
            <li key={f.id}>
              <a href={`#${f.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/20 bg-paper px-3 text-sm font-semibold text-ink hover:border-ink">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{f.icon}</span>
                {t(`guide.f.${f.id}.name`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 space-y-5">
        {GUIDE_FEATURES.map((f) => (
          <FeatureCard key={f.id} feature={f} />
        ))}
      </div>

      <section className="mt-10" aria-labelledby="glosarium">
        <h2 id="glosarium" className="font-display text-xl font-bold text-ink">{t("guide.page.glossary")}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g} className="rounded-[12px] border border-ink/15 bg-paper p-4">
              <dt className="font-bold text-ink">{t(`glossary.${g}.term`)}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{t(`glossary.${g}.def`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10 rounded-[14px] border-2 border-ink/20 bg-paper p-5" aria-labelledby="harga">
        <h2 id="harga" className="font-display text-xl font-bold text-ink">{t("guide.page.pricing-title")}</h2>
        <p className="mt-2 text-body-md leading-relaxed text-ink-soft">{t("guide.page.pricing-body")}</p>
        <Link href="/#pricing" className="mt-3 inline-flex min-h-11 items-center font-bold text-green-deep underline underline-offset-4">
          {t("guide.page.pricing-cta")}
        </Link>
      </section>

      <p className="mt-8 text-body-md text-ink-soft">
        {t("guide.page.contact")}{" "}
        <Link href="/contact" className="font-semibold text-green-deep underline underline-offset-4">
          {t("guide.page.contact-cta")}
        </Link>
      </p>
    </div>
  );
}

function FeatureCard({ feature: f }: { feature: GuideFeature }) {
  const { t } = useTranslation();
  const router = useRouter();
  const k = (part: string) => t(`guide.f.${f.id}.${part}`);
  const showTour = () => {
    if (f.tourKey) resetTourSeen(f.tourKey);
    router.push(f.href);
  };
  return (
    <article id={f.id} className="scroll-mt-24 rounded-[14px] border-2 border-ink bg-paper p-5 shadow-hard-sm md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-2 border-ink bg-lime">
          <span className="material-symbols-outlined text-[22px] text-ink" aria-hidden="true">{f.icon}</span>
        </span>
        <h2 className="font-display text-xl font-bold text-ink">{k("name")}</h2>
      </div>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-green-deep">{t("guide.page.for")}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-ink">{k("what")}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-green-deep">{t("guide.page.when")}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-ink">{k("when")}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-green-deep">{t("guide.page.steps")}</dt>
          <dd className="mt-1">
            <ol className="space-y-1.5">
              {["s1", "s2", "s3"].map((s, i) => (
                <li key={s} className="flex gap-2 text-sm leading-relaxed text-ink">
                  <span className="font-mono font-bold text-green-deep" aria-hidden="true">{i + 1}.</span>
                  <span>{k(s)}</span>
                </li>
              ))}
            </ol>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-green-deep">{t("guide.page.free")}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-ink">{k("free")}</dd>
        </div>
      </dl>
      {f.terms && (
        <p className="mt-3 flex flex-wrap items-center gap-1 text-xs text-ink-soft">
          <span className="font-semibold">{t("guide.howto.terms")}</span>
          {f.terms.map((term) => (
            <Term key={term} id={term} />
          ))}
        </p>
      )}
      <details className="mt-4 rounded-[10px] border border-ink/15 px-4 py-2">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-ink">{k("q")}</summary>
        <p className="pb-2 text-sm leading-relaxed text-ink-soft">{k("a")}</p>
      </details>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={f.href} className="inline-flex min-h-11 items-center rounded-full border-[2.5px] border-ink bg-lime px-5 text-sm font-bold text-on-light shadow-[0_3px_0_rgb(var(--c-ink))]">
          {t("guide.page.open")}
        </Link>
        {f.tourKey && (
          <button type="button" onClick={showTour} className="inline-flex min-h-11 items-center rounded-full border-2 border-ink/40 px-5 text-sm font-bold text-ink hover:border-ink">
            {t("guide.page.tour")}
          </button>
        )}
      </div>
    </article>
  );
}
