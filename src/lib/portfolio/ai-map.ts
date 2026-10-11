import type { PortfolioData } from "@/components/portfolio-templates/types";

export type AiChange = {
  field: string;
  label: string;
  from: string;
  to: string;
};

type Dict = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Satu-satunya cara respons /api/portfolio/suggest masuk ke state portfolio.
 * Respons bersarang dipetakan ke field datar PortfolioFormData, jadi tidak
 * mungkin ada kunci asing yang tersimpan dan ikut terbit.
 */
export function applyAiSuggestion(
  data: PortfolioData,
  res: Dict,
): { data: PortfolioData; changes: AiChange[] } {
  const form = { ...data.formData } as Record<string, string>;
  const changes: AiChange[] = [];

  const set = (field: string, value: unknown, label: string) => {
    const next = str(value);
    if (!next) return;
    const from = String(form[field] ?? "");
    if (from === next) return;
    form[field] = next;
    changes.push({ field, label, from, to: next });
  };

  const hero = (res.hero ?? {}) as Dict;
  set("heroHeadline", hero.headline, "Judul peran");
  set("heroSubHeadline", hero.sub_headline ?? hero.subheadline, "Sub-judul");
  set("heroBio", hero.bio, "Bio singkat");

  const about = (res.about ?? {}) as Dict;
  const paragraphs = Array.isArray(about.paragraphs)
    ? about.paragraphs
    : [about.paragraph_1, about.paragraph_2, about.paragraph_3, about.meta_description];
  set(
    "aboutText",
    paragraphs.map(str).filter(Boolean).join("\n\n"),
    "Tentang saya",
  );

  const skills = ((res.skills_display ?? res.skills) ?? {}) as Dict;
  const mainSkills = Array.isArray(skills.skills)
    ? skills.skills
    : Array.isArray(skills.primary)
      ? skills.primary
      : [];
  set(
    "skillsMain",
    mainSkills.map(str).filter(Boolean).join(", "),
    "Keahlian utama",
  );

  // Blok SEO diterima apa adanya (snake_case AI maupun camelCase), lalu
  // dipotong schema saat simpan draft — di sini hanya dipetakan dan dilaporkan.
  const seoRes = (res.seo ?? {}) as Dict;
  const seoNext: NonNullable<PortfolioData["seo"]> = {};
  const pageTitle = str(seoRes.page_title ?? seoRes.pageTitle);
  const metaDescription = str(seoRes.meta_description ?? seoRes.metaDescription);
  const keywords = (Array.isArray(seoRes.keywords) ? seoRes.keywords : [])
    .map(str)
    .filter(Boolean);
  if (pageTitle) seoNext.pageTitle = pageTitle;
  if (metaDescription) seoNext.metaDescription = metaDescription;
  if (keywords.length) seoNext.keywords = keywords;

  const prevSeo = (data.seo ?? {}) as NonNullable<PortfolioData["seo"]>;
  const seoLabels: [keyof NonNullable<PortfolioData["seo"]>, string][] = [
    ["pageTitle", "Judul SEO"],
    ["metaDescription", "Deskripsi SEO"],
    ["keywords", "Kata kunci SEO"],
  ];
  for (const [key, label] of seoLabels) {
    const next = seoNext[key];
    if (next === undefined) continue;
    const from = prevSeo[key];
    const same = Array.isArray(next)
      ? Array.isArray(from) && next.join(", ") === from.join(",")
      : from === next;
    if (same) continue;
    changes.push({
      field: `seo.${key}`,
      label,
      from: Array.isArray(from) ? from.join(", ") : String(from ?? ""),
      to: Array.isArray(next) ? next.join(", ") : next,
    });
  }

  if (changes.length === 0) return { data, changes };
  const seo = { ...data.seo, ...seoNext };
  return {
    data: {
      ...data,
      formData: form as unknown as PortfolioData["formData"],
      ...(Object.keys(seoNext).length > 0 ? { seo } : {}),
    },
    changes,
  };
}

/**
 * AI tidak boleh menghapus pekerjaan yang sudah diketik user. Entri dengan
 * perusahaan dan posisi yang sama dianggap duplikat dan dilewati.
 */
export function mergeExperiences(
  current: PortfolioData["experiences"],
  incoming: PortfolioData["experiences"],
): { merged: PortfolioData["experiences"]; addedCount: number; keptCount: number } {
  const key = (e: { company?: string; position?: string }) =>
    `${(e.company ?? "").trim().toLowerCase()}|${(e.position ?? "").trim().toLowerCase()}`;

  const seen = new Set(current.map(key));
  const added: PortfolioData["experiences"] = [];
  for (const exp of incoming) {
    const k = key(exp);
    if (seen.has(k)) continue;
    seen.add(k);
    added.push(exp);
  }

  return {
    merged: [...current, ...added],
    addedCount: added.length,
    keptCount: current.length,
  };
}
